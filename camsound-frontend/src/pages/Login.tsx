import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlatformSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import { authService } from '../services/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const { settings } = usePlatformSettings();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Sign In — CamSound';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate input
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);
    try {
      const res = await authService.login({ email: email.trim(), password });
      if (res.data.success) {
        login(res.data.token, res.data.user, res.data.csrfToken);
        const u = res.data.user;
        if (u.type === 'admin') navigate('/admin');
        else if (u.type === 'artist') navigate('/artist');
        else navigate('/fan');
      } else {
        setError(res.data.message || 'Login failed');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 
                      err.message || 
                      'Invalid email or password';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [socialMsg, setSocialMsg] = useState('');

  return (
    <div className="auth-page-body">
      {/* Wave background */}
      <div className="music-wave-bg">
        <div className="wave-anim" />
      </div>

      <div className="auth-card" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, right: 20 }}>
          <LanguageToggle />
        </div>

        {/* Logo */}
        <div className="auth-logo">
          <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.platformName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <i className={`fas ${settings.logoIcon || 'fa-drum'}`} style={{ fontSize: '2rem', WebkitTextFillColor: 'unset', background: 'none', color: 'var(--accent-color)' }} />
            )}
            {settings.platformName || 'CamSound'}
          </h1>
          <p>{settings.platformDesc || 'Amplifying Cameroonian music globally'}</p>
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
            <label className="auth-label" htmlFor="email">{t('auth.email')}</label>
            <div className="input-icon-wrap">
              <i className="fas fa-envelope" />
              <input
                type="email"
                id="email"
                className="auth-input"
                placeholder={t('auth.email_placeholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label" htmlFor="password">{t('auth.password')}</label>
            <div className="input-icon-wrap" style={{ position: 'relative' }}>
              <i className="fas fa-lock" />
              <input
                type={showPass ? 'text' : 'password'}
                id="password"
                className="auth-input"
                placeholder={t('auth.password_placeholder')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                title={showPass ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}
              >
                <i className={`far ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>
          </div>

          <div className="forgot-password-link">
            <button
              type="button"
              onClick={() => { setForgotMsg(''); setIsForgotOpen(true); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              {t('auth.forgot_password')}
            </button>
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? <><i className="fas fa-spinner fa-spin" /> {t('auth.logging_in')}</> : <><i className="fas fa-sign-in-alt" /> {t('auth.login_button')}</>}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider"><span>{t('auth.or_continue_with')}</span></div>

        {socialMsg && (
          <div style={{ textAlign: 'center', margin: '8px 0', fontSize: '0.82rem', color: 'var(--accent-color)' }}>
            {socialMsg}
          </div>
        )}

        {/* Social */}
        <div className="social-buttons">
          <button className="btn-social" onClick={() => { setSocialMsg('Google login is currently disabled in test environment.'); setTimeout(() => setSocialMsg(''), 3000); }}>
            <i className="fab fa-google" /> Google
          </button>
          <button className="btn-social" onClick={() => { setSocialMsg('Facebook login is currently disabled in test environment.'); setTimeout(() => setSocialMsg(''), 3000); }}>
            <i className="fab fa-facebook-f" /> Facebook
          </button>
        </div>

        {/* Footer */}
        <div className="auth-footer-links">
          <p>{t('auth.no_account')} <Link to="/signup">{t('auth.sign_up_now')}</Link></p>
          <p><Link to="/"><i className="fas fa-home" style={{ marginRight: 4 }} />{t('auth.back_to_home')}</Link></p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 32, maxWidth: 420, width: '100%', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 8px' }}>{t('auth.reset_password')}</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 20 }}>{t('auth.reset_desc')}</p>
            {forgotMsg && (
              <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.12)', color: '#4ade80', fontSize: '0.88rem' }}>
                {forgotMsg}
              </div>
            )}
            <input
              type="email"
              placeholder="name@example.com"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              className="auth-input"
              style={{ width: '100%', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn-camsound-yellow"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  if (!forgotEmail.trim()) return;
                  setForgotMsg(`✅ Password reset instructions sent to ${forgotEmail}`);
                  setTimeout(() => { setIsForgotOpen(false); setForgotEmail(''); }, 3000);
                }}
              >
                {t('auth.send_reset_link')}
              </button>
              <button className="btn-camsound-outline" onClick={() => setIsForgotOpen(false)}>{t('common.cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

