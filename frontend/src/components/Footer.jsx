import { Link } from 'react-router-dom';
import { LogoMark } from './Navbar';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>
      <div className="footer__inner">

        <div className="footer__cta">
          <h3 className="footer__cta-title">
            Ready to push<br /><em>boundaries?</em>
          </h3>
          <Link to="/register" className="footer__cta-btn">
            Initialize Access <span style={{ color: 'var(--accent)' }}>→</span>
          </Link>
        </div>

        <div className="footer__nav">
          <div className="footer__brand">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <LogoMark size={32} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 600, color: 'var(--white)', letterSpacing: '0.1em' }}>UVSHUB</span>
            </Link>
            <p className="footer__brand-text">
              An advanced learning platform designed for the builders of tomorrow.
            </p>
          </div>
        </div>

        <div className="footer__bottom">
          <div>© 2026 UVSHUB || Developed by <a href="https://www.nutzycraft.com/" target="_blank" rel="noopener noreferrer" className="footer__author-link">NutzyCraft</a>. All Rights Reserved.</div>
          <div className="footer__socials">
            <a href="#" className="footer__social" aria-label="X (Twitter)">X</a>
            <a href="#" className="footer__social" aria-label="GitHub">GH</a>
            <a href="#" className="footer__social" aria-label="Discord">DC</a>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
