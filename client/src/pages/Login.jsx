import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Phone, Mail, CheckCircle2, Shield } from 'lucide-react';

const Login = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const { loginAdmin, sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await loginAdmin(email, password);
      setSuccessMsg('Logged in successfully!');
      setTimeout(() => {
        navigate('/admin-dashboard');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await sendOTP(phone);
      setOtpSent(true);
      setSimulatedOtp(data.otp);
      setSuccessMsg(`Simulated OTP sent. Check notifications!`);
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await verifyOTP(phone, otp);
      setSuccessMsg('Staff login verified successfully!');
      setTimeout(() => {
        navigate('/staff-dashboard');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={loginBoxStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Government Arts College</h1>
          <p style={subtitleStyle}>Department of Mathematics Timetable portal</p>
        </div>

        {/* Tab Selector */}
        <div style={tabContainerStyle}>
          <button 
            onClick={() => { setIsAdminMode(false); setError(''); setSuccessMsg(''); setOtpSent(false); }}
            style={tabButtonStyle(!isAdminMode)}
          >
            <Phone size={16} />
            <span>Staff Login</span>
          </button>
          <button 
            onClick={() => { setIsAdminMode(true); setError(''); setSuccessMsg(''); }}
            style={tabButtonStyle(isAdminMode)}
          >
            <Shield size={16} />
            <span>Admin Login</span>
          </button>
        </div>

        {error && <div style={errorStyle}>{error}</div>}
        {successMsg && <div style={successStyle}>{successMsg}</div>}

        {/* Admin Login Form */}
        {isAdminMode ? (
          <form onSubmit={handleAdminSubmit} style={formStyle}>
            <div className="form-group">
              <label className="form-label">Admin Username or Email</label>
              <div style={inputWrapperStyle}>
                <Mail size={18} style={inputIconStyle} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={inputPaddingStyle}
                  placeholder="e.g. mohan" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={inputWrapperStyle}>
                <KeyRound size={18} style={inputIconStyle} />
                <input 
                  type="password" 
                  className="form-input" 
                  style={inputPaddingStyle}
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={submitBtnStyle} disabled={loading}>
              {loading ? 'Logging in...' : 'Sign In as Admin'}
            </button>
          </form>
        ) : (
          /* Staff Login (OTP Flow) */
          <div style={formStyle}>
            {!otpSent ? (
              <form onSubmit={handleSendOtpSubmit}>
                <div className="form-group">
                  <label className="form-label">Registered Phone Number</label>
                  <div style={inputWrapperStyle}>
                    <Phone size={18} style={inputIconStyle} />
                    <input 
                      type="tel" 
                      className="form-input" 
                      style={inputPaddingStyle}
                      placeholder="e.g. 9443212341" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={submitBtnStyle} disabled={loading}>
                  {loading ? 'Validating account...' : 'Request OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpSubmit}>
                <div className="form-group">
                  <label className="form-label">Enter 6-Digit OTP</label>
                  <div style={inputWrapperStyle}>
                    <KeyRound size={18} style={inputIconStyle} />
                    <input 
                      type="text" 
                      className="form-input" 
                      style={inputPaddingStyle}
                      placeholder="Enter OTP" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                {/* Simulated OTP Notification Banner */}
                <div style={otpBannerStyle}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <div>
                    <span style={{ fontWeight: '600' }}>Development SMS Simulator:</span>
                    <p style={{ margin: '2px 0 0 0' }}>Your code is <strong style={{ color: '#ffffff', fontSize: '15px' }}>{simulatedOtp}</strong>. It will expire in 5 minutes.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                  >
                    Change Phone
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify & Log In'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const containerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: '20px',
};

const loginBoxStyle = {
  width: '100%',
  maxWidth: '440px',
  background: 'var(--bg-card)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
  border: '1px solid var(--border-color)',
  borderRadius: '20px',
  padding: '40px 32px',
  boxShadow: 'var(--shadow-lg)',
};

const headerStyle = {
  textAlign: 'center',
  marginBottom: '32px',
};

const titleStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: '24px',
  fontWeight: '800',
  color: '#ffffff',
  marginBottom: '6px',
};

const subtitleStyle = {
  fontSize: '14px',
  color: 'var(--text-secondary)',
};

const tabContainerStyle = {
  display: 'flex',
  background: 'rgba(0, 0, 0, 0.25)',
  padding: '4px',
  borderRadius: '10px',
  marginBottom: '28px',
  border: '1px solid var(--border-color)',
};

const tabButtonStyle = (isActive) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '10px',
  borderRadius: '8px',
  border: 'none',
  background: isActive ? 'var(--bg-card-hover)' : 'transparent',
  color: isActive ? '#ffffff' : 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: isActive ? '600' : '500',
  transition: 'all 0.2s ease',
  boxShadow: isActive ? '0 4px 10px rgba(0, 0, 0, 0.15)' : 'none',
});

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
};

const inputWrapperStyle = {
  position: 'relative',
};

const inputIconStyle = {
  position: 'absolute',
  top: '50%',
  left: '12px',
  transform: 'translateY(-50%)',
  color: 'var(--text-muted)',
};

const inputPaddingStyle = {
  paddingLeft: '40px',
};

const hintStyle = {
  display: 'block',
  fontSize: '11px',
  color: 'var(--text-muted)',
  marginTop: '6px',
};

const submitBtnStyle = {
  width: '100%',
  marginTop: '10px',
};

const errorStyle = {
  background: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  color: '#fca5a5',
  padding: '12px',
  borderRadius: '8px',
  fontSize: '13px',
  marginBottom: '20px',
  textAlign: 'center',
};

const successStyle = {
  background: 'rgba(16, 185, 129, 0.1)',
  border: '1px solid rgba(16, 185, 129, 0.3)',
  color: '#a7f3d0',
  padding: '12px',
  borderRadius: '8px',
  fontSize: '13px',
  marginBottom: '20px',
  textAlign: 'center',
};

const otpBannerStyle = {
  background: 'rgba(52, 211, 153, 0.08)',
  border: '1px solid rgba(52, 211, 153, 0.2)',
  borderRadius: '8px',
  padding: '12px',
  display: 'flex',
  gap: '12px',
  fontSize: '12px',
  color: 'var(--text-secondary)',
  marginTop: '16px',
};

export default Login;
