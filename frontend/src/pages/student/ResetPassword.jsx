import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogoMark } from '../../components/Navbar';
import './Auth.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialTokenInfo = () => {
    const hash = location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const token = params.get('access_token');
      if (token) return { token, err: '' };
      return { token: '', err: 'Invalid reset link. Missing access token.' };
    }
    return { token: '', err: 'Invalid reset link. No token found in the URL.' };
  };

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accessToken] = useState(() => getInitialTokenInfo().token);
  const [error, setError] = useState(() => getInitialTokenInfo().err);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);



  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!accessToken) {
      setError('Cannot reset password without a valid token.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, new_password: newPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to reset password');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/student/login');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-panel__inner">
          <div className="auth-logo">
            <div className="auth-logo-mark"><LogoMark dark={false} /></div>
            <span className="auth-logo-text">UVSHUB</span>
          </div>

          <h1 className="auth-title">Update Passkey</h1>
          <p className="auth-sub">Enter your new credentials below to restore access.</p>

          {error && (
            <div className="auth-error" style={{ marginBottom: '24px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {success && (
            <div className="auth-error" style={{ marginBottom: '24px', backgroundColor: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Password updated successfully! Redirecting to login...
            </div>
          )}

          {!success && (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label className="auth-label">New Passkey</label>
                <div className="auth-input-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input
                    type="password"
                    className="auth-input"
                    name="newPassword"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={!accessToken}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Confirm Passkey</label>
                <div className="auth-input-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input
                    type="password"
                    className="auth-input"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={!accessToken}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading || !accessToken}>
                {loading ? 'PROCESSING...' : 'UPDATE PASSKEY'}
              </button>
            </form>
          )}
          
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <Link to="/student/login" className="auth-link">Return to Base</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
