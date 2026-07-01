import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login({ email: email.trim(), password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        const u = res.data.user;
        if (u.type === 'admin') navigate('/admin');
        else if (u.type === 'artist') navigate('/artist');
        else navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-body">
      {/* Wave background */}
      <div className="music-wave-bg">
        <div className="wave-anim" />
      </div>

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <h1><i className="fas fa-drum" style={{ fontSize: '2rem', WebkitTextFillColor: 'unset', background: 'none', color: 'var(--accent-color)' }} />CamSound</h1>
          <p>Amplifying Cameroonian music globally</p>
        </div>

        {/* Error */}
        {error && (
          <div className="auth-error">
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="email">Email Address</label>
            <div className="input-icon-wrap">
              <i className="fas fa-envelope" />
              <input
                type="email"
                id="email"
                className="auth-input"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label" htmlFor="password">Password</label>
            <div className="input-icon-wrap" style={{ position: 'relative' }}>
              <i className="fas fa-lock" />
              <input
                type={showPass ? 'text' : 'password'}
                id="password"
                className="auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}
              >
                <i className={`far ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>
          </div>

          <div className="forgot-password-link">
            <a href="#">Forgot Password?</a>
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin" /> Logging in...</> : <><i className="fas fa-sign-in-alt" /> Login to Account</>}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider"><span>Or continue with</span></div>

        {/* Social */}
        <div className="social-buttons">
          <button className="btn-social"><i className="fab fa-google" /> Google</button>
          <button className="btn-social"><i className="fab fa-facebook-f" /> Facebook</button>
        </div>

        {/* Footer */}
        <div className="auth-footer-links">
          <p>Don't have an account? <Link to="/signup">Sign up now</Link></p>
          <p><Link to="/"><i className="fas fa-home" style={{ marginRight: 4 }} />Back to Home</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
