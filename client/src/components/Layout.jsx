import { Link, NavLink } from 'react-router-dom';
import { SITE_NAME } from '../../../shared/meta.js';

export default function Layout({ children }) {
  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-inner">
          <Link to="/" className="logo" aria-label={`${SITE_NAME} home`}>
            {SITE_NAME.toLowerCase()}
            <span className="logo-dot" aria-hidden />
          </Link>
          <nav className="nav">
            <NavLink to="/browse" className="nav-link">
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
            <strong>{SITE_NAME.toLowerCase()}</strong> is made by humans who have strong feelings about pizza toppings.
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
