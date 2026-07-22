import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const NAV_LINKS = [
  { id: 'nav-approach',   label: 'Approach',   href: '#approach'   },
  { id: 'nav-instructor', label: 'Instructors', href: '#instructors' },
  { id: 'nav-courses',    label: 'Courses',     href: '#courses'    },
  { id: 'nav-about',      label: 'About',      href: '/about'      },
];

const LogoMark = ({ size = 14, dark = true }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path d="M9 1.5L16 5.5V12.5L9 16.5L2 12.5V5.5L9 1.5Z" fill={dark ? 'white' : 'var(--bg)'} />
    <path d="M9 6L12.5 8V12L9 14L5.5 12V8L9 6Z" fill={dark ? 'rgba(255,255,255,0.25)' : 'rgba(3,3,4,0.2)'} />
  </svg>
);

export { LogoMark };

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const navigate = useNavigate();

  const handleNavClick = (href) => {
    setDrawerOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        // If not on landing page, navigate to landing page with hash
        navigate(`/${href}`);
      }
    } else {
      navigate(href);
    }
  };

  return (
    <>
      <nav
        className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}
        id="navbar"
        role="navigation"
        aria-label="Main navigation"
      >
        <Link to="/" className="navbar__logo" id="navbar-logo">
          <div className="navbar__logo-mark"><LogoMark dark={false} /></div>
          <span className="navbar__logo-text">UVSHUB</span>
        </Link>

        <div className="navbar__center">
          {NAV_LINKS.map(link => (
            <a
              key={link.id}
              id={link.id}
              href={link.href}
              className="navbar__link"
              onClick={e => { e.preventDefault(); handleNavClick(link.href); }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="navbar__actions">
          <Link to="/student/login" id="navbar-login" className="navbar__login">Log in</Link>
          <Link to="/student/register" id="navbar-cta" className="btn btn-primary">Get Started</Link>
        </div>

        {/* Hamburger */}
        <button
          id="navbar-hamburger"
          className={`navbar__hamburger${drawerOpen ? ' open' : ''}`}
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile Drawer */}
      <div className={`navbar__drawer${drawerOpen ? ' open' : ''}`} aria-hidden={!drawerOpen}>
        <div className="navbar__drawer-backdrop" onClick={() => setDrawerOpen(false)} />
        <div className="navbar__drawer-panel">
          {NAV_LINKS.map(link => (
            <a
              key={link.id}
              href={link.href}
              className="navbar__drawer-link"
              onClick={e => { e.preventDefault(); scrollTo(link.href); }}
            >
              {link.label}
            </a>
          ))}

          <div className="drawer__footer">
            <Link to="/student/login" className="btn btn-outline" onClick={() => setDrawerOpen(false)}>Log in</Link>
            <Link to="/student/register" className="btn btn-primary" onClick={() => setDrawerOpen(false)}>Get Started Free</Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;
