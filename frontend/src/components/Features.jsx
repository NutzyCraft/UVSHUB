import { Link } from 'react-router-dom';
import './Features.css';
import SpotlightCard from './ui/SpotlightCard';
import Reveal from './ui/Reveal';

function Features() {
  return (
    <section className="features" id="approach" aria-labelledby="features-heading">
      <div className="features__inner">

        <div className="features__header">
          <div className="features__header-left">
            <div className="tag">PREMIUM EXPERIENCE</div>
            <h2 className="features__header-title" id="features-heading">
              Engineered for<br /><em>virtual excellence.</em>
            </h2>
            <p className="features__header-sub">
              Experience online classes that rival in-person learning. Enjoy high-resolution streams, personalized attention, and an environment designed for your absolute success.
            </p>
          </div>
          <Link to="/courses" className="btn btn-outline">
            Browse Classes
          </Link>
        </div>

        <Reveal direction="up" delay={200}>
          <div className="bento">

            {/* Big text cell — Personal Attention */}
            <SpotlightCard className="bento-cell bento-cell--c8 bento-cell--r2 bento-cell--glow-violet" glowColor="rgba(143, 85, 255, 0.2)">
              <div className="bento-cell__icon" style={{ color: 'var(--violet)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
              </div>
              <div className="bento-cell__title" style={{ fontSize: '24px' }}>Unmatched Personal Attention</div>
              <div className="bento-cell__desc" style={{ fontSize: '15px', maxWidth: '400px' }}>
                We believe online learning shouldn't mean learning alone. Our instructors dedicate time to give special attention to every single student, ensuring nobody is left behind.
              </div>
            </SpotlightCard>

            {/* Stat — 4K Streams */}
            <SpotlightCard className="bento-cell bento-cell--c4 bento-cell--glow-accent" glowColor="rgba(226, 255, 74, 0.2)">
              <div className="bento-cell__stat">1080p</div>
              <div className="bento-cell__stat-label">Full HD Streaming Quality</div>
              <div className="bento-cell__visual">
                <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
                  <circle cx="80" cy="80" r="60" stroke="var(--accent)" strokeWidth="1" strokeDasharray="4 4"/>
                </svg>
              </div>
            </SpotlightCard>

            {/* Crystal Clear Audio */}
            <SpotlightCard className="bento-cell bento-cell--c4">
              <div className="bento-cell__icon" style={{ color: 'var(--accent)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
              </div>
              <div className="bento-cell__title">Crystal Clear Audio</div>
              <div className="bento-cell__desc">Experience lag-free, studio-quality audio for perfectly clear lessons.</div>
            </SpotlightCard>

            {/* Interactive */}
            <SpotlightCard className="bento-cell bento-cell--c4">
              <div className="bento-cell__icon" style={{ color: 'var(--blue)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div className="bento-cell__title">Interactive Sessions</div>
              <div className="bento-cell__desc">Engage directly with teachers. Ask questions in real-time and get immediate feedback.</div>
            </SpotlightCard>

            {/* Categories */}
            <SpotlightCard className="bento-cell bento-cell--c4 bento-cell--glow-blue" glowColor="rgba(45, 212, 191, 0.2)">
              <div className="bento-cell__icon" style={{ color: 'var(--blue)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              </div>
              <div className="bento-cell__title">Comprehensive Subjects</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto' }}>
                {['MATH','SCIENCE','ENGLISH','ICT','COMMERCE'].map(t => (
                  <span key={t} style={{ fontSize: '11px', fontFamily: 'var(--mono)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: '4px', color: 'var(--ink-3)' }}>{t}</span>
                ))}
              </div>
            </SpotlightCard>

            {/* Lifetime access */}
            <SpotlightCard className="bento-cell bento-cell--c4">
              <div className="bento-cell__icon" style={{ color: 'var(--white)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div className="bento-cell__title">Class Recordings</div>
              <div className="bento-cell__desc">Missed a session? Re-watch high-quality recordings anytime without any expiration limits.</div>
            </SpotlightCard>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default Features;
