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
              <div style={{ width: '24px', height: '24px', background: 'var(--white)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LogoMark size={10} dark={false} />
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 600, color: 'var(--white)', letterSpacing: '0.1em' }}>UVSHUB</span>
            </Link>
            <p className="footer__brand-text">
              An advanced spatial learning platform designed for the builders of tomorrow.
            </p>
          </div>

          <div>
            <div className="footer__group-title">Modules</div>
            <ul className="footer__links">
              <li><Link to="/courses" className="footer__link">Web Development</Link></li>
              <li><Link to="/courses" className="footer__link">Spatial Design</Link></li>
              <li><Link to="/courses" className="footer__link">Machine Learning</Link></li>
              <li><Link to="/courses" className="footer__link">Neural Networks</Link></li>
            </ul>
          </div>

          <div>
            <div className="footer__group-title">Platform</div>
            <ul className="footer__links">
              <li><a href="#approach" className="footer__link">Architecture</a></li>
              <li><a href="#instructors" className="footer__link">Operatives</a></li>
              <li><a href="#pricing" className="footer__link">Licensing</a></li>
              <li><Link to="/student/login" className="footer__link">Terminal Login</Link></li>
            </ul>
          </div>

          <div>
            <div className="footer__group-title">Legal</div>
            <ul className="footer__links">
              <li><a href="#" className="footer__link">Privacy Protocol</a></li>
              <li><a href="#" className="footer__link">Terms of Service</a></li>
              <li><a href="#" className="footer__link">Cookie Matrix</a></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <div>© 2028 UVSHUB. ALL SYSTEMS NOMINAL.</div>
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
