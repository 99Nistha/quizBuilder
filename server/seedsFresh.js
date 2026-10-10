// The second batch of starter games: around the world (US, UK, India, Korea),
// every format, and every mood from petty to properly sad.
// `pictures` maps a label to a better picture search; see seeds.js.

const items = (...labels) => labels.map((label, i) => ({ id: `i${i + 1}`, label }));
const pairs = (...list) => list.map(([a, b], i) => ({ id: `p${i + 1}`, a: { label: a }, b: { label: b } }));

let qn = 100;
const q = (text, answers, correct, note = '') => {
  qn += 1;
  return { id: `q${qn}`, text, note, answers: answers.map((label, i) => ({ id: `q${qn}a${i}`, label })), correct: `q${qn}a${correct}` };
};
// personality question: answers are [label, resultId]
const pq = (text, answers) => {
  qn += 1;
  return { id: `q${qn}`, text, answers: answers.map(([label, result], i) => ({ id: `q${qn}a${i}`, label, result })) };
};

export const freshSeeds = [
  // ---------- Korea ----------
  {
    type: 'blind_ranking',
    slug: 'blind-rank-kpop-groups',
    title: 'Blind rank these K-pop groups',
    blurb: 'Fandoms, please stay calm. (They will not stay calm.)',
    category: 'music',
    region: 'kr',
    data: { items: items('BTS', 'BLACKPINK', 'Stray Kids', 'Seventeen', 'TWICE', 'aespa', 'NewJeans', 'Big Bang') },
    pictures: { BTS: 'BTS', BLACKPINK: 'Blackpink', 'Stray Kids': 'Stray Kids', Seventeen: 'Seventeen (South Korean band)', TWICE: 'Twice (group)', aespa: 'Aespa', NewJeans: 'NewJeans', 'Big Bang': 'Big Bang (South Korean band)' },
  },
  {
    type: 'personality',
    slug: 'which-kdrama-are-you',
    title: 'Which K-drama are you?',
    blurb: 'Answer honestly. The second lead is watching.',
    category: 'tv',
    region: 'kr',
    data: {
      results: [
        { id: 'clo', label: 'Crash Landing on You', desc: 'You fall hard and fast, and you would cross an actual border for the people you love. Dramatic? Yes. Wrong? Never.' },
        { id: 'goblin', label: 'Goblin', desc: "Old soul, a little tragic, extremely good coat game. You've definitely cried at a sunset." },
        { id: 'reply', label: 'Reply 1988', desc: "You're the friend group glue. Snacks in your bag, a group chat named after an inside joke, and a heart the size of a whole neighbourhood." },
        { id: 'squid', label: 'Squid Game', desc: 'You read the terms and conditions. Competitive, a bit suspicious of everyone, and frankly very hard to beat at board games.' },
      ],
      questions: [
        pq('Pick a Friday night', [['A long walk that turns into a confession', 'clo'], ['Rereading old letters by candlelight', 'goblin'], ['Instant noodles with the whole gang', 'reply'], ['Game night, and you are winning', 'squid']]),
        pq('Your group chat role?', [['Sends voice notes at 2am', 'clo'], ['Says one wise thing a week', 'goblin'], ['Remembers everyone’s birthday', 'reply'], ['Screenshots everything as evidence', 'squid']]),
        pq('Pick a snack', [['Fried chicken and beer', 'clo'], ['Buckwheat soba', 'goblin'], ['Tteokbokki from the corner shop', 'reply'], ['Dalgona candy (carefully)', 'squid']]),
        pq('Someone cuts the queue. You…', [['Stare until they feel it', 'clo'], ['Sigh. You have seen worse in 900 years', 'goblin'], ['Let it go, it’s fine, they’re probably having a day', 'reply'], ['Remember their face forever', 'squid']]),
      ],
    },
    pictures: { 'Crash Landing on You': 'Crash Landing on You', Goblin: 'Guardian: The Lonely and Great God', 'Reply 1988': 'Reply 1988', 'Squid Game': 'Squid Game' },
  },
  {
    type: 'tier_list',
    slug: 'tier-list-korean-food',
    title: 'Tier list: Korean food',
    blurb: 'If tteokbokki is not in S tier we need to talk.',
    category: 'food',
    region: 'kr',
    data: { tiers: ['S', 'A', 'B', 'C', 'D'], items: items('Kimchi', 'Bibimbap', 'Tteokbokki', 'Korean fried chicken', 'Samgyeopsal', 'Japchae', 'Bulgogi', 'Gimbap', 'Naengmyeon', 'Hotteok') },
    pictures: { 'Korean fried chicken': 'Korean fried chicken', Samgyeopsal: 'Samgyeop-sal', Gimbap: 'Gimbap', Hotteok: 'Hotteok' },
  },
  {
    type: 'would_you_rather',
    slug: 'would-you-rather-kdrama-edition',
    title: 'Would you rather: K-drama edition',
    blurb: 'The wrist grab is coming either way.',
    category: 'tv',
    region: 'kr',
    data: {
      pairs: pairs(
        ['Fall for a cold chaebol heir who is only soft with you', 'Fall for the childhood friend who has loved you for 20 years'],
        ['Live in a Seoul rooftop flat with a view', 'Live in a hanok with a courtyard and a grandma next door'],
        ['Be the second lead (great hair, never gets the girl)', 'Be the main lead (gets the girl, gets hit by a truck in episode 14)'],
        ['Eat ramyeon at 2am with your crush', 'Korean BBQ with the whole office, boss paying'],
        ['Get amnesia right before the wedding', 'Find out your love interest is your long-lost cousin'],
      ),
    },
    cover: 'N Seoul Tower',
    pictures: {
      'Fall for a cold chaebol heir who is only soft with you': 'Gangnam District',
      'Fall for the childhood friend who has loved you for 20 years': 'Friendship',
      'Live in a Seoul rooftop flat with a view': 'Seoul',
      'Live in a hanok with a courtyard and a grandma next door': 'Hanok',
      'Eat ramyeon at 2am with your crush': 'Ramyeon',
      'Korean BBQ with the whole office, boss paying': 'Korean barbecue',
    },
  },
  {
    type: 'trivia',
    slug: 'how-well-do-you-know-korea',
    title: 'How well do you actually know Korea?',
    blurb: 'Watching 40 K-dramas counts as studying. Probably.',
    category: 'internet',
    region: 'kr',
    data: {
      questions: [
        q('What is the capital of South Korea?', ['Busan', 'Seoul', 'Incheon'], 1),
        q('Who created the Korean alphabet, Hangul?', ['King Sejong', 'Admiral Yi', 'King Gojong'], 0, 'King Sejong the Great introduced it in the 1440s, partly so ordinary people could read.'),
        q('What is the main vegetable in classic baechu kimchi?', ['Radish', 'Napa cabbage', 'Cucumber'], 1),
        q('Which artist made "Gangnam Style"?', ['G-Dragon', 'Rain', 'PSY'], 2, 'It was the first YouTube video to hit a billion views.'),
        q('What does "BTS" stand for in Korean?', ['Bangtan Sonyeondan', 'Beyond The Scene', 'Big Time Stars'], 0, '"Beyond The Scene" came later as an English backronym.'),
        q('What is the currency of South Korea?', ['Yen', 'Won', 'Yuan'], 1),
      ],
    },
    cover: 'Gyeongbokgung',
    pictures: {
      'What is the capital of South Korea?': 'Han River (Korea)',
      'Who created the Korean alphabet, Hangul?': 'Hangul',
      'What is the main vegetable in classic baechu kimchi?': 'Kimchi',
      'Which artist made "Gangnam Style"?': 'Gangnam District',
      'What does "BTS" stand for in Korean?': 'BTS',
      'What is the currency of South Korea?': 'Myeong-dong',
    },
  },

  // ---------- India ----------
  {
    type: 'blind_ranking',
    slug: 'blind-rank-shah-rukh-khan-movies',
    title: 'Blind rank these Shah Rukh Khan movies',
    blurb: 'Palat. Palat. Okay now rank it.',
    category: 'movies',
    region: 'in',
    data: { items: items('Dilwale Dulhania Le Jayenge', 'Kuch Kuch Hota Hai', 'Kabhi Khushi Kabhie Gham', 'Chak De! India', 'Om Shanti Om', 'My Name Is Khan', 'Pathaan', 'Jawan') },
    pictures: { 'Kabhi Khushi Kabhie Gham': 'Kabhi Khushi Kabhie Gham...', 'Pathaan': 'Pathaan (film)', Jawan: 'Jawan (film)', 'Om Shanti Om': 'Om Shanti Om' },
  },
  {
    type: 'poll',
    slug: 'goat-of-indian-cricket',
    title: 'Who is the GOAT of Indian cricket?',
    blurb: "Choose carefully. Your uncle will see this.",
    category: 'sports',
    region: 'in',
    data: { items: items('Sachin Tendulkar', 'Virat Kohli', 'MS Dhoni', 'Rohit Sharma', 'Kapil Dev', 'Sunil Gavaskar') },
  },
  {
    type: 'this_or_that',
    slug: 'this-or-that-desi-edition',
    title: 'This or that: desi edition',
    blurb: 'Every answer will start a family argument.',
    category: 'internet',
    region: 'in',
    data: { pairs: pairs(['Chai', 'Filter coffee'], ['Mumbai', 'Delhi'], ['Biryani', 'Butter chicken'], ['Shah Rukh Khan', 'Salman Khan'], ['Diwali', 'Holi'], ['Samosa', 'Vada pav'], ['Maggi', 'Poha']) },
    pictures: { Chai: 'Masala chai', 'Filter coffee': 'Indian filter coffee', Mumbai: 'Mumbai', Delhi: 'India Gate', Maggi: 'Maggi', 'Butter chicken': 'Butter chicken' },
  },
  {
    type: 'personality',
    slug: 'which-bollywood-hero-are-you',
    title: 'Which Bollywood hero are you?',
    blurb: 'Slow-motion hair flip optional.',
    category: 'celebs',
    region: 'in',
    data: {
      results: [
        { id: 'srk', label: 'Shah Rukh Khan', desc: 'Open arms, open heart. You say something charming in the rain and somehow it works every single time.' },
        { id: 'salman', label: 'Salman Khan', desc: 'Big heart, bigger entrances. You do things your own way and somehow everybody still turns up for you.' },
        { id: 'aamir', label: 'Aamir Khan', desc: 'The perfectionist. You redo the group project the night before it is due, and honestly, thank you.' },
        { id: 'ranveer', label: 'Ranveer Singh', desc: 'Chaos in the best way. Your outfits have outfits and your energy can power a small city.' },
      ],
      questions: [
        pq('Pick a dream weekend', [['Switzerland, mountains, a train', 'srk'], ['Farmhouse with all your friends', 'salman'], ['Learning something completely new', 'aamir'], ['Wherever the party is', 'ranveer']]),
        pq('Your karaoke song?', [['A slow romantic one, with feeling', 'srk'], ['Something everyone can shout along to', 'salman'], ['You practised it all week', 'aamir'], ['All of them. Back to back.', 'ranveer']]),
        pq('Pick an outfit', [['A sweater tied over the shoulders', 'srk'], ['Jeans, a bracelet, done', 'salman'], ['Whatever the role needs', 'aamir'], ['Head-to-toe leopard print', 'ranveer']]),
        pq('How do you say sorry?', [['A long heartfelt speech', 'srk'], ['Show up with food', 'salman'], ['A well-researched letter', 'aamir'], ['A dramatic dance number', 'ranveer']]),
      ],
    },
    pictures: { 'Ranveer Singh': 'Ranveer Singh' },
  },
  {
    type: 'tier_list',
    slug: 'tier-list-indian-street-food',
    title: 'Tier list: Indian street food',
    blurb: 'Pani puri vendors are the real MVPs.',
    category: 'food',
    region: 'in',
    data: { tiers: ['S', 'A', 'B', 'C', 'D'], items: items('Pani puri', 'Vada pav', 'Pav bhaji', 'Samosa', 'Chole bhature', 'Momos', 'Dosa', 'Jalebi', 'Kathi roll', 'Bhel puri') },
    pictures: { 'Pani puri': 'Panipuri', Momos: 'Momo (food)', 'Kathi roll': 'Kati roll', 'Bhel puri': 'Bhelpuri' },
  },

  // ---------- UK ----------
  {
    type: 'this_or_that',
    slug: 'this-or-that-very-british',
    title: 'This or that: very British edition',
    blurb: 'The scone question has ended friendships.',
    category: 'food',
    region: 'uk',
    data: { pairs: pairs(['Jam first (Cornish)', 'Cream first (Devon)'], ['Greggs', 'Pret'], ['Tea', 'Coffee'], ['Marmite', 'Vegemite'], ['Gravy on chips', 'Curry sauce on chips'], ['Full English', 'Bacon butty'], ['Dunk the biscuit', 'Never dunk']) },
    pictures: { 'Jam first (Cornish)': 'Cream tea', 'Cream first (Devon)': 'Clotted cream', Greggs: 'Greggs', Pret: 'Pret a Manger', 'Gravy on chips': 'Chips and gravy', 'Curry sauce on chips': 'Chip shop curry', 'Full English': 'Full breakfast', 'Bacon butty': 'Bacon sandwich', 'Dunk the biscuit': 'Biscuit dunking', 'Never dunk': 'Digestive biscuit' },
  },
  {
    type: 'poll',
    slug: 'best-oasis-song',
    title: "What's the best Oasis song?",
    blurb: "Definitely, maybe, there's only one right answer.",
    category: 'music',
    region: 'uk',
    data: { items: items('Wonderwall', "Don't Look Back in Anger", 'Champagne Supernova', 'Live Forever', 'Supersonic', 'Stand by Me') },
    pictures: { Wonderwall: "(What's the Story) Morning Glory?", "Don't Look Back in Anger": "Don't Look Back in Anger", 'Champagne Supernova': 'Champagne Supernova', 'Live Forever': 'Live Forever (Oasis song)', Supersonic: 'Supersonic (Oasis song)', 'Stand by Me': 'Be Here Now (album)' },
  },
  {
    type: 'bracket',
    slug: 'best-british-tv-show-bracket',
    title: 'Best British TV show ever: the bracket',
    blurb: 'Eight classics. One winner. Several fallings-out.',
    category: 'tv',
    region: 'uk',
    data: { shuffle: true, items: items('Doctor Who', 'Fleabag', 'Peaky Blinders', 'The Office (UK)', 'Sherlock', 'Gavin & Stacey', 'Downton Abbey', 'Only Fools and Horses') },
    pictures: { 'The Office (UK)': 'The Office (British TV series)', 'Gavin & Stacey': 'Gavin & Stacey', Sherlock: 'Sherlock (TV series)' },
  },
  {
    type: 'personality',
    slug: 'which-british-weather-are-you',
    title: 'Which British weather are you?',
    blurb: 'All four seasons before lunch.',
    category: 'internet',
    region: 'uk',
    data: {
      results: [
        { id: 'drizzle', label: 'Drizzle', desc: "Low-key, always there, gently gets into everything. People complain about you but they'd miss you." },
        { id: 'sun', label: 'Surprise sunshine', desc: "You turn up out of nowhere and everyone immediately goes to the pub. A national treasure." },
        { id: 'fog', label: 'Fog', desc: 'Mysterious. Nobody knows what you are thinking, and you prefer it that way.' },
        { id: 'storm', label: 'Thunderstorm', desc: 'Big feelings, bigger entrances, gone by morning. Exhausting but iconic.' },
      ],
      questions: [
        pq('Pick a Sunday', [['Pyjamas till noon', 'drizzle'], ['Beer garden, obviously', 'sun'], ['A long walk on your own', 'fog'], ['Something spontaneous and loud', 'storm']]),
        pq('How do you text?', [['lol ok x', 'drizzle'], ['ALL CAPS, many exclamation marks', 'sun'], ['Read at 14:02', 'fog'], ['Seven messages in a row', 'storm']]),
        pq('Pick a drink', [['A nice cup of tea', 'drizzle'], ['Pimm’s', 'sun'], ['Black coffee', 'fog'], ['Whatever is strongest', 'storm']]),
        pq('At a party you are…', [['In the kitchen, chatting', 'drizzle'], ['Making everyone dance', 'sun'], ['Gone without saying goodbye', 'fog'], ['The reason there’s a story tomorrow', 'storm']]),
      ],
    },
    pictures: { 'Surprise sunshine': 'Sunlight', Thunderstorm: 'Thunderstorm', Drizzle: 'Drizzle', Fog: 'Fog' },
  },
  {
    type: 'trivia',
    slug: 'very-british-trivia',
    title: 'Very British trivia (no googling, we can tell)',
    category: 'internet',
    region: 'uk',
    data: {
      questions: [
        q('What is the national animal of Scotland?', ['Red deer', 'Unicorn', 'Golden eagle'], 1, 'Yes, really. It has been since the 1300s.'),
        q("Strictly speaking, what is 'Big Ben'?", ['The clock tower', 'The clock face', 'The bell'], 2, 'The tower has been called the Elizabeth Tower since 2012.'),
        q('What do Londoners call the Underground?', ['The Metro', 'The Tube', 'The Line'], 1),
        q('Which bakery chain is famous for its sausage rolls?', ['Greggs', 'Pret', 'Costa'], 0),
        q('In which city did the Beatles form?', ['Manchester', 'London', 'Liverpool'], 2),
      ],
    },
    cover: 'Big Ben',
    pictures: {
      'What is the national animal of Scotland?': 'Edinburgh Castle',
      "Strictly speaking, what is 'Big Ben'?": 'Palace of Westminster',
      'What do Londoners call the Underground?': 'London Underground',
      'Which bakery chain is famous for its sausage rolls?': 'Sausage roll',
      'In which city did the Beatles form?': 'The Beatles',
    },
  },

  // ---------- US ----------
  {
    type: 'tier_list',
    slug: 'tier-list-american-fast-food',
    title: 'Tier list: American fast food chains',
    blurb: 'Chick-fil-A stans, the floor is yours.',
    category: 'food',
    region: 'us',
    data: { tiers: ['S', 'A', 'B', 'C', 'D'], items: items("McDonald's", 'Chick-fil-A', 'In-N-Out', 'Taco Bell', "Wendy's", 'Burger King', 'Chipotle', 'Popeyes', 'Shake Shack', 'Five Guys') },
    pictures: { 'In-N-Out': 'In-N-Out Burger', Chipotle: 'Chipotle Mexican Grill' },
  },
  {
    type: 'poll',
    slug: 'is-a-hot-dog-a-sandwich',
    title: 'Is a hot dog a sandwich?',
    blurb: 'The question that has broken more friendships than Monopoly.',
    category: 'food',
    region: 'us',
    data: { items: items('Yes, obviously', 'No, absolutely not', "It's a taco", "It's its own thing") },
    pictures: { 'Yes, obviously': 'Sandwich', 'No, absolutely not': 'Hot dog', "It's a taco": 'Taco', "It's its own thing": 'Hot dog stand' },
  },
  {
    type: 'would_you_rather',
    slug: 'would-you-rather-halloween',
    title: 'Would you rather: Halloween edition',
    blurb: "It's October. You know what to do.",
    category: 'internet',
    region: 'us',
    data: {
      pairs: pairs(
        ['Spend one night alone in a haunted house', 'Spend one night alone in a corn maze'],
        ['Only get candy corn this year', 'Only get raisins this year'],
        ['Wear the scariest costume at the party', 'Wear the funniest costume at the party'],
        ['Have a ghost roommate who cleans', 'Have a vampire roommate who pays rent on time'],
        ['Watch every horror movie with the lights off', 'Never watch a horror movie again'],
      ),
    },
    cover: 'Jack-o’-lantern',
    pictures: {
      'Spend one night alone in a haunted house': 'Haunted house',
      'Spend one night alone in a corn maze': 'Corn maze',
      'Only get candy corn this year': 'Candy corn',
      'Only get raisins this year': 'Raisin',
      'Have a ghost roommate who cleans': 'Ghost',
      'Have a vampire roommate who pays rent on time': 'Vampire',
      'Watch every horror movie with the lights off': 'Horror film',
      'Never watch a horror movie again': 'Romantic comedy',
    },
  },
  {
    type: 'trivia',
    slug: 'only-real-americans-get-5',
    title: 'Only real Americans get 5/5',
    category: 'internet',
    region: 'us',
    data: {
      questions: [
        q('How many stars are on the US flag?', ['48', '50', '52'], 1),
        q('Thanksgiving is in which month?', ['October', 'November', 'December'], 1, 'In the US it is the fourth Thursday of November. Canada does it in October.'),
        q("Which city is called 'the Big Apple'?", ['Chicago', 'Los Angeles', 'New York City'], 2),
        q('The Super Bowl is the final of which sport?', ['Baseball', 'American football', 'Basketball'], 1),
        q('Which state is Hollywood in?', ['California', 'Nevada', 'Florida'], 0),
      ],
    },
    cover: 'Statue of Liberty',
    pictures: {
      'How many stars are on the US flag?': 'United States Capitol',
      'Thanksgiving is in which month?': 'Thanksgiving dinner',
      "Which city is called 'the Big Apple'?": 'Times Square',
      'The Super Bowl is the final of which sport?': 'Vince Lombardi Trophy',
      'Which state is Hollywood in?': 'Hollywood Sign',
    },
  },
  {
    type: 'bracket',
    slug: 'best-marvel-movie-bracket',
    title: 'Best Marvel movie: the bracket',
    blurb: "Don't say Endgame just because it was long.",
    category: 'movies',
    region: 'us',
    data: { shuffle: true, items: items('Avengers: Endgame', 'Avengers: Infinity War', 'Black Panther', 'Iron Man', 'Guardians of the Galaxy', 'Spider-Man: No Way Home', 'Thor: Ragnarok', 'The Avengers') },
    pictures: { 'Iron Man': 'Iron Man (2008 film)', 'Guardians of the Galaxy': 'Guardians of the Galaxy (film)', 'Black Panther': 'Black Panther (film)', 'The Avengers': 'The Avengers (2012 film)' },
  },

  // ---------- everywhere: feelings edition ----------
  {
    type: 'rate_these',
    slug: 'rate-movies-that-made-you-ugly-cry',
    title: 'Rate the movies that made you ugly cry',
    blurb: 'Tissues are in the kitchen. Take the whole box.',
    category: 'movies',
    data: { items: items('Titanic', 'The Notebook', 'Hachi: A Dog’s Tale', 'Grave of the Fireflies', 'Coco', 'Taare Zameen Par', 'Miracle in Cell No. 7', 'Marley & Me') },
    pictures: { Titanic: 'Titanic (1997 film)', 'The Notebook': 'The Notebook', 'Hachi: A Dog’s Tale': "Hachi: A Dog's Tale", Coco: 'Coco (2017 film)', 'Miracle in Cell No. 7': 'Miracle in Cell No. 7', 'Marley & Me': 'Marley & Me (film)' },
  },
  {
    type: 'would_you_rather',
    slug: 'would-you-rather-big-feelings',
    title: 'Would you rather: big feelings edition',
    blurb: 'A gentle one. Answer with your heart.',
    category: 'internet',
    data: {
      pairs: pairs(
        ['Have one more day with someone you lost', 'Know for sure that they are okay, wherever they are'],
        ['Forget your worst memory', 'Relive your best memory once more'],
        ['Read every letter your parents never sent you', 'Get one letter from your 80-year-old self'],
        ['Say sorry to someone you hurt', 'Hear sorry from someone who hurt you'],
        ['Know exactly how much time you have', 'Never know, and live like it’s forever'],
      ),
    },
    cover: 'Sunset',
  },
  {
    type: 'poll',
    slug: 'what-instantly-makes-your-day',
    title: 'What instantly makes your day better?',
    blurb: 'A happy one. You deserve it.',
    category: 'internet',
    data: { items: items('A puppy video', 'A sunny morning', 'A random text from your best friend', 'The smell of fresh bread', 'Payday', 'Your song coming on shuffle') },
    pictures: { 'A puppy video': 'Puppy', 'A sunny morning': 'Sunrise', 'A random text from your best friend': 'Text messaging', 'The smell of fresh bread': 'Bread', Payday: 'Cash', 'Your song coming on shuffle': 'Headphones' },
  },
  {
    type: 'rate_these',
    slug: 'rate-these-cursed-food-combos',
    title: 'Rate these cursed food combos',
    blurb: "Some of these are crimes. Some of them are… actually good?",
    category: 'food',
    data: { items: items('Pineapple on pizza', 'Fries dipped in a milkshake', 'Ketchup on eggs', 'Mayo on fries', 'Chocolate and chips', 'Cheese on apple pie') },
    pictures: { 'Pineapple on pizza': 'Hawaiian pizza', 'Fries dipped in a milkshake': 'Milkshake', 'Ketchup on eggs': 'Scrambled eggs', 'Mayo on fries': 'Patatje oorlog', 'Chocolate and chips': 'Potato chip', 'Cheese on apple pie': 'Apple pie' },
  },
];
