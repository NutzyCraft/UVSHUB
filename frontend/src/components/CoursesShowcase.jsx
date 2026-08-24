import { useState, useEffect } from 'react';
import './CoursesShowcase.css';
import CourseCard from './ui/CourseCard';
import Reveal from './ui/Reveal';

function CoursesShowcase() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/courses`);
        const data = await res.json();
        if (data.success) {
          setCourses(data.data);
        } else {
          setError(data.message || 'Failed to fetch courses');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Network error fetching courses');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <section className="showcase" id="courses" aria-labelledby="showcase-heading">
      <div className="showcase__inner">
        <div className="showcase__header">
          <div>
            <div className="tag">DATABASE</div>
            <h2 className="showcase__header-title" id="showcase-heading">
              Curated modules<br />for deep focus.
            </h2>
          </div>
        </div>

        <Reveal direction="up" delay={100}>
          <div className="showcase__grid" role="tabpanel">
            {loading ? (
              <p style={{ color: 'var(--ink-4)', gridColumn: '1/-1', padding: '40px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '14px' }}>INITIALIZING DATASTREAM...</p>
            ) : error ? (
              <p style={{ color: 'var(--red)', gridColumn: '1/-1', padding: '40px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '14px' }}>{error}</p>
            ) : courses.length > 0 ? (
              courses.map(c => <CourseCard key={c.id} course={c} />)
            ) : (
              <p style={{ color: 'var(--ink-4)', gridColumn: '1/-1', padding: '40px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '14px' }}>NO_RECORDS_FOUND</p>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default CoursesShowcase;
