import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogoMark } from '../../components/Navbar';
import '../Dashboard.css';
import './InstructorDashboard.css';

const API = import.meta.env.VITE_API_URL || '';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const formatTime = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${(hr % 12 || 12).toString().padStart(2, '0')}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

const fmt = (n) =>
  new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(n);

const fmtMonth = (m) => {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return new Date(parseInt(y), parseInt(mo) - 1, 1).toLocaleString('en-LK', { month: 'long', year: 'numeric' });
};

const dayShort = { Monday: 'MON', Tuesday: 'TUE', Wednesday: 'WED', Thursday: 'THU', Friday: 'FRI', Saturday: 'SAT', Sunday: 'SUN' };

/* ── Icons ────────────────────────────────────────────────────────────────── */
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  subjects:  'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  students:  'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm11 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  earnings:  'M12 1v22M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6',
  meet:      'M15 10l4.553-2.069A1 1 0 0 1 21 8.869v6.262a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  calendar:  'M3 4h18v4H3zM16 2v4M8 2v4M3 10h18v11H3zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01',
  clock:     'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 5v5l4 2',
  signout:   'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  fee:       'M9 14l-4-4 4-4M5 10h11a4 4 0 0 1 0 8h-1',
  copy:      'M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z',
  eyeOff:    'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22',
  account:   'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  lock:      'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
  check:     'M20 6L9 17l-5-5',
};

/* ── Sub-components ───────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, accent }) {
  return (
    <div className={`id-stat-card${accent ? ' id-stat-card--accent' : ''}`}>
      <div className="id-stat-head">
        <span className="id-stat-label">{label}</span>
        <span className="id-stat-icon"><Icon d={icons[icon]} size={18} /></span>
      </div>
      <div className="id-stat-val">{value}</div>
    </div>
  );
}

function SubjectCard({ subject }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (link) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const hasMeeting = subject.meetingLink && subject.meetingLink.trim() !== '';
  const hidden = subject.isHidden;

  return (
    <div className={`id-subject-card${hidden ? ' id-subject-card--hidden' : ''}`}>
      <div className="id-subject-header">
        <div className="id-subject-thumb-wrap">
          {subject.image ? (
            <img src={subject.image} alt={subject.name} className="id-subject-thumb" />
          ) : (
            <div className="id-subject-thumb-placeholder">
              <Icon d={icons.subjects} size={24} />
            </div>
          )}
        </div>
        <div className="id-subject-meta">
          <div className="id-subject-tags">
            <span className="id-tag id-tag--grade">Grade {subject.grade}</span>
            <span className="id-tag id-tag--medium">{subject.medium}</span>
            {hidden && (
              <span className="id-tag id-tag--hidden">
                <Icon d={icons.eyeOff} size={10} /> Hidden
              </span>
            )}
          </div>
          <h3 className="id-subject-name">{subject.name}</h3>
          <p className="id-subject-price">{fmt(subject.price)} / student</p>
        </div>
      </div>

      <div className="id-subject-schedule">
        <div className="id-sched-item">
          <Icon d={icons.calendar} size={14} />
          <span>{subject.day ? (dayShort[subject.day] || subject.day) : '—'}</span>
        </div>
        <div className="id-sched-sep" />
        <div className="id-sched-item">
          <Icon d={icons.clock} size={14} />
          <span>{formatTime(subject.startTime)} – {formatTime(subject.endTime)}</span>
        </div>
      </div>

      <div className="id-meet-row">
        <div className="id-meet-icon"><Icon d={icons.meet} size={14} /></div>
        {hasMeeting ? (
          <>
            <a href={subject.meetingLink} target="_blank" rel="noreferrer" className="id-meet-link">
              Join Google Meet
            </a>
            <button
              className={`id-copy-btn${copied ? ' id-copy-btn--done' : ''}`}
              onClick={() => handleCopy(subject.meetingLink)}
              title="Copy link"
            >
              {copied ? '✓' : <Icon d={icons.copy} size={12} />}
            </button>
          </>
        ) : (
          <span className="id-meet-none">No meeting link assigned</span>
        )}
      </div>

      <div className="id-payment-block">
        <div className="id-payment-row id-payment-row--students">
          <span className="id-pr-label">
            <Icon d={icons.students} size={12} />
            Enrolled Students
          </span>
          <span className="id-pr-val id-pr-val--students">{subject.enrollmentCount}</span>
        </div>
        <div className="id-payment-divider" />
        <div className="id-payment-row">
          <span className="id-pr-label">Class Fee × Students</span>
          <span className="id-pr-val">{fmt(subject.grossEarnings)}</span>
        </div>
        <div className="id-payment-row id-payment-row--fee">
          <span className="id-pr-label">
            <Icon d={icons.fee} size={12} />
            Platform Fee (Rs {subject.platformFeePerStudent} × {subject.enrollmentCount})
          </span>
          <span className="id-pr-val id-pr-val--fee">− {fmt(subject.platformFeeTotal)}</span>
        </div>
        <div className="id-payment-divider" />
        <div className="id-payment-row id-payment-row--net">
          <span className="id-pr-label id-pr-label--net">Monthly Receivable</span>
          <span className="id-pr-val id-pr-val--net">{fmt(subject.netEarnings)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function InstructorDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [data, setData] = useState(null);
  const [payouts, setPayouts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('subjects');

  // Account / password state
  const [pwForm, setPwForm] = useState({ password: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token || !user) { navigate('/student/login'); return; }

    const role = user.Role?.toLowerCase();
    if (role !== 'instructor' && role !== 'admin') {
      alert('Access Denied. Instructors Only.');
      navigate('/student/home');
      return;
    }

    const load = async () => {
      setLoading(true); setError('');
      try {
        const [dashRes, payRes] = await Promise.all([
          fetch(`${API}/api/v1/instructors/dashboard`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/v1/instructors/payouts`,   { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [dashJson, payJson] = await Promise.all([dashRes.json(), payRes.json()]);
        if (dashRes.ok) setData(dashJson.data);
        else setError(dashJson.message || 'Failed to load dashboard');
        if (payRes.ok) setPayouts(payJson.data);
      } catch {
        setError('Connection error. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate, user]);


  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/student/login');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (pwForm.password !== pwForm.confirm) {
      setPwError('Passwords do not match.');
      return;
    }
    if (pwForm.password.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }
    const token = localStorage.getItem('token');
    setPwLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/users/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwForm.password }),
      });
      const json = await res.json();
      if (res.ok) {
        setPwSuccess('Password updated successfully!');
        setPwForm({ password: '', confirm: '' });
      } else {
        setPwError(json.message || 'Failed to update password');
      }
    } catch {
      setPwError('Connection error.');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="id-loading-screen">
        <div className="id-spinner" />
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="id-loading-screen">
        <p className="id-error-msg">{error}</p>
        <button className="btn btn-outline" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const { summary, subjects } = data || { summary: {}, subjects: [] };
  const currentMonth = payouts?.currentMonth || '';
  const paidThisMonth = payouts?.paidThisMonth || false;
  const currentPayout = payouts?.currentPayout || null;
  const payoutHistory = payouts?.history || [];

  return (
    <div className="dashboard id-dashboard">
      <div className="id-orb id-orb-1" />
      <div className="id-orb id-orb-2" />

      {/* ── Sidebar ── */}
      <aside className="dash-sidebar">
        <Link to="/" className="dash-logo">
          <div className="dash-logo-mark"><LogoMark /></div>
          <span className="dash-logo-text">UVSHUB</span>
        </Link>

        <nav className="dash-nav">
          <button
            className={`dash-nav-item${activeTab === 'subjects' ? ' dash-nav-item--active' : ''}`}
            onClick={() => setActiveTab('subjects')}
          >
            <Icon d={icons.subjects} size={16} />
            My Subjects
          </button>
          <button
            className={`dash-nav-item${activeTab === 'account' ? ' dash-nav-item--active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <Icon d={icons.account} size={16} />
            Account
          </button>
        </nav>

        <div className="dash-user">
          <div className="id-avatar-fallback">
            {user?.Name?.charAt(0).toUpperCase() || 'I'}
          </div>
          <div className="dash-user-info">
            <span className="dash-user-name">{user?.Name || 'Instructor'}</span>
            <span className="dash-user-plan">INSTRUCTOR</span>
          </div>
          <button className="id-signout-btn" onClick={handleSignOut} title="Sign out">
            <Icon d={icons.signout} size={16} />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="dash-main">
        <div className="dash-content">

          {/* ══════════════ MY SUBJECTS TAB ══════════════ */}
          {activeTab === 'subjects' && (
            <>
              <div className="id-page-header">
                <div>
                  <div className="id-greeting">Welcome back,</div>
                  <h1 className="dash-title">{user?.Name}</h1>
                  <p className="dash-sub">Here&apos;s your teaching overview for this month</p>
                </div>
                {/* Paid Status Badge in header */}
                {paidThisMonth ? (
                  <div className="id-paid-badge id-paid-badge--paid">
                    <Icon d={icons.check} size={16} />
                    <span>Paid for {fmtMonth(currentMonth)}</span>
                  </div>
                ) : (
                  <div className="id-paid-badge id-paid-badge--pending">
                    <span className="id-paid-dot" />
                    <span>Payment Pending — {fmtMonth(currentMonth)}</span>
                  </div>
                )}
              </div>

              {/* Paid status detailed card */}
              {paidThisMonth && currentPayout && (
                <div className="id-payout-card id-payout-card--paid">
                  <div className="id-payout-card-icon">
                    <Icon d={icons.check} size={22} />
                  </div>
                  <div className="id-payout-card-body">
                    <div className="id-payout-card-title">Payment Received — {fmtMonth(currentPayout.month)}</div>
                    <div className="id-payout-card-amount">{fmt(currentPayout.amount)}</div>
                    <div className="id-payout-card-meta">
                      Paid on {new Date(currentPayout.paidAt).toLocaleDateString('en-LK', { day: 'numeric', month: 'long', year: 'numeric' })}
                      &nbsp;· by {currentPayout.paidByAdmin}
                    </div>
                  </div>
                </div>
              )}
              {!paidThisMonth && (
                <div className="id-payout-card id-payout-card--pending">
                  <div className="id-payout-card-icon">
                    <Icon d={icons.earnings} size={22} />
                  </div>
                  <div className="id-payout-card-body">
                    <div className="id-payout-card-title">Payment Pending — {fmtMonth(currentMonth)}</div>
                    <div className="id-payout-card-amount">{fmt(summary.totalNet ?? 0)}</div>
                    <div className="id-payout-card-meta">Your total receivable for this month has not been paid yet.</div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="id-stats-grid">
                <StatCard label="Total Subjects"   value={summary.totalSubjects ?? 0}          icon="subjects" />
                <StatCard label="Enrolled Students" value={summary.totalStudents ?? 0}          icon="students" />
                <StatCard label="Gross Earnings"   value={fmt(summary.totalGross ?? 0)}        icon="earnings" />
                <StatCard label="Platform Fee"     value={`− ${fmt(summary.totalPlatformFee ?? 0)}`} icon="fee" />
                <StatCard label="Total Receivable" value={fmt(summary.totalNet ?? 0)}          icon="earnings" accent />
              </div>

              <div className="id-fee-note">
                <Icon d={icons.fee} size={14} />
                <span>
                  A platform fee of <strong>Rs 500</strong> is deducted per enrolled student, per subject, from your monthly earnings.
                </span>
              </div>

              <div className="id-section-header">
                <h2 className="id-section-title">Your Subjects</h2>
                <span className="id-section-count">{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</span>
              </div>

              {subjects.length === 0 ? (
                <div className="id-empty-state">
                  <div className="id-empty-icon"><Icon d={icons.subjects} size={32} /></div>
                  <p>No subjects assigned to you yet.</p>
                  <p className="id-empty-sub">Contact the admin to have subjects created under your name.</p>
                </div>
              ) : (
                <div className="id-subjects-grid">
                  {subjects.map((subject) => (
                    <SubjectCard key={subject.id} subject={subject} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ══════════════ ACCOUNT TAB ══════════════ */}
          {activeTab === 'account' && (
            <>
              <div className="id-greeting">Settings</div>
              <h1 className="dash-title">My Account</h1>
              <p className="dash-sub">Manage your password and view payment history.</p>

              <div className="id-account-grid">

                {/* Change Password */}
                <div className="id-account-panel">
                  <div className="id-account-panel-head">
                    <Icon d={icons.lock} size={18} />
                    <span>Change Password</span>
                  </div>
                  <div className="id-account-panel-body">
                    {pwError && <div className="id-form-msg id-form-msg--error">{pwError}</div>}
                    {pwSuccess && <div className="id-form-msg id-form-msg--success"><Icon d={icons.check} size={14} /> {pwSuccess}</div>}
                    <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="id-form-field">
                        <label className="id-form-label">New Password</label>
                        <input
                          type="password"
                          placeholder="Min 6 characters"
                          value={pwForm.password}
                          onChange={e => setPwForm({ ...pwForm, password: e.target.value })}
                          required
                          minLength={6}
                          className="id-form-input"
                        />
                      </div>
                      <div className="id-form-field">
                        <label className="id-form-label">Confirm New Password</label>
                        <input
                          type="password"
                          placeholder="Re-enter password"
                          value={pwForm.confirm}
                          onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                          required
                          className="id-form-input"
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={pwLoading} style={{ alignSelf: 'flex-start', padding: '12px 28px' }}>
                        {pwLoading ? 'UPDATING...' : 'UPDATE PASSWORD'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Payout History */}
                <div className="id-account-panel">
                  <div className="id-account-panel-head">
                    <Icon d={icons.earnings} size={18} />
                    <span>Payout History</span>
                  </div>
                  <div className="id-account-panel-body">
                    {/* Current month status */}
                    {paidThisMonth ? (
                      <div className="id-payout-status id-payout-status--paid">
                        <Icon d={icons.check} size={16} />
                        <div>
                          <div className="id-ps-title">Paid for {fmtMonth(currentMonth)}</div>
                          <div className="id-ps-amount">{currentPayout ? fmt(currentPayout.amount) : '—'}</div>
                          {currentPayout && (
                            <div className="id-ps-meta">
                              {new Date(currentPayout.paidAt).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' })}
                              &nbsp;· Admin: {currentPayout.paidByAdmin}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="id-payout-status id-payout-status--pending">
                        <span className="id-paid-dot" />
                        <div>
                          <div className="id-ps-title">Pending — {fmtMonth(currentMonth)}</div>
                          <div className="id-ps-amount">{fmt(summary.totalNet ?? 0)}</div>
                          <div className="id-ps-meta">Not yet paid by admin</div>
                        </div>
                      </div>
                    )}

                    {/* History list */}
                    {payoutHistory.length > 0 && (
                      <div className="id-payout-history">
                        <div className="id-ph-label">Previous Payments</div>
                        {payoutHistory.map((p) => (
                          <div key={p.id} className="id-ph-row">
                            <div className="id-ph-month">{fmtMonth(p.month)}</div>
                            <div className="id-ph-amount">{fmt(p.amount)}</div>
                            <div className="id-ph-date">
                              {new Date(p.paidAt).toLocaleDateString('en-LK', { day: 'numeric', month: 'short' })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {payoutHistory.length === 0 && !paidThisMonth && (
                      <p style={{ color: 'var(--ink-4)', fontSize: '13px', marginTop: '12px' }}>No payment history yet.</p>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
