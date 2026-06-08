import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogoMark } from '../../components/Navbar';
import './Courses.css';
import CourseCard from '../../components/ui/CourseCard';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [cat, setCat] = useState('All');
  const [lvl, setLvl] = useState('All Grades');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('popular');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('/api/v1/courses');
        const data = await res.json();
        if (data.success) {
          setCourses(data.data);
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
    fetchCourses();
  }, []);

  // Compute dynamic filters
  const mediums = Array.from(new Set(courses.map(c => c.Medium).filter(Boolean)));
  const grades = Array.from(new Set(courses.map(c => c.Grade).filter(Boolean))).sort((a,b) => a - b);

  const filtered = courses.filter(c => {
    if (cat !== 'All' && c.Medium !== cat) return false;
    if (lvl !== 'All Grades' && c.Grade !== parseFloat(lvl.replace('Grade ', ''))) return false;
    if (search && !(c.Name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
          <div className="tag" style={{ background: 'var(--violet-light)', borderColor: 'var(--violet)', color: 'var(--violet)' }}>DATABASE ACCESS</div>
          <h1>Find your next <em>breakthrough.</em></h1>
          <p>Explore expert-led neural transmissions across various mediums and grades.</p>

          <div className="courses-search">
            <div className="courses-search__wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Query database for specific modules..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="courses-search__btn">Execute Search</button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="courses-body">
        {/* Filters sidebar */}
        <aside className="courses-filter">
          <div className="courses-filter__header">
            <span className="courses-filter__title">Parameters</span>
            <button className="courses-filter__reset" onClick={() => { setCat('All'); setLvl('All Grades'); setSearch(''); }}>
              Reset
            </button>
          </div>

          <div className="courses-filter__section">
            <div className="courses-filter__sec-title">Medium</div>
            {['All', ...mediums].map(c => (
              <label key={c} className="courses-filter__opt">
                <input type="radio" name="cat" checked={cat === c} onChange={() => setCat(c)} />
                {c}
              </label>
            ))}
          </div>

          <div className="courses-filter__section">
            <div className="courses-filter__sec-title">Grade</div>
            {['All Grades', ...grades.map(g => `Grade ${g}`)].map(l => (
              <label key={l} className="courses-filter__opt">
                <input type="radio" name="lvl" checked={lvl === l} onChange={() => setLvl(l)} />
                {l}
              </label>
            ))}
          </div>
        </aside>

        {/* Results */}
        <main className="courses-results">
          <div className="courses-toolbar">
            <div className="courses-toolbar__count">
              <strong>{filtered.length}</strong> {filtered.length === 1 ? 'RECORD' : 'RECORDS'} MATCHED
            </div>
            <div className="courses-sort">
              <span className="courses-sort__label">Sort:</span>
              <select className="courses-sort__select" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="popular">Priority / Popular</option>
                <option value="newest">Recent Commits</option>
              </select>
            </div>
          </div>

          {loading ? (
             <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--ink-4)' }}>INITIALIZING DATASTREAM...</div>
          ) : error ? (
             <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--red)' }}>{error}</div>
          ) : (
            <>
              <div className="courses-grid">
                {filtered.map(c => <CourseCard key={c.id} course={c} />)}
              </div>

              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px', color: 'var(--ink-4)', border: '1px dashed var(--border)', borderRadius: 'var(--r-xl)', fontFamily: 'var(--mono)', fontSize: '13px' }}>
                  NO RECORDS MATCHING QUERY PARAMETERS.
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Courses;
