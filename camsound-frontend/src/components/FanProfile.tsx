import React, { useState, useEffect } from 'react';
import { authService, statsService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const COUNTRIES = [
  'Cameroon', 'Nigeria', 'Ghana', 'Ivory Coast', 'Senegal', 'Kenya',
  'South Africa', 'Ethiopia', 'Tanzania', 'Uganda', 'France', 'United Kingdom',
  'United States', 'Canada', 'Germany', 'Belgium', 'Switzerland', 'Other',
];

const FanProfile: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  const [form, setForm] = useState({
    name: user?.name ?? '',
    bio: user?.bio ?? '',
    phone: user?.phone ?? '',
    country: user?.country ?? '',
  });

  const [stats, setStats] = useState<{ totalPlays?: number; favorites?: number; memberSince?: string } | null>(null);

  useEffect(() => {
    statsService.getFanStats().then(res => {
      setStats(res.data?.data ?? res.data ?? null);
    }).catch(() => {
      // fallback: derive from user object
      setStats({ memberSince: (user as any)?.createdAt });
    });
  }, [user]);

  const handleChange = (field: string, val: string) =>
    setForm(f => ({ ...f, [field]: val }));

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    setSaveError('');
    try {
      const res = await authService.updateProfile(form);
      const updated = res.data?.data ?? res.data ?? user;
      updateUser({ ...user!, ...updated, ...form });
      setSaveMsg('Profile updated ✅');
      setEditing(false);
    } catch (e: any) {
      setSaveError(e?.response?.data?.message ?? 'Could not save. Try again.');
    } finally {
      setSaving(false);
      setTimeout(() => { setSaveMsg(''); setSaveError(''); }, 4000);
    }
  };

  const handleCancel = () => {
    setForm({
      name: user?.name ?? '',
      bio: user?.bio ?? '',
      phone: user?.phone ?? '',
      country: user?.country ?? '',
    });
    setEditing(false);
    setSaveError('');
  };

  const memberSince = stats?.memberSince
    ? new Date(stats.memberSince).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : (user as any)?.createdAt
      ? new Date((user as any).createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      : 'Unknown';

  const planLabel = user?.subscriptionStatus === 'active' ? 'Premium' : 'Free';
  const planIcon = user?.subscriptionStatus === 'active' ? 'fa-crown' : 'fa-user';
  const planColor = user?.subscriptionStatus === 'active' ? 'var(--accent-color)' : 'var(--text-muted)';

  return (
    <div className="fan-profile-container">
      {/* Profile Card */}
      <div className="fan-profile-card">
        <div className="fan-profile-avatar-wrap">
          <div className="fan-profile-avatar">
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} />
              : <span>{user?.name?.charAt(0)?.toUpperCase() ?? 'U'}</span>}
          </div>
          <div className="fan-profile-plan-badge" style={{ color: planColor }}>
            <i className={`fas ${planIcon}`} /> {planLabel}
          </div>
        </div>

        <div className="fan-profile-identity">
          <h2 className="fan-profile-name">{user?.name ?? 'Music Lover'}</h2>
          <p className="fan-profile-email">
            <i className="fas fa-envelope" /> {user?.email}
          </p>
          <p className="fan-profile-country">
            <i className="fas fa-map-marker-alt" /> {user?.country || 'Location not set'}
          </p>
        </div>

        {/* Stats Row */}
        <div className="fan-profile-stats">
          <div className="fan-profile-stat">
            <span className="fan-profile-stat-value">{stats?.totalPlays?.toLocaleString() ?? '—'}</span>
            <span className="fan-profile-stat-label">Plays</span>
          </div>
          <div className="fan-profile-stat-divider" />
          <div className="fan-profile-stat">
            <span className="fan-profile-stat-value">{stats?.favorites?.toLocaleString() ?? '—'}</span>
            <span className="fan-profile-stat-label">Favorites</span>
          </div>
          <div className="fan-profile-stat-divider" />
          <div className="fan-profile-stat">
            <span className="fan-profile-stat-value">{memberSince}</span>
            <span className="fan-profile-stat-label">Member Since</span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="fan-profile-form-card">
        <div className="fan-section-header" style={{ marginBottom: 20 }}>
          <h3 className="fan-section-title" style={{ margin: 0 }}>
            <i className="fas fa-user-edit" /> Profile Details
          </h3>
          {!editing && (
            <button className="fan-edit-btn" onClick={() => setEditing(true)}>
              <i className="fas fa-pen" /> Edit
            </button>
          )}
        </div>

        <div className="fan-profile-fields">
          {/* Name */}
          <div className="fan-profile-field">
            <label className="fan-field-label">Display Name</label>
            {editing
              ? <input className="fan-field-input" value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="Your name" />
              : <div className="fan-field-value">{user?.name || '—'}</div>}
          </div>

          {/* Email (read-only) */}
          <div className="fan-profile-field">
            <label className="fan-field-label">Email</label>
            <div className="fan-field-value fan-field-readonly">
              {user?.email} <span className="fan-field-badge">Read-only</span>
            </div>
          </div>

          {/* Bio */}
          <div className="fan-profile-field">
            <label className="fan-field-label">Bio</label>
            {editing
              ? <textarea className="fan-field-textarea" rows={3} value={form.bio} onChange={e => handleChange('bio', e.target.value)} placeholder="Tell us about yourself..." />
              : <div className="fan-field-value">{user?.bio || <span style={{ color: 'var(--text-muted)' }}>No bio yet</span>}</div>}
          </div>

          {/* Phone */}
          <div className="fan-profile-field">
            <label className="fan-field-label">Phone</label>
            {editing
              ? <input className="fan-field-input" type="tel" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+237 6XX XXX XXX" />
              : <div className="fan-field-value">{user?.phone || <span style={{ color: 'var(--text-muted)' }}>Not set</span>}</div>}
          </div>

          {/* Country */}
          <div className="fan-profile-field">
            <label className="fan-field-label">Country</label>
            {editing
              ? (
                <select className="fan-field-input" value={form.country} onChange={e => handleChange('country', e.target.value)}>
                  <option value="">— Select Country —</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )
              : <div className="fan-field-value">{user?.country || <span style={{ color: 'var(--text-muted)' }}>Not set</span>}</div>}
          </div>
        </div>

        {editing && (
          <div className="fan-profile-actions">
            {saveError && <span className="fan-error-msg"><i className="fas fa-exclamation-circle" /> {saveError}</span>}
            {saveMsg && <span className="fan-success-msg">{saveMsg}</span>}
            <button className="fan-secondary-btn" onClick={handleCancel} disabled={saving}>Cancel</button>
            <button className="fan-primary-btn" onClick={handleSave} disabled={saving}>
              <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {saveMsg && !editing && (
          <div className="fan-profile-actions">
            <span className="fan-success-msg">{saveMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FanProfile;
