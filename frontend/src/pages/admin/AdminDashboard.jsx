import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogoMark } from '../../components/Navbar';
import '../Dashboard.css';
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [instructorForm, setInstructorForm] = useState({ name: '', description: '', image: null });
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [showInstructorModal, setShowInstructorModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [courseForm, setCourseForm] = useState({
    name: '',
    instructor: '',
    grade: '',
    price: '',
    medium: '',
    meetingLink: '',
    startTime: '',
    endTime: '',
    day: '',
    image: null,
    isHidden: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewingSlipUrl, setViewingSlipUrl] = useState(null);
  const [togglingSubjectId, setTogglingSubjectId] = useState(null);
  const navigate = useNavigate();

  const fetchStudents = async (token) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStudents(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch students');
      }
    } catch {
      setError('Connection error fetching students');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/courses?all=true`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (response.ok) {
        setSubjects(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch subjects');
      }
    } catch {
      setError('Connection error fetching subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (subject) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newHiddenState = !subject.IsHidden;
    setTogglingSubjectId(subject.id);
    setError('');
    setSuccess('');

    // Optimistic update
    setSubjects((prev) =>
      prev.map((s) => (s.id === subject.id ? { ...s, IsHidden: newHiddenState } : s))
    );

    try {
      const formData = new FormData();
      formData.append('isHidden', String(newHiddenState));

      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/courses/${subject.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(`Subject "${subject.Name}" is now ${newHiddenState ? 'HIDDEN from' : 'VISIBLE to'} students.`);
      } else {
        // Rollback
        setSubjects((prev) =>
          prev.map((s) => (s.id === subject.id ? { ...s, IsHidden: subject.IsHidden } : s))
        );
        setError(data.message || 'Failed to toggle subject visibility');
      }
    } catch {
      // Rollback
      setSubjects((prev) =>
        prev.map((s) => (s.id === subject.id ? { ...s, IsHidden: subject.IsHidden } : s))
      );
      setError('Connection error updating subject visibility');
    } finally {
      setTogglingSubjectId(null);
    }
  };

  const fetchPayments = async (token) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setPayments((data.data || []).filter((payment) => !payment.Status || payment.Status === 'Pending'));
      } else {
        setError(data.message || 'Failed to fetch payments');
      }
    } catch {
      setError('Connection error fetching payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async (token) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setPaymentHistory(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch payment history');
      }
    } catch {
      setError('Connection error fetching payment history');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/instructors`);
      const data = await response.json();
      if (response.ok) setInstructors(data.data || []);
    } catch {
      console.error('Failed to fetch instructors');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      navigate('/student/login');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (user.Role.toLowerCase() !== 'admin') {
        alert('Access Denied. Admins Only.');
        navigate('/student/home');
        return;
      }
    } catch {
      navigate('/student/login');
      return;
    }

    if (activeTab === 'students') {
      Promise.resolve().then(() => fetchStudents(token));
    } else if (activeTab === 'subjects') {
      Promise.resolve().then(() => { fetchSubjects(); fetchInstructors(); });
    } else if (activeTab === 'courses') {
      Promise.resolve().then(() => fetchInstructors());
    } else if (activeTab === 'instructors') {
      Promise.resolve().then(() => fetchInstructors());
    } else if (activeTab === 'payments') {
      Promise.resolve().then(() => fetchPayments(token));
    } else if (activeTab === 'history') {
      Promise.resolve().then(() => fetchPaymentHistory(token));
    }
  }, [activeTab, navigate]);

  const handleApprovePayment = async (paymentId) => {
    const token = localStorage.getItem('token');
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message);
        fetchPayments(token);
      } else {
        setError(data.message || 'Failed to approve payment');
      }
    } catch {
      setError('Connection error approving payment');
    }
  };

  const handleRejectPayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to reject this payment?')) {
      return;
    }
    const token = localStorage.getItem('token');
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message || 'Payment rejected successfully');
        fetchPayments(token);
      } else {
        setError(data.message || 'Failed to reject payment');
      }
    } catch {
      setError('Connection error rejecting payment');
    }
  };

  const handleInstructorSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setError(''); setSuccess(''); setLoading(true);

    const formData = new FormData();
    formData.append('name', instructorForm.name);
    formData.append('description', instructorForm.description);
    if (instructorForm.image) {
      formData.append('image', instructorForm.image);
    }

    try {
      const url = editingInstructor ? `${import.meta.env.VITE_API_URL || ''}/api/v1/instructors/${editingInstructor.id}` : `${import.meta.env.VITE_API_URL || ''}/api/v1/instructors`;
      const method = editingInstructor ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setSuccess(editingInstructor ? 'Instructor updated!' : 'Instructor added!');
        setShowInstructorModal(false);
        setInstructorForm({ name: '', description: '', image: null });
        setEditingInstructor(null);
        fetchInstructors();
      } else {
        setError(data.message || 'Failed to save instructor');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInstructor = async (id) => {
    if (!window.confirm('Delete this instructor?')) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/instructors/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) fetchInstructors();
    } catch {
      console.error('Error deleting instructor');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', courseForm.name);
      formData.append('instructor', courseForm.instructor);
      formData.append('grade', courseForm.grade);
      formData.append('price', courseForm.price);
      formData.append('medium', courseForm.medium);
      formData.append('day', courseForm.day);
      formData.append('isHidden', String(courseForm.isHidden || false));
      if (courseForm.meetingLink) formData.append('meetingLink', courseForm.meetingLink);
      if (courseForm.startTime) formData.append('startTime', courseForm.startTime);
      if (courseForm.endTime) formData.append('endTime', courseForm.endTime);
      if (courseForm.image) formData.append('image', courseForm.image);

      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/courses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Course created successfully!');
        setCourseForm({ name: '', instructor: '', grade: '', price: '', medium: '', meetingLink: '', startTime: '', endTime: '', day: '', image: null, isHidden: false });
        await fetchSubjects();
        setActiveTab('subjects');
      } else {
        setError(data.message || 'Failed to create course');
      }
    } catch {
      setError('Connection error creating course');
    } finally {
      setLoading(false);
    }
  };

  const viewStudentDetails = async (studentId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/users/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSelectedStudent(data.data);
      } else {
        alert(data.message || 'Failed to load details');
      }
    } catch {
      alert('Connection error loading student details');
    }
  };

  const openSubjectEditor = (subject) => {
    setEditingSubject({
      id: subject.id,
      name: subject.Name || '',
      instructor: subject.InstructorName || subject.Instructor || subject.instructor?.name || '',
      grade: subject.Grade?.toString() || '',
      price: subject.Price?.toString() || '',
      medium: subject.Medium || '',
      meetingLink: subject.MeetingLink || '',
      day: subject.Day || '',
      startTime: subject.StartTime || '',
      endTime: subject.EndTime || '',
      isHidden: Boolean(subject.IsHidden),
      image: null,
    });
    setError('');
    setSuccess('');
  };

  const handleSubjectEditChange = (event) => {
    const { name, value } = event.target;
    setEditingSubject((currentSubject) => ({
      ...currentSubject,
      [name]: value,
    }));
  };

  const handleUpdateSubject = async (event) => {
    event.preventDefault();

    if (!editingSubject?.id) {
      return;
    }

    const token = localStorage.getItem('token');
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      if (editingSubject.name) formData.append('name', editingSubject.name);
      if (editingSubject.grade) formData.append('grade', editingSubject.grade);
      if (editingSubject.price) formData.append('price', editingSubject.price);
      if (editingSubject.medium) formData.append('medium', editingSubject.medium);
      if (editingSubject.day) formData.append('day', editingSubject.day);
      if (editingSubject.instructor) formData.append('instructor', editingSubject.instructor);
      if (editingSubject.meetingLink) formData.append('meetingLink', editingSubject.meetingLink);
      if (editingSubject.startTime) formData.append('startTime', editingSubject.startTime);
      if (editingSubject.endTime) formData.append('endTime', editingSubject.endTime);
      if (editingSubject.image) formData.append('image', editingSubject.image);
      formData.append('isHidden', String(editingSubject.isHidden || false));

      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/courses/${editingSubject.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Subject updated successfully!');
        setEditingSubject(null);
        await fetchSubjects();
      } else {
        setError(data.message || 'Failed to update subject');
      }
    } catch {
      setError('Connection error updating subject');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) {
      return;
    }

    const token = localStorage.getItem('token');
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/courses/${subjectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Subject deleted successfully!');
        await fetchSubjects();
      } else {
        setError(data.message || 'Failed to delete subject');
      }
    } catch {
      setError('Connection error deleting subject');
    } finally {
      setLoading(false);
    }
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
            { id: 'students', label: 'Students' },
            { id: 'subjects', label: 'Subjects' },
            { id: 'instructors', label: 'Instructors' },
            { id: 'courses', label: 'Add Course' },
            { id: 'payments', label: 'Approve Payments' },
            { id: 'history', label: 'Payment History' }
          ].map(t => (
            <button
              key={t.id}
              className={`dash-nav-item${activeTab === t.id ? ' dash-nav-item--active' : ''}`}
              onClick={() => { setActiveTab(t.id); setError(''); setSuccess(''); }}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="dash-user" style={{ cursor: 'pointer' }} onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/student/login');
        }}>
          <div className="dash-user-av" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-3)', fontSize: '18px', fontWeight: 'bold' }}>AD</div>
          <div className="dash-user-info">
            <span className="dash-user-name">Logout</span>
            <span className="dash-user-plan">Admin</span>
          </div>
        </div>
      </aside>

      <main className="dash-main">


        <div className="dash-content">
          {error && <div className="status-banner status-banner--error" style={{ marginBottom: '24px', padding: '16px', background: 'rgba(224, 45, 60, 0.1)', color: '#FF5A65', border: '1px solid rgba(224, 45, 60, 0.2)', borderRadius: '8px' }}>{error}</div>}
          {success && <div className="status-banner status-banner--success" style={{ marginBottom: '24px', padding: '16px', background: 'rgba(45, 212, 191, 0.1)', color: 'var(--accent)', border: '1px solid rgba(45, 212, 191, 0.2)', borderRadius: '8px' }}>{success}</div>}
          {loading && <div className="status-banner" style={{ marginBottom: '24px', padding: '16px', color: 'var(--ink-2)' }}>Refreshing system data...</div>}

          {activeTab === 'students' && !loading && (
            <>
              <h1 className="dash-title">Student Registry</h1>
              <p className="dash-sub">View and manage enrolled operatives.</p>
              <div className="dash-panel">
                <div className="dash-panel-body" style={{ overflowX: 'auto', padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--ink-3)' }}>
                        <th style={{ padding: '16px', fontWeight: 600 }}>ID</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Name</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Email</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>WhatsApp</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '16px', color: 'var(--accent)', fontFamily: 'var(--mono)' }}>#{student.Student_ID}</td>
                          <td style={{ padding: '16px', color: 'var(--white)' }}>{student.Name}</td>
                          <td style={{ padding: '16px', color: 'var(--ink-2)' }}>{student.Email}</td>
                          <td style={{ padding: '16px', color: 'var(--ink-2)' }}>{student.Watsapp_Number}</td>
                          <td style={{ padding: '16px' }}>
                            <button onClick={() => viewStudentDetails(student.id)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--accent)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                              PROFILE
                            </button>
                          </td>
                        </tr>
                      ))}
                      {students.length === 0 && (
                        <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-3)' }}>No registered operatives found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'subjects' && !loading && (
            <>
              <h1 className="dash-title">Subject Inventory</h1>
              <p className="dash-sub">Manage available modules and instructions.</p>
              <div className="dash-panel">
                <div className="dash-panel-body" style={{ overflowX: 'auto', padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--ink-3)' }}>
                        <th style={{ padding: '16px', fontWeight: 600 }}>ID</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Name</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Instructor</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Grade/Medium</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Price</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Visibility</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Meeting</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((subject) => (
                        <tr key={subject.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: subject.IsHidden ? 0.7 : 1, transition: 'opacity 0.2s ease' }}>
                          <td style={{ padding: '16px', color: 'var(--accent)', fontFamily: 'var(--mono)' }}>#{subject.id}</td>
                          <td style={{ padding: '16px', color: 'var(--white)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{subject.Name}</span>
                              {subject.IsHidden && (
                                <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#FF5A65', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                                  HIDDEN
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '16px', color: 'var(--ink-2)' }}>{subject.InstructorName || subject.Instructor || subject.instructor?.name || 'N/A'}</td>
                          <td style={{ padding: '16px', color: 'var(--ink-2)' }}>G{subject.Grade} / {subject.Medium}</td>
                          <td style={{ padding: '16px', color: 'var(--ink-2)' }}>Rs. {subject.Price}</td>
                          <td style={{ padding: '16px' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(subject)}
                              disabled={togglingSubjectId === subject.id}
                              title={subject.IsHidden ? 'Click to show subject to students' : 'Click to hide subject from students'}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 12px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontFamily: 'var(--mono)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: subject.IsHidden ? 'rgba(239, 68, 68, 0.12)' : 'rgba(45, 212, 191, 0.12)',
                                color: subject.IsHidden ? '#FF5A65' : 'var(--accent)',
                                border: `1px solid ${subject.IsHidden ? 'rgba(239, 68, 68, 0.35)' : 'rgba(45, 212, 191, 0.35)'}`,
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: subject.IsHidden ? '#FF5A65' : 'var(--accent)',
                                  boxShadow: subject.IsHidden ? 'none' : '0 0 6px var(--accent)',
                                }}
                              />
                              {togglingSubjectId === subject.id
                                ? 'UPDATING...'
                                : subject.IsHidden
                                ? 'HIDDEN (SHOW)'
                                : 'VISIBLE (HIDE)'}
                            </button>
                          </td>
                          <td style={{ padding: '16px' }}>
                            {subject.MeetingLink ? <a href={subject.MeetingLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>LINK</a> : <span style={{ color: 'var(--ink-4)' }}>N/A</span>}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => openSubjectEditor(subject)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--white)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>EDIT</button>
                              <button onClick={() => handleDeleteSubject(subject.id)} style={{ background: 'transparent', border: '1px solid #FF5A65', color: '#FF5A65', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>DEL</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {subjects.length === 0 && (
                        <tr><td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-3)' }}>No subjects found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'instructors' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h1 className="dash-title">Instructors Management</h1>
                  <p className="dash-sub">Add, edit, or delete instructor profiles.</p>
                </div>
                <button 
                  onClick={() => { setEditingInstructor(null); setInstructorForm({ name: '', description: '', image: null }); setShowInstructorModal(true); }}
                  style={{ background: 'var(--ink-1)', color: 'var(--white)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: 'var(--r-md)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                >
                  + Add Instructor
                </button>
              </div>
              <div className="dash-panel">
                <div className="dash-panel-body" style={{ padding: '0' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                          <th style={{ padding: '16px', fontWeight: 600, color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Image</th>
                          <th style={{ padding: '16px', fontWeight: 600, color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Name</th>
                          <th style={{ padding: '16px', fontWeight: 600, color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Description</th>
                          <th style={{ padding: '16px', fontWeight: 600, color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {instructors.map(inst => (
                          <tr key={inst.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '16px', color: 'var(--ink-2)' }}>
                              {inst.Image ? <img src={inst.Image} alt={inst.Name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{inst.Name.charAt(0)}</div>}
                            </td>
                            <td style={{ padding: '16px', color: 'var(--ink-2)' }}>{inst.Name}</td>
                            <td style={{ padding: '16px', color: 'var(--ink-2)' }}>{inst.Description}</td>
                            <td style={{ padding: '16px' }}>
                              <button onClick={() => { setEditingInstructor(inst); setInstructorForm({ name: inst.Name, description: inst.Description, image: null }); setShowInstructorModal(true); }} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', marginRight: '16px', textDecoration: 'underline' }}>Edit</button>
                              <button onClick={() => handleDeleteInstructor(inst.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', textDecoration: 'underline' }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'courses' && (
            <>
              <h1 className="dash-title">Create New Module</h1>
              <p className="dash-sub">Initialize a new subject parameter.</p>
              <div className="dash-panel" style={{ maxWidth: '800px' }}>
                <div className="dash-panel-body">
                  <form onSubmit={handleCreateCourse} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Subject Name</label>
                      <input type="text" value={courseForm.name} onChange={e => setCourseForm({...courseForm, name: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} required placeholder="e.g. Physics" />
                    </div>
                    <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Instructor</label>
                      <select value={courseForm.instructor} onChange={e => setCourseForm({...courseForm, instructor: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none', appearance: 'none' }} required>
                        <option value="" disabled>Select an instructor</option>
                        {instructors.map(inst => <option key={inst.id} value={inst.Name}>{inst.Name}</option>)}
                      </select>
                    </div>
                    <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Grade</label>
                      <input type="number" step="1" value={courseForm.grade} onChange={e => setCourseForm({...courseForm, grade: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} required placeholder="e.g. 13" />
                    </div>
                    <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Price</label>
                      <input type="number" step="0.01" value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} required placeholder="e.g. 3500" />
                    </div>
                    <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Medium</label>
                      <select value={courseForm.medium} onChange={e => setCourseForm({...courseForm, medium: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} required>
                        <option value="" disabled>Select Medium</option>
                        <option value="Sinhala">Sinhala</option>
                        <option value="English">English</option>
                        <option value="Tamil">Tamil</option>
                      </select>
                    </div>
                    <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Day of the Week</label>
                      <select value={courseForm.day} onChange={e => setCourseForm({...courseForm, day: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} required>
                        <option value="" disabled>Select Day</option>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </select>
                    </div>
                    <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Start Time</label>
                      <input type="time" value={courseForm.startTime || ''} onChange={e => setCourseForm({...courseForm, startTime: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none', colorScheme: 'dark' }} required />
                    </div>
                    <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>End Time</label>
                      <input type="time" value={courseForm.endTime || ''} onChange={e => setCourseForm({...courseForm, endTime: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none', colorScheme: 'dark' }} required />
                    </div>
                    <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Meeting Link (Optional - Auto-generated if times are provided)</label>
                      <input type="url" value={courseForm.meetingLink} onChange={e => setCourseForm({...courseForm, meetingLink: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} placeholder="https://meet..." />
                    </div>
                    <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Subject Image</label>
                      <input type="file" accept="image/*" onChange={e => setCourseForm({...courseForm, image: e.target.files[0]})} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} />
                    </div>
                    <div className="auth-field" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '14px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none', width: '100%' }}>
                        <input
                          type="checkbox"
                          checked={courseForm.isHidden || false}
                          onChange={(e) => setCourseForm(prev => ({ ...prev, isHidden: e.target.checked }))}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ color: 'var(--white)', fontSize: '13px', fontWeight: 600 }}>Create as hidden (Draft mode)</div>
                          <div style={{ color: 'var(--ink-3)', fontSize: '11px', marginTop: '2px' }}>Keep this subject hidden from students and public pages upon creation.</div>
                        </div>
                      </label>
                    </div>
                    <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                      <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '14px 32px' }}>{loading ? 'CREATING...' : 'INITIALIZE MODULE'}</button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}

          {activeTab === 'payments' && !loading && (
            <>
              <h1 className="dash-title">Financial Authorizations</h1>
              <p className="dash-sub">Review and approve pending transactions.</p>
              <div className="dash-panel">
                <div className="dash-panel-body" style={{ overflowX: 'auto', padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--ink-3)' }}>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Payment ID</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Student ID</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Subject</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Amount</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Method</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(payment => (
                        <tr key={payment.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '16px', color: 'var(--accent)', fontFamily: 'var(--mono)' }}>#{payment.id}</td>
                          <td style={{ padding: '16px', color: 'var(--ink-2)', fontFamily: 'var(--mono)' }}>#{payment.Student_ID}</td>
                          <td style={{ padding: '16px', color: 'var(--white)' }}>{payment.Subject}</td>
                          <td style={{ padding: '16px', color: 'var(--ink-2)' }}>Rs. {payment.Amount}</td>
                          <td style={{ padding: '16px', color: 'var(--ink-2)' }}>{payment.Method}</td>
                          <td style={{ padding: '16px', color: '#f59e0b' }}>{payment.Status || 'Pending'}</td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {payment.Slip_Url ? (
                                <button onClick={() => setViewingSlipUrl(payment.Slip_Url)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--white)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>RECEIPT</button>
                              ) : <span style={{ color: 'var(--ink-4)', padding: '6px 12px', fontSize: '12px' }}>NO SLIP</span>}
                              <button onClick={() => handleApprovePayment(payment.id)} style={{ background: 'var(--accent)', border: 'none', color: '#0a0a0c', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>APPROVE</button>
                              <button onClick={() => handleRejectPayment(payment.id)} style={{ background: 'transparent', border: '1px solid #FF5A65', color: '#FF5A65', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>REJECT</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {payments.length === 0 && (
                        <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-3)' }}>No pending approvals.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'history' && !loading && (
            <>
              <h1 className="dash-title">Transaction Ledger</h1>
              <p className="dash-sub">Historical record of all payment operations.</p>
              <div className="dash-panel">
                <div className="dash-panel-body" style={{ overflowX: 'auto', padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--ink-3)' }}>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Payment ID</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Student ID</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Subject</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Amount</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Method</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map(payment => (
                        <tr key={payment.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '16px', color: 'var(--accent)', fontFamily: 'var(--mono)' }}>#{payment.id}</td>
                          <td style={{ padding: '16px', color: 'var(--ink-2)', fontFamily: 'var(--mono)' }}>#{payment.Student_ID}</td>
                          <td style={{ padding: '16px', color: 'var(--white)' }}>{payment.Subject}</td>
                          <td style={{ padding: '16px', color: 'var(--ink-2)' }}>Rs. {payment.Amount}</td>
                          <td style={{ padding: '16px', color: 'var(--ink-2)' }}>{payment.Method}</td>
                          <td style={{ padding: '16px', color: payment.Status === 'Approved' ? 'var(--accent)' : payment.Status === 'Rejected' ? '#FF5A65' : '#f59e0b' }}>{payment.Status || 'Pending'}</td>
                          <td style={{ padding: '16px' }}>
                            {payment.Slip_Url ? (
                              <button onClick={() => setViewingSlipUrl(payment.Slip_Url)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--white)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>RECEIPT</button>
                            ) : <span style={{ color: 'var(--ink-4)' }}>N/A</span>}
                          </td>
                        </tr>
                      ))}
                      {paymentHistory.length === 0 && (
                        <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-3)' }}>No payment history.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedStudent(null)}>
          <div className="dash-panel" onClick={(e) => e.stopPropagation()} style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto', padding: 0, background: '#0a0a0c', border: '1px solid var(--border)' }}>
            <div className="dash-panel-head">
              <span className="dash-panel-title">Operative Details</span>
              <button onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', color: 'var(--ink-4)', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
            </div>
            <div className="dash-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', color: 'var(--ink-2)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                <span style={{ color: 'var(--ink-3)' }}>Name:</span> <span style={{ color: 'var(--white)' }}>{selectedStudent.Name}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                <span style={{ color: 'var(--ink-3)' }}>ID:</span> <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>#{selectedStudent.Student_ID}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                <span style={{ color: 'var(--ink-3)' }}>Email:</span> <span style={{ color: 'var(--white)' }}>{selectedStudent.Email}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                <span style={{ color: 'var(--ink-3)' }}>WhatsApp:</span> <span style={{ color: 'var(--white)' }}>{selectedStudent.Watsapp_Number}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                <span style={{ color: 'var(--ink-3)' }}>NIC:</span> <span style={{ color: 'var(--white)' }}>{selectedStudent.NIC || 'N/A'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                <span style={{ color: 'var(--ink-3)' }}>Address:</span> <span style={{ color: 'var(--white)' }}>{selectedStudent.Address}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                <span style={{ color: 'var(--ink-3)' }}>Guardian:</span> <span style={{ color: 'var(--white)' }}>{selectedStudent.Gurdian_s_Name}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                <span style={{ color: 'var(--ink-3)' }}>Guardian No:</span> <span style={{ color: 'var(--white)' }}>{selectedStudent.Gurdians_Number}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                <span style={{ color: 'var(--ink-3)' }}>Enrollments:</span> 
                <span style={{ color: 'var(--white)' }}>{selectedStudent.enrolledCourses?.length ? selectedStudent.enrolledCourses.map(c => c.Subject_Name).join(', ') : 'None'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setEditingSubject(null)}>
          <div className="dash-panel" onClick={(e) => e.stopPropagation()} style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', padding: 0, background: '#0a0a0c', border: '1px solid var(--border)' }}>
            <div className="dash-panel-head">
              <span className="dash-panel-title">Edit Subject Parameter</span>
              <button onClick={() => setEditingSubject(null)} style={{ background: 'none', border: 'none', color: 'var(--ink-4)', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
            </div>
            <div className="dash-panel-body">
              <form onSubmit={handleUpdateSubject} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Subject Name</label>
                  <input type="text" name="name" value={editingSubject.name} onChange={handleSubjectEditChange} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} required />
                </div>
                <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Instructor</label>
                  <select name="instructor" value={editingSubject.instructor} onChange={handleSubjectEditChange} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none', appearance: 'none' }} required>
                    <option value="" disabled>Select an instructor</option>
                    {instructors.map(inst => <option key={inst.id} value={inst.Name}>{inst.Name}</option>)}
                  </select>
                </div>
                <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Grade</label>
                  <input type="number" step="1" name="grade" value={editingSubject.grade} onChange={handleSubjectEditChange} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} required />
                </div>
                <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Price</label>
                  <input type="number" step="0.01" name="price" value={editingSubject.price} onChange={handleSubjectEditChange} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} required />
                </div>
                <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Medium</label>
                  <select name="medium" value={editingSubject.medium} onChange={handleSubjectEditChange} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} required>
                    <option value="" disabled>Select Medium</option>
                    <option value="Sinhala">Sinhala</option>
                    <option value="English">English</option>
                    <option value="Tamil">Tamil</option>
                  </select>
                </div>
                <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Day of the Week</label>
                  <select name="day" value={editingSubject.day || ''} onChange={handleSubjectEditChange} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }}>
                    <option value="" disabled>Select Day</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
                <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Meeting Link</label>
                  <input type="url" name="meetingLink" value={editingSubject.meetingLink} onChange={handleSubjectEditChange} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} />
                </div>
                <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Start Time</label>
                  <input type="time" name="startTime" value={editingSubject.startTime || ''} onChange={handleSubjectEditChange} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} />
                </div>
                <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>End Time</label>
                  <input type="time" name="endTime" value={editingSubject.endTime || ''} onChange={handleSubjectEditChange} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} />
                </div>
                <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Subject Image (Optional)</label>
                  <input type="file" name="image" accept="image/*" onChange={(e) => setEditingSubject({...editingSubject, image: e.target.files[0]})} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} />
                </div>
                <div className="auth-field" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '14px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none', width: '100%' }}>
                    <input
                      type="checkbox"
                      name="isHidden"
                      checked={editingSubject.isHidden || false}
                      onChange={(e) => setEditingSubject(prev => ({ ...prev, isHidden: e.target.checked }))}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ color: 'var(--white)', fontSize: '13px', fontWeight: 600 }}>Hide this subject from students</div>
                      <div style={{ color: 'var(--ink-3)', fontSize: '11px', marginTop: '2px' }}>When enabled, this subject will disappear from homepage & student dashboard.</div>
                    </div>
                  </label>
                </div>
                <div style={{ gridColumn: '1 / -1', fontSize: '12px', color: 'var(--ink-3)', marginTop: '-10px' }}>
                  Note: Providing a Start and End Time will automatically generate and update the Google Meet Link.
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button type="button" onClick={() => setEditingSubject(null)} className="btn btn-outline" style={{ flex: 1, padding: '12px' }}>CANCEL</button>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, padding: '12px' }}>{loading ? 'SAVING...' : 'SAVE CHANGES'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Viewing Payment Slip Modal */}
      {viewingSlipUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setViewingSlipUrl(null)}>
          <div className="dash-panel" onClick={(e) => e.stopPropagation()} style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', padding: 0, background: '#0a0a0c', border: '1px solid var(--border)' }}>
            <div className="dash-panel-head">
              <span className="dash-panel-title">Proof of Authorization</span>
              <button onClick={() => setViewingSlipUrl(null)} style={{ background: 'none', border: 'none', color: 'var(--ink-4)', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
            </div>
            <div className="dash-panel-body" style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
              <img src={viewingSlipUrl} alt="Slip" style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px', objectFit: 'contain' }} />
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewingSlipUrl(null)} className="btn btn-outline" style={{ padding: '8px 16px' }}>CLOSE</button>
            </div>
          </div>
        </div>
      )}
      {showInstructorModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="dash-panel" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="dash-panel-body">
              <h2 className="dash-title" style={{ marginBottom: '24px' }}>{editingInstructor ? 'Edit Instructor' : 'Add Instructor'}</h2>
              <form onSubmit={handleInstructorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Name</label>
                  <input type="text" value={instructorForm.name} onChange={e => setInstructorForm({...instructorForm, name: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none' }} required />
                </div>
                <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Description</label>
                  <textarea value={instructorForm.description} onChange={e => setInstructorForm({...instructorForm, description: e.target.value})} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px 16px', borderRadius: 'var(--r-md)', color: 'var(--white)', outline: 'none', minHeight: '100px', resize: 'vertical' }} required />
                </div>
                <div className="auth-field" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="auth-label" style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Image (Optional)</label>
                  <input type="file" onChange={e => setInstructorForm({...instructorForm, image: e.target.files[0]})} style={{ width: '100%', color: 'var(--ink-3)', fontSize: '14px' }} accept="image/*" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button type="button" onClick={() => setShowInstructorModal(false)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--white)', padding: '12px 24px', borderRadius: 'var(--r-md)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cancel</button>
                  <button type="submit" disabled={loading} style={{ background: 'var(--white)', color: 'var(--black)', border: 'none', padding: '12px 24px', borderRadius: 'var(--r-md)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{loading ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
