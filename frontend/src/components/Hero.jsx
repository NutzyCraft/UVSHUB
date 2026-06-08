import { Link } from 'react-router-dom';
import './Hero.css';
import Magnetic from './ui/Magnetic';
import SpotlightCard from './ui/SpotlightCard';

function Hero() {
  return (
    <section className="hero" id="hero" aria-labelledby="hero-title">

      {/* Aurora Background */}
      <div className="hero__aurora" aria-hidden="true" />

      {/* Main content */}
      <div className="hero__content">
        <div className="hero__eyebrow">
          <div className="hero__eyebrow-pulse"><span /></div>
          SYSTEM ONLINE // 1,160+ COURSES
        </div>

        <h1 className="hero__title" id="hero-title">
          Learn without<br />
          <em>limitations.</em>
        </h1>

        <p className="hero__sub">
          A spatial learning platform for curious minds. Master world-class courses,
          earn verified certificates, and join the network of tomorrow's builders.
        </p>

        <div className="hero__actions" style={{ display: 'flex', gap: '16px' }}>
          <Magnetic strength={0.3}>
            <Link to="/student/register" id="hero-cta-primary" className="btn btn-primary btn-lg">
              Initialize Access
            </Link>
          </Magnetic>
          <Magnetic strength={0.3}>
            <Link to="/courses" id="hero-cta-secondary" className="btn btn-outline btn-lg">
              Browse Matrix
            </Link>
          </Magnetic>
        </div>
      </div>

      {/* 3D Glass Cards */}
      <div className="hero__cards" aria-label="Featured courses">
        
        {/* Card 1 */}
        <SpotlightCard className="hero__glass-card" glowColor="rgba(143, 85, 255, 0.2)">
          <div id="hcard-1" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="hc-icon" style={{ color: 'var(--violet)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div className="hc-title">Advanced React & Architecture</div>
            <div className="hc-meta" style={{ marginTop: 'auto' }}>
              <span>47 HOURS</span>
              <span className="hc-pill" style={{ background: 'var(--violet)' }}>PRO</span>
            </div>
          </div>
        </SpotlightCard>

        {/* Card 2 (Center) */}
        <SpotlightCard className="hero__glass-card" glowColor="rgba(226, 255, 74, 0.2)">
          <div id="hcard-2" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="hc-icon" style={{ color: 'var(--accent)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>
            </div>
            <div className="hc-title">UI/UX Spatial Design Patterns</div>
            <div className="hc-meta" style={{ marginTop: 'auto' }}>
              <span>38 HOURS</span>
              <span className="hc-pill" style={{ background: 'var(--accent)', color: 'var(--bg)' }}>NEW</span>
            </div>
          </div>
        </SpotlightCard>

        {/* Card 3 */}
        <SpotlightCard className="hero__glass-card" glowColor="rgba(45, 212, 191, 0.2)">
          <div id="hcard-3" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="hc-icon" style={{ color: 'var(--blue)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            </div>
            <div className="hc-title">Applied ML & Neural Nets</div>
            <div className="hc-meta" style={{ marginTop: 'auto' }}>
              <span>44 HOURS</span>
              <span className="hc-pill" style={{ background: 'var(--blue)' }}>HOT</span>
            </div>
          </div>
        </SpotlightCard>

        <div className="hero__bottom-fade" aria-hidden="true" />
      </div>

    </section>
  );
}

export default Hero;
