import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlatformSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import { authService } from '../services/api';

const Signup: React.FC = () => {
  const [type, setType] = useState('fan');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { login } = useAuth();
  const { settings } = usePlatformSettings();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    document.title = 'Sign Up — CamSound';
    const roleParam = searchParams.get('role');
    if (roleParam === 'artist') {
      setType('artist');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.signup({ name: name.trim(), email: normalizedEmail, password, type, country: country.trim() });
      if (res.data.success) {
        login(res.data.token, res.data.user, res.data.csrfToken);
        if (type === 'artist') navigate('/artist');
        else navigate('/fan');
      } else {
        setError(res.data.message || 'Sign up failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-body">
      <div className="music-wave-bg">
        <div className="wave-anim" />
      </div>

      <div className="auth-card auth-card-wide" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, right: 20 }}>
          <LanguageToggle />
        </div>

        <div className="auth-logo">
          <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={settings.platformName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <i className={`fas ${settings.logoIcon || 'fa-drum'}`} style={{ fontSize: '2rem', WebkitTextFillColor: 'unset', background: 'none', color: 'var(--accent-color)' }} />
            )}
            {settings.platformName || 'CamSound'}
          </h1>
          <p>{t('auth.signup_subtitle')}</p>
        </div>

        {error && (
          <div className="auth-error">
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{t('auth.registering_as')} <strong style={{ color: type === 'artist' ? 'var(--accent-color)' : 'var(--text-white)' }}>{type === 'artist' ? t('auth.role_artist') : t('auth.role_fan')}</strong></span>
          </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="auth-form-group" style={{ gridColumn: '1/-1' }}>
                <label className="auth-label">{type === 'artist' ? t('auth.artist_name') : t('auth.full_name')}</label>
                <div className="input-icon-wrap">
                  <i className="fas fa-user" />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder={type === 'artist' ? t('auth.artist_name') : t('auth.full_name')}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-form-group" style={{ gridColumn: '1/-1' }}>
                <label className="auth-label">{t('auth.email')}</label>
                <div className="input-icon-wrap">
                  <i className="fas fa-envelope" />
                  <input
                    type="email"
                    className="auth-input"
                    placeholder={t('auth.email_placeholder')}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-form-group" style={{ gridColumn: '1/-1' }}>
                <label className="auth-label">{t('auth.country')}</label>
                <div className="input-icon-wrap">
                  <i className="fas fa-globe" />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder={t('auth.country_placeholder')}
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-form-group" style={{ gridColumn: '1/-1' }}>
                <label className="auth-label">{t('auth.password')}</label>
                <div className="input-icon-wrap" style={{ position: 'relative' }}>
                  <i className="fas fa-lock" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="auth-input"
                    placeholder={t('auth.password_placeholder')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
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
                {password && (() => {
                  let score = 0;
                  if (password.length >= 8) score++;
                  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
                  if (/\d/.test(password)) score++;
                  if (/[^a-zA-Z\d]/.test(password)) score++;

                  let label = 'Weak';
                  let color = '#ff6b6b';
                  if (score === 2) { label = 'Fair'; color = '#ffa726'; }
                  else if (score === 3) { label = 'Good'; color = '#51cf66'; }
                  else if (score === 4) { label = 'Strong'; color = '#2E8B57'; }

                  const pct = (score / 4) * 100;
                  return (
                    <div className="password-strength" style={{ marginTop: 8 }}>
                      <div className="strength-text" style={{ color, fontSize: '0.82rem', marginBottom: 4 }}>
                        {t('auth.password_strength')}: {label}
                      </div>
                      <div className="strength-bar" style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' }}>
                        <div className="strength-fill" style={{ width: `${pct}%`, background: color, height: '100%', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="auth-form-group" style={{ gridColumn: '1/-1' }}>
                <label className="auth-label">{t('auth.confirm_password')}</label>
                <div className="input-icon-wrap" style={{ position: 'relative' }}>
                  <i className="fas fa-lock" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    className="auth-input"
                    placeholder={t('auth.confirm_password_placeholder')}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(p => !p)}
                    aria-label={showConfirmPass ? 'Hide confirmation password' : 'Show confirmation password'}
                    title={showConfirmPass ? 'Hide confirmation password' : 'Show confirmation password'}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}
                  >
                    <i className={`far ${showConfirmPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="role-selection" style={{ marginBottom: 16 }}>
              {[
                { value: 'fan', icon: 'fa-headphones', title: t('auth.role_fan'), description: t('auth.role_fan_desc') },
                { value: 'artist', icon: 'fa-microphone', title: t('auth.role_artist'), description: t('auth.role_artist_desc') },
              ].map(role => (
                <div key={role.value} className={`role-option ${type === role.value ? 'selected' : ''}`} onClick={() => setType(role.value)} role="radio" aria-checked={type === role.value} tabIndex={0}>
                  <div className="role-icon-circle"><i className={`fas ${role.icon}`} /></div>
                  <div className="role-info"><h5>{role.title}</h5><p>{role.description}</p></div>
                  {type === role.value && <i className="fas fa-check-circle" style={{ marginLeft: 'auto', color: 'var(--accent-color)' }} />}
                </div>
              ))}
            </div>

            <label style={{ margin: '16px 0', fontSize: '0.83rem', color: 'var(--text-muted)', display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
              <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} required style={{ marginTop: 3 }} />
              <span>{t('auth.agree_terms')} <Link to="/terms" target="_blank" style={{ color: 'var(--secondary-color)' }}>{t('common.terms')}</Link> {t('auth.and')} <Link to="/privacy" target="_blank" style={{ color: 'var(--secondary-color)' }}>{t('common.privacy')}</Link>.</span>
            </label>

            <button type="submit" className="btn-auth-submit" disabled={loading || !acceptedTerms}>
              {loading
                ? <><i className="fas fa-spinner fa-spin" /> {t('auth.creating_account')}</>
                : <><i className="fas fa-user-plus" /> {t('auth.signup_button')}</>}
            </button>
          </form>

        <div className="auth-divider"><span>{t('auth.or_signup_with')}</span></div>
        <div className="social-buttons">
          <button type="button" className="btn-social" onClick={() => setError('Google signup is currently disabled in test environment.')}><i className="fab fa-google" /> Google</button>
          <button type="button" className="btn-social" onClick={() => setError('Facebook signup is currently disabled in test environment.')}><i className="fab fa-facebook-f" /> Facebook</button>
        </div>

        <div className="auth-footer-links">
          <p>{t('auth.have_account')} <Link to="/login">{t('auth.login_link')}</Link></p>
          <p><Link to="/"><i className="fas fa-home" style={{ marginRight: 4 }} />{t('auth.back_to_home')}</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

