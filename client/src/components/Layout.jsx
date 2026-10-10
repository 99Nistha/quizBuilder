import { Link, NavLink } from 'react-router-dom';
import { BRAND, SITE_NAME } from '../../../shared/meta.js';
import BeeMark from './BeeMark.jsx';

export function Wordmark() {
  if (BRAND.logoImage) return <img src={BRAND.logoImage} alt={SITE_NAME} className="logo-img" />;
  const [a, b] = BRAND.wordmark ?? [SITE_NAME, ''];
  return (
    <>
      <BeeMark />
      <span>
        {a}
        <span className="logo-word-b">{b}</span>
      </span>
    </>
  );
}

export default function Layout({ children }) {
  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-inner">
          <Link to="/" className="logo" aria-label={`${SITE_NAME} home`}>
            <Wordmark />
          </Link>
          <nav className="nav">
            <NavLink to="/browse" className="nav-link nav-browse">
              Browse
            </NavLink>
            <NavLink to="/mine" className="nav-link">
              My games
            </NavLink>
            <Link to="/make" className="btn btn-small btn-red">
              Make one
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <div className="wrap footer-inner">
          <p>
            <strong>{SITE_NAME}</strong> is made by humans who have strong feelings about pizza toppings.
          </p>
          <p className="footer-links">
            <Link to="/make">Make a game</Link>
            <Link to="/browse">Browse</Link>
            <Link to="/privacy">Privacy</Link>
          </p>
        </div>
      </footer>
    </>
  );
}
