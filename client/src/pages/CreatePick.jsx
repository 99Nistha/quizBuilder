import { Link } from 'react-router-dom';
import { formatList } from '../../../shared/meta.js';
import FormatArt from '../components/FormatArt.jsx';
import { useTitle } from '../lib/util.js';

export default function CreatePick() {
  useTitle('Make a game');
  return (
    <div className="wrap section">
      <h1 className="page-title">What are we making?</h1>
      <p className="page-sub">Pick a format. You can add pictures to anything, or just type and go.</p>
      <div className="formats formats-big">
        {formatList().map((f) => (
          <Link key={f.id} to={`/make/${f.id}`} className="format" style={{ '--c': f.color }}>
            <FormatArt type={f.id} />
            <strong>{f.name}</strong>
            <span>{f.pitch}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
