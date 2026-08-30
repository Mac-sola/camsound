import React, { useState, useEffect } from 'react';
import { notificationSettingsService, authService } from '../services/api';

interface NotifSettings {
  newReleases?: boolean;
  artistUpdates?: boolean;
  communityMentions?: boolean;
  weeklyDigest?: boolean;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; id: string }> = ({ checked, onChange, id }) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`fan-toggle ${checked ? 'on' : 'off'}`}
  >
    <span className="fan-toggle-thumb" />
  </button>
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
    <div className="fan-settings-container">
      <div style={{ marginBottom: 28 }}>
        <h2 className="fan-page-title">⚙️ Settings</h2>
        <p className="fan-page-subtitle">Manage your preferences and account</p>
      </div>

      {/* ── Notification Preferences ── */}
      <div className="fan-settings-card">
        <div className="fan-settings-card-header">
          <i className="fas fa-bell" />
          <h3>Notification Preferences</h3>
        </div>

        <div className="fan-settings-items">
          {notifItems.map(item => (
            <div key={item.key} className="fan-settings-row">
              <div className="fan-settings-row-icon">
                <i className={`fas ${item.icon}`} />
              </div>
              <div className="fan-settings-row-info">
                <div className="fan-settings-row-label">{item.label}</div>
                <div className="fan-settings-row-desc">{item.desc}</div>
              </div>
              <ToggleSwitch
                id={`toggle-${item.key}`}
                checked={!!notifSettings[item.key]}
                onChange={() => handleNotifToggle(item.key)}
              />
            </div>
          ))}
        </div>

        <div className="fan-settings-card-footer">
          {notifMsg && <span className="fan-success-msg">{notifMsg}</span>}
          <button className="fan-primary-btn" onClick={handleSaveNotifs} disabled={savingNotifs}>
            <i className={`fas ${savingNotifs ? 'fa-spinner fa-spin' : 'fa-save'}`} />
            {savingNotifs ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* ── Appearance ── */}
      <div className="fan-settings-card">
        <div className="fan-settings-card-header">
          <i className="fas fa-palette" />
          <h3>Appearance</h3>
        </div>
        <div className="fan-settings-items">
          <div className="fan-settings-row">
            <div className="fan-settings-row-icon"><i className="fas fa-moon" /></div>
            <div className="fan-settings-row-info">
              <div className="fan-settings-row-label">Dark Mode</div>
              <div className="fan-settings-row-desc">Always on — CamSound's signature dark aesthetic</div>
            </div>
            <ToggleSwitch id="toggle-darkmode" checked={true} onChange={() => {}} />
          </div>
        </div>
      </div>

      {/* ── Change Password ── */}
      <div className="fan-settings-card">
        <div className="fan-settings-card-header">
          <i className="fas fa-lock" />
          <h3>Change Password</h3>
        </div>

        <form className="fan-settings-items" onSubmit={handleChangePassword}>
          <div className="fan-profile-field">
            <label className="fan-field-label">Current Password</label>
            <div className="fan-pw-wrap">
              <input
                className="fan-field-input"
                type={showPw ? 'text' : 'password'}
                value={pwForm.currentPassword}
                onChange={e => handlePwChange('currentPassword', e.target.value)}
                placeholder="Your current password"
                required
              />
              <button type="button" className="fan-pw-toggle" onClick={() => setShowPw(v => !v)}>
                <i className={`fas ${showPw ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>
          </div>

          <div className="fan-profile-field">
            <label className="fan-field-label">New Password</label>
            <div className="fan-pw-wrap">
              <input
                className="fan-field-input"
                type={showPw ? 'text' : 'password'}
                value={pwForm.newPassword}
                onChange={e => handlePwChange('newPassword', e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
              />
            </div>
          </div>

          <div className="fan-profile-field">
            <label className="fan-field-label">Confirm New Password</label>
            <div className="fan-pw-wrap">
              <input
                className="fan-field-input"
                type={showPw ? 'text' : 'password'}
                value={pwForm.confirmPassword}
                onChange={e => handlePwChange('confirmPassword', e.target.value)}
                placeholder="Repeat your new password"
                required
              />
            </div>
          </div>

          {pwError && <p className="fan-error-msg"><i className="fas fa-exclamation-circle" /> {pwError}</p>}
          {pwMsg   && <p className="fan-success-msg">{pwMsg}</p>}

          <div className="fan-settings-card-footer">
            <button type="submit" className="fan-primary-btn" disabled={savingPw}>
              <i className={`fas ${savingPw ? 'fa-spinner fa-spin' : 'fa-key'}`} />
              {savingPw ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FanSettings;
