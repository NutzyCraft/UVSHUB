import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LogoMark } from '../../components/Navbar';
import './CourseDetail.css';

const Check = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const Play = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const File = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;

const syllabus = [
  { title: '1. Initialization & Environment', dur: '45m', eps: [{ t: 'System overview', d: '05:20', type: 'vid' }, { t: 'Environment configuration', d: '12:45', type: 'vid' }, { t: 'Architecture deep dive', d: '27:00', type: 'vid' }] },
  { title: '2. Core Protocols', dur: '2h 15m', eps: [{ t: 'Syntax and primitives', d: '18:30', type: 'vid' }, { t: 'Advanced patterns', d: '45:10', type: 'vid' }, { t: 'Simulation exercise', d: '1h 10m', type: 'doc' }] },
  { title: '3. State Management', dur: '3h 40m', eps: [{ t: 'Data flow control', d: '35:20', type: 'vid' }, { t: 'Memory optimization', d: '1h 20m', type: 'vid' }, { t: 'Stress testing', d: '1h 45m', type: 'vid' }] },
  { title: '4. Final Integration', dur: '1h 30m', eps: [{ t: 'Matrix deployment', d: '15:00', type: 'vid' }, { t: 'Production telemetry', d: '45:00', type: 'vid' }, { t: 'Session termination', d: '30:00', type: 'vid' }] },
];

function CourseDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('about');
  const [openMods, setOpenMods] = useState([0]); // first module open
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`/api/v1/courses/${id}`);
        const data = await res.json();
        if (data.success) {
          setCourse(data.data);
        } else {
          setError(data.message || 'Failed to fetch course');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  if (loading) return <div style={{ padding: '120px', textAlign: 'center', color: 'var(--white)', fontFamily: 'var(--mono)' }}>INITIALIZING DATASTREAM...</div>;
  if (error || !course) return <div style={{ padding: '120px', textAlign: 'center', color: 'var(--red)', fontFamily: 'var(--mono)' }}>{error || 'Course not found'}</div>;

  const { Name, InstructorName, Medium, Grade, Price } = course;
  const isFree = !Price || parseFloat(Price) === 0;

  // Fallback UI variables
  const categoryStr = `${Medium} • Grade ${Grade}`;
  const duration = "4h 30m";
  const rating = 4.8;
  const reviewCount = 1250;
  const thumb = "https://images.unsplash.com/photo-1610563166150-b34df4f3bcd6?auto=format&fit=crop&w=600&q=80";
  const avatar = "https://i.pravatar.cc/150?u=" + id; // Mock avatar
  const originalPrice = null;

  const toggleMod = (idx) => {
    setOpenMods(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  return (
    <div className="cd-page">
      {/* Navbar Minimal */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', zIndex: 100, background: 'rgba(3,3,4,0.6)', backdropFilter: 'blur(24px)', borderBottom: '1px solid var(--border)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--white)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LogoMark dark={false} /></div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: 600, color: 'var(--white)', letterSpacing: '0.1em' }}>UVSHUB</span>
        </Link>
        <Link to="/student/login" className="btn btn-outline" style={{ fontFamily: 'var(--mono)', fontSize: '12px', padding: '10px 20px' }}>Dashboard</Link>
      </nav>

      {/* Hero */}
      <header className="cd-hero">
        <div className="cd-hero__inner">
          <div>
            <Link to="/courses" className="cd-hero__back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              ABORT TO MATRIX
            </Link>

            <div className="cd-hero__cat">{categoryStr}</div>
            <h1 className="cd-hero__title">{Name}</h1>
            <p className="cd-hero__desc">
              Master the spatial architecture needed to excel. This comprehensive transmission takes you from initialization to advanced execution with real-world applications.
            </p>

            <div className="cd-hero__meta">
              <div className="cd-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)" stroke="var(--accent)" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <strong>{rating}</strong> ({reviewCount.toLocaleString()} DATA POINTS)
              </div>
              <div className="cd-meta-sep" />
              <div className="cd-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <strong>12,450</strong> ACTIVE NODES
              </div>
              <div className="cd-meta-sep" />
              <div className="cd-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {duration}
              </div>
            </div>

            <div className="cd-hero__instructor">
              <img src={avatar} alt={InstructorName} className="cd-hero__inst-avatar" />
              <div>
                <div className="cd-hero__inst-name">{InstructorName}</div>
                <div className="cd-hero__inst-role">Senior Operative</div>
              </div>
            </div>
          </div>

          {/* Sticky Enroll Card (Desktop) */}
          <div className="cd-enroll-card" style={{ position: 'sticky', top: '100px', transform: 'translateY(60px)' }}>
            <div className="cd-enroll-card__thumb">
              <img src={thumb} alt={Name} />
              <div className="cd-enroll-card__play">
                <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </div>

            <div className="cd-enroll-card__body">
              <div className="cd-enroll-card__price-row">
                <div className={`cd-enroll-card__price${isFree ? ' cd-enroll-card__price--free' : ''}`}>
                  {isFree ? 'FREE' : `$${Price}`}
                </div>
                {!isFree && originalPrice && (
                  <div className="cd-enroll-card__orig">${originalPrice}</div>
                )}
              </div>

              <button className="cd-enroll-card__cta">
                {isFree ? 'INITIALIZE DOWNLOAD' : 'PROCURE CLEARANCE'}
              </button>
              <div className="cd-enroll-card__guarantee">30-DAY SYNC GUARANTEE</div>

              <ul className="cd-enroll-card__includes">
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> {duration} bandwidth required</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> 14 schematic blueprints</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Cross-device synchronization</li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg> Verified cryptographic certificate</li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="cd-body">
        <main className="cd-main">
          <div className="cd-tabs">
            {['Synopsis', 'Syllabus', 'Operative', 'Telemetry'].map(t => {
              const id = t.toLowerCase();
              return (
                <button
                  key={id}
                  className={`cd-tab${activeTab === id ? ' cd-tab--active' : ''}`}
                  onClick={() => setActiveTab(id)}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div className="cd-content">
            {activeTab === 'synopsis' && (
              <div className="cd-about">
                <h2 className="cd-section-title">Transmission Overview</h2>
                <p>
                  Dive deep into the core spatial principles and advanced techniques that top operatives use every day.
                  Whether you're looking to establish a new connection or upgrade your current bandwidth, this module provides a structured, hands-on approach to mastering the architecture.
                </p>
                <p>
                  You'll start with the fundamentals, ensuring a solid data foundation, before moving onto complex real-world simulations.
                  By the end of this transmission, you will have compiled a fully functional system from scratch.
                </p>

                <div className="cd-learn-box">
                  <h3 className="cd-section-title" style={{ fontSize: '18px', marginBottom: '24px' }}>Acquisition Targets</h3>
                  <ul className="cd-learn-grid">
                    <li><Check /> Build complex architectures from source</li>
                    <li><Check /> Understand deep systems, not just superficial syntax</li>
                    <li><Check /> Implement optimal routing protocols used by top nodes</li>
                    <li><Check /> Deploy your simulations to live networks</li>
                    <li><Check /> Master 2028-era spatial tooling and data flows</li>
                    <li><Check /> Pass technical access assessments with confidence</li>
                  </ul>
                </div>

                <h3 className="cd-section-title" style={{ fontSize: '20px', marginTop: '48px' }}>Prerequisites</h3>
                <ul style={{ listStyle: 'none', padding: 0, color: 'var(--ink-2)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li><span style={{ color: 'var(--accent)', marginRight: '8px' }}>//</span> No prior clearance is required. We will begin at the root level.</li>
                  <li><span style={{ color: 'var(--accent)', marginRight: '8px' }}>//</span> A terminal with an active network connection.</li>
                  <li><span style={{ color: 'var(--accent)', marginRight: '8px' }}>//</span> Sufficient cognitive bandwidth to process the incoming data.</li>
                </ul>
              </div>
            )}

            {activeTab === 'syllabus' && (
              <div>
                <h2 className="cd-section-title">Data Matrix</h2>
                <div style={{ marginBottom: '24px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--ink-4)', letterSpacing: '0.1em' }}>
                  {syllabus.length} BLOCKS • {syllabus.reduce((acc, curr) => acc + curr.eps.length, 0)} PACKETS • {course.duration} TOTAL BANDWIDTH
                </div>

                <div className="cd-syllabus">
                  {syllabus.map((mod, idx) => {
                    const isOpen = openMods.includes(idx);
                    return (
                      <div key={idx} className={`cd-module${isOpen ? ' cd-module--open' : ''}`}>
                        <div className="cd-module__header" onClick={() => toggleMod(idx)}>
                          <div className="cd-module__title-wrap">
                            <svg className="cd-module__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                            <span className="cd-module__title">{mod.title}</span>
                          </div>
                          <span className="cd-module__meta">{mod.eps.length} PACKETS • {mod.dur}</span>
                        </div>
                        {isOpen && (
                          <div className="cd-module__content">
                            {mod.eps.map((ep, i) => (
                              <div key={i} className="cd-lesson">
                                <div className="cd-lesson__title">
                                  {ep.type === 'vid' ? <Play /> : <File />}
                                  {ep.t}
                                </div>
                                <div className="cd-lesson__dur">{ep.d}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {['operative', 'telemetry'].includes(activeTab) && (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <p style={{ color: 'var(--ink-4)', fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.1em' }}>DATA CURRENTLY ENCRYPTED. CLEARANCE PENDING.</p>
              </div>
            )}
          </div>
        </main>
        
        {/* Empty right column for grid layout alignment with the sticky card */}
        <div></div>
      </div>
    </div>
  );
}

export default CourseDetail;
