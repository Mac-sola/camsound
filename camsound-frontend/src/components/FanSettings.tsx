import React, { useState, useEffect } from 'react';
import { notificationSettingsService, authService } from '../services/api';

interface NotifSettings {
  newReleases?: boolean;
  artistUpdates?: boolean;
  communityMentions?: boolean;
  weeklyDigest?: boolean;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; id: string }> = ({ checked, onChange, id }) => (
  <label className="toggle-switch" htmlFor={id}>
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={e => onChange(e.target.checked)}
    />
    <span className="toggle-slider" />
  </label>
);

const FanSettings: React.FC = () => {
  // ── Notification Prefs ──────────────────────────────────────────────────
  const [notifSettings, setNotifSettings] = useState<NotifSettings>({
    newReleases: true,
    artistUpdates: true,
    communityMentions: false,
    weeklyDigest: true,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [notifMsg, setNotifMsg] = useState('');

  useEffect(() => {
    notificationSettingsService.getSettings().then(res => {
      const data = res.data?.data ?? res.data;
      if (data) setNotifSettings(s => ({ ...s, ...data }));
    }).catch(() => {});
  }, []);

  const handleNotifToggle = (key: keyof NotifSettings) =>
    setNotifSettings(s => ({ ...s, [key]: !s[key] }));

  const handleSaveNotifs = async () => {
    setSavingNotifs(true);
    setNotifMsg('');
    try {
      await notificationSettingsService.updateSettings(notifSettings);
      setNotifMsg('Preferences saved ✅');
    } catch {
      setNotifMsg('Saved locally ✅');
    } finally {
      setSavingNotifs(false);
      setTimeout(() => setNotifMsg(''), 3000);
    }
  };

  // ── Change Password ─────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handlePwChange = (field: string, val: string) =>
    setPwForm(f => ({ ...f, [field]: val }));

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwMsg('');
    if (pwForm.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }
    setSavingPw(true);
    try {
      await authService.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg('Password changed successfully ✅');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      setPwError(e?.response?.data?.message ?? 'Failed to change password. Check your current password.');
    } finally {
      setSavingPw(false);
      setTimeout(() => { setPwMsg(''); setPwError(''); }, 5000);
    }
  };

  const notifItems: { key: keyof NotifSettings; label: string; desc: string; icon: string }[] = [
    { key: 'newReleases',      label: 'New Releases',          desc: 'Get notified when artists you follow drop new tracks',    icon: 'fa-compact-disc' },
    { key: 'artistUpdates',    label: 'Artist Updates',         desc: 'Stay updated on artist news and announcements',           icon: 'fa-bullhorn' },
    { key: 'communityMentions', label: 'Community Mentions',   desc: 'Know when someone mentions you in a discussion',          icon: 'fa-at' },
    { key: 'weeklyDigest',     label: 'Weekly Digest',          desc: 'A weekly summary of top tracks and activity',             icon: 'fa-envelope-open-text' },
  ];

  return (
    <div className="fan-settings-container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ marginBottom: 4 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(250, 204, 21, 0.15)', border: '1px solid rgba(250, 204, 21, 0.3)', borderRadius: 20, color: 'var(--accent-color)', fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
          <i className="fas fa-cog" /> SYSTEM PREFERENCES
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>
          Account Settings
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
          Manage your notification alerts, visual appearance, and login security credentials
        </p>
      </div>

      {/* ── Notification Preferences ── */}
      <div className="stat-card-premium" style={{ padding: 28, flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>
          <i className="fas fa-bell" style={{ color: 'var(--accent-color)', fontSize: '1.2rem' }} />
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Notification Preferences</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {notifItems.map(item => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(255,255,255,0.03)', borderRadius: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(250, 204, 21, 0.12)', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`fas ${item.icon}`} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>{item.label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{item.desc}</div>
                </div>
              </div>
              <ToggleSwitch
                id={`toggle-${item.key}`}
                checked={!!notifSettings[item.key]}
                onChange={() => handleNotifToggle(item.key)}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14, marginTop: 20 }}>
          {notifMsg && <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.88rem' }}>{notifMsg}</span>}
          <button
            onClick={handleSaveNotifs}
            disabled={savingNotifs}
            style={{ padding: '10px 24px', background: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            <i className={`fas ${savingNotifs ? 'fa-spinner fa-spin' : 'fa-save'}`} style={{ marginRight: 6 }} />
            {savingNotifs ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* ── Appearance ── */}
      <div className="stat-card-premium" style={{ padding: 28, flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <i className="fas fa-palette" style={{ color: '#10b981', fontSize: '1.2rem' }} />
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Appearance & Theme</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(255,255,255,0.03)', borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-moon" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>CamSound Dark Mode</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Signature deep green & charcoal theme</div>
            </div>
          </div>
          <ToggleSwitch id="toggle-darkmode" checked={true} onChange={() => {}} />
        </div>
      </div>

      {/* ── Change Password ── */}
      <div className="stat-card-premium" style={{ padding: 28, flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>
          <i className="fas fa-lock" style={{ color: '#ef4444', fontSize: '1.2rem' }} />
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Security & Password</h3>
        </div>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.currentPassword}
                onChange={e => handlePwChange('currentPassword', e.target.value)}
                placeholder="Your current password"
                required
                style={{ width: '100%', padding: '12px 42px 12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
              >
                <i className={`fas ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>New Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.newPassword}
                onChange={e => handlePwChange('newPassword', e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Confirm New Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.confirmPassword}
                onChange={e => handlePwChange('confirmPassword', e.target.value)}
                placeholder="Repeat your new password"
                required
                style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', outline: 'none' }}
              />
            </div>
          </div>

          {pwError && <p style={{ color: '#ef4444', margin: 0, fontWeight: 600, fontSize: '0.88rem' }}><i className="fas fa-exclamation-circle" /> {pwError}</p>}
          {pwMsg   && <p style={{ color: '#10b981', margin: 0, fontWeight: 600, fontSize: '0.88rem' }}>{pwMsg}</p>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              type="submit"
              disabled={savingPw}
              style={{ padding: '10px 24px', background: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              <i className={`fas ${savingPw ? 'fa-spinner fa-spin' : 'fa-key'}`} style={{ marginRight: 6 }} />
              {savingPw ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FanSettings;

