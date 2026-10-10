-- Playbee database.
-- In Supabase: SQL Editor -> New query -> paste this whole file -> Run.
-- Safe to run again; it only adds what's missing and replaces the functions.

create extension if not exists pgcrypto;

-- ---------- tables ----------

create table if not exists public.games (
  id            text primary key default encode(gen_random_bytes(9), 'hex'),
  slug          text unique not null,
  type          text not null check (type in ('blind_ranking','this_or_that','would_you_rather','poll','trivia','personality','tier_list','bracket','rate_these')),
  title         text not null check (char_length(title) between 1 and 90),
  blurb         text not null default '' check (char_length(blurb) <= 200),
  category      text not null check (category in ('music','movies','tv','sports','celebs','dance','gaming','food','anime','internet')),
  region        text not null default 'global' check (region in ('global','us','uk','in','kr')),
  cover         text check (cover is null or char_length(cover) <= 500),
  creator       text not null default '' check (char_length(creator) <= 30),
  data          jsonb not null check (pg_column_size(data) < 200000),
  plays         integer not null default 0,
  edit_key_hash text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

-- One row per finished game: just what was picked. No accounts, no names.
create table if not exists public.plays (
  id         text primary key default encode(gen_random_bytes(7), 'hex'),
  game_id    text not null references public.games(id) on delete cascade,
  result     jsonb not null check (pg_column_size(result) < 20000),
  demo       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists plays_game_time on public.plays (game_id, created_at desc);
create index if not exists plays_time on public.plays (created_at desc);
create index if not exists games_new on public.games (created_at desc);
create index if not exists games_cat on public.games (category, created_at desc);

-- Short-lived spam counters. Holds a scrambled network address for at most an hour.
create table if not exists public.hits (
  key text not null,
  at  timestamptz not null default now()
);
create index if not exists hits_key on public.hits (key, at);

-- Nobody touches the tables directly. The site only calls the functions below.
alter table public.games enable row level security;
alter table public.plays enable row level security;
alter table public.hits  enable row level security;
revoke all on public.games, public.plays, public.hits from anon, authenticated;

-- ---------- helpers (not callable from the site) ----------

create or replace function public._limit(action text, max_per_hour int) returns void
language plpgsql security definer set search_path = public as $$
declare
  ip text := coalesce(split_part((current_setting('request.headers', true)::json)->>'x-forwarded-for', ',', 1), 'unknown');
  k text := action || ':' || encode(digest(ip || to_char(now(), 'YYYY-MM-DD'), 'sha256'), 'hex');
begin
  if random() < 0.05 then
    delete from hits where at < now() - interval '1 hour';
  end if;
  if (select count(*) from hits where key = k and at > now() - interval '1 hour') >= max_per_hour then
    raise exception 'Whoa, slow down a sec and try again.';
  end if;
  insert into hits (key) values (k);
end $$;

create or replace function public._game(g public.games) returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'id', g.id, 'slug', g.slug, 'type', g.type, 'title', g.title, 'blurb', g.blurb,
    'category', g.category, 'region', g.region, 'cover', g.cover, 'creator', g.creator,
    'data', g.data, 'plays', g.plays,
    'createdAt', (extract(epoch from g.created_at) * 1000)::bigint,
    'updatedAt', (extract(epoch from g.updated_at) * 1000)::bigint)
$$;

-- The skeleton of a game (ids and "which one is right" links, no words or
-- pictures). Once people have played, this can't change or their results break.
create or replace function public._shape(j jsonb) returns jsonb
language plpgsql immutable as $$
declare
  k text;
  v jsonb;
  result jsonb := '{}';
begin
  if jsonb_typeof(j) = 'array' then
    return coalesce((select jsonb_agg(public._shape(e) order by i) from jsonb_array_elements(j) with ordinality as t(e, i)), '[]');
  elsif jsonb_typeof(j) = 'object' then
    for k, v in select * from jsonb_each(j) loop
      continue when k in ('label', 'image', 'desc', 'note', 'text', 'shuffle');
      if k = 'tiers' and jsonb_typeof(v) = 'array' then
        result := result || jsonb_build_object(k, jsonb_array_length(v));
      else
        result := result || jsonb_build_object(k, public._shape(v));
      end if;
    end loop;
    return result;
  end if;
  return j;
end $$;

create or replace function public._owned(p_slug text, p_key text) returns public.games
language plpgsql security definer set search_path = public as $$
declare
  g games;
begin
  select * into g from games where slug = p_slug;
  if g.id is null then
    raise exception 'Couldn''t find that one';
  end if;
  if g.edit_key_hash is null or p_key is null or g.edit_key_hash <> encode(digest(p_key, 'sha256'), 'hex') then
    raise exception 'That edit link doesn''t work for this game.';
  end if;
  return g;
end $$;

-- ---------- reading ----------

create or replace function public.home() returns jsonb
language sql stable security definer set search_path = public as $$
  with week as (
    select game_id, count(*) as n from plays
    where created_at > now() - interval '7 days' and not demo
    group by game_id
  )
  select jsonb_build_object(
    'stats', jsonb_build_object(
      'playsThisWeek', coalesce((select sum(n) from week), 0),
      'games', (select count(*) from games)),
    'trending', coalesce((
      select jsonb_agg(_game(g) || jsonb_build_object('week', w.n) order by w.n desc, g.plays desc)
      from (select * from week order by n desc limit 12) w join games g on g.id = w.game_id), '[]'),
    'fresh', coalesce((
      select jsonb_agg(_game(g) order by g.created_at desc)
      from games g where g.id in (select id from games order by created_at desc limit 12)), '[]'),
    'categories', coalesce((select jsonb_object_agg(category, n) from (select category, count(*) n from games group by category) c), '{}'),
    'regions', coalesce((select jsonb_object_agg(region, n) from (select region, count(*) n from games group by region) r), '{}'))
$$;

create or replace function public.list_games(p_category text default null, p_type text default null, p_region text default null, p_sort text default 'new', p_page int default 0)
returns jsonb language sql stable security definer set search_path = public as $$
  with ranked as (
    select g, row_number() over (order by case when p_sort = 'top' then g.plays end desc nulls last, g.created_at desc) as rn
    from games g
    where (p_category is null or g.category = p_category)
      and (p_type is null or g.type = p_type)
      and (p_region is null or g.region = p_region)
  )
  select jsonb_build_object(
    'games', coalesce((select jsonb_agg(_game((r.g)) order by r.rn) from ranked r where r.rn > p_page * 24 and r.rn <= p_page * 24 + 24), '[]'),
    'more', exists (select 1 from ranked r where r.rn > p_page * 24 + 24))
$$;

-- A game plus the latest picks, so the page can work out the crowd numbers.
create or replace function public.get_game(p_slug text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'game', _game(g),
    'results', coalesce((select jsonb_agg(p.result) from (select result from plays where game_id = g.id order by created_at desc limit 5000) p), '[]'))
  from games g where g.slug = p_slug
$$;

create or replace function public.get_play(p_id text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p.id,
    'result', p.result,
    'game', _game(g),
    'results', coalesce((select jsonb_agg(x.result) from (select result from plays where game_id = g.id order by created_at desc limit 5000) x), '[]'))
  from plays p join games g on g.id = p.game_id where p.id = p_id
$$;

-- ---------- writing ----------

create or replace function public.create_game(p_type text, p_title text, p_blurb text, p_category text, p_region text, p_cover text, p_creator text, p_data jsonb, p_slug text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  base text := left(regexp_replace(lower(coalesce(p_slug, '')), '[^a-z0-9-]+', '', 'g'), 50);
  v_slug text;
  key text := translate(encode(gen_random_bytes(18), 'base64'), '+/=', '-_');
begin
  perform _limit('create', 20);
  if base = '' then base := 'game'; end if;
  loop
    v_slug := lower(base || '-' || substr(translate(encode(gen_random_bytes(6), 'base64'), '+/=0OIl1', 'abcdefgh'), 1, 6));
    exit when not exists (select 1 from games g where g.slug = v_slug);
  end loop;
  insert into games (slug, type, title, blurb, category, region, cover, creator, data, edit_key_hash)
  values (v_slug, p_type, trim(p_title), coalesce(trim(p_blurb), ''), p_category, coalesce(p_region, 'global'), nullif(p_cover, ''), coalesce(trim(p_creator), ''), p_data, encode(digest(key, 'sha256'), 'hex'));
  return jsonb_build_object('slug', v_slug, 'editKey', key);
end $$;

create or replace function public.add_play(p_slug text, p_result jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  gid text;
  pid text;
  n int;
begin
  perform _limit('play', 150);
  select id into gid from games where slug = p_slug;
  if gid is null then
    raise exception 'Couldn''t find that one';
  end if;
  insert into plays (game_id, result) values (gid, p_result) returning id into pid;
  update games set plays = plays + 1 where id = gid returning plays into n;
  return jsonb_build_object('id', pid, 'plays', n);
end $$;

create or replace function public.game_for_edit(p_slug text, p_key text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  g games := _owned(p_slug, p_key);
begin
  perform _limit('edit', 200);
  return jsonb_build_object('game', _game(g), 'locked', g.plays > 0);
end $$;

create or replace function public.update_game(p_slug text, p_key text, p_title text, p_blurb text, p_category text, p_region text, p_cover text, p_creator text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  g games := _owned(p_slug, p_key);
begin
  perform _limit('edit', 200);
  if g.plays > 0 and _shape(p_data) is distinct from _shape(g.data) then
    raise exception 'People have already played this, so you can change names, pictures and details but not add or remove things.';
  end if;
  update games set title = trim(p_title), blurb = coalesce(trim(p_blurb), ''), category = p_category, region = coalesce(p_region, 'global'),
    cover = nullif(p_cover, ''), creator = coalesce(trim(p_creator), ''), data = p_data, updated_at = now()
  where id = g.id;
  return jsonb_build_object('slug', g.slug);
end $$;

create or replace function public.delete_game(p_slug text, p_key text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  g games := _owned(p_slug, p_key);
begin
  delete from games where id = g.id;
  return jsonb_build_object('deleted', true);
end $$;

-- ---------- who can call what ----------

revoke execute on function public._limit(text, int), public._game(public.games), public._shape(jsonb), public._owned(text, text) from public, anon, authenticated;
grant execute on function public.home(), public.list_games(text, text, text, text, int), public.get_game(text), public.get_play(text),
  public.create_game(text, text, text, text, text, text, text, jsonb, text), public.add_play(text, jsonb),
  public.game_for_edit(text, text), public.update_game(text, text, text, text, text, text, text, text, jsonb), public.delete_game(text, text)
  to anon, authenticated;

-- ---------- pictures ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pictures', 'pictures', true, 5242880, array['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Anyone can add pictures" on storage.objects;
create policy "Anyone can add pictures" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'pictures' and (storage.foldername(name))[1] = 'u');
