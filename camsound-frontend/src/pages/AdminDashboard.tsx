import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import '../admin.css';
import { usePlatformSettings } from '../context/SettingsContext';
import {
  statsService, adminService, artistsService, paymentsService, withdrawalsService,
  adRevenueService, adminLogsService, featuredService, subscriptionsService
} from '../services/api';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import MoMoPaymentModal from '../components/MoMoPaymentModal';

const ADMIN_NAV = [

  { section: 'Main' },
  { label: 'Overview', icon: 'fa-tachometer-alt', view: 'overview' },
  { label: 'Moderation Queue', icon: 'fa-shield-alt', view: 'moderation' },
  { label: 'Reports', icon: 'fa-chart-bar', view: 'reports' },
  { label: 'Admin Logs', icon: 'fa-clipboard-list', view: 'logs' },

  { section: 'Catalog & Content' },
  { label: 'Songs', icon: 'fa-music', view: 'songs' },
  { label: 'Artists', icon: 'fa-microphone', view: 'artists' },
  { label: 'Featured Content', icon: 'fa-star', view: 'featured' },

  { section: 'Monetization' },
  { label: 'Subscriptions', icon: 'fa-credit-card', view: 'subscriptions' },
  { label: 'Subscription Plans', icon: 'fa-crown', view: 'plans' },
  { label: 'Payments', icon: 'fa-dollar-sign', view: 'payments' },
  { label: 'Ad Revenue', icon: 'fa-ad', view: 'adRevenue' },
  { label: 'Withdrawals (Payouts)', icon: 'fa-wallet', view: 'withdrawals' },

  { section: 'System' },
  { label: 'User Directory', icon: 'fa-users', view: 'users' },
  { label: 'Platform Settings', icon: 'fa-cog', view: 'settings' },
];

const CHART_COLORS = ['#facc15', '#10b981', '#c084fc', '#60a5fa', '#f87171', '#34d399'];
const GENRES = ['All', 'Makossa', 'Bikutsi', 'Afrobeat', 'Assiko', 'Traditional', 'Gospel', 'Bend Skin', 'Hip Hop', 'R&B'];

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
  const s = String(status || '').toLowerCase();
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    active: { bg: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: 'rgba(16, 185, 129, 0.25)' },
    approved: { bg: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: 'rgba(16, 185, 129, 0.25)' },
    verified: { bg: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: 'rgba(16, 185, 129, 0.25)' },
    completed: { bg: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: 'rgba(16, 185, 129, 0.25)' },
    resolved: { bg: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: 'rgba(16, 185, 129, 0.25)' },
    pending: { bg: 'rgba(250, 204, 21, 0.12)', color: '#facc15', border: 'rgba(250, 204, 21, 0.25)' },
    blocked: { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: 'rgba(239, 68, 68, 0.25)' },
    rejected: { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: 'rgba(239, 68, 68, 0.25)' },
    failed: { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: 'rgba(239, 68, 68, 0.25)' },
    inactive: { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: 'rgba(239, 68, 68, 0.25)' },
    artist: { bg: 'rgba(192, 132, 252, 0.12)', color: '#c084fc', border: 'rgba(192, 132, 252, 0.25)' },
    admin: { bg: 'rgba(96, 165, 250, 0.12)', color: '#60a5fa', border: 'rgba(96, 165, 250, 0.25)' },
    fan: { bg: 'rgba(255, 255, 255, 0.08)', color: '#d1d5db', border: 'rgba(255, 255, 255, 0.15)' },
  };
  const c = colors[s] ?? { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: 'rgba(255,255,255,0.12)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 26, padding: '4px 12px', borderRadius: 999,
      fontSize: '0.75rem', lineHeight: 1.1, fontWeight: 700,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap', textTransform: 'capitalize'
    }}>
      {status}
    </span>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; width?: number }> = ({ title, onClose, children, width = 540 }) => (
  <div style={{
    position: 'fixed', inset: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: 16
  }}>
    <div style={{
      background: 'rgba(18, 26, 22, 0.96)',
      borderRadius: 18, width: '100%', maxWidth: width,
      border: '1px solid rgba(250, 204, 21, 0.25)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(250, 204, 21, 0.1)',
      maxHeight: '90vh', overflow: 'auto'
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          {title}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.06)', border: 'none',
            color: 'rgba(255, 255, 255, 0.6)', cursor: 'pointer',
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <i className="fas fa-times" />
        </button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.65)', fontWeight: 600 }}>{label}</label>
    {children}
  </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    style={{
      width: '100%', padding: '10px 14px',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: 10, color: '#fff', fontSize: '0.9rem',
      outline: 'none', boxSizing: 'border-box',
      ...props.style
    }}
  />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, ...props }) => (
  <select
    {...props}
    style={{
      width: '100%', padding: '10px 14px',
      background: 'var(--bg-secondary, #111827)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: 10, color: '#fff', fontSize: '0.9rem',
      outline: 'none', boxSizing: 'border-box',
      ...props.style
    }}
  >
    {children}
  </select>
);

const AdminDashboard: React.FC = () => {
  const { refreshSettings } = usePlatformSettings();
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
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [adminMomoTestModalOpen, setAdminMomoTestModalOpen] = useState(false);
  const [adminWithdrawalToProcess, setAdminWithdrawalToProcess] = useState<any>(null);


  const [settingsForm, setSettingsForm] = useState({
    platformName: 'CamSound',
    platformDesc: 'Discover Cameroonian Music',
    logoUrl: '',
    logoIcon: 'fa-drum',
    supportEmail: 'support@camsound.cm',
    commissionRate: '15',
    maintenanceMode: 'off',
    emailNotifications: true,
    twoFactorAuth: false,
    autoLogout: false
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [stats, setStats] = useState<any>({
    totalUsers: 0, totalArtists: 0, totalSongs: 0, totalRevenue: 0,
    activeUsers: 0, artistUsers: 0, pendingUsers: 0, blockedUsers: 0,
    userGrowth: [], userGrowthLabels: [], genreDistribution: [], topSongs: [], topArtists: [], recentSongs: []
  });
  const [loading, setLoading] = useState(false);

  // Search & Filter state
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  const [artistSearch, setArtistSearch] = useState('');
  const [artistFilter, setArtistFilter] = useState('all');

  const [songSearch, setSongSearch] = useState('');
  const [songGenreFilter, setSongGenreFilter] = useState('All');

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

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
          platformDesc: s.platformDesc || s.platform_desc || 'Discover Cameroonian Music',
          logoUrl: s.logoUrl || s.logo_url || '',
          logoIcon: s.logoIcon || s.logo_icon || 'fa-drum',
          supportEmail: s.supportEmail || s.support_email || 'support@camsound.cm',
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
    setSettingsSaving(true);
    try {
      const r = await adminService.updateSettings(settingsForm);
      if (r.data.success) {
        await refreshSettings();
        showToast('Platform settings & branding updated live across all pages!');
      } else {
        showToast(r.data.message || 'Failed to save');
      }
    } catch {
      showToast('Error saving settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Filtered lists
  const filteredUsers = users.filter(u => {
    const matchesSearch = !userSearch || [u.name, u.email, u.phone, u.type].some(f => String(f || '').toLowerCase().includes(userSearch.toLowerCase()));
    const matchesRole = userRoleFilter === 'all' || u.type === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredArtists = artists.filter(a => {
    const matchesSearch = !artistSearch || [a.name, a.genre].some(f => String(f || '').toLowerCase().includes(artistSearch.toLowerCase()));
    const isVerified = a.verification === 'approved' || a.status === 'verified';
    if (artistFilter === 'verified') return matchesSearch && isVerified;
    if (artistFilter === 'pending') return matchesSearch && !isVerified;
    return matchesSearch;
  });

  const filteredSongs = songs.filter(s => {
    const matchesSearch = !songSearch || [s.title, s.genre, s.artistId?.name].some(f => String(f || '').toLowerCase().includes(songSearch.toLowerCase()));
    const matchesGenre = songGenreFilter === 'All' || s.genre === songGenreFilter;
    return matchesSearch && matchesGenre;
  });

  // User Growth chart data
  const userGrowthData = (stats.userGrowthLabels || []).map((label: string, i: number) => ({
    name: label, Users: stats.userGrowth?.[i] ?? 0
  }));

  // Genre chart data
  const genreData = (stats.genreDistribution || []).map((g: any, i: number) => ({
    name: g.label || g.genre, value: g.count, fill: CHART_COLORS[i % CHART_COLORS.length]
  }));

  /* ─── Overview View ─── */
  const OverviewView = () => (
    <div>
      {/* Primary KPI Stats */}
      <div className="admin-stat-grid">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: 'fa-users', color: '#60a5fa', trend: '+12.4% this mo' },
          { label: 'Total Artists', value: stats.totalArtists, icon: 'fa-microphone', color: '#10b981', trend: '+8.1% this mo' },
          { label: 'Total Songs', value: stats.totalSongs, icon: 'fa-music', color: '#c084fc', trend: '+15.2% this mo' },
          { label: 'Total Revenue', value: `XAF ${(stats.totalRevenue ?? 0).toLocaleString()}`, icon: 'fa-dollar-sign', color: '#facc15', trend: 'Live MoMo' },
        ].map(s => (
          <div key={s.label} className="admin-stat-card">
            <div className="admin-stat-icon" style={{ color: s.color, background: `${s.color}18`, border: `1px solid ${s.color}35` }}>
              <i className={`fas ${s.icon}`} />
            </div>
            <div>
              <div className="admin-stat-label">{s.label}</div>
              <div className="admin-stat-value">{loading ? '…' : s.value?.toLocaleString?.() ?? s.value ?? 0}</div>
              <div className="admin-stat-trend up"><i className="fas fa-arrow-up" style={{ fontSize: '0.65rem' }} /> {s.trend}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary KPI Stats */}
      <div className="admin-stat-grid" style={{ marginBottom: 28 }}>
        {[
          { label: 'Active Fans', value: stats.activeUsers ?? 0, icon: 'fa-user-check', color: '#34d399' },
          { label: 'Registered Artists', value: stats.artistUsers ?? stats.totalArtists ?? 0, icon: 'fa-star', color: '#a78bfa' },
          { label: 'Pending Moderation', value: songs.filter(s => s.moderationStatus === 'pending').length, icon: 'fa-clock', color: '#fbbf24' },
          { label: 'Blocked Accounts', value: stats.blockedUsers ?? 0, icon: 'fa-user-shield', color: '#f87171' },
        ].map(s => (
          <div key={s.label} className="admin-stat-card">
            <div className="admin-stat-icon" style={{ color: s.color, background: `${s.color}18`, border: `1px solid ${s.color}35` }}>
              <i className={`fas ${s.icon}`} />
            </div>
            <div>
              <div className="admin-stat-label">{s.label}</div>
              <div className="admin-stat-value">{loading ? '…' : s.value?.toLocaleString?.() ?? 0}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title"><i className="fas fa-chart-line" /> User Registrations Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={userGrowthData.length ? userGrowthData : [{ name: 'Jan', Users: 12 }, { name: 'Feb', Users: 28 }, { name: 'Mar', Users: 45 }]}>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'rgba(18, 26, 22, 0.95)', border: '1px solid var(--accent-color)', borderRadius: 10, color: '#fff' }} />
              <Line type="monotone" dataKey="Users" stroke="#facc15" strokeWidth={3} dot={{ fill: '#facc15', r: 4 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title"><i className="fas fa-compact-disc" /> Genre Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={genreData.length ? genreData : [{ name: 'Afrobeat', value: 40, fill: '#facc15' }, { name: 'Makossa', value: 30, fill: '#10b981' }, { name: 'Bikutsi', value: 20, fill: '#c084fc' }]} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value">
                {(genreData.length ? genreData : [{ fill: '#facc15' }, { fill: '#10b981' }]).map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(18, 26, 22, 0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, color: '#fff' }} />
              <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Content Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">🔥 Top Streaming Tracks</h2>
            <button className="admin-btn-action" onClick={() => setActiveView('songs')}>View Catalog <i className="fas fa-arrow-right" /></button>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>#</th><th>Track</th><th>Artist</th><th>Plays</th><th>Status</th></tr></thead>
              <tbody>
                {(stats.topSongs || []).slice(0, 5).map((s: any, i: number) => (
                  <tr key={s._id || i}>
                    <td style={{ color: 'var(--accent-color)', fontWeight: 800 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{s.title}</td>
                    <td>{s.artistId?.name || s.artist || '—'}</td>
                    <td style={{ color: '#60a5fa', fontWeight: 700 }}>{(s.plays || 0).toLocaleString()}</td>
                    <td><Pill status={s.moderationStatus || s.status || 'active'} /></td>
                  </tr>
                ))}
                {!stats.topSongs?.length && <tr><td colSpan={5} style={{ padding: 28, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No stream data yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">⭐ Top Cameroonian Artists</h2>
            <button className="admin-btn-action" onClick={() => setActiveView('artists')}>View All <i className="fas fa-arrow-right" /></button>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>#</th><th>Artist</th><th>Genre</th><th>Followers</th><th>Badge</th></tr></thead>
              <tbody>
                {(stats.topArtists || []).slice(0, 5).map((a: any, i: number) => (
                  <tr key={a._id || i}>
                    <td style={{ color: 'var(--accent-color)', fontWeight: 800 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{a.name}</td>
                    <td>{a.genre || '—'}</td>
                    <td style={{ color: '#34d399', fontWeight: 700 }}>{(a.followers || 0).toLocaleString()}</td>
                    <td><Pill status={a.verification === 'approved' ? 'verified' : a.verification || 'pending'} /></td>
                  </tr>
                ))}
                {!stats.topArtists?.length && <tr><td colSpan={5} style={{ padding: 28, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No artists found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout navItems={ADMIN_NAV} activeView={activeView} onNavClick={setActiveView} topbarTitle="CamSound Administration Center">
      {toastMessage && (
        <div className="admin-toast">
          <i className="fas fa-check-circle" style={{ color: 'var(--accent-color)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      <div key={activeView} className="view-fade-in">
        {/* ─── 1. OVERVIEW ─── */}
        {activeView === 'overview' && <OverviewView />}

        {/* ─── 2. USER MANAGEMENT ─── */}
        {activeView === 'users' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title"><i className="fas fa-users-cog" /> User Management Directory</h2>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-camsound-yellow" style={{ fontSize: '0.84rem', padding: '8px 16px' }} onClick={() => { setShowAddUser(true); setAddUserMsg(''); }}>
                  <i className="fas fa-user-plus" style={{ marginRight: 6 }} /> Add New User
                </button>
                <button className="admin-btn-action" onClick={() => exportCSV(
                  [['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined Date'], ...filteredUsers.map(u => [u.name, u.email, u.phone || '', u.type, u.status, u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''])],
                  'users_export.csv'
                )}>
                  <i className="fas fa-download" style={{ marginRight: 6 }} /> Export CSV
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="admin-filter-bar">
              <div className="admin-search-box">
                <i className="fas fa-search" />
                <input className="admin-search-input" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users by name, email, role..." />
              </div>
              <div className="admin-chips-group">
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginRight: 4 }}>Role:</span>
                {['all', 'fan', 'artist', 'admin'].map(r => (
                  <button key={r} className={`admin-chip ${userRoleFilter === r ? 'active' : ''}`} onClick={() => setUserRoleFilter(r)}>
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr>{['User Profile', 'Email Address', 'Phone', 'Role', 'Account Status', 'Joined Date', 'Administrative Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(250,204,21,0.15)', color: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', border: '1px solid rgba(250,204,21,0.3)' }}>
                            {u.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff' }}>{u.name}</div>
                            <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.4)' }}>ID: {u._id?.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>{u.phone || '—'}</td>
                      <td><Pill status={u.type || 'fan'} /></td>
                      <td><Pill status={u.status || 'active'} /></td>
                      <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                      <td>
                        <div className="admin-action-group">
                          <button className="admin-btn-action" onClick={() => setShowViewUser(u)} title="View Profile"><i className="fas fa-eye" /> View</button>
                          <button className="admin-btn-action" onClick={async () => {
                            const newStatus = u.status === 'active' ? 'blocked' : 'active';
                            await adminService.updateUserStatus(u._id, newStatus);
                            showToast(`User marked as ${newStatus}`);
                            fetchUsers();
                          }}>
                            <i className={`fas ${u.status === 'active' ? 'fa-ban' : 'fa-check'}`} /> {u.status === 'active' ? 'Block' : 'Unblock'}
                          </button>
                          <button className="admin-btn-action" onClick={() => { setShowResetPassword(u); setResetPwNew(''); setResetPwConfirm(''); setResetPwMsg(''); }}>
                            <i className="fas fa-key" /> Reset Pw
                          </button>
                          <button className="admin-btn-action danger" onClick={async () => {
                            if (confirm(`Are you sure you want to permanently delete user "${u.name}"?`)) {
                              await adminService.deleteUser(u._id);
                              showToast('User deleted successfully');
                              fetchUsers();
                            }
                          }}>
                            <i className="fas fa-trash-alt" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredUsers.length && <tr><td colSpan={7} style={{ padding: 36, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No users found matching search criteria.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── 3. SONGS MANAGEMENT ─── */}
        {activeView === 'songs' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title"><i className="fas fa-music" /> Song Catalog Management</h2>
              <button className="admin-btn-action" onClick={() => exportCSV(
                [['Title', 'Artist', 'Genre', 'Plays', 'Duration', 'Moderation', 'Release Date'], ...filteredSongs.map(s => [s.title, s.artistId?.name || '', s.genre || '', s.plays || 0, s.duration || '', s.moderationStatus || s.status || '', s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''])],
                'songs_catalog.csv'
              )}>
                <i className="fas fa-download" style={{ marginRight: 6 }} /> Export Catalog
              </button>
            </div>

            {/* Filter Bar */}
            <div className="admin-filter-bar">
              <div className="admin-search-box">
                <i className="fas fa-search" />
                <input className="admin-search-input" value={songSearch} onChange={e => setSongSearch(e.target.value)} placeholder="Search songs by title, artist, genre..." />
              </div>
              <div className="admin-chips-group">
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginRight: 4 }}>Genre:</span>
                {GENRES.slice(0, 6).map(g => (
                  <button key={g} className={`admin-chip ${songGenreFilter === g ? 'active' : ''}`} onClick={() => setSongGenreFilter(g)}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr>{['Track Info', 'Artist', 'Genre', 'Streams', 'Duration', 'Uploaded Date', 'Moderation Status', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredSongs.map(s => (
                    <tr key={s._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {s.coverArt ? <img src={s.coverArt} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fas fa-music" style={{ color: 'var(--accent-color)' }} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff' }}>{s.title}</div>
                            <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.4)' }}>{s.album || 'Single'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{s.artistId?.name || s.artist || '—'}</td>
                      <td>{s.genre || 'Afrobeat'}</td>
                      <td style={{ color: '#60a5fa', fontWeight: 700 }}>{(s.plays || 0).toLocaleString()}</td>
                      <td>{s.duration || '3:30'}</td>
                      <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
                      <td><Pill status={s.moderationStatus || s.status || 'approved'} /></td>
                      <td>
                        <div className="admin-action-group">
                          <button className="admin-btn-action" onClick={() => setShowViewSong(s)}><i className="fas fa-eye" /> View</button>
                          <button className="admin-btn-action" onClick={() => { setShowEditSong(s); setEditSongForm({ title: s.title, genre: s.genre || 'Afrobeat', status: s.moderationStatus || s.status || 'active' }); }}>
                            <i className="fas fa-edit" /> Edit
                          </button>
                          <button className="admin-btn-action danger" onClick={async () => {
                            if (confirm(`Permanently remove track "${s.title}"?`)) {
                              await adminService.deleteSongAdmin(s._id);
                              showToast('Song deleted from platform');
                              fetchSongs();
                            }
                          }}>
                            <i className="fas fa-trash-alt" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredSongs.length && <tr><td colSpan={8} style={{ padding: 36, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No songs found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── 4. MODERATION QUEUE ─── */}
        {activeView === 'moderation' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title"><i className="fas fa-shield-alt" /> Moderation & Review Queue</h2>
              <span className="admin-stat-trend neutral">
                {songs.filter(s => s.moderationStatus === 'pending').length} pending review
              </span>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr>{['Song Title', 'Artist', 'Genre', 'Submitted', 'Status', 'Moderation Decision'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {songs.filter(s => s.moderationStatus === 'pending').map(s => (
                    <tr key={s._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 42, height: 42, borderRadius: 8, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {s.coverArt ? <img src={s.coverArt} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fas fa-music" style={{ color: 'var(--accent-color)' }} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff' }}>{s.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>File: {s.audioUrl ? 'Ready for preview' : 'Processing'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{s.artistId?.name || s.artist || '—'}</td>
                      <td>{s.genre}</td>
                      <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Today'}</td>
                      <td><Pill status="pending" /></td>
                      <td>
                        <div className="admin-action-group">
                          <button className="admin-btn-action success" onClick={async () => {
                            await adminService.moderateSong(s._id, { moderationStatus: 'approved', status: 'active' });
                            showToast(`"${s.title}" Approved and Published!`);
                            fetchSongs();
                          }}>
                            <i className="fas fa-check" /> Approve
                          </button>
                          <button className="admin-btn-action danger" onClick={async () => {
                            await adminService.moderateSong(s._id, { moderationStatus: 'rejected', status: 'inactive' });
                            showToast(`"${s.title}" Rejected`);
                            fetchSongs();
                          }}>
                            <i className="fas fa-times" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!songs.filter(s => s.moderationStatus === 'pending').length && (
                    <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                      <i className="fas fa-check-circle" style={{ fontSize: '2.5rem', color: '#10b981', display: 'block', marginBottom: 12 }} />
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>All clear! No songs pending moderation.</div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>New artist uploads will automatically appear here for moderation.</div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── 5. ARTISTS MANAGEMENT ─── */}
        {activeView === 'artists' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title"><i className="fas fa-microphone-alt" /> Artist Directory & Verification</h2>
              <button className="admin-btn-action" onClick={() => exportCSV(
                [['Artist Name', 'Genre', 'Followers', 'Total Tracks', 'Status', 'Verification'], ...filteredArtists.map(a => [a.name, a.genre || '', a.followers || 0, a.totalSongs || 0, a.status || '', a.verification || ''])],
                'artists_export.csv'
              )}>
                <i className="fas fa-download" style={{ marginRight: 6 }} /> Export Artists
              </button>
            </div>

            {/* Filter Bar */}
            <div className="admin-filter-bar">
              <div className="admin-search-box">
                <i className="fas fa-search" />
                <input className="admin-search-input" value={artistSearch} onChange={e => setArtistSearch(e.target.value)} placeholder="Search artists by name or genre..." />
              </div>
              <div className="admin-chips-group">
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginRight: 4 }}>Filter:</span>
                {['all', 'verified', 'pending'].map(f => (
                  <button key={f} className={`admin-chip ${artistFilter === f ? 'active' : ''}`} onClick={() => setArtistFilter(f)}>
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr>{['Artist Profile', 'Primary Genre', 'Followers', 'Catalog Count', 'Status', 'Verification Badge', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredArtists.map(a => {
                    const isVerified = a.verification === 'approved' || a.status === 'verified';
                    return (
                      <tr key={a._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                              {a.name?.charAt(0) || 'A'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {a.name}
                                {isVerified && <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '0.85rem' }} title="Verified Artist" />}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.4)' }}>{a.location || 'Cameroon'}</div>
                            </div>
                          </div>
                        </td>
                        <td>{a.genre || 'Afrobeats'}</td>
                        <td style={{ color: '#34d399', fontWeight: 700 }}>{(a.followers || 0).toLocaleString()}</td>
                        <td style={{ color: '#60a5fa', fontWeight: 700 }}>{a.totalSongs || a.songCount || '—'}</td>
                        <td><Pill status={a.status || 'active'} /></td>
                        <td><Pill status={isVerified ? 'verified' : 'pending'} /></td>
                        <td>
                          <div className="admin-action-group">
                            <button className="admin-btn-action" onClick={() => setShowViewArtist(a)}><i className="fas fa-eye" /> Profile</button>
                            {!isVerified ? (
                              <button className="admin-btn-action success" onClick={async () => {
                                await artistsService.updateArtist(a._id, { verification: 'approved', status: 'verified' });
                                showToast(`Artist "${a.name}" verified!`);
                                fetchArtists();
                              }}>
                                <i className="fas fa-certificate" /> Verify Badge
                              </button>
                            ) : (
                              <button className="admin-btn-action danger" onClick={async () => {
                                await artistsService.updateArtist(a._id, { verification: 'rejected', status: 'pending' });
                                showToast(`Verification revoked for "${a.name}"`);
                                fetchArtists();
                              }}>
                                <i className="fas fa-ban" /> Revoke
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!filteredArtists.length && <tr><td colSpan={7} style={{ padding: 36, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No artists found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── 6. FEATURED CONTENT ─── */}
        {activeView === 'featured' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title"><i className="fas fa-star" /> Homepage Hero & Featured Banners</h2>
            </div>

            {/* Create/Edit Form */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 18, borderRadius: 14, border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', color: 'var(--accent-color)', fontWeight: 700 }}>
                {editingFeaturedId ? 'Edit Featured Item' : 'Create New Featured Banner'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
                <div><label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Banner Title</label><Input placeholder="e.g. Makossa Fest 2026" value={featuredForm.title} onChange={e => setFeaturedForm((p: any) => ({ ...p, title: e.target.value }))} /></div>
                <div><label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Image URL</label><Input placeholder="https://..." value={featuredForm.image} onChange={e => setFeaturedForm((p: any) => ({ ...p, image: e.target.value }))} /></div>
                <div><label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Target Link</label><Input placeholder="/browse or /artist/..." value={featuredForm.link} onChange={e => setFeaturedForm((p: any) => ({ ...p, link: e.target.value }))} /></div>
                <div><label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Subtitle / Description</label><Input placeholder="Short tagline..." value={featuredForm.description} onChange={e => setFeaturedForm((p: any) => ({ ...p, description: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-camsound-yellow" onClick={async () => {
                  if (editingFeaturedId) { await featuredService.updateFeatured(editingFeaturedId, featuredForm); showToast('Featured banner updated!'); setEditingFeaturedId(null); }
                  else { await featuredService.createFeatured(featuredForm); showToast('Featured banner published!'); }
                  setFeaturedForm({ title: '', description: '', image: '', link: '' }); fetchFeatured();
                }}>
                  {editingFeaturedId ? 'Save Changes' : 'Publish Banner'}
                </button>
                {editingFeaturedId && <button className="admin-btn-action" onClick={() => { setEditingFeaturedId(null); setFeaturedForm({ title: '', description: '', image: '', link: '' }); }}>Cancel</button>}
              </div>
            </div>

            {/* List of active featured items */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {featuredList.map(f => (
                <div key={f._id} style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ height: 120, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
                    {f.image ? <img src={f.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}><i className="fas fa-image fa-2x" /></div>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{f.title}</div>
                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{f.description || 'No description'}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)' }}>Link: {f.link || '—'}</span>
                    <div className="admin-action-group">
                      <button className="admin-btn-action" onClick={() => { setEditingFeaturedId(f._id); setFeaturedForm({ title: f.title || '', description: f.description || '', image: f.image || '', link: f.link || '' }); }}><i className="fas fa-edit" /></button>
                      <button className="admin-btn-action danger" onClick={async () => { if (confirm('Delete banner?')) { await featuredService.deleteFeatured(f._id); showToast('Banner removed'); fetchFeatured(); } }}><i className="fas fa-trash" /></button>
                    </div>
                  </div>
                </div>
              ))}
              {!featuredList.length && <div style={{ padding: 36, textAlign: 'center', color: 'rgba(255,255,255,0.3)', gridColumn: '1 / -1' }}>No featured banners published yet.</div>}
            </div>
          </div>
        )}

        {/* ─── 7. SUBSCRIPTIONS & MONETIZATION ─── */}
        {activeView === 'subscriptions' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title"><i className="fas fa-credit-card" /> Active Fan Subscriptions</h2>
              <button className="btn-camsound-yellow" style={{ fontSize: '0.84rem', padding: '6px 14px' }} onClick={() => setShowAddSubscription(true)}>
                <i className="fas fa-plus" style={{ marginRight: 6 }} /> Grant Subscription
              </button>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr>{['Plan Tier', 'Subscribed User', 'Amount (XAF)', 'Status', 'Start Date', 'Expiry Date'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {subscriptions.map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 700, color: '#fff' }}>{s.planName || s.plan || 'Premium Fan'}</td>
                      <td>{s.userId?.name || s.userName || '—'}</td>
                      <td style={{ color: 'var(--accent-color)', fontWeight: 700 }}>XAF {(s.amount || 0).toLocaleString()}</td>
                      <td><Pill status={s.status || 'active'} /></td>
                      <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'}</td>
                      <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                  {!subscriptions.length && <tr><td colSpan={6} style={{ padding: 36, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No active fan subscriptions recorded.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── 8. SUBSCRIPTION PLANS ─── */}
        {activeView === 'plans' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title"><i className="fas fa-crown" /> Subscription Pricing Plans (XAF)</h2>
              <button className="btn-camsound-yellow" style={{ fontSize: '0.84rem', padding: '6px 14px' }} onClick={() => { setEditingPlanId(null); setPlanForm({ name: '', price: '', currency: 'XAF', period: '/month', description: '', features: '', isPopular: false }); setShowPlanModal(true); }}>
                <i className="fas fa-plus" style={{ marginRight: 6 }} /> Add New Plan
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {plans.map(p => (
                <div key={p._id} style={{ padding: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: p.isPopular ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
                  {p.isPopular && <span style={{ position: 'absolute', top: -12, right: 20, background: 'var(--accent-color)', color: '#0b0f0c', fontWeight: 800, fontSize: '0.72rem', padding: '3px 10px', borderRadius: 999 }}>POPULAR</span>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>{p.name}</h3>
                    <div className="admin-action-group">
                      <button className="admin-btn-action" onClick={() => { setEditingPlanId(p._id); setPlanForm({ name: p.name, price: p.price, currency: p.currency || 'XAF', period: p.period || '/month', description: p.description || '', features: Array.isArray(p.features) ? p.features.join(', ') : (p.features || ''), isPopular: p.isPopular || false }); setShowPlanModal(true); }}><i className="fas fa-edit" /></button>
                      <button className="admin-btn-action danger" onClick={async () => { if (confirm(`Delete plan "${p.name}"?`)) { await subscriptionsService.deletePlan(p._id); showToast('Plan deleted'); fetchPlans(); } }}><i className="fas fa-trash" /></button>
                    </div>
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-color)', marginBottom: 12 }}>
                    XAF {Number(p.price).toLocaleString()} <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{p.period}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 16 }}>{p.description}</p>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Included Features:</div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.84rem', color: 'rgba(255,255,255,0.8)', display: 'grid', gap: 6 }}>
                      {(Array.isArray(p.features) ? p.features : (typeof p.features === 'string' ? p.features.split(',') : [])).map((f: string, i: number) => (
                        <li key={i}>{String(f || '').trim()}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── 9. PAYMENTS & TRANSACTIONS ─── */}
        {activeView === 'payments' && (
          <div className="admin-card">
            <div className="admin-card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 className="admin-card-title"><i className="fas fa-file-invoice-dollar" /> MTN MoMo & Orange Money Payments</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', margin: '4px 0 0' }}>Live ledger & real-time MTN MoMo gateway simulation</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-camsound-yellow" onClick={() => setAdminMomoTestModalOpen(true)} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  <i className="fas fa-bolt" style={{ marginRight: 6 }} /> ⚡ Run MoMo Test Transaction
                </button>
                <button className="admin-btn-action" onClick={() => exportCSV(
                  [['Date', 'Amount (XAF)', 'Method', 'User', 'Status'], ...payments.map(p => [new Date(p.createdAt).toLocaleDateString(), p.amount, p.paymentMethod || 'MoMo', p.user?.name || '', p.status])],
                  'payments_history.csv'
                )}>
                  <i className="fas fa-download" style={{ marginRight: 6 }} /> Export CSV
                </button>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr>{['Transaction Date', 'Amount', 'Payment Method', 'Payer Information', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id}>
                      <td style={{ color: 'rgba(255,255,255,0.6)' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td style={{ color: 'var(--accent-color)', fontWeight: 800 }}>XAF {(p.amount || 0).toLocaleString()}</td>
                      <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}><i className="fas fa-mobile-alt" style={{ color: '#facc15' }} /> {p.paymentMethod || 'MTN MoMo'}</span></td>
                      <td>{p.user?.name || p.user?.email || '—'}</td>
                      <td><Pill status={p.status || 'completed'} /></td>
                      <td>
                        {p.status === 'pending' ? (
                          <div className="admin-action-group">
                            <button className="admin-btn-action success" onClick={async () => { await paymentsService.updatePaymentStatus(p._id, { status: 'completed' }); showToast('Payment verified'); fetchPayments(); }}>
                              <i className="fas fa-check" /> Verify
                            </button>
                            <button className="admin-btn-action danger" onClick={async () => { await paymentsService.updatePaymentStatus(p._id, { status: 'failed' }); showToast('Payment flagged as failed'); fetchPayments(); }}>
                              <i className="fas fa-times" /> Fail
                            </button>
                          </div>
                        ) : p.status === 'completed' ? (
                          <span style={{ color: '#34d399', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <i className="fas fa-check-circle" /> Verified
                          </span>
                        ) : (
                          <span style={{ color: '#f87171', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <i className="fas fa-times-circle" /> Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!payments.length && <tr><td colSpan={6} style={{ padding: 36, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No payment transactions found.</td></tr>}

                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── 10. AD REVENUE ─── */}
        {activeView === 'adRevenue' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title"><i className="fas fa-ad" /> Platform Advertising Earnings</h2>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: 18, borderRadius: 14, border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', color: 'var(--accent-color)', fontWeight: 700 }}>
                {editingAdId ? 'Edit Ad Revenue Entry' : 'Log New Ad Network Revenue'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
                <div><label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Date</label><Input type="date" value={adForm.date} onChange={e => setAdForm((p: any) => ({ ...p, date: e.target.value }))} /></div>
                <div><label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Ad Network / Source</label><Input placeholder="Google AdSense, Meta..." value={adForm.source} onChange={e => setAdForm((p: any) => ({ ...p, source: e.target.value }))} /></div>
                <div><label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Revenue Amount (XAF)</label><Input type="number" placeholder="50000" value={adForm.amount} onChange={e => setAdForm((p: any) => ({ ...p, amount: e.target.value }))} /></div>
                <div><label style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Notes / Details</label><Input placeholder="Campaign details..." value={adForm.description} onChange={e => setAdForm((p: any) => ({ ...p, description: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-camsound-yellow" onClick={async () => {
                  if (editingAdId) { await adRevenueService.updateAdRevenue(editingAdId, adForm); showToast('Ad revenue updated!'); setEditingAdId(null); }
                  else { await adRevenueService.createAdRevenue(adForm); showToast('Ad revenue logged successfully!'); }
                  setAdForm({ date: '', source: '', amount: '', description: '' }); fetchAdRevenue();
                }}>
                  {editingAdId ? 'Update Entry' : 'Log Revenue'}
                </button>
                {editingAdId && <button className="admin-btn-action" onClick={() => { setEditingAdId(null); setAdForm({ date: '', source: '', amount: '', description: '' }); }}>Cancel</button>}
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr>{['Date', 'Ad Source', 'Amount (XAF)', 'Description', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {adRevenue.map(a => (
                    <tr key={a._id}>
                      <td>{new Date(a.date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 700, color: '#fff' }}>{a.source}</td>
                      <td style={{ color: 'var(--accent-color)', fontWeight: 800 }}>XAF {Number(a.amount).toLocaleString()}</td>
                      <td style={{ color: 'rgba(255,255,255,0.6)' }}>{a.description || '—'}</td>
                      <td>
                        <div className="admin-action-group">
                          <button className="admin-btn-action" onClick={() => { setEditingAdId(a._id); setAdForm({ date: a.date ? new Date(a.date).toISOString().slice(0, 10) : '', source: a.source || '', amount: a.amount || '', description: a.description || '' }); }}><i className="fas fa-edit" /></button>
                          <button className="admin-btn-action danger" onClick={async () => { if (confirm('Delete ad record?')) { await adRevenueService.deleteAdRevenue(a._id); showToast('Ad revenue record removed'); fetchAdRevenue(); } }}><i className="fas fa-trash" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!adRevenue.length && <tr><td colSpan={5} style={{ padding: 36, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No ad earnings logged yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── 11. WITHDRAWALS & ARTIST PAYOUTS ─── */}
        {activeView === 'withdrawals' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title"><i className="fas fa-wallet" /> Artist Royalty Withdrawal Requests</h2>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr>{['Request Date', 'Artist Payout Amount', 'MoMo / Orange Number', 'Status', 'Approval Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {withdrawals.map(w => (
                    <tr key={w._id}>
                      <td>{new Date(w.createdAt).toLocaleDateString()}</td>
                      <td style={{ color: 'var(--accent-color)', fontWeight: 800 }}>XAF {(w.amount || 0).toLocaleString()}</td>
                      <td style={{ color: '#fff', fontWeight: 600 }}><i className="fas fa-phone-alt" style={{ color: 'var(--accent-color)', marginRight: 6 }} /> {w.momoNumber || '—'}</td>
                      <td><Pill status={w.status || 'pending'} /></td>
                      <td>
                        {w.status === 'pending' ? (
                          <div className="admin-action-group">
                            <button
                              className="admin-btn-action"
                              style={{ border: '1px solid #facc15', color: '#facc15', fontWeight: 700 }}
                              onClick={() => setAdminWithdrawalToProcess(w)}
                            >
                              <i className="fas fa-bolt" /> ⚡ MoMo Payout
                            </button>
                            <button className="admin-btn-action success" onClick={async () => {
                              await withdrawalsService.updateWithdrawal(w._id, { status: 'completed' });
                              showToast('Payout approved and marked completed');
                              fetchWithdrawals();
                            }}>
                              <i className="fas fa-check" /> Direct Approve
                            </button>
                            <button className="admin-btn-action danger" onClick={async () => {
                              await withdrawalsService.updateWithdrawal(w._id, { status: 'rejected' });
                              showToast('Withdrawal rejected');
                              fetchWithdrawals();
                            }}>
                              <i className="fas fa-times" /> Reject
                            </button>
                          </div>
                        ) : w.status === 'completed' ? (

                          <span style={{ color: '#34d399', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <i className="fas fa-check-circle" /> Paid & Settled
                          </span>
                        ) : (
                          <span style={{ color: '#f87171', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <i className="fas fa-times-circle" /> Declined
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!withdrawals.length && <tr><td colSpan={5} style={{ padding: 36, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No pending artist withdrawal requests.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── 12. REPORTS & MODERATION ─── */}
        {activeView === 'reports' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title"><i className="fas fa-flag" /> User & Content Violation Reports</h2>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr>{['Report Date', 'Target Content', 'Reason / Violation', 'Reported By', 'Status', 'Action'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r._id}>
                      <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 700, color: '#fff' }}>{r.targetType}: {r.targetId}</td>
                      <td>{r.reason}</td>
                      <td>{r.reportedBy?.name || 'Anonymous User'}</td>
                      <td><Pill status={r.status || 'pending'} /></td>
                      <td>
                        {r.status !== 'resolved' ? (
                          <button className="admin-btn-action success" onClick={async () => {
                            await adminService.updateReport(r._id, 'resolved');
                            showToast('Report marked as resolved');
                            fetchReports();
                          }}>
                            <i className="fas fa-check" /> Resolve
                          </button>
                        ) : (
                          <span style={{ color: '#34d399', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <i className="fas fa-check-circle" /> Resolved
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!reports.length && <tr><td colSpan={6} style={{ padding: 36, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No open violation reports.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── 13. ADMIN LOGS ─── */}
        {activeView === 'logs' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title"><i className="fas fa-history" /> Platform Administrative Audit Trail</h2>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr>{['Timestamp', 'Admin Actor', 'Operation Executed', 'Target ID / Resource', 'IP Address'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {adminLogs.map(l => (
                    <tr key={l._id}>
                      <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{new Date(l.createdAt).toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-color)' }}>{l.adminUser?.name || 'Super Admin'}</td>
                      <td><span style={{ fontWeight: 600, color: '#fff' }}>{l.action}</span></td>
                      <td style={{ color: 'rgba(255,255,255,0.6)' }}>{l.target || '—'}</td>
                      <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>{l.ip || '127.0.0.1'}</td>
                    </tr>
                  ))}
                  {!adminLogs.length && <tr><td colSpan={5} style={{ padding: 36, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>No admin audit records yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── 14. PLATFORM SETTINGS ─── */}
        {activeView === 'settings' && (
          <div className="admin-card" style={{ maxWidth: 840 }}>
            <div className="admin-card-header">
              <h2 className="admin-card-title"><i className="fas fa-sliders-h" /> Platform Branding &amp; Global Configuration</h2>
            </div>

            {/* Live Branding Preview */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(15,61,46,0.5), rgba(11,15,12,0.8))',
              border: '1px solid rgba(250,204,21,0.3)',
              borderRadius: 14,
              padding: '16px 20px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--accent-color, #facc15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(250,204,21,0.4)',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {settingsForm.logoUrl ? (
                    <img src={settingsForm.logoUrl} alt={settingsForm.platformName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <i className={`fas ${settingsForm.logoIcon || 'fa-drum'}`} style={{ color: '#0b0f0c', fontSize: '1.4rem' }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-color, #facc15)' }}>
                    {settingsForm.platformName || 'CamSound'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>
                    {settingsForm.platformDesc || 'Discover Cameroonian Music'}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', background: 'rgba(250,204,21,0.15)', color: 'var(--accent-color)', padding: '4px 12px', borderRadius: 999, fontWeight: 700 }}>
                Live Header &amp; Landing Preview
              </span>
            </div>

            <div style={{ display: 'grid', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Platform Brand Name">
                  <Input
                    placeholder="e.g. CamSound"
                    value={settingsForm.platformName}
                    onChange={e => setSettingsForm(f => ({ ...f, platformName: e.target.value }))}
                  />
                </Field>
                <Field label="Platform Tagline / Short Description">
                  <Input
                    placeholder="e.g. Discover Cameroonian Music"
                    value={settingsForm.platformDesc}
                    onChange={e => setSettingsForm(f => ({ ...f, platformDesc: e.target.value }))}
                  />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <Field label="Custom Logo Image URL (Optional - leave empty for icon)">
                  <Input
                    placeholder="https://example.com/logo.png or data:image/..."
                    value={settingsForm.logoUrl}
                    onChange={e => setSettingsForm(f => ({ ...f, logoUrl: e.target.value }))}
                  />
                </Field>
                <Field label="Brand Icon Preset">
                  <Select
                    value={settingsForm.logoIcon}
                    onChange={e => setSettingsForm(f => ({ ...f, logoIcon: e.target.value }))}
                  >
                    <option value="fa-drum">🥁 Drum (Cameroon Traditional)</option>
                    <option value="fa-music">🎵 Music Note</option>
                    <option value="fa-headphones">🎧 Headphones</option>
                    <option value="fa-compact-disc">💿 Vinyl / CD</option>
                    <option value="fa-wave-square">🌊 Soundwave</option>
                    <option value="fa-broadcast-tower">📡 Radio Tower</option>
                    <option value="fa-fire">🔥 Fire / Trending</option>
                  </Select>
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Support / Admin Contact Email">
                  <Input
                    type="email"
                    placeholder="support@camsound.cm"
                    value={settingsForm.supportEmail}
                    onChange={e => setSettingsForm(f => ({ ...f, supportEmail: e.target.value }))}
                  />
                </Field>
                <Field label="Platform Commission Rate (%)">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="15"
                    value={settingsForm.commissionRate}
                    onChange={e => setSettingsForm(f => ({ ...f, commissionRate: e.target.value }))}
                  />
                </Field>
              </div>

              <Field label="Platform Operational Status">
                <Select
                  value={settingsForm.maintenanceMode}
                  onChange={e => setSettingsForm(f => ({ ...f, maintenanceMode: e.target.value }))}
                >
                  <option value="off">Operational (Active - Platform fully open)</option>
                  <option value="on">Maintenance Mode (Platform Paused for maintenance)</option>
                </Select>
              </Field>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 18, display: 'flex', gap: 12 }}>
                <button className="btn-camsound-yellow" onClick={handleSaveSettings} disabled={settingsSaving}>
                  <i className="fas fa-save" style={{ marginRight: 8 }} />
                  {settingsSaving ? 'Saving & Broadcasting…' : 'Save & Propagate Platform Settings'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODALS ─── */}

      {/* Plan Create/Edit Modal */}
      {showPlanModal && (
        <Modal title={editingPlanId ? 'Edit Subscription Plan' : 'Create Subscription Plan'} onClose={() => setShowPlanModal(false)}>
          <Field label="Plan Name"><Input placeholder="e.g. Creator VIP" value={planForm.name} onChange={e => setPlanForm((p: any) => ({ ...p, name: e.target.value }))} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Price (XAF)"><Input type="number" placeholder="5000" value={planForm.price} onChange={e => setPlanForm((p: any) => ({ ...p, price: e.target.value }))} /></Field>
            <Field label="Billing Interval"><Input placeholder="/month" value={planForm.period} onChange={e => setPlanForm((p: any) => ({ ...p, period: e.target.value }))} /></Field>
          </div>
          <Field label="Short Description"><Input placeholder="Ideal for power users..." value={planForm.description} onChange={e => setPlanForm((p: any) => ({ ...p, description: e.target.value }))} /></Field>
          <Field label="Features (comma separated)"><Input placeholder="Unlimited streams, Offline mode, High-res audio" value={planForm.features} onChange={e => setPlanForm((p: any) => ({ ...p, features: e.target.value }))} /></Field>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
            <input type="checkbox" id="popularCheck" checked={planForm.isPopular} onChange={e => setPlanForm((p: any) => ({ ...p, isPopular: e.target.checked }))} style={{ width: 18, height: 18, accentColor: 'var(--accent-color)' }} />
            <label htmlFor="popularCheck" style={{ color: '#fff', fontSize: '0.88rem', cursor: 'pointer' }}>Mark as Popular / Featured Tier</label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button className="admin-btn-action" onClick={() => setShowPlanModal(false)}>Cancel</button>
            <button className="btn-camsound-yellow" onClick={async () => {
              if (!planForm.name || !planForm.price) return;
              const payload = {
                ...planForm,
                price: Number(planForm.price),
                features: typeof planForm.features === 'string'
                  ? planForm.features.split(',').map((f: string) => f.trim()).filter(Boolean)
                  : (Array.isArray(planForm.features) ? planForm.features : [])
              };
              try {
                if (editingPlanId) {
                  await subscriptionsService.updatePlan(editingPlanId, payload);
                  showToast('Plan updated successfully');
                } else {
                  await subscriptionsService.createPlan(payload);
                  showToast('Plan created successfully');
                }
                setShowPlanModal(false);
                fetchPlans();
              } catch {
                showToast('Error saving plan');
              }
            }}>
              Save Plan
            </button>
          </div>
        </Modal>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <Modal title="Create New CamSound User" onClose={() => setShowAddUser(false)}>
          {addUserMsg && <div style={{ marginBottom: 12, padding: 10, background: 'rgba(250,204,21,0.1)', color: '#facc15', borderRadius: 8, fontSize: '0.85rem' }}>{addUserMsg}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="First Name"><Input placeholder="John" value={addUserForm.firstName} onChange={e => setAddUserForm(f => ({ ...f, firstName: e.target.value }))} /></Field>
            <Field label="Last Name"><Input placeholder="Doe" value={addUserForm.lastName} onChange={e => setAddUserForm(f => ({ ...f, lastName: e.target.value }))} /></Field>
          </div>
          <Field label="Email Address"><Input type="email" placeholder="john@camsound.cm" value={addUserForm.email} onChange={e => setAddUserForm(f => ({ ...f, email: e.target.value }))} /></Field>
          <Field label="Phone (MoMo / Orange)"><Input placeholder="+237 6XXXXXXXX" value={addUserForm.phone} onChange={e => setAddUserForm(f => ({ ...f, phone: e.target.value }))} /></Field>
          <Field label="Account Type">
            <Select value={addUserForm.type} onChange={e => setAddUserForm(f => ({ ...f, type: e.target.value }))}>
              <option value="fan">Fan (Listener)</option>
              <option value="artist">Artist (Creator)</option>
              <option value="admin">Administrator</option>
            </Select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Password"><Input type="password" placeholder="••••••••" value={addUserForm.password} onChange={e => setAddUserForm(f => ({ ...f, password: e.target.value }))} /></Field>
            <Field label="Confirm Password"><Input type="password" placeholder="••••••••" value={addUserForm.confirmPassword} onChange={e => setAddUserForm(f => ({ ...f, confirmPassword: e.target.value }))} /></Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button className="admin-btn-action" onClick={() => setShowAddUser(false)}>Cancel</button>
            <button className="btn-camsound-yellow" onClick={async () => {
              if (!addUserForm.email || !addUserForm.password) { setAddUserMsg('Email and Password are required'); return; }
              if (addUserForm.password !== addUserForm.confirmPassword) { setAddUserMsg('Passwords do not match'); return; }
              try {
                const r = await adminService.createUser({
                  name: `${addUserForm.firstName} ${addUserForm.lastName}`.trim(),
                  email: addUserForm.email,
                  phone: addUserForm.phone,
                  type: addUserForm.type,
                  password: addUserForm.password,
                  status: addUserForm.active ? 'active' : 'inactive'
                });
                if (r.data.success) {
                  showToast('User created successfully');
                  setShowAddUser(false);
                  fetchUsers();
                } else {
                  setAddUserMsg(r.data.message || 'Creation failed');
                }
              } catch (e: any) {
                setAddUserMsg(e.response?.data?.message || 'Error creating user');
              }
            }}>
              Create User
            </button>
          </div>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {showResetPassword && (
        <Modal title={`Reset Password for ${showResetPassword.name}`} onClose={() => setShowResetPassword(null)}>
          {resetPwMsg && <div style={{ marginBottom: 12, padding: 10, background: 'rgba(250,204,21,0.1)', color: '#facc15', borderRadius: 8, fontSize: '0.85rem' }}>{resetPwMsg}</div>}
          <Field label="New Password"><Input type="password" placeholder="Enter new strong password" value={resetPwNew} onChange={e => setResetPwNew(e.target.value)} /></Field>
          <Field label="Confirm New Password"><Input type="password" placeholder="Re-enter password" value={resetPwConfirm} onChange={e => setResetPwConfirm(e.target.value)} /></Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button className="admin-btn-action" onClick={() => setShowResetPassword(null)}>Cancel</button>
            <button className="btn-camsound-yellow" onClick={async () => {
              if (!resetPwNew || resetPwNew !== resetPwConfirm) { setResetPwMsg('Passwords do not match'); return; }
              try {
                await adminService.resetUserPassword(showResetPassword._id, resetPwNew);
                showToast(`Password updated for ${showResetPassword.name}`);
                setShowResetPassword(null);
              } catch {
                setResetPwMsg('Error resetting password');
              }
            }}>
              Update Password
            </button>
          </div>
        </Modal>
      )}

      {/* View User Modal */}
      {showViewUser && (
        <Modal title={`User Profile: ${showViewUser.name}`} onClose={() => setShowViewUser(null)}>
          <div style={{ display: 'grid', gap: 14 }}>
            <div><strong style={{ color: 'var(--accent-color)' }}>Email:</strong> {showViewUser.email}</div>
            <div><strong style={{ color: 'var(--accent-color)' }}>Phone:</strong> {showViewUser.phone || 'None registered'}</div>
            <div><strong style={{ color: 'var(--accent-color)' }}>Role:</strong> <Pill status={showViewUser.type} /></div>
            <div><strong style={{ color: 'var(--accent-color)' }}>Status:</strong> <Pill status={showViewUser.status} /></div>
            <div><strong style={{ color: 'var(--accent-color)' }}>Registered:</strong> {showViewUser.createdAt ? new Date(showViewUser.createdAt).toLocaleString() : '—'}</div>
          </div>
        </Modal>
      )}

      {/* Edit Song Modal */}
      {showEditSong && (
        <Modal title={`Edit Track: ${showEditSong.title}`} onClose={() => setShowEditSong(null)}>
          <Field label="Song Title"><Input value={editSongForm.title} onChange={e => setEditSongForm(f => ({ ...f, title: e.target.value }))} /></Field>
          <Field label="Genre">
            <Select value={editSongForm.genre} onChange={e => setEditSongForm(f => ({ ...f, genre: e.target.value }))}>
              {GENRES.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={editSongForm.status} onChange={e => setEditSongForm(f => ({ ...f, status: e.target.value }))}>
              <option value="active">Active (Published)</option>
              <option value="inactive">Inactive (Unpublished)</option>
            </Select>
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button className="admin-btn-action" onClick={() => setShowEditSong(null)}>Cancel</button>
            <button className="btn-camsound-yellow" onClick={async () => {
              await adminService.updateSong(showEditSong._id, editSongForm);
              showToast('Song details updated!');
              setShowEditSong(null);
              fetchSongs();
            }}>
              Save Changes
            </button>
          </div>
        </Modal>
      )}

      {/* View Artist Modal */}
      {showViewArtist && (
        <Modal title={`Artist: ${showViewArtist.name}`} onClose={() => setShowViewArtist(null)}>
          <div style={{ display: 'grid', gap: 14 }}>
            <div><strong style={{ color: 'var(--accent-color)' }}>Genre:</strong> {showViewArtist.genre || 'Afrobeats'}</div>
            <div><strong style={{ color: 'var(--accent-color)' }}>Location:</strong> {showViewArtist.location || 'Cameroon'}</div>
            <div><strong style={{ color: 'var(--accent-color)' }}>Followers:</strong> {(showViewArtist.followers || 0).toLocaleString()}</div>
            <div><strong style={{ color: 'var(--accent-color)' }}>Bio:</strong> {showViewArtist.bio || 'No artist biography provided.'}</div>
          </div>
        </Modal>
      )}

      {/* View Song Modal */}
      {showViewSong && (
        <Modal title={`Track Details: ${showViewSong.title}`} onClose={() => setShowViewSong(null)}>
          <div style={{ display: 'grid', gap: 14 }}>
            <div><strong style={{ color: 'var(--accent-color)' }}>Artist:</strong> {showViewSong.artistId?.name || showViewSong.artist || '—'}</div>
            <div><strong style={{ color: 'var(--accent-color)' }}>Genre:</strong> {showViewSong.genre}</div>
            <div><strong style={{ color: 'var(--accent-color)' }}>Total Plays:</strong> {(showViewSong.plays || 0).toLocaleString()}</div>
            <div><strong style={{ color: 'var(--accent-color)' }}>Duration:</strong> {showViewSong.duration || '—'}</div>
            <div><strong style={{ color: 'var(--accent-color)' }}>Moderation Status:</strong> <Pill status={showViewSong.moderationStatus || 'approved'} /></div>
          </div>
        </Modal>
      )}

      {/* Add Subscription Modal */}
      {showAddSubscription && (
        <Modal title="Grant Fan Subscription" onClose={() => setShowAddSubscription(false)}>
          <Field label="Target User">
            <Select value={addSubForm.userId} onChange={e => setAddSubForm(f => ({ ...f, userId: e.target.value }))}>
              <option value="">Select a user...</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
            </Select>
          </Field>
          <Field label="Plan Tier">
            <Select value={addSubForm.planName} onChange={e => setAddSubForm(f => ({ ...f, planName: e.target.value }))}>
              <option value="Premium Fan">Premium Fan (1,500 XAF/mo)</option>
              <option value="Artist VIP">Artist VIP (5,000 XAF/mo)</option>
            </Select>
          </Field>
          <Field label="Amount Paid (XAF)"><Input type="number" placeholder="1500" value={addSubForm.amount} onChange={e => setAddSubForm(f => ({ ...f, amount: e.target.value }))} /></Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button className="admin-btn-action" onClick={() => setShowAddSubscription(false)}>Cancel</button>
            <button className="btn-camsound-yellow" onClick={async () => {
              if (!addSubForm.userId) return;
              try {
                await subscriptionsService.createSubscription({
                  userId: addSubForm.userId,
                  planName: addSubForm.planName || 'Premium Fan',
                  amount: Number(addSubForm.amount || 1500),
                  status: 'active'
                });
                showToast('Subscription granted successfully');
                setShowAddSubscription(false);
                fetchSubscriptions();
              } catch {
                showToast('Error granting subscription');
              }
            }}>
              Confirm Subscription
            </button>
          </div>
        </Modal>
      )}

      {/* Admin MoMo Gateway Diagnostic Test Modal */}
      {adminMomoTestModalOpen && (
        <MoMoPaymentModal
          isOpen={adminMomoTestModalOpen}
          onClose={() => setAdminMomoTestModalOpen(false)}
          mode="test"
          amount={2500}
          initialPhone="670000123"
          onSuccess={() => {
            showToast('MTN MoMo Gateway test transaction successful! Ledger synchronized.');
            fetchPayments();
          }}
        />
      )}

      {/* Admin MoMo Artist Payout Simulation Modal */}
      {adminWithdrawalToProcess && (
        <MoMoPaymentModal
          isOpen={Boolean(adminWithdrawalToProcess)}
          onClose={() => setAdminWithdrawalToProcess(null)}
          mode="withdrawal"
          amount={Number(adminWithdrawalToProcess.amount) || 5000}
          initialPhone={adminWithdrawalToProcess.momoNumber || ''}
          withdrawalId={adminWithdrawalToProcess._id}
          onSuccess={async () => {
            showToast(`MTN MoMo Payout of ${(adminWithdrawalToProcess.amount || 0).toLocaleString()} FCFA disbursed!`);
            setAdminWithdrawalToProcess(null);
            fetchWithdrawals();
          }}
        />
      )}
    </Layout>
  );
};

export default AdminDashboard;

