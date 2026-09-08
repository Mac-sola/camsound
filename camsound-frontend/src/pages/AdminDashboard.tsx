import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  statsService, adminService, artistsService, paymentsService, withdrawalsService,
  adRevenueService, adminLogsService, featuredService, subscriptionsService
} from '../services/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const ADMIN_NAV = [
  { label: 'Overview', icon: 'fa-tachometer-alt', view: 'overview' },
  { label: 'Users', icon: 'fa-users', view: 'users' },
  { label: 'Songs', icon: 'fa-music', view: 'songs' },
  { label: 'Artists', icon: 'fa-microphone', view: 'artists' },
  { label: 'Moderation Queue', icon: 'fa-shield-alt', view: 'moderation' },
  { label: 'Featured Content', icon: 'fa-star', view: 'featured' },
  { label: 'Subscriptions', icon: 'fa-credit-card', view: 'subscriptions' },
  { label: 'Subscription Plans', icon: 'fa-crown', view: 'plans' },
  { label: 'Payments', icon: 'fa-dollar-sign', view: 'payments' },
  { label: 'Ad Revenue', icon: 'fa-ad', view: 'adRevenue' },
  { label: 'Withdrawals', icon: 'fa-wallet', view: 'withdrawals' },
  { label: 'Reports', icon: 'fa-chart-bar', view: 'reports' },
  { label: 'Admin Logs', icon: 'fa-clipboard-list', view: 'logs' },
  { label: 'Settings', icon: 'fa-cog', view: 'settings' },
];

const CHART_COLORS = ['#facc15', '#10b981', '#c084fc', '#60a5fa', '#f87171', '#34d399'];
const GENRES = ['Makossa', 'Bikutsi', 'Afrobeat', 'Assiko', 'Traditional', 'Gospel', 'Bend Skin', 'Hip Hop', 'R&B'];
const STATUS_OPTS = ['active', 'pending', 'blocked'];

function exportCSV(rows: (string | number)[][], filename: string) {
  const csv = 'data:text/csv;charset=utf-8,' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = encodeURI(csv);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const Pill: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, { bg: string; color: string }> = {
    active: { bg: 'rgba(81,207,102,0.12)', color: '#51cf66' },
    approved: { bg: 'rgba(81,207,102,0.12)', color: '#51cf66' },
    verified: { bg: 'rgba(81,207,102,0.12)', color: '#51cf66' },
    pending: { bg: 'rgba(250,204,21,0.12)', color: '#facc15' },
    blocked: { bg: 'rgba(255,107,107,0.12)', color: '#ff6b6b' },
    rejected: { bg: 'rgba(255,107,107,0.12)', color: '#ff6b6b' },
    inactive: { bg: 'rgba(255,107,107,0.12)', color: '#ff6b6b' },
  };
  const c = colors[status] ?? { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' };
  return <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600, background: c.bg, color: c.color }}>{status}</span>;
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; width?: number }> = ({ title, onClose, children, width = 520 }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, width: '100%', maxWidth: width, border: '1px solid var(--border-color)', maxHeight: '90vh', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1.2rem' }}><i className="fas fa-times" /></button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{label}</label>
    {children}
  </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box', ...props.style }} />
);
const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, ...props }) => (
  <select {...props} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box', ...props.style }}>{children}</select>
);
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box', ...props.style }} />
);

const AdminDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [songs, setSongs] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [adRevenue, setAdRevenue] = useState<any[]>([]);
  const [featuredList, setFeaturedList] = useState<any[]>([]);
  const [featuredForm, setFeaturedForm] = useState<any>({ title: '', description: '', image: '', link: '' });
  const [editingFeaturedId, setEditingFeaturedId] = useState<string | null>(null);
  const [adForm, setAdForm] = useState<any>({ date: '', source: '', amount: '', description: '' });
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [planForm, setPlanForm] = useState<any>({ name: '', price: '', currency: 'XAF', period: '/month', description: '', features: '', isPopular: false });
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planMessage, setPlanMessage] = useState('');
  const [settingsForm, setSettingsForm] = useState({ platformName: 'CamSound', platformDesc: '', supportEmail: 'support@camsound.com', commissionRate: '15', maintenanceMode: 'off', emailNotifications: true, twoFactorAuth: false, autoLogout: false });
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [stats, setStats] = useState<any>({ totalUsers: 0, totalArtists: 0, totalSongs: 0, totalRevenue: 0, activeUsers: 0, artistUsers: 0, pendingUsers: 0, blockedUsers: 0, userGrowth: [], userGrowthLabels: [], genreDistribution: [], topSongs: [], topArtists: [], recentSongs: [] });
  const [loading, setLoading] = useState(false);
  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [artistSearch, setArtistSearch] = useState('');
  const [songSearch, setSongSearch] = useState('');
  // Modal states
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ firstName: '', lastName: '', email: '', phone: '', type: 'fan', password: '', confirmPassword: '', active: true });
  const [addUserMsg, setAddUserMsg] = useState('');
  const [showResetPassword, setShowResetPassword] = useState<any>(null);
  const [resetPwNew, setResetPwNew] = useState('');
  const [resetPwConfirm, setResetPwConfirm] = useState('');
  const [resetPwMsg, setResetPwMsg] = useState('');
  const [showViewUser, setShowViewUser] = useState<any>(null);
  const [showViewArtist, setShowViewArtist] = useState<any>(null);
  const [showViewSong, setShowViewSong] = useState<any>(null);
  const [showEditSong, setShowEditSong] = useState<any>(null);
  const [editSongForm, setEditSongForm] = useState({ title: '', genre: '', status: 'active' });
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [addSubForm, setAddSubForm] = useState({ planName: '', amount: '', userId: '', startDate: '', endDate: '' });
  const [addSubMsg, setAddSubMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    statsService.getGlobalStats().then(res => {
      if (res.data.success) setStats((prev: any) => ({ ...prev, ...res.data.data }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeView === 'users') fetchUsers();
    else if (activeView === 'songs' || activeView === 'moderation') fetchSongs();
    else if (activeView === 'artists') fetchArtists();
    else if (activeView === 'payments') fetchPayments();
    else if (activeView === 'adRevenue') fetchAdRevenue();
    else if (activeView === 'featured') fetchFeatured();
    else if (activeView === 'logs') fetchAdminLogs();
    else if (activeView === 'withdrawals') fetchWithdrawals();
    else if (activeView === 'reports') fetchReports();
    else if (activeView === 'settings') fetchSettings();
    else if (activeView === 'plans') fetchPlans();
    else if (activeView === 'subscriptions') { fetchSubscriptions(); fetchUsers(); }
  }, [activeView]);

  const fetchUsers = async () => { try { const r = await adminService.getUsers(); if (r.data.success) setUsers(r.data.data); } catch {} };
  const fetchSongs = async () => { try { const r = await adminService.getSongs(); if (r.data.success) setSongs(r.data.data); } catch {} };
  const fetchArtists = async () => { try { const r = await artistsService.getArtists(); if (r.data.success) setArtists(r.data.data); } catch {} };
  const fetchPayments = async () => { try { const r = await paymentsService.getPayments(); if (r.data.success) setPayments(r.data.data); } catch {} };
  const fetchWithdrawals = async () => { try { const r = await withdrawalsService.getWithdrawals(); if (r.data.success) setWithdrawals(r.data.data); } catch {} };
  const fetchAdRevenue = async () => { try { const r = await adRevenueService.getAdRevenue(); if (r.data.success) setAdRevenue(r.data.data); } catch {} };
  const fetchFeatured = async () => { try { const r = await featuredService.getFeatured(); if (r.data.success) setFeaturedList(r.data.data); } catch {} };
  const fetchAdminLogs = async () => { try { const r = await adminLogsService.getLogs(); if (r.data.success) setAdminLogs(r.data.data); } catch {} };
  const fetchReports = async () => { try { const r = await adminService.getReports(); if (r.data.success) setReports(r.data.data); } catch {} };
  const fetchPlans = async () => { try { const r = await subscriptionsService.getPlans(); if (r.data.success) setPlans(r.data.data); } catch {} };
  const fetchSubscriptions = async () => { try { const r = await subscriptionsService.getSubscriptions(); if (r.data.success) setSubscriptions(r.data.data); } catch {} };
  const fetchSettings = async () => {
    try {
      const r = await adminService.getSettings();
      if (r.data.success && r.data.data) {
        const s = r.data.data;
        setSettingsForm(f => ({
          ...f,
          platformName: s.platformName || s.platform_name || 'CamSound',
          platformDesc: s.platformDesc || s.platform_desc || '',
          supportEmail: s.supportEmail || s.support_email || 'support@camsound.com',
          commissionRate: String(s.commissionRate || s.commission_rate || '15'),
          maintenanceMode: s.maintenanceMode || s.maintenance_mode || 'off',
          emailNotifications: s.emailNotifications ?? true,
          twoFactorAuth: s.twoFactorAuth ?? false,
          autoLogout: s.autoLogout ?? false,
        }));
      }
    } catch {}
  };
  const handleSaveSettings = async () => {
    setSettingsSaving(true); setSettingsMessage('');
    try {
      const r = await adminService.updateSettings(settingsForm);
      setSettingsMessage(r.data.success ? '✅ Settings saved successfully.' : r.data.message || 'Failed.');
    } catch (e: any) { setSettingsMessage(e.response?.data?.message || 'Error saving settings.'); }
    finally { setSettingsSaving(false); setTimeout(() => setSettingsMessage(''), 4000); }
  };

  // Filtered lists
  const filteredUsers = users.filter(u =>
    !userSearch || [u.name, u.email, u.phone, u.type].some(f => String(f || '').toLowerCase().includes(userSearch.toLowerCase()))
  );
  const filteredArtists = artists.filter(a =>
    !artistSearch || [a.name, a.genre].some(f => String(f || '').toLowerCase().includes(artistSearch.toLowerCase()))
  );
  const filteredSongs = songs.filter(s =>
    !songSearch || [s.title, s.genre, s.artistId?.name].some(f => String(f || '').toLowerCase().includes(songSearch.toLowerCase()))
  );

  // User Growth chart data
  const userGrowthData = (stats.userGrowthLabels || []).map((label: string, i: number) => ({
    name: label, Users: stats.userGrowth?.[i] ?? 0
  }));

  // Genre chart data
  const genreData = (stats.genreDistribution || []).map((g: any, i: number) => ({
    name: g.label || g.genre, value: g.count, fill: CHART_COLORS[i % CHART_COLORS.length]
  }));

  // Revenue chart data (mock from stats)
  const revenueData = [
    { name: 'Subscription', value: stats.subscriptionRevenue ?? stats.totalRevenue ?? 0 },
    { name: 'Ad Revenue', value: stats.adRevenue ?? 0 },
    { name: 'Royalties', value: stats.royaltiesPaid ?? 0 },
  ];

  // Artist verification data
  const verificationData = [
    { name: 'Verified', value: stats.verifiedArtists ?? artists.filter((a: any) => a.verification === 'approved' || a.status === 'verified').length, fill: '#10b981' },
    { name: 'Pending', value: stats.pendingArtists ?? artists.filter((a: any) => a.verification === 'pending').length, fill: '#facc15' },
    { name: 'Unverified', value: stats.unverifiedArtists ?? artists.filter((a: any) => !a.verification || a.verification === 'rejected').length, fill: '#f87171' },
  ];

  const OverviewView = () => (
    <div>
      {/* Primary Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 16 }}>
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: 'fa-users', color: '#60a5fa' },
          { label: 'Total Artists', value: stats.totalArtists, icon: 'fa-microphone', color: '#10b981' },
          { label: 'Total Songs', value: stats.totalSongs, icon: 'fa-music', color: '#c084fc' },
          { label: 'Total Revenue', value: `XAF ${(stats.totalRevenue ?? 0).toLocaleString()}`, icon: 'fa-dollar-sign', color: '#facc15' },
        ].map(s => (
          <div key={s.label} className="stat-dash-card">
            <div className="stat-dash-icon" style={{ color: s.color, background: `${s.color}18`, borderColor: `${s.color}30` }}><i className={`fas ${s.icon}`} /></div>
            <div><div className="stat-dash-label">{s.label}</div><div className="stat-dash-value">{loading ? '…' : s.value?.toLocaleString?.() ?? s.value ?? 0}</div></div>
          </div>
        ))}
      </div>
      {/* Secondary Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Active Users', value: stats.activeUsers ?? 0, icon: 'fa-user-check', color: '#34d399' },
          { label: 'Artist Users', value: stats.artistUsers ?? stats.totalArtists ?? 0, icon: 'fa-star', color: '#a78bfa' },
          { label: 'Pending Users', value: stats.pendingUsers ?? 0, icon: 'fa-user-clock', color: '#fbbf24' },
          { label: 'Blocked Users', value: stats.blockedUsers ?? 0, icon: 'fa-user-times', color: '#f87171' },
        ].map(s => (
          <div key={s.label} className="stat-dash-card">
            <div className="stat-dash-icon" style={{ color: s.color, background: `${s.color}18`, borderColor: `${s.color}30` }}><i className={`fas ${s.icon}`} /></div>
            <div><div className="stat-dash-label">{s.label}</div><div className="stat-dash-value">{loading ? '…' : s.value?.toLocaleString?.() ?? 0}</div></div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="section-card">
          <div className="section-header"><h2><i className="fas fa-chart-line" style={{ color: 'var(--accent-color)', marginRight: 8 }} />User Growth</h2></div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={userGrowthData.length ? userGrowthData : [{ name: '—', Users: 0 }]}>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff' }} />
              <Line type="monotone" dataKey="Users" stroke="#facc15" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="section-card">
          <div className="section-header"><h2><i className="fas fa-tags" style={{ color: '#c084fc', marginRight: 8 }} />Genre Spread</h2></div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={genreData.length ? genreData : [{ name: 'No data', value: 1, fill: 'var(--bg-tertiary)' }]} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                {(genreData.length ? genreData : [{ fill: 'var(--bg-tertiary)' }]).map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff' }} />
              <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <div className="section-card">
          <div className="section-header"><h2><i className="fas fa-dollar-sign" style={{ color: '#10b981', marginRight: 8 }} />Revenue Breakdown</h2></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="section-card">
          <div className="section-header"><h2><i className="fas fa-check-circle" style={{ color: '#34d399', marginRight: 8 }} />Artist Verification Status</h2></div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={verificationData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                {verificationData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff' }} />
              <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="section-card">
          <div className="section-header"><h2>🔥 Top Songs</h2></div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.5)' }}>
              <th style={{ padding: '8px 6px', textAlign: 'left' }}>#</th>
              <th style={{ padding: '8px 6px', textAlign: 'left' }}>Title</th>
              <th style={{ padding: '8px 6px', textAlign: 'left' }}>Artist</th>
              <th style={{ padding: '8px 6px', textAlign: 'left' }}>Plays</th>
              <th style={{ padding: '8px 6px', textAlign: 'left' }}>Status</th>
            </tr></thead>
            <tbody>
              {(stats.topSongs || []).slice(0, 8).map((s: any, i: number) => (
                <tr key={s._id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 6px', color: 'var(--accent-color)', fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ padding: '8px 6px', fontWeight: 600 }}>{s.title}</td>
                  <td style={{ padding: '8px 6px', color: 'rgba(255,255,255,0.6)' }}>{s.artistId?.name || s.artist || '—'}</td>
                  <td style={{ padding: '8px 6px', color: '#60a5fa' }}>{(s.plays || 0).toLocaleString()}</td>
                  <td style={{ padding: '8px 6px' }}><Pill status={s.moderationStatus || s.status || 'active'} /></td>
                </tr>
              ))}
              {!stats.topSongs?.length && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No data yet</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="section-card">
          <div className="section-header"><h2>⭐ Top Artists</h2></div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.5)' }}>
              <th style={{ padding: '8px 6px', textAlign: 'left' }}>#</th>
              <th style={{ padding: '8px 6px', textAlign: 'left' }}>Artist</th>
              <th style={{ padding: '8px 6px', textAlign: 'left' }}>Genre</th>
              <th style={{ padding: '8px 6px', textAlign: 'left' }}>Followers</th>
              <th style={{ padding: '8px 6px', textAlign: 'left' }}>Status</th>
            </tr></thead>
            <tbody>
              {(stats.topArtists || []).slice(0, 8).map((a: any, i: number) => (
                <tr key={a._id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 6px', color: 'var(--accent-color)', fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ padding: '8px 6px', fontWeight: 600 }}>{a.name}</td>
                  <td style={{ padding: '8px 6px', color: 'rgba(255,255,255,0.6)' }}>{a.genre || '—'}</td>
                  <td style={{ padding: '8px 6px', color: '#10b981' }}>{(a.followers || 0).toLocaleString()}</td>
                  <td style={{ padding: '8px 6px' }}><Pill status={a.verification === 'approved' ? 'verified' : a.verification || 'pending'} /></td>
                </tr>
              ))}
              {!stats.topArtists?.length && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No data yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {/* Recent Songs */}
      <div className="section-card">
        <div className="section-header"><h2>🕐 Recent Songs</h2><button className="view-all-btn" onClick={() => setActiveView('songs')}>View All <i className="fas fa-arrow-right" /></button></div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.5)' }}>
            <th style={{ padding: '8px 6px', textAlign: 'left' }}>#</th>
            <th style={{ padding: '8px 6px', textAlign: 'left' }}>Title</th>
            <th style={{ padding: '8px 6px', textAlign: 'left' }}>Artist</th>
            <th style={{ padding: '8px 6px', textAlign: 'left' }}>Genre</th>
            <th style={{ padding: '8px 6px', textAlign: 'left' }}>Plays</th>
            <th style={{ padding: '8px 6px', textAlign: 'left' }}>Date</th>
          </tr></thead>
          <tbody>
            {(stats.recentSongs || stats.topSongs || []).slice(0, 6).map((s: any, i: number) => (
              <tr key={s._id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px 6px', color: 'rgba(255,255,255,0.4)' }}>{i + 1}</td>
                <td style={{ padding: '8px 6px', fontWeight: 600 }}>{s.title}</td>
                <td style={{ padding: '8px 6px', color: 'rgba(255,255,255,0.6)' }}>{s.artistId?.name || s.artist || '—'}</td>
                <td style={{ padding: '8px 6px', color: 'rgba(255,255,255,0.6)' }}>{s.genre || '—'}</td>
                <td style={{ padding: '8px 6px', color: '#60a5fa' }}>{(s.plays || 0).toLocaleString()}</td>
                <td style={{ padding: '8px 6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
            {!(stats.recentSongs || stats.topSongs)?.length && <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No data yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <Layout navItems={ADMIN_NAV} activeView={activeView} onNavClick={setActiveView} topbarTitle="Admin Dashboard Overview">
      <div key={activeView} className="view-fade-in">

        {/* OVERVIEW */}
        {activeView === 'overview' && <OverviewView />}

        {/* USERS */}
        {activeView === 'users' && (
          <div className="section-card">
            <div className="section-header">
              <h2>User Management</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-camsound-yellow" style={{ fontSize: '0.82rem', padding: '6px 14px' }} onClick={() => { setShowAddUser(true); setAddUserMsg(''); }}>
                  <i className="fas fa-user-plus" style={{ marginRight: 6 }} />Add User
                </button>
                <button className="btn-camsound-outline" style={{ fontSize: '0.82rem', padding: '6px 14px' }} onClick={() => exportCSV(
                  [['Name', 'Email', 'Phone', 'Type', 'Status', 'Joined'], ...filteredUsers.map(u => [u.name, u.email, u.phone || '', u.type, u.status, u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''])],
                  'users.csv'
                )}>
                  <i className="fas fa-download" style={{ marginRight: 6 }} />Export
                </button>
              </div>
            </div>
            <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users by name, email, role..." style={{ width: '100%', padding: '9px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', marginBottom: 16, fontSize: '0.9rem', boxSizing: 'border-box' }} />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.5)', textAlign: 'left' }}>
                  {['Name', 'Email', 'Phone', 'Type', 'Status', 'Joined', 'Actions'].map(h => <th key={h} style={{ padding: '10px 8px', fontWeight: 600 }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{u.name}</td>
                      <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.6)' }}>{u.email}</td>
                      <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.5)' }}>{u.phone || '—'}</td>
                      <td style={{ padding: '10px 8px' }}><Pill status={u.type} /></td>
                      <td style={{ padding: '10px 8px' }}><Pill status={u.status} /></td>
                      <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button className="btn-camsound-outline" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => setShowViewUser(u)}>View</button>
                          <button className="btn-camsound-outline" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={async () => { await adminService.updateUserStatus(u._id, u.status === 'active' ? 'blocked' : 'active'); fetchUsers(); }}>{u.status === 'active' ? 'Block' : 'Unblock'}</button>
                          <button className="btn-camsound-outline" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => { setShowResetPassword(u); setResetPwNew(''); setResetPwConfirm(''); setResetPwMsg(''); }}>Reset Pw</button>
                          <button className="btn-camsound-outline" style={{ padding: '3px 8px', fontSize: '0.75rem', borderColor: 'rgba(239,68,68,0.4)', color: '#f87171' }} onClick={async () => { if (confirm('Delete user?')) { await adminService.deleteUser(u._id); fetchUsers(); } }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredUsers.length && <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No users found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SONGS */}
        {activeView === 'songs' && (
          <div className="section-card">
            <div className="section-header">
              <h2>Song Management</h2>
              <button className="btn-camsound-outline" style={{ fontSize: '0.82rem', padding: '6px 14px' }} onClick={() => exportCSV(
                [['Title', 'Artist', 'Genre', 'Plays', 'Duration', 'Status', 'Date'], ...filteredSongs.map(s => [s.title, s.artistId?.name || '', s.genre || '', s.plays || 0, s.duration || '', s.moderationStatus || s.status || '', s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''])],
                'songs.csv'
              )}>
                <i className="fas fa-download" style={{ marginRight: 6 }} />Export
              </button>
            </div>
            <input value={songSearch} onChange={e => setSongSearch(e.target.value)} placeholder="Search songs by title, artist, genre..." style={{ width: '100%', padding: '9px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', marginBottom: 16, fontSize: '0.9rem', boxSizing: 'border-box' }} />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.5)', textAlign: 'left' }}>
                  {['Title', 'Artist', 'Genre', 'Plays', 'Duration', 'Date', 'Status', 'Actions'].map(h => <th key={h} style={{ padding: '10px 8px', fontWeight: 600 }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredSongs.map(s => (
                    <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{s.title}</td>
                      <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.6)' }}>{s.artistId?.name || '—'}</td>
                      <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.6)' }}>{s.genre || '—'}</td>
                      <td style={{ padding: '10px 8px', color: '#60a5fa' }}>{(s.plays || 0).toLocaleString()}</td>
                      <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.5)' }}>{s.duration || '—'}</td>
                      <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '10px 8px' }}><Pill status={s.moderationStatus || s.status || 'active'} /></td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-camsound-outline" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => setShowViewSong(s)}>View</button>
                          <button className="btn-camsound-outline" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => { setShowEditSong(s); setEditSongForm({ title: s.title, genre: s.genre || 'Afrobeat', status: s.moderationStatus || s.status || 'active' }); }}>Edit</button>
                          <button className="btn-camsound-outline" style={{ padding: '3px 8px', fontSize: '0.75rem', borderColor: 'rgba(239,68,68,0.4)', color: '#f87171' }} onClick={async () => { if (confirm(`Delete "${s.title}"?`)) { await adminService.deleteSongAdmin(s._id); fetchSongs(); } }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredSongs.length && <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No songs found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SONGS - MODERATION */}
        {activeView === 'moderation' && (
          <div className="section-card">
            <div className="section-header"><h2><i className="fas fa-shield-alt" style={{ color: '#f59e0b', marginRight: 8 }} />Moderation Queue</h2></div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.5)', textAlign: 'left' }}>
                {['Title', 'Artist', 'Genre', 'Status', 'Actions'].map(h => <th key={h} style={{ padding: '10px 8px', fontWeight: 600 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {songs.filter(s => s.moderationStatus === 'pending').map(s => (
                  <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 600 }}>{s.title}</td>
                    <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.6)' }}>{s.artistId?.name || '—'}</td>
                    <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.6)' }}>{s.genre}</td>
                    <td style={{ padding: '10px 8px' }}><Pill status="pending" /></td>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-camsound-outline" style={{ padding: '4px 12px', fontSize: '0.8rem', borderColor: '#51cf66', color: '#51cf66' }} onClick={async () => { await adminService.moderateSong(s._id, { moderationStatus: 'approved', status: 'active' }); fetchSongs(); }}>Approve</button>
                        <button className="btn-camsound-outline" style={{ padding: '4px 12px', fontSize: '0.8rem', borderColor: '#f87171', color: '#f87171' }} onClick={async () => { await adminService.moderateSong(s._id, { moderationStatus: 'rejected', status: 'inactive' }); fetchSongs(); }}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!songs.filter(s => s.moderationStatus === 'pending').length && (
                  <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                    <i className="fas fa-check-circle" style={{ fontSize: '2rem', color: '#30d158', display: 'block', marginBottom: 8 }} />
                    No songs pending moderation
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ARTISTS */}
        {activeView === 'artists' && (
          <div className="section-card">
            <div className="section-header">
              <h2>Artist Management</h2>
              <button className="btn-camsound-outline" style={{ fontSize: '0.82rem', padding: '6px 14px' }} onClick={() => exportCSV(
                [['Name', 'Genre', 'Followers', 'Status', 'Verification'], ...filteredArtists.map(a => [a.name, a.genre || '', a.followers || 0, a.status || '', a.verification || ''])],
                'artists.csv'
              )}>
                <i className="fas fa-download" style={{ marginRight: 6 }} />Export
              </button>
            </div>
            <input value={artistSearch} onChange={e => setArtistSearch(e.target.value)} placeholder="Search artists by name or genre..." style={{ width: '100%', padding: '9px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', marginBottom: 16, fontSize: '0.9rem', boxSizing: 'border-box' }} />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.5)', textAlign: 'left' }}>
                  {['Artist', 'Genre', 'Followers', 'Songs', 'Status', 'Verification', 'Actions'].map(h => <th key={h} style={{ padding: '10px 8px', fontWeight: 600 }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredArtists.map(a => {
                    const isVerified = a.verification === 'approved' || a.status === 'verified';
                    return (
                      <tr key={a._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, flexShrink: 0 }}>
                              {a.name?.charAt(0) || 'A'}
                            </div>
                            <span style={{ fontWeight: 600 }}>{a.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.6)' }}>{a.genre || '—'}</td>
                        <td style={{ padding: '10px 8px', color: '#10b981' }}>{(a.followers || 0).toLocaleString()}</td>
                        <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.6)' }}>{a.totalSongs || a.songCount || '—'}</td>
                        <td style={{ padding: '10px 8px' }}><Pill status={a.status || 'active'} /></td>
                        <td style={{ padding: '10px 8px' }}><Pill status={a.verification === 'approved' ? 'verified' : a.verification || 'pending'} /></td>
                        <td style={{ padding: '10px 8px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-camsound-outline" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => setShowViewArtist(a)}>View</button>
                            {!isVerified ? (
                              <button className="btn-camsound-outline" style={{ padding: '3px 8px', fontSize: '0.75rem', borderColor: '#51cf66', color: '#51cf66' }} onClick={async () => { await artistsService.updateArtist(a._id, { verification: 'approved', status: 'verified' }); fetchArtists(); }}>Verify</button>
                            ) : (
                              <button className="btn-camsound-outline" style={{ padding: '3px 8px', fontSize: '0.75rem', borderColor: '#f87171', color: '#f87171' }} onClick={async () => { await artistsService.updateArtist(a._id, { verification: 'rejected', status: 'pending' }); fetchArtists(); }}>Revoke</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!filteredArtists.length && <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No artists found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FEATURED */}
        {activeView === 'featured' && (
          <div className="section-card">
            <div className="section-header"><h2>Featured Content</h2></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10, marginBottom: 16, alignItems: 'end' }}>
              <div><label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Title</label><Input placeholder="Title" value={featuredForm.title} onChange={e => setFeaturedForm((p: any) => ({ ...p, title: e.target.value }))} /></div>
              <div><label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Image URL</label><Input placeholder="https://..." value={featuredForm.image} onChange={e => setFeaturedForm((p: any) => ({ ...p, image: e.target.value }))} /></div>
              <div><label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Link</label><Input placeholder="https://..." value={featuredForm.link} onChange={e => setFeaturedForm((p: any) => ({ ...p, link: e.target.value }))} /></div>
              <div><label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Description</label><Input placeholder="Short description" value={featuredForm.description} onChange={e => setFeaturedForm((p: any) => ({ ...p, description: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-camsound-yellow" onClick={async () => {
                  if (editingFeaturedId) { await featuredService.updateFeatured(editingFeaturedId, featuredForm); setEditingFeaturedId(null); }
                  else { await featuredService.createFeatured(featuredForm); }
                  setFeaturedForm({ title: '', description: '', image: '', link: '' }); fetchFeatured();
                }}>{editingFeaturedId ? 'Update' : 'Create'}</button>
                {editingFeaturedId && <button className="btn-camsound-outline" onClick={() => { setEditingFeaturedId(null); setFeaturedForm({ title: '', description: '', image: '', link: '' }); }}>Cancel</button>}
              </div>
            </div>
            {featuredList.length === 0 ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>No featured items yet.</div> : (
              <div style={{ display: 'grid', gap: 10 }}>
                {featuredList.map(f => (
                  <div key={f._id} style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      {f.image && <img src={f.image} style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 6 }} alt="" />}
                      <div><div style={{ fontWeight: 700 }}>{f.title}</div><div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{f.description}</div></div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-camsound-outline" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => { setEditingFeaturedId(f._id); setFeaturedForm({ title: f.title || '', description: f.description || '', image: f.image || '', link: f.link || '' }); }}>Edit</button>
                      <button className="btn-camsound-outline" style={{ padding: '4px 10px', fontSize: '0.8rem', borderColor: '#f87171', color: '#f87171' }} onClick={async () => { if (confirm('Delete?')) { await featuredService.deleteFeatured(f._id); fetchFeatured(); } }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBSCRIPTIONS */}
        {activeView === 'subscriptions' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="section-card">
                <div className="section-header">
                  <h2>Subscription Plans</h2>
                  <button className="btn-camsound-yellow" style={{ fontSize: '0.82rem', padding: '6px 14px' }} onClick={() => { setShowAddSubscription(true); setAddSubMsg(''); }}>
                    <i className="fas fa-plus" style={{ marginRight: 6 }} />Add Subscription
                  </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.5)', textAlign: 'left' }}>
                    {['Plan', 'User', 'Amount', 'Status', 'Start', 'End'].map(h => <th key={h} style={{ padding: '8px 6px', fontWeight: 600 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {subscriptions.map(s => (
                      <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '8px 6px', fontWeight: 600 }}>{s.planName || s.plan || '—'}</td>
                        <td style={{ padding: '8px 6px', color: 'rgba(255,255,255,0.6)' }}>{s.userId?.name || s.userName || '—'}</td>
                        <td style={{ padding: '8px 6px', color: 'var(--accent-color)', fontWeight: 600 }}>XAF {s.amount?.toLocaleString()}</td>
                        <td style={{ padding: '8px 6px' }}><Pill status={s.status} /></td>
                        <td style={{ padding: '8px 6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>{s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'}</td>
                        <td style={{ padding: '8px 6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>{s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                    {!subscriptions.length && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No subscriptions yet</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="section-card">
                <div className="section-header"><h2>Recent Subscriptions</h2></div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.5)', textAlign: 'left' }}>
                    {['Plan', 'User', 'Amount', 'Start', 'Status'].map(h => <th key={h} style={{ padding: '8px 6px', fontWeight: 600 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {subscriptions.slice(0, 10).map(s => (
                      <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '8px 6px', fontWeight: 600 }}>{s.planName || s.plan || '—'}</td>
                        <td style={{ padding: '8px 6px', color: 'rgba(255,255,255,0.6)' }}>{s.userId?.name || '—'}</td>
                        <td style={{ padding: '8px 6px', color: 'var(--accent-color)' }}>XAF {s.amount?.toLocaleString()}</td>
                        <td style={{ padding: '8px 6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>{s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'}</td>
                        <td style={{ padding: '8px 6px' }}><Pill status={s.status} /></td>
                      </tr>
                    ))}
                    {!subscriptions.length && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No data</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENTS & WITHDRAWALS */}
        {(activeView === 'payments' || activeView === 'withdrawals') && (
          <div className="section-card">
            <div className="section-header"><h2>{activeView === 'payments' ? 'Payments' : 'Withdrawals'}</h2></div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'rgba(255,255,255,0.5)' }}>
                <th style={{ padding: '10px 8px' }}>Date</th><th style={{ padding: '10px 8px' }}>Amount</th>{activeView === 'withdrawals' && <th style={{ padding: '10px 8px' }}>MoMo</th>}<th style={{ padding: '10px 8px' }}>Status</th><th style={{ padding: '10px 8px' }}>Actions</th>
              </tr></thead>
              <tbody>
                {(activeView === 'payments' ? payments : withdrawals).map((item: any) => (
                  <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 8px' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 600, color: 'var(--accent-color)' }}>XAF {item.amount?.toLocaleString()}</td>
                    {activeView === 'withdrawals' && <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.6)' }}>{item.momoNumber || '—'}</td>}
                    <td style={{ padding: '10px 8px' }}><Pill status={item.status} /></td>
                    <td style={{ padding: '10px 8px' }}>
                      {item.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-camsound-outline" style={{ padding: '3px 10px', fontSize: '0.78rem', borderColor: '#51cf66', color: '#51cf66' }} onClick={async () => { activeView === 'payments' ? await paymentsService.updatePaymentStatus(item._id, { status: 'completed' }) : await withdrawalsService.updateWithdrawal(item._id, { status: 'completed' }); activeView === 'payments' ? fetchPayments() : fetchWithdrawals(); }}>Approve</button>
                          <button className="btn-camsound-outline" style={{ padding: '3px 10px', fontSize: '0.78rem', borderColor: '#f87171', color: '#f87171' }} onClick={async () => { activeView === 'payments' ? await paymentsService.updatePaymentStatus(item._id, { status: 'failed' }) : await withdrawalsService.updateWithdrawal(item._id, { status: 'rejected' }); activeView === 'payments' ? fetchPayments() : fetchWithdrawals(); }}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {!(activeView === 'payments' ? payments : withdrawals).length && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No records</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* AD REVENUE */}
        {activeView === 'adRevenue' && (
          <div className="section-card">
            <div className="section-header"><h2>Ad Revenue</h2></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10, marginBottom: 16, alignItems: 'end' }}>
              <div><label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Date</label><Input type="date" value={adForm.date} onChange={e => setAdForm((p: any) => ({ ...p, date: e.target.value }))} /></div>
              <div><label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Source</label><Input placeholder="Google, Meta..." value={adForm.source} onChange={e => setAdForm((p: any) => ({ ...p, source: e.target.value }))} /></div>
              <div><label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Amount (XAF)</label><Input type="number" placeholder="Amount" value={adForm.amount} onChange={e => setAdForm((p: any) => ({ ...p, amount: e.target.value }))} /></div>
              <div><label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Description</label><Input placeholder="Description" value={adForm.description} onChange={e => setAdForm((p: any) => ({ ...p, description: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-camsound-yellow" onClick={async () => {
                  if (editingAdId) { await adRevenueService.updateAdRevenue(editingAdId, adForm); setEditingAdId(null); }
                  else { await adRevenueService.createAdRevenue(adForm); }
                  setAdForm({ date: '', source: '', amount: '', description: '' }); fetchAdRevenue();
                }}>{editingAdId ? 'Update' : 'Create'}</button>
                {editingAdId && <button className="btn-camsound-outline" onClick={() => { setEditingAdId(null); setAdForm({ date: '', source: '', amount: '', description: '' }); }}>Cancel</button>}
              </div>
            </div>
            {adRevenue.length === 0 ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>No ad revenue entries yet.</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.5)', textAlign: 'left' }}>
                  {['Date', 'Source', 'Amount', 'Description', 'Actions'].map(h => <th key={h} style={{ padding: '10px 8px', fontWeight: 600 }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {adRevenue.map((a: any) => (
                    <tr key={a._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 8px' }}>{new Date(a.date).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{a.source}</td>
                      <td style={{ padding: '10px 8px', color: 'var(--accent-color)', fontWeight: 600 }}>XAF {Number(a.amount).toLocaleString()}</td>
                      <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.6)' }}>{a.description || '—'}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-camsound-outline" style={{ padding: '3px 10px', fontSize: '0.78rem' }} onClick={() => { setEditingAdId(a._id); setAdForm({ date: a.date ? new Date(a.date).toISOString().slice(0, 10) : '', source: a.source || '', amount: a.amount || '', description: a.description || '' }); }}>Edit</button>
                          <button className="btn-camsound-outline" style={{ padding: '3px 10px', fontSize: '0.78rem', borderColor: '#f87171', color: '#f87171' }} onClick={async () => { if (confirm('Delete?')) { await adRevenueService.deleteAdRevenue(a._id); fetchAdRevenue(); } }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ADMIN LOGS */}
        {activeView === 'logs' && (
          <div className="section-card">
            <div className="section-header"><h2>Admin Activity Logs</h2></div>
            {adminLogs.length === 0 ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>No admin logs yet.</div> : (
              <div style={{ display: 'grid', gap: 8 }}>
                {adminLogs.map(l => (
                  <div key={l._id} style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div><div style={{ fontWeight: 600 }}>{l.action}</div><div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{l.details}</div></div>
                    <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                      <div>{l.adminId?.name || 'Admin'}</div>
                      <div>{new Date(l.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REPORTS */}
        {activeView === 'reports' && (
          <div className="section-card">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Reports &amp; Violations</h2>
              <button className="btn-camsound-yellow" style={{ fontSize: '0.82rem', padding: '6px 14px' }} onClick={() => exportCSV(
                [['Type', 'Item ID', 'Reason', 'Status', 'Date'], ...reports.map((r: any) => [r.type || '', r.itemId || '', r.reason || '', r.status || 'pending', r.createdAt ? new Date(r.createdAt).toISOString() : ''])],
                `reports_${new Date().toISOString().slice(0, 10)}.csv`
              )}>
                <i className="fas fa-file-csv" style={{ marginRight: 6 }} />Export CSV
              </button>
            </div>
            {/* Revenue Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Users', value: stats.totalUsers ?? 0, icon: 'fa-users' },
                { label: 'Active Subscriptions', value: stats.activeSubscriptions ?? 0, icon: 'fa-crown' },
                { label: 'Subscription Revenue', value: `XAF ${(stats.subscriptionRevenue ?? 0).toLocaleString()}`, icon: 'fa-credit-card' },
                { label: 'Ad Revenue', value: `XAF ${(stats.adRevenue ?? 0).toLocaleString()}`, icon: 'fa-ad' },
              ].map(s => (
                <div key={s.label} style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-color)', fontSize: '1.1rem' }}>{loading ? '…' : s.value}</div>
                </div>
              ))}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'rgba(255,255,255,0.5)', textAlign: 'left' }}>
                {['Type', 'Reported Item', 'Reason', 'Status', 'Date', 'Actions'].map(h => <th key={h} style={{ padding: '10px 8px', fontWeight: 600 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No reports yet</td></tr>
                ) : reports.map((r: any) => (
                  <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 8px' }}>{r.type}</td>
                    <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>{r.itemId}</td>
                    <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.6)' }}>{r.reason}</td>
                    <td style={{ padding: '10px 8px' }}><Pill status={r.status || 'pending'} /></td>
                    <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-camsound-outline" style={{ padding: '3px 10px', fontSize: '0.78rem', borderColor: '#51cf66', color: '#51cf66' }} onClick={async () => { await adminService.updateReport(r._id, 'resolved'); fetchReports(); }}>Resolve</button>
                        <button className="btn-camsound-outline" style={{ padding: '3px 10px', fontSize: '0.78rem', borderColor: '#f87171', color: '#f87171' }} onClick={async () => { await adminService.updateReport(r._id, 'rejected'); fetchReports(); }}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SETTINGS */}
        {activeView === 'settings' && (
          <div className="section-card">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Platform Settings</h2>
              <button className="btn-camsound-yellow" style={{ padding: '8px 20px' }} onClick={handleSaveSettings} disabled={settingsSaving}>{settingsSaving ? 'Saving…' : 'Save Settings'}</button>
            </div>
            {settingsMessage && <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 8, background: settingsMessage.startsWith('✅') ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: settingsMessage.startsWith('✅') ? '#4ade80' : '#f87171', fontSize: '0.9rem' }}>{settingsMessage}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
              <Field label="Platform Name"><Input value={settingsForm.platformName} onChange={e => setSettingsForm(f => ({ ...f, platformName: e.target.value }))} /></Field>
              <Field label="Support Email"><Input type="email" value={settingsForm.supportEmail} onChange={e => setSettingsForm(f => ({ ...f, supportEmail: e.target.value }))} /></Field>
              <Field label="Commission Rate (%)"><Input type="number" value={settingsForm.commissionRate} onChange={e => setSettingsForm(f => ({ ...f, commissionRate: e.target.value }))} /></Field>
              <Field label="Maintenance Mode">
                <Select value={settingsForm.maintenanceMode} onChange={e => setSettingsForm(f => ({ ...f, maintenanceMode: e.target.value }))}>
                  <option value="off">Off</option><option value="on">On</option>
                </Select>
              </Field>
              <Field label="Platform Description" ><Textarea rows={3} value={settingsForm.platformDesc} onChange={e => setSettingsForm(f => ({ ...f, platformDesc: e.target.value }))} style={{ gridColumn: '1/-1' }} /></Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 20, padding: 20, background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <h4 style={{ gridColumn: '1/-1', margin: '0 0 8px', color: '#fff' }}>Security &amp; Notifications</h4>
              {[
                { key: 'emailNotifications', label: 'Email Notifications' },
                { key: 'twoFactorAuth', label: 'Two-Factor Auth' },
                { key: 'autoLogout', label: 'Auto Logout' },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem', color: '#fff' }}>
                  <input type="checkbox" checked={(settingsForm as any)[key]} onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.checked }))} style={{ width: 16, height: 16 }} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* SUBSCRIPTION PLANS */}
        {activeView === 'plans' && (
          <div className="section-card">
            <div className="section-header"><h2>Subscription Plans</h2></div>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 24, marginTop: 8, border: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: 16, color: '#fff' }}>{editingPlanId ? 'Edit Plan' : 'Add New Plan'}</h4>
              {planMessage && <div style={{ marginBottom: 12, padding: '8px 14px', borderRadius: 8, background: planMessage.startsWith('✅') ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: planMessage.startsWith('✅') ? '#4ade80' : '#f87171', fontSize: '0.88rem' }}>{planMessage}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <Field label="Plan Name"><Input placeholder="Artist Pro" value={planForm.name} onChange={e => setPlanForm((f: any) => ({ ...f, name: e.target.value }))} /></Field>
                <Field label="Price (XAF)"><Input type="number" placeholder="5000" value={planForm.price} onChange={e => setPlanForm((f: any) => ({ ...f, price: e.target.value }))} /></Field>
                <Field label="Billing Period">
                  <Select value={planForm.period} onChange={e => setPlanForm((f: any) => ({ ...f, period: e.target.value }))}>
                    <option value="/month">Monthly</option><option value="/year">Yearly</option><option value="/forever">One-time</option>
                  </Select>
                </Field>
                <div style={{ gridColumn: '1/-1' }}><Field label="Features (comma-separated)"><Input placeholder="Unlimited uploads, Analytics, MoMo Payouts" value={planForm.features} onChange={e => setPlanForm((f: any) => ({ ...f, features: e.target.value }))} /></Field></div>
                <Field label="Description"><Input placeholder="Short description" value={planForm.description} onChange={e => setPlanForm((f: any) => ({ ...f, description: e.target.value }))} /></Field>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 22 }}>
                  <input type="checkbox" id="planPop" checked={planForm.isPopular} onChange={e => setPlanForm((f: any) => ({ ...f, isPopular: e.target.checked }))} style={{ width: 16, height: 16 }} />
                  <label htmlFor="planPop" style={{ color: '#fff', fontSize: '0.9rem', cursor: 'pointer' }}>Mark as Popular</label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button className="btn-camsound-yellow" style={{ padding: '9px 24px' }} onClick={async () => {
                  setPlanMessage('');
                  try {
                    const payload = { ...planForm, price: Number(planForm.price), features: planForm.features.split(',').map((f: string) => f.trim()).filter(Boolean) };
                    if (editingPlanId) { await subscriptionsService.updatePlan(editingPlanId, payload); setPlanMessage('✅ Plan updated.'); }
                    else { await subscriptionsService.createPlan(payload); setPlanMessage('✅ Plan created.'); }
                    setPlanForm({ name: '', price: '', currency: 'XAF', period: '/month', description: '', features: '', isPopular: false });
                    setEditingPlanId(null); await fetchPlans();
                  } catch (e: any) { setPlanMessage(e.response?.data?.message || 'Failed.'); }
                  setTimeout(() => setPlanMessage(''), 4000);
                }}>{editingPlanId ? 'Update Plan' : 'Add Plan'}</button>
                {editingPlanId && <button className="btn-camsound-outline" style={{ padding: '9px 24px' }} onClick={() => { setEditingPlanId(null); setPlanForm({ name: '', price: '', currency: 'XAF', period: '/month', description: '', features: '', isPopular: false }); }}>Cancel</button>}
              </div>
            </div>
            <div style={{ overflowX: 'auto', marginTop: 24 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Plan Name', 'Price', 'Period', 'Features', 'Popular', 'Actions'].map(h => <th key={h} style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.5)', textAlign: 'left', fontWeight: 600 }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {plans.length === 0 ? <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No plans yet. Add one above.</td></tr>
                  : plans.map((p: any) => (
                    <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 8px' }}><span style={{ fontWeight: 600 }}>{p.name}</span>{p.isPopular && <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', background: 'rgba(250,204,21,0.15)', color: 'var(--accent-color)' }}>POPULAR</span>}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--accent-color)', fontWeight: 700 }}>XAF {Number(p.price).toLocaleString()}</td>
                      <td style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.6)' }}>{p.period || '/month'}</td>
                      <td style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>{Array.isArray(p.features) ? p.features.slice(0, 2).join(', ') + (p.features.length > 2 ? '…' : '') : p.features}</td>
                      <td style={{ padding: '12px 8px' }}>{p.isPopular ? <i className="fas fa-check" style={{ color: '#4ade80' }} /> : <i className="fas fa-times" style={{ color: 'rgba(255,255,255,0.3)' }} />}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn-camsound-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => { setEditingPlanId(p._id); setPlanForm({ name: p.name, price: String(p.price), currency: p.currency || 'XAF', period: p.period || '/month', description: p.description || '', features: Array.isArray(p.features) ? p.features.join(', ') : p.features || '', isPopular: p.isPopular || false }); }}>Edit</button>
                          <button style={{ padding: '4px 12px', fontSize: '0.8rem', background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, cursor: 'pointer' }} onClick={async () => { if (!confirm(`Delete plan "${p.name}"?`)) return; await subscriptionsService.deletePlan(p._id); fetchPlans(); }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* --- MODALS --- */}

      {/* Add User Modal */}
      {showAddUser && (
        <Modal title="Add New User" onClose={() => setShowAddUser(false)} width={560}>
          {addUserMsg && <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: addUserMsg.startsWith('✅') ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: addUserMsg.startsWith('✅') ? '#4ade80' : '#f87171' }}>{addUserMsg}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="First Name"><Input value={addUserForm.firstName} onChange={e => setAddUserForm(f => ({ ...f, firstName: e.target.value }))} /></Field>
            <Field label="Last Name"><Input value={addUserForm.lastName} onChange={e => setAddUserForm(f => ({ ...f, lastName: e.target.value }))} /></Field>
            <Field label="Email"><Input type="email" value={addUserForm.email} onChange={e => setAddUserForm(f => ({ ...f, email: e.target.value }))} /></Field>
            <Field label="Phone"><Input type="tel" value={addUserForm.phone} onChange={e => setAddUserForm(f => ({ ...f, phone: e.target.value }))} /></Field>
            <Field label="Role"><Select value={addUserForm.type} onChange={e => setAddUserForm(f => ({ ...f, type: e.target.value }))}><option value="fan">Fan</option><option value="artist">Artist</option></Select></Field>
            <Field label="Password"><Input type="password" value={addUserForm.password} onChange={e => setAddUserForm(f => ({ ...f, password: e.target.value }))} /></Field>
            <Field label="Confirm Password"><Input type="password" value={addUserForm.confirmPassword} onChange={e => setAddUserForm(f => ({ ...f, confirmPassword: e.target.value }))} /></Field>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 22 }}>
              <input type="checkbox" id="userActiveChk" checked={addUserForm.active} onChange={e => setAddUserForm(f => ({ ...f, active: e.target.checked }))} style={{ width: 16, height: 16 }} />
              <label htmlFor="userActiveChk" style={{ color: '#fff', cursor: 'pointer' }}>Activate immediately</label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button className="btn-camsound-outline" style={{ flex: 1 }} onClick={() => setShowAddUser(false)}>Cancel</button>
            <button className="btn-camsound-yellow" style={{ flex: 1 }} onClick={async () => {
              setAddUserMsg('');
              if (!addUserForm.firstName || !addUserForm.email || !addUserForm.password) { setAddUserMsg('❌ Please fill all required fields.'); return; }
              if (addUserForm.password !== addUserForm.confirmPassword) { setAddUserMsg('❌ Passwords do not match.'); return; }
              try {
                const r = await adminService.createUser({ name: `${addUserForm.firstName} ${addUserForm.lastName}`.trim(), email: addUserForm.email, phone: addUserForm.phone, type: addUserForm.type, password: addUserForm.password, status: addUserForm.active ? 'active' : 'pending' });
                if (r.data.success) { setAddUserMsg('✅ User created successfully.'); fetchUsers(); setTimeout(() => setShowAddUser(false), 1500); }
                else setAddUserMsg('❌ ' + (r.data.message || 'Failed to create user.'));
              } catch (e: any) { setAddUserMsg('❌ ' + (e.response?.data?.message || 'Error creating user.')); }
            }}>Create User</button>
          </div>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {showResetPassword && (
        <Modal title={`Reset Password — ${showResetPassword.name}`} onClose={() => setShowResetPassword(null)}>
          {resetPwMsg && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: resetPwMsg.startsWith('✅') ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: resetPwMsg.startsWith('✅') ? '#4ade80' : '#f87171' }}>{resetPwMsg}</div>}
          <Field label="New Password"><Input type="password" value={resetPwNew} onChange={e => setResetPwNew(e.target.value)} placeholder="Min 8 characters" /></Field>
          <Field label="Confirm Password"><Input type="password" value={resetPwConfirm} onChange={e => setResetPwConfirm(e.target.value)} /></Field>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button className="btn-camsound-outline" style={{ flex: 1 }} onClick={() => setShowResetPassword(null)}>Cancel</button>
            <button className="btn-camsound-yellow" style={{ flex: 1 }} onClick={async () => {
              if (resetPwNew.length < 8) { setResetPwMsg('❌ Password must be at least 8 characters.'); return; }
              if (resetPwNew !== resetPwConfirm) { setResetPwMsg('❌ Passwords do not match.'); return; }
              try {
                const r = await adminService.resetUserPassword(showResetPassword._id, resetPwNew);
                if (r.data.success) { setResetPwMsg('✅ Password reset successfully.'); setTimeout(() => setShowResetPassword(null), 1500); }
                else setResetPwMsg('❌ ' + (r.data.message || 'Failed.'));
              } catch (e: any) { setResetPwMsg('❌ ' + (e.response?.data?.message || 'Error.')); }
            }}>Reset Password</button>
          </div>
        </Modal>
      )}

      {/* View User Modal */}
      {showViewUser && (
        <Modal title="User Details" onClose={() => setShowViewUser(null)}>
          {[['Name', showViewUser.name], ['Email', showViewUser.email], ['Phone', showViewUser.phone || '—'], ['Role', showViewUser.type], ['Status', showViewUser.status], ['Joined', showViewUser.createdAt ? new Date(showViewUser.createdAt).toLocaleDateString() : '—']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>{k}</span>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{v}</span>
            </div>
          ))}
        </Modal>
      )}

      {/* View Artist Modal */}
      {showViewArtist && (
        <Modal title="Artist Details" onClose={() => setShowViewArtist(null)}>
          {[['Name', showViewArtist.name], ['Genre', showViewArtist.genre || '—'], ['Followers', showViewArtist.followers ?? '—'], ['Status', showViewArtist.status || '—'], ['Verification', showViewArtist.verification || '—'], ['Bio', showViewArtist.bio || '—']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>{k}</span>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', textAlign: 'right', maxWidth: '60%' }}>{String(v)}</span>
            </div>
          ))}
        </Modal>
      )}

      {/* View Song Modal */}
      {showViewSong && (
        <Modal title="Song Details" onClose={() => setShowViewSong(null)}>
          {[['Title', showViewSong.title], ['Artist', showViewSong.artistId?.name || '—'], ['Genre', showViewSong.genre || '—'], ['Plays', showViewSong.plays ?? 0], ['Duration', showViewSong.duration || '—'], ['Status', showViewSong.moderationStatus || showViewSong.status || '—'], ['Uploaded', showViewSong.createdAt ? new Date(showViewSong.createdAt).toLocaleDateString() : '—']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>{k}</span>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{String(v)}</span>
            </div>
          ))}
        </Modal>
      )}

      {/* Edit Song Modal */}
      {showEditSong && (
        <Modal title="Edit Song" onClose={() => setShowEditSong(null)}>
          <Field label="Song Title"><Input value={editSongForm.title} onChange={e => setEditSongForm(f => ({ ...f, title: e.target.value }))} /></Field>
          <Field label="Genre"><Select value={editSongForm.genre} onChange={e => setEditSongForm(f => ({ ...f, genre: e.target.value }))}>{GENRES.map(g => <option key={g}>{g}</option>)}</Select></Field>
          <Field label="Status"><Select value={editSongForm.status} onChange={e => setEditSongForm(f => ({ ...f, status: e.target.value }))}>{STATUS_OPTS.map(s => <option key={s}>{s}</option>)}</Select></Field>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button className="btn-camsound-outline" style={{ flex: 1 }} onClick={() => setShowEditSong(null)}>Cancel</button>
            <button className="btn-camsound-yellow" style={{ flex: 1 }} onClick={async () => {
              await adminService.updateSong(showEditSong._id, editSongForm);
              setShowEditSong(null); fetchSongs();
            }}>Save Changes</button>
          </div>
        </Modal>
      )}

      {/* Add Subscription Modal */}
      {showAddSubscription && (
        <Modal title="Add Subscription" onClose={() => setShowAddSubscription(false)}>
          {addSubMsg && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: addSubMsg.startsWith('✅') ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: addSubMsg.startsWith('✅') ? '#4ade80' : '#f87171' }}>{addSubMsg}</div>}
          <Field label="Plan Name"><Input value={addSubForm.planName} onChange={e => setAddSubForm(f => ({ ...f, planName: e.target.value }))} placeholder="Artist Pro" /></Field>
          <Field label="Amount (XAF)"><Input type="number" value={addSubForm.amount} onChange={e => setAddSubForm(f => ({ ...f, amount: e.target.value }))} /></Field>
          <Field label="Subscriber">
            <Select value={addSubForm.userId} onChange={e => setAddSubForm(f => ({ ...f, userId: e.target.value }))}>
              <option value="">Select user</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
            </Select>
          </Field>
          <Field label="Start Date"><Input type="date" value={addSubForm.startDate} onChange={e => setAddSubForm(f => ({ ...f, startDate: e.target.value }))} /></Field>
          <Field label="End Date"><Input type="date" value={addSubForm.endDate} onChange={e => setAddSubForm(f => ({ ...f, endDate: e.target.value }))} /></Field>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button className="btn-camsound-outline" style={{ flex: 1 }} onClick={() => setShowAddSubscription(false)}>Cancel</button>
            <button className="btn-camsound-yellow" style={{ flex: 1 }} onClick={async () => {
              try {
                const r = await subscriptionsService.createSubscription({ planName: addSubForm.planName, amount: Number(addSubForm.amount), userId: addSubForm.userId, startDate: addSubForm.startDate, endDate: addSubForm.endDate, status: 'active' });
                if (r.data.success) { setAddSubMsg('✅ Subscription created.'); fetchSubscriptions(); setTimeout(() => setShowAddSubscription(false), 1500); }
                else setAddSubMsg('❌ ' + (r.data.message || 'Failed.'));
              } catch (e: any) { setAddSubMsg('❌ ' + (e.response?.data?.message || 'Error.')); }
            }}>Create Subscription</button>
          </div>
        </Modal>
      )}

    </Layout>
  );
};

export default AdminDashboard;
