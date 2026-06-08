import { useState, useEffect } from 'react';
import './CoursesShowcase.css'; // We can reuse the showcase styles or standard styles

function InstructorsShowcase() {
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
    <section id="instructors" className="courses-showcase" style={{ padding: '120px 40px', background: 'var(--bg)' }}>
      <div className="courses-showcase__inner" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <header className="courses-showcase__header">
          <h2 className="courses-showcase__title">Meet the <em>Architects.</em></h2>
          <p className="courses-showcase__desc" style={{ color: 'var(--ink-3)', fontSize: '18px', maxWidth: '600px', margin: '16px auto 0' }}>
            The elite operatives constructing your knowledge matrices.
          </p>
        </header>

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
                    <img src={inst.Image} alt={inst.Name} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
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
    </section>
  );
}

export default InstructorsShowcase;
