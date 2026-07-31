import './CourseCard.css';
import SpotlightCard from './SpotlightCard';

function CourseCard({ course }) {
  const { id, Name, InstructorName, Medium, Grade, Price, Day, StartTime, EndTime } = course;
  
  // Map backend fields to UI
  const title = Name || 'Untitled Course';
  const instructor = InstructorName || 'Unknown';
  const price = Price ? parseFloat(Price) : 0;
  const isFree = price === 0;

  // Format time and duration
  let timeText = null;
  let durText = null;

  if (StartTime) {
    const formatTime = (timeStr) => {
      if (!timeStr) return '';
      const [h, m] = timeStr.split(':');
      let hr = parseInt(h, 10);
      const ampm = hr >= 12 ? 'PM' : 'AM';
      hr = hr % 12 || 12;
      return `${hr}:${m} ${ampm}`;
    };

    const formattedStart = formatTime(StartTime);
    timeText = formattedStart;
    
    if (EndTime) {
      const [sh, sm] = StartTime.split(':').map(Number);
      const [eh, em] = EndTime.split(':').map(Number);
      let startMins = sh * 60 + sm;
      let endMins = eh * 60 + em;
      
      if (endMins < startMins) endMins += 24 * 60;
      const diffMins = endMins - startMins;
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      durText = hrs > 0 ? `${hrs}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;
    }
  }

  // Aesthetic Placeholders for Spatial 2028 design
  const thumb = course.Image || "https://images.unsplash.com/photo-1610563166150-b34df4f3bcd6?auto=format&fit=crop&w=600&q=80";
  const badge = null;
  const badgeCls = '';

  return (
    <SpotlightCard className="course-card">
      <div id={`course-${id}`} aria-label={title} style={{ display: 'flex', flexDirection: 'column', height: '100%', textDecoration: 'none', color: 'inherit' }}>
        <div className="course-card__thumb">
          <img src={thumb} alt={title} className="course-card__thumb-img" loading="lazy" />
          {badge && <span className={`course-card__badge course-card__badge--${badgeCls}`}>{badge}</span>}
        </div>

        {/* Body */}
        <div className="course-card__body">
          <div className="course-card__cat">
            {Medium} • Grade {Grade}
            {Day && ` • ${Day}`}
          </div>
          <h3 className="course-card__title">{title}</h3>
          <p className="course-card__instructor">by {instructor}</p>

          <div className="course-card__meta" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {durText && (
              <span className="course-card__dur">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {durText}
              </span>
            )}
            {timeText && (
              <span className="course-card__dur" style={{ color: 'var(--ink-2)' }}>
                Starts at {timeText}
              </span>
            )}
          </div>

          <div className="course-card__footer">
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span className={`course-card__price${isFree ? ' course-card__price--free' : ''}`}>
                {isFree ? 'Free' : `Rs. ${price}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}

export default CourseCard;
