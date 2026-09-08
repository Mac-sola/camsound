import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

const Signup: React.FC = () => {
  const [step, setStep] = useState(2);
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'artist') {
      setType('artist');
      setStep(2);
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

      <div className="auth-card auth-card-wide">
        <div className="auth-logo">
          <h1><i className="fas fa-drum" style={{ fontSize: '2rem', WebkitTextFillColor: 'unset', background: 'none', color: 'var(--accent-color)' }} />CamSound</h1>
          <p>Join the Cameroonian music revolution</p>
        </div>

        {error && (
          <div className="auth-error">
            <i className="fas fa-exclamation-circle" /> {error}
          </div>
        )}

        {step === 1 ? (
          // Step 1: Role Selection
          <div>
            <div style={{ marginBottom: 20 }}>
              <label className="auth-label">I want to...</label>
              <div className="role-selection">
                <div
                  className={`role-option ${type === 'fan' ? 'selected' : ''}`}
                  onClick={() => setType('fan')}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setType('fan'); } }}
                  role="radio"
                  tabIndex={0}
                  aria-checked={type === 'fan'}
                >
                  <div className="role-icon-circle"><i className="fas fa-headphones" /></div>
                  <div className="role-info">
                    <h5>Listen as a Fan</h5>
                    <p>Discover and stream Cameroonian music</p>
                  </div>
                  {type === 'fan' && <i className="fas fa-check-circle" style={{ marginLeft: 'auto', color: 'var(--accent-color)', fontSize: '1.3rem' }} />}
                </div>
                <div
                  className={`role-option ${type === 'artist' ? 'selected' : ''}`}
                  onClick={() => setType('artist')}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setType('artist'); } }}
                  role="radio"
                  tabIndex={0}
                  aria-checked={type === 'artist'}
                >
                  <div className="role-icon-circle"><i className="fas fa-microphone" /></div>
                  <div className="role-info">
                    <h5>Join as an Artist</h5>
                    <p>Upload music and build your fanbase</p>
                  </div>
                  {type === 'artist' && <i className="fas fa-check-circle" style={{ marginLeft: 'auto', color: 'var(--accent-color)', fontSize: '1.3rem' }} />}
                </div>
              </div>
            </div>
            <button className="btn-auth-submit" onClick={() => setStep(2)}>
              Continue <i className="fas fa-arrow-right" />
            </button>
          </div>
        ) : (
          // Step 2: Account Details
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>I am registering as <strong style={{ color: type === 'artist' ? 'var(--accent-color)' : 'var(--text-white)' }}>{type === 'artist' ? 'Artist' : 'Fan'}</strong></span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="auth-form-group" style={{ gridColumn: '1/-1' }}>
                <label className="auth-label">{type === 'artist' ? 'Artist Name' : 'Full Name'}</label>
                <div className="input-icon-wrap">
                  <i className="fas fa-user" />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder={type === 'artist' ? 'Your artist name' : 'Your full name'}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-form-group" style={{ gridColumn: '1/-1' }}>
                <label className="auth-label">Email Address</label>
                <div className="input-icon-wrap">
                  <i className="fas fa-envelope" />
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-form-group" style={{ gridColumn: '1/-1' }}>
                <label className="auth-label">Country</label>
                <div className="input-icon-wrap">
                  <i className="fas fa-globe" />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Country"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-form-group" style={{ gridColumn: '1/-1' }}>
                <label className="auth-label">Password</label>
                <div className="input-icon-wrap" style={{ position: 'relative' }}>
                  <i className="fas fa-lock" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Create a password (min. 6 chars)"
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
                        Password strength: {label}
                      </div>
                      <div className="strength-bar" style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' }}>
                        <div className="strength-fill" style={{ width: `${pct}%`, background: color, height: '100%', transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="auth-form-group" style={{ gridColumn: '1/-1' }}>
                <label className="auth-label">Confirm Password</label>
                <div className="input-icon-wrap" style={{ position: 'relative' }}>
                  <i className="fas fa-lock" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Re-enter your password"
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
                { value: 'fan', icon: 'fa-headphones', title: 'Fan', description: 'Discover and enjoy music from Cameroonian artists' },
                { value: 'artist', icon: 'fa-microphone', title: 'Artist', description: 'Upload and share your music with the world' },
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
              <span>I agree to the <a href="#" onClick={e => e.preventDefault()} style={{ color: 'var(--secondary-color)' }}>Terms of Service</a> and <a href="#" onClick={e => e.preventDefault()} style={{ color: 'var(--secondary-color)' }}>Privacy Policy</a>.</span>
            </label>

            <button type="submit" className="btn-auth-submit" disabled={loading || !acceptedTerms}>
              {loading
                ? <><i className="fas fa-spinner fa-spin" /> Creating account...</>
                : <><i className="fas fa-user-plus" /> Create Account</>}
            </button>
          </form>
        )}

        <div className="auth-divider"><span>Or sign up with</span></div>
        <div className="social-buttons">
          <button type="button" className="btn-social" onClick={() => setError('Google signup is currently disabled in test environment.')}><i className="fab fa-google" /> Google</button>
          <button type="button" className="btn-social" onClick={() => setError('Facebook signup is currently disabled in test environment.')}><i className="fab fa-facebook-f" /> Facebook</button>
        </div>

        <div className="auth-footer-links">
          <p>Already have an account? <Link to="/login">Login</Link></p>
          <p><Link to="/"><i className="fas fa-home" style={{ marginRight: 4 }} />Back to Home</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

