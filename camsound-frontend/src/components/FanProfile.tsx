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
      setSaveMsg('Profile updated successfully ✅');
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
  const planColor = user?.subscriptionStatus === 'active' ? 'var(--accent-color)' : 'var(--text-muted)';

  return (
    <div className="fan-profile-container">
      {/* Profile Card */}
      <div className="hero-welcome" style={{ padding: '32px 36px', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div className="hero-avatar-ring">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <div className="avatar-placeholder" style={{ background: 'var(--accent-color)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '2rem' }}>
                  {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
              )}
            </div>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(250, 204, 21, 0.15)', border: '1px solid rgba(250, 204, 21, 0.3)', borderRadius: 20, color: planColor, fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
                <i className={`fas ${user?.subscriptionStatus === 'active' ? 'fa-crown' : 'fa-user'}`} /> {planLabel.toUpperCase()} ACCOUNT
              </div>
              <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                {user?.name ?? 'Music Lover'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.88rem' }}>
                <span><i className="fas fa-envelope" style={{ color: 'var(--accent-color)', marginRight: 6 }} />{user?.email}</span>
                <span><i className="fas fa-map-marker-alt" style={{ color: 'var(--accent-color)', marginRight: 6 }} />{user?.country || 'Cameroon'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="stat-card-premium" style={{ padding: '14px 20px', minWidth: 120 }}>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{stats?.totalPlays?.toLocaleString() ?? '0'}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Plays</div>
              </div>
            </div>
            <div className="stat-card-premium" style={{ padding: '14px 20px', minWidth: 120 }}>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{stats?.favorites?.toLocaleString() ?? '0'}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Favorites</div>
              </div>
            </div>
            <div className="stat-card-premium" style={{ padding: '14px 20px', minWidth: 140 }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-color)' }}>{memberSince}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Member Since</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Card */}
      <div className="stat-card-premium" style={{ padding: 28, flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fas fa-user-edit" style={{ color: 'var(--accent-color)' }} /> Account Profile Details
          </h3>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                background: 'rgba(250, 204, 21, 0.15)', border: '1px solid rgba(250, 204, 21, 0.3)',
                color: 'var(--accent-color)', borderRadius: 20, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
              <i className="fas fa-pen" /> Edit Profile
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {/* Display Name */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Display Name</label>
            {editing ? (
              <input
                style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', outline: 'none' }}
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="Your display name"
              />
            ) : (
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, color: '#fff', fontWeight: 600 }}>{user?.name || '—'}</div>
            )}
          </div>

          {/* Email (read-only) */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Email Address</label>
            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, color: 'rgba(255,255,255,0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{user?.email}</span>
              <span className="glass-badge" style={{ fontSize: '0.7rem' }}>Read-only</span>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Phone Number</label>
            {editing ? (
              <input
                type="tel"
                style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', outline: 'none' }}
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="+237 6XX XXX XXX"
              />
            ) : (
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, color: '#fff', fontWeight: 600 }}>{user?.phone || 'Not set'}</div>
            )}
          </div>

          {/* Country */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Country / Region</label>
            {editing ? (
              <select
                style={{ width: '100%', padding: '12px 16px', background: 'rgba(18, 26, 22, 0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', outline: 'none' }}
                value={form.country}
                onChange={e => handleChange('country', e.target.value)}
              >
                <option value="">— Select Country —</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, color: '#fff', fontWeight: 600 }}>{user?.country || 'Not set'}</div>
            )}
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginTop: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Personal Bio</label>
          {editing ? (
            <textarea
              rows={3}
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', outline: 'none' }}
              value={form.bio}
              onChange={e => handleChange('bio', e.target.value)}
              placeholder="Tell the CamSound community a bit about yourself..."
            />
          ) : (
            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, color: user?.bio ? '#fff' : 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              {user?.bio || 'No personal bio added yet.'}
            </div>
          )}
        </div>

        {editing && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14, marginTop: 24 }}>
            {saveError && <span style={{ color: '#ef4444', fontSize: '0.88rem', fontWeight: 600 }}><i className="fas fa-exclamation-circle" /> {saveError}</span>}
            {saveMsg && <span style={{ color: '#10b981', fontSize: '0.88rem', fontWeight: 600 }}>{saveMsg}</span>}
            <button
              onClick={handleCancel}
              disabled={saving}
              style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '10px 24px', background: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`} style={{ marginRight: 6 }} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {saveMsg && !editing && (
          <div style={{ marginTop: 16 }}>
            <span style={{ color: '#10b981', fontSize: '0.88rem', fontWeight: 600 }}>{saveMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FanProfile;

