import { Link } from 'react-router-dom';
import { useTitle } from '../lib/util.js';

export default function NotFound() {
  useTitle('Not found');
  return (
    <div className="wrap narrow section center">
      <h1 className="page-title">Hmm, nothing here.</h1>
      <p className="page-sub">The link might be wrong, or this got taken down.</p>
      <Link to="/" className="btn btn-red">
        Back to the homepage
      </Link>
    </div>
  );
}
