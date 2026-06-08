import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogoMark } from '../../components/Navbar';
import '../Dashboard.css';
const buildProfileForm = (student) => ({
  name: student?.Name || '',
  whatsappNumber: student?.Watsapp_Number || '',
  address: student?.Address || '',
  guardianName: student?.Gurdian_s_Name || '',
  guardianNumber: student?.Gurdians_Number || '',
  password: '',
  confirmPassword: '',
});

const StudentHome = () => {
  const navigate = useNavigate();
  const [storedStudent] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  });
  const [student, setStudent] = useState(storedStudent);
  const initialStudentRef = useRef({
    id: storedStudent?.id,
    role: storedStudent?.Role,
  });
  const navigateRef = useRef(navigate);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileForm, setProfileForm] = useState(() => buildProfileForm(storedStudent));
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCourseForPayment, setSelectedCourseForPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentSlip, setPaymentSlip] = useState(null);
  const [paymentSlipName, setPaymentSlipName] = useState('');
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const [enrollingId, setEnrollingId] = useState(null);

  const fetchProfile = async (studentId, token) => {
    try {
      const response = await fetch(`/api/v1/users/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load profile data');
      }

      if (data?.data) {
        setProfileForm(buildProfileForm(data.data));
        setStudent(data.data);
      }
    } catch (fetchError) {
      setError(fetchError.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (course) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/student/login');
      return;
    }

    setEnrollingId(course.id);
    setError('');

    try {
      const response = await fetch(`/api/v1/courses/${course.id}/enroll`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Refetch profile to sync the home tab enrollments
        const studentId = student?.id;
        await fetchProfile(studentId, token);
      } else {
        setError(data.message || 'Failed to enroll');
      }
    } catch {
      setError('Connection error during enrollment');
    } finally {
      setEnrollingId(null);
    }
  };

  const [payingId, setPayingId] = useState(null);

  const handlePayNow = (course) => {
    setSelectedCourseForPayment(course);
    setPaymentMethod('Bank Transfer');
    setPaymentSlip(null);
    setPaymentSlipName('');
    setUploadError('');
    setShowPaymentModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUploadError('');
    if (!file) {
      setPaymentSlip(null);
      setPaymentSlipName('');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Only jpeg and png files are allowed.');
      setPaymentSlip(null);
      setPaymentSlipName('');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be up to 5MB.');
      setPaymentSlip(null);
      setPaymentSlipName('');
      return;
    }

    setPaymentSlip(file);
    setPaymentSlipName(file.name);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setUploadError('');

    if (!paymentSlip) {
      setUploadError('Please select a payment receipt file.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/student/login');
      return;
    }

    setPayingId(selectedCourseForPayment.id);
    setError('');

    const formData = new FormData();
    formData.append('subjectName', selectedCourseForPayment.Name);
    formData.append('amount', selectedCourseForPayment.Price);
    formData.append('method', paymentMethod);
    formData.append('slip', paymentSlip);

    try {
      const response = await fetch('/api/v1/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert('Payment slip submitted successfully! Waiting for admin approval.');
        setShowPaymentModal(false);
        setPaymentSlip(null);
        setPaymentSlipName('');
        const studentId = student?.id;
        await fetchProfile(studentId, token);
      } else {
        setUploadError(data.message || 'Failed to submit payment receipt');
      }
    } catch {
      setUploadError('Connection error submitting payment receipt');
    } finally {
      setPayingId(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const { id: studentId, role } = initialStudentRef.current;

    if (!token || !studentId) {
      navigateRef.current('/student/login');
      return;
    }

    if (role?.toLowerCase() === 'admin') {
      navigateRef.current('/admin/dashboard');
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      if (cancelled) return;
      await fetchProfile(studentId, token);
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCourses = async () => {
      try {
        const response = await fetch('/api/v1/courses');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load available subjects');
        }

        if (!cancelled) {
          setCourses(data.data || []);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message || 'Failed to load available subjects');
        }
      } finally {
        if (!cancelled) {
          setCoursesLoading(false);
        }
      }
    };

    loadCourses();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/student/login');
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setProfileMessage('');

    if (profileForm.password || profileForm.confirmPassword) {
      if (profileForm.password !== profileForm.confirmPassword) {
        setError('Password and confirm password do not match.');
        return;
      }
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/student/login');
      return;
    }

    setSavingProfile(true);

    try {
      const payload = {
        name: profileForm.name,
        whatsappNumber: profileForm.whatsappNumber,
        address: profileForm.address,
        guardianName: profileForm.guardianName,
        guardianNumber: profileForm.guardianNumber,
      };

      if (profileForm.password) {
        payload.password = profileForm.password;
      }

      const response = await fetch('/api/v1/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      if (data?.data) {
        setStudent((currentStudent) => ({
          ...currentStudent,
          ...data.data,
        }));
        localStorage.setItem('user', JSON.stringify(data.data));
        setProfileForm(buildProfileForm(data.data));
      }

      setProfileMessage(data.message || 'Profile updated successfully.');
    } catch (submitError) {
      setError(submitError.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  if (!student) {
    return (
      <div className="student-home student-home--loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2>Loading Profile...</h2>
      </div>
    );
  }

  const avatarLetter = student.Name ? student.Name.charAt(0).toUpperCase() : 'S';
  const enrolledSubjects = Array.isArray(student.enrolledCourses) ? student.enrolledCourses : [];

  const subjectCards = (subjectList, emptyTitle, emptyMessage, fallbackLoadingMessage, showEnrollButton = false) => {
    if (fallbackLoadingMessage) {
      return <div style={{ color: 'var(--ink-4)', fontFamily: 'var(--mono)', fontSize: '12px' }}>{fallbackLoadingMessage}</div>;
    }

    if (!subjectList.length) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--r-xl)' }}>
          <h4 style={{ color: 'var(--white)', marginBottom: '8px' }}>{emptyTitle}</h4>
          <p style={{ color: 'var(--ink-4)', fontSize: '14px' }}>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {subjectList.map((subject, index) => {
          const isEnrolled = enrolledSubjects.some(
            (enrollment) => enrollment.Subject_Name === (subject.Subject_Name || subject.Name)
          );

          const paymentForSubject = (student.payments || []).find(
            (payment) => payment.Subject === (subject.Subject_Name || subject.Name)
          );
          const paymentStatus = paymentForSubject ? paymentForSubject.Status : null;

          return (
            <article className="dash-course" key={subject.id || subject.Subject_Name || subject.Name || `${emptyTitle}-${index}`} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)' }}>
              <div className="dash-course-info" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div className="dash-course-title" style={{ fontSize: '18px' }}>{subject.Subject_Name || subject.Name}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--accent)' }}>{subject.Price ? `Rs. ${subject.Price}` : 'FREE'}</div>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', color: 'var(--ink-3)', fontSize: '13px', marginBottom: '16px' }}>
                  <span>Grade {subject.Grade ?? 'N/A'}</span>
                  <span>•</span>
                  <span>{subject.Medium ?? 'Unknown'}</span>
                  <span>•</span>
                  <span>Instructor: {subject.InstructorName || subject.Instructor || 'Unknown'}</span>
                </div>

                {(paymentStatus === 'Approved' || isEnrolled) && subject.MeetingLink && (
                  <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(45, 212, 191, 0.1)', border: '1px dashed var(--accent)', borderRadius: '8px', textAlign: 'center' }}>
                    <a href={subject.MeetingLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: '13px' }}>
                      [ INITIATE CONNECTION ]
                    </a>
                  </div>
                )}
                
                {showEnrollButton && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={isEnrolled || enrollingId === subject.id}
                      onClick={() => handleEnroll(subject)}
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                    >
                      {isEnrolled ? 'ENROLLED' : enrollingId === subject.id ? 'PROCESSING...' : 'REQUEST CLEARANCE'}
                    </button>
                    {paymentStatus === 'Pending' && <button type="button" className="btn btn-outline" disabled style={{ padding: '8px 16px', fontSize: '12px' }}>PENDING</button>}
                    {paymentStatus === 'Approved' && <button type="button" className="btn btn-outline" disabled style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--accent)', borderColor: 'var(--accent)' }}>APPROVED</button>}
                    {paymentStatus === 'Rejected' && <button type="button" className="btn btn-outline" onClick={() => handlePayNow(subject)} style={{ padding: '8px 16px', fontSize: '12px', color: '#FF5A65', borderColor: '#FF5A65' }}>REJECTED (PAY NOW)</button>}
                    {!paymentStatus && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        disabled={payingId === subject.id}
                        onClick={() => handlePayNow(subject)}
                        style={{ padding: '8px 16px', fontSize: '12px' }}
                      >
                        {payingId === subject.id ? 'PROCESSING...' : 'PROCESS PAYMENT'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  return (
    <div className="dashboard">
      <aside className="dash-sidebar">
        <Link to="/" className="dash-logo">
          <div className="dash-logo-mark"><LogoMark dark={false} /></div>
          <span className="dash-logo-text">UVSHUB</span>
        </Link>
        <nav className="dash-nav">
          {[
            { id: 'home', label: 'Home' },
            { id: 'subjects', label: 'Subjects' },
            { id: 'payment', label: 'Payment' },
            { id: 'profile', label: 'Profile' }
          ].map(t => (
            <button
              key={t.id}
              className={`dash-nav-item${activeTab === t.id ? ' dash-nav-item--active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="dash-user" style={{ cursor: 'pointer' }} onClick={handleLogout}>
          <div className="dash-user-av" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-3)', fontSize: '18px', fontWeight: 'bold' }}>{avatarLetter}</div>
          <div className="dash-user-info">
            <span className="dash-user-name">Logout</span>
            <span className="dash-user-plan">{student.Name}</span>
          </div>
        </div>
      </aside>

      <main className="dash-main">
        <header className="dash-header">
          <div className="dash-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Query subjects..." />
          </div>
          <div className="dash-header-actions">
            <div className="dash-bell">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
          </div>
        </header>

        <div className="dash-content">
          {error && <div className="status-banner status-banner--error" style={{ marginBottom: '24px', padding: '16px', background: 'rgba(224, 45, 60, 0.1)', color: '#FF5A65', border: '1px solid rgba(224, 45, 60, 0.2)', borderRadius: '8px' }}>{error}</div>}
          {loading && <div className="status-banner" style={{ marginBottom: '24px', padding: '16px', color: 'var(--ink-2)' }}>Refreshing your profile...</div>}

          {activeTab === 'home' && (
            <>
              <h1 className="dash-title">Telemetry Overview</h1>
              <p className="dash-sub">Welcome back, operative. Here is your current network status.</p>

              <div className="dash-stats">
                <div className="dash-stat-card">
                  <div className="dash-stat-head">
                    <span className="dash-stat-label">ENROLLED MODULES</span>
                    <div className="dash-stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></div>
                  </div>
                  <div className="dash-stat-val">{String(enrolledSubjects.length).padStart(2, '0')}</div>
                </div>
                <div className="dash-stat-card">
                  <div className="dash-stat-head">
                    <span className="dash-stat-label">AVAILABLE SUBJECTS</span>
                    <div className="dash-stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                  </div>
                  <div className="dash-stat-val">{String(courses.length).padStart(2, '0')}</div>
                </div>
                <div className="dash-stat-card">
                  <div className="dash-stat-head">
                    <span className="dash-stat-label">STUDENT ID</span>
                    <div className="dash-stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
                  </div>
                  <div className="dash-stat-val" style={{ fontSize: '24px' }}>#{student.Student_ID}</div>
                </div>
              </div>

              <div className="dash-panel">
                <div className="dash-panel-head">
                  <span className="dash-panel-title">Your currently enrolled subjects</span>
                </div>
                <div className="dash-panel-body">
                  {subjectCards(
                    enrolledSubjects,
                    'No current subjects found',
                    'Your current subjects will appear here once your enrollment is approved.',
                    '',
                    false
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'subjects' && (
            <>
              <h1 className="dash-title">Subject Network</h1>
              <p className="dash-sub">Browse and request clearance for available modules.</p>

              <div className="dash-panel">
                <div className="dash-panel-head">
                  <span className="dash-panel-title">All available subjects</span>
                  <span className="dash-panel-link">{courses.length} RECORDS</span>
                </div>
                <div className="dash-panel-body">
                  {coursesLoading
                    ? subjectCards([], '', '', 'Loading available subjects...', false)
                    : subjectCards(
                      courses,
                      'No subjects available',
                      'Available subjects will appear here once they are created.',
                      '',
                      true
                    )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'profile' && (
            <>
              <h1 className="dash-title">Operative Profile</h1>
              <p className="dash-sub">Update your clearance details.</p>

              <div className="dash-grid">
                <div className="dash-panel">
                  <div className="dash-panel-head">
                    <span className="dash-panel-title">Edit Profile</span>
                  </div>
                  <div className="dash-panel-body">
                    {profileMessage && <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(45, 212, 191, 0.1)', color: 'var(--accent)', border: '1px solid rgba(45, 212, 191, 0.2)', borderRadius: '8px' }}>{profileMessage}</div>}

                    <form onSubmit={handleProfileSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Full Name</label>
                        <input type="text" name="name" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} value={profileForm.name} onChange={handleProfileChange} required />
                      </div>
                      <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email</label>
                        <input type="email" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} value={student.Email || ''} readOnly />
                      </div>
                      <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>WhatsApp Number</label>
                        <input type="text" name="whatsappNumber" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} value={profileForm.whatsappNumber} onChange={handleProfileChange} required />
                      </div>
                      <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Address</label>
                        <input type="text" name="address" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} value={profileForm.address} onChange={handleProfileChange} required />
                      </div>
                      <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Guardian Name</label>
                        <input type="text" name="guardianName" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} value={profileForm.guardianName} onChange={handleProfileChange} required />
                      </div>
                      <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Guardian Number</label>
                        <input type="text" name="guardianNumber" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} value={profileForm.guardianNumber} onChange={handleProfileChange} required />
                      </div>
                      <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>New Password</label>
                        <input type="password" name="password" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} value={profileForm.password} onChange={handleProfileChange} placeholder="Leave blank to keep current" />
                      </div>
                      <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Confirm Password</label>
                        <input type="password" name="confirmPassword" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} value={profileForm.confirmPassword} onChange={handleProfileChange} />
                      </div>
                      <div className="auth-field" style={{ gridColumn: '1 / -1' }}>
                        <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ padding: '12px', fontSize: '14px', width: '200px' }}>
                          {savingProfile ? 'SAVING...' : 'SAVE CHANGES'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'payment' && (
            <>
              <h1 className="dash-title">Financial Records</h1>
              <p className="dash-sub">Payment overview and billing reminders.</p>

              <div className="dash-panel">
                <div className="dash-panel-head">
                  <span className="dash-panel-title">Payments</span>
                </div>
                <div className="dash-panel-body">
                  <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ color: 'var(--ink-3)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>Next step</div>
                    <div style={{ color: 'var(--white)', fontWeight: 700 }}>Contact the office for pending payment details</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Payment Authorization Modal */}
      {showPaymentModal && selectedCourseForPayment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowPaymentModal(false)}>
          <div className="dash-panel" onClick={(e) => e.stopPropagation()} style={{ width: '460px', padding: '0', background: '#0a0a0c', border: '1px solid var(--border)' }}>
            <div className="dash-panel-head">
              <span className="dash-panel-title">Upload Payment Slip</span>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', color: 'var(--ink-4)', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
            </div>
            <div className="dash-panel-body">
              <form onSubmit={handlePaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--accent)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>Bank Details</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: 'var(--ink-2)' }}>
                    <div><strong>Bank:</strong> Commercial Bank</div>
                    <div><strong>A/C No.:</strong> 8020111119</div>
                    <div style={{ gridColumn: '1 / -1' }}><strong>Name:</strong> Soesh cooray</div>
                  </div>
                </div>

                <div style={{ padding: '12px 16px', borderLeft: '4px solid #f59e0b', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '0 8px 8px 0', fontSize: '13px', color: 'var(--ink-2)' }}>
                  <p style={{ margin: '0 0 4px 0' }}>Deposit class fee and upload receipt. We will verify and approve within 3 business days.</p>
                  <p style={{ margin: 0, fontWeight: 700, color: '#f59e0b' }}>Please pay in advance. Don't wait until the last moment.</p>
                </div>

                <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Payment Method</label>
                  <select
                    style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    <option value="Bank Transfer" style={{ color: '#000' }}>Bank Transfer</option>
                    <option value="Card" style={{ color: '#000' }}>Card</option>
                    <option value="Cash" style={{ color: '#000' }}>Cash</option>
                  </select>
                </div>

                <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Upload Receipt / Payment Slip</label>
                  <div style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255, 255, 255, 0.02)', position: 'relative' }}>
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleFileChange}
                      required
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                    />
                    <div style={{ color: 'var(--ink-3)', fontSize: '13px' }}>
                      {paymentSlipName ? (
                        <div style={{ color: 'var(--accent)', fontWeight: 600 }}>{paymentSlipName}</div>
                      ) : (
                        <span>📁 Select jpeg or png file (Max 5MB)</span>
                      )}
                    </div>
                  </div>
                </div>

                {uploadError && <div style={{ padding: '12px', background: 'rgba(224, 45, 60, 0.1)', color: '#FF5A65', border: '1px solid rgba(224, 45, 60, 0.2)', borderRadius: '8px', fontSize: '13px' }}>{uploadError}</div>}

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-outline" style={{ flex: 1, padding: '12px' }}>CANCEL</button>
                  <button type="submit" className="btn btn-primary" disabled={payingId !== null || !paymentSlip} style={{ flex: 1, padding: '12px' }}>
                    {payingId !== null ? 'UPLOADING...' : 'SUBMIT PAYMENT'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHome;
