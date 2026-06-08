import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogoMark } from '../../components/Navbar';
import './Courses.css';

function Instructors() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const res = await fetch('/api/v1/instructors');
        const data = await res.json();
        if (data.success) {
          setInstructors(data.data);
        } else {
          setError(data.message || 'Failed to fetch');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchInstructors();
  }, []);

  return (
    <div className="courses-page">
      {/* Navbar Minimal */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', zIndex: 100, background: 'rgba(3,3,4,0.6)', backdropFilter: 'blur(24px)', borderBottom: '1px solid var(--border)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--white)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LogoMark dark={false} /></div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: 600, color: 'var(--white)', letterSpacing: '0.1em' }}>UVSHUB</span>
        </Link>
        <Link to="/student/login" className="btn btn-outline" style={{ fontFamily: 'var(--mono)', fontSize: '12px', padding: '10px 20px' }}>Dashboard</Link>
      </nav>

      {/* Hero */}
      <header className="courses-hero">
        <div className="courses-hero__inner">
          <div className="tag" style={{ background: 'var(--blue-light)', borderColor: 'var(--blue)', color: 'var(--blue)' }}>PERSONNEL DIRECTORY</div>
          <h1>Meet the <em>Architects.</em></h1>
          <p>The elite operatives constructing your knowledge matrices.</p>
        </div>
      </header>

      {/* Body */}
      <div className="courses-body" style={{ display: 'block', padding: '0 40px', maxWidth: '1280px', margin: '0 auto', paddingBottom: '120px' }}>
        {loading ? (
            <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--ink-4)' }}>INITIALIZING DIRECTORY...</div>
        ) : error ? (
            <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--red)' }}>{error}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px', marginTop: '64px' }}>
            {instructors.map(inst => (
              <div key={inst.id} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '100%', height: '240px', background: 'var(--surface-3)', position: 'relative' }}>
                  {inst.Image ? (
                    <img src={inst.Image} alt={inst.Name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>{inst.Name.charAt(0)}</div>
                  )}
                </div>
                <div style={{ padding: '32px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--white)', marginBottom: '16px' }}>{inst.Name}</h3>
                  <p style={{ fontSize: '15px', color: 'var(--ink-3)', lineHeight: '1.6' }}>{inst.Description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Instructors;
