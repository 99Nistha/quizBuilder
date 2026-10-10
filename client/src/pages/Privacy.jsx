import { SITE_NAME } from '../../../shared/meta.js';
import { useTitle } from '../lib/util.js';

export default function Privacy() {
  useTitle('Privacy');
  return (
    <div className="wrap narrow section prose">
      <h1 className="page-title">Privacy, in plain words</h1>
      <p>You don't need an account to make or play anything on {SITE_NAME}.</p>
      <p>
        When you finish a game we save <strong>what you picked</strong> (your ranking, your answers) so we can show everyone how the crowd voted and give your result its own link. We don't save
        your name, email or anything else that says who you are alongside it.
      </p>
      <p>
        Your browser remembers which results are yours so we can say “your ranking” instead of “their ranking”. That stays on your device. Clear your browser data and it's gone.
      </p>
      <p>
        If we ever work with brands, they only see totals like “68% picked Folklore”. Never anything about you personally. We don't sell data. That's not a vibe we're going for.
      </p>
      <p>Pictures you upload are public, since the whole point is that people see them. Please only upload stuff you're okay sharing.</p>
      <p>
        To stop spam, we keep a scrambled version of your network address for up to an hour, then delete it. It can't be turned back into your address.
      </p>
      <p>
        When you search for a picture, your browser looks it up on Wikipedia, iTunes and Openverse directly, so those sites see that request like any other visit.
      </p>
    </div>
  );
}
