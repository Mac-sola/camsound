import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { statsService, adminService, artistsService, paymentsService, withdrawalsService, adRevenueService, adminLogsService, featuredService, subscriptionsService } from '../services/api';

const ADMIN_NAV = [
  { label: 'Overview', icon: 'fa-tachometer-alt', view: 'overview' },
  { label: 'Users', icon: 'fa-users', view: 'users' },
  { label: 'Songs', icon: 'fa-music', view: 'songs' },
  { label: 'Artists', icon: 'fa-microphone', view: 'artists' },
  { label: 'Moderation Queue', icon: 'fa-shield-alt', view: 'moderation' },
  { label: 'Featured Content', icon: 'fa-star', view: 'featured' },
  { label: 'Subscription Plans', icon: 'fa-crown', view: 'plans' },
  { label: 'Payments', icon: 'fa-dollar-sign', view: 'payments' },
  { label: 'Ad Revenue', icon: 'fa-ad', view: 'adRevenue' },
  { label: 'Withdrawals', icon: 'fa-wallet', view: 'withdrawals' },
  { label: 'Reports', icon: 'fa-chart-bar', view: 'reports' },
  { label: 'Admin Logs', icon: 'fa-clipboard-list', view: 'logs' },
  { label: 'Settings', icon: 'fa-cog', view: 'settings' },
];


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
  const [planForm, setPlanForm] = useState<any>({ name: '', price: '', currency: 'XAF', period: '/month', description: '', features: '', isPopular: false });
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planMessage, setPlanMessage] = useState('');
  const [settingsForm, setSettingsForm] = useState({ platformName: 'CamSound', supportEmail: 'support@camsound.com', commissionRate: '15', maintenanceMode: 'off' });
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [stats, setStats] = useState<any>({ totalUsers: 0, totalArtists: 0, totalSongs: 0, totalRevenue: 0, userGrowth: [], userGrowthLabels: [], genreDistribution: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await statsService.getGlobalStats();
        if (res.data.success) setStats(res.data.data);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const fetchUsers = async () => { try { const res = await adminService.getUsers(); if (res.data.success) setUsers(res.data.data); } catch {} };
  const fetchSongs = async () => { try { const res = await adminService.getSongs(); if (res.data.success) setSongs(res.data.data); } catch {} };
  const fetchArtists = async () => { try { const res = await artistsService.getArtists(); if (res.data.success) setArtists(res.data.data); } catch {} };
  const fetchPayments = async () => { try { const res = await paymentsService.getPayments(); if (res.data.success) setPayments(res.data.data); } catch {} };
  const fetchWithdrawals = async () => { try { const res = await withdrawalsService.getWithdrawals(); if (res.data.success) setWithdrawals(res.data.data); } catch {} };
  const fetchAdRevenue = async () => { try { const res = await adRevenueService.getAdRevenue(); if (res.data.success) setAdRevenue(res.data.data); } catch {} };
  const fetchFeatured = async () => { try { const res = await featuredService.getFeatured(); if (res.data.success) setFeaturedList(res.data.data); } catch {} };
  const fetchAdminLogs = async () => { try { const res = await adminLogsService.getLogs(); if (res.data.success) setAdminLogs(res.data.data); } catch {} };
  const fetchReports = async () => { try { const res = await adminService.getReports(); if (res.data.success) setReports(res.data.data); } catch {} };
  const fetchPlans = async () => { try { const res = await subscriptionsService.getPlans(); if (res.data.success) setPlans(res.data.data); } catch {} };
  const fetchSettings = async () => {
    try {
      const res = await adminService.getSettings();
      if (res.data.success && res.data.data) {
        const s = res.data.data;
        setSettingsForm({
          platformName: s.platformName || s.platform_name || 'CamSound',
          supportEmail: s.supportEmail || s.support_email || 'support@camsound.com',
          commissionRate: String(s.commissionRate || s.commission_rate || '15'),
          maintenanceMode: s.maintenanceMode || s.maintenance_mode || 'off',
        });
      }
    } catch {}
  };
  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    setSettingsMessage('');
    try {
      const res = await adminService.updateSettings(settingsForm);
      if (res.data.success) {
        setSettingsMessage('✅ Settings saved successfully.');
      } else {
        setSettingsMessage(res.data.message || 'Failed to save settings.');
      }
    } catch (err: any) {
      setSettingsMessage(err.response?.data?.message || 'Error saving settings.');
    } finally {
      setSettingsSaving(false);
      setTimeout(() => setSettingsMessage(''), 4000);
    }
  };

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
  }, [activeView]);

  const OverviewView = () => (
    <div>
      {/* Stats Grid */}
      <div className="stats-cards-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total Users', value: stats?.totalUsers, icon: 'fa-users', color: '' },
          { label: 'Total Artists', value: stats?.totalArtists, icon: 'fa-microphone', color: 'green' },
          { label: 'Total Songs', value: stats?.totalSongs, icon: 'fa-music', color: '' },
          { label: 'Total Revenue', value: `XAF ${stats?.totalRevenue ?? 0}`, icon: 'fa-dollar-sign', color: 'blue' },
        ].map(s => (
          <div key={s.label} className="stat-dash-card">
            <div className={`stat-dash-icon ${s.color}`}><i className={`fas ${s.icon}`} /></div>
            <div>
              <div className="stat-dash-label">{s.label}</div>
              <div className="stat-dash-value">{loading ? '...' : s.value?.toLocaleString() ?? 0}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* User Growth Bar Chart */}
        <div className="section-card">
          <div className="section-header">
            <h2><i className="fas fa-chart-line" style={{ color: 'var(--accent-color)', marginRight: 10 }} />User Growth</h2>
          </div>
          <div className="bar-chart-container">
            {stats?.userGrowth?.map((val: number, i: number) => {
              const max = Math.max(...(stats.userGrowth || [1]), 1);
              const h = (val / max) * 100;
              return (
                <div key={i} className="bar-col">
                  <div className="bar-fill" style={{ height: `${h}%` }} />
                  <div className="bar-label">{stats.userGrowthLabels?.[i]}</div>
                </div>
              );
            }) ?? (
              Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="bar-col">
                  <div className="bar-fill" style={{ height: '5%', background: 'var(--bg-tertiary)' }} />
                  <div className="bar-label">—</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Moderation Queue */}
        <div className="section-card">
          <div className="section-header">
            <h2><i className="fas fa-shield-alt" style={{ color: '#F59E0B', marginRight: 10 }} />Moderation Queue</h2>
            <button className="view-all-btn" onClick={() => setActiveView('moderation')}>
              View All <i className="fas fa-arrow-right" />
            </button>
          </div>
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <i className="fas fa-check-circle" style={{ fontSize: '2.5rem', color: '#30d158', display: 'block', marginBottom: 12 }} />
            <p>No songs pending moderation.</p>
          </div>
        </div>
      </div>

      {/* Genre Distribution */}
      {stats?.genreDistribution?.length > 0 && (
        <div className="section-card">
          <div className="section-header"><h2>Genre Distribution</h2></div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {stats.genreDistribution.map((g: any) => (
              <div key={g.label} style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>{g.label}</span>
                <span style={{ fontSize: '0.8rem', background: 'rgba(250,204,21,0.1)', color: 'var(--accent-color)', padding: '2px 8px', borderRadius: 999 }}>{g.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );



  return (
    <Layout
      navItems={ADMIN_NAV}
      activeView={activeView}
      onNavClick={setActiveView}
    >
      {activeView === 'overview' && <OverviewView />}
      {/* Users View */}
      {activeView === 'users' && (
        <div className="section-card">
          <div className="section-header"><h2>Users Management</h2></div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Name</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Email</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Role</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 8px' }}>{u.name}</td>
                  <td style={{ padding: '12px 8px' }}>{u.email}</td>
                  <td style={{ padding: '12px 8px' }}>{u.type}</td>
                  <td style={{ padding: '12px 8px' }}><span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem', background: u.status === 'active' ? 'rgba(81, 207, 102, 0.1)' : 'rgba(255, 107, 107, 0.1)', color: u.status === 'active' ? '#51cf66' : '#ff6b6b' }}>{u.status}</span></td>
                  <td style={{ padding: '12px 8px' }}>
                    <button className="btn-camsound-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', marginRight: 8 }} onClick={async () => { await adminService.updateUserStatus(u._id, u.status === 'active' ? 'blocked' : 'active'); fetchUsers(); }}>{u.status === 'active' ? 'Block' : 'Unblock'}</button>
                    <button className="btn-camsound-outline" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={async () => { if (window.confirm('Delete user?')) { await adminService.deleteUser(u._id); fetchUsers(); } }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Songs & Moderation View */}
      {(activeView === 'songs' || activeView === 'moderation') && (
        <div className="section-card">
          <div className="section-header"><h2>{activeView === 'moderation' ? 'Moderation Queue' : 'All Songs'}</h2></div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Title</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Artist</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Genre</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {songs.filter(s => activeView === 'moderation' ? s.moderationStatus === 'pending' : true).map(s => (
                <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 600 }}>{s.title}</td>
                  <td style={{ padding: '12px 8px' }}>{s.artistId?.name || 'Unknown'}</td>
                  <td style={{ padding: '12px 8px' }}>{s.genre}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem', background: s.moderationStatus === 'approved' ? 'rgba(81, 207, 102, 0.1)' : s.moderationStatus === 'rejected' ? 'rgba(255, 107, 107, 0.1)' : 'rgba(250, 204, 21, 0.1)', color: s.moderationStatus === 'approved' ? '#51cf66' : s.moderationStatus === 'rejected' ? '#ff6b6b' : '#facc15' }}>
                      {s.moderationStatus}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {s.moderationStatus === 'pending' && (
                      <>
                        <button className="btn-camsound-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', marginRight: 8, borderColor: '#51cf66', color: '#51cf66' }} onClick={async () => { await adminService.moderateSong(s._id, { moderationStatus: 'approved', status: 'active' }); fetchSongs(); }}>Approve</button>
                        <button className="btn-camsound-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', borderColor: '#ff6b6b', color: '#ff6b6b' }} onClick={async () => { await adminService.moderateSong(s._id, { moderationStatus: 'rejected', status: 'inactive' }); fetchSongs(); }}>Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {songs.filter(s => activeView === 'moderation' ? s.moderationStatus === 'pending' : true).length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <p>No songs {activeView === 'moderation' && 'pending moderation'}.</p>
            </div>
          )}
        </div>
      )}

      {/* Artists View */}
      {activeView === 'artists' && (
        <div className="section-card">
          <div className="section-header"><h2>Artists Directory</h2></div>
          <div className="cards-grid">
            {artists.map(a => {
              const isVerified = a.verification === 'approved' || a.status === 'verified';
              const isPending = a.verification === 'pending';
              return (
                <div key={a._id} className="music-card" style={{ padding: 16, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-tertiary)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {a.image ? <img src={a.image} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : <i className="fas fa-user" style={{ fontSize: '1.8rem', color: 'var(--text-muted)' }} />}
                      {isVerified && <i className="fas fa-check-circle" style={{ position: 'absolute', bottom: 2, right: 2, color: '#4ade80', background: 'var(--bg-primary)', borderRadius: '50%', fontSize: '1.1rem' }} />}
                    </div>
                    <h4 style={{ margin: '0 0 4px' }}>{a.name}</h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.genre || 'Afrobeat'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>{a.followers || 0} followers</div>
                    <div style={{ marginBottom: 12 }}>
                      {isVerified ? (
                        <span style={{ fontSize: '0.75rem', background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '3px 10px', borderRadius: 999, fontWeight: 600 }}>Verified</span>
                      ) : isPending ? (
                        <span style={{ fontSize: '0.75rem', background: 'rgba(250,204,21,0.15)', color: 'var(--accent-color)', padding: '3px 10px', borderRadius: 999, fontWeight: 600 }}>Verification Pending</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', padding: '3px 10px', borderRadius: 999 }}>Unverified</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, width: '100%', justifyContent: 'center' }}>
                    {!isVerified ? (
                      <button className="btn-camsound-yellow" style={{ fontSize: '0.78rem', padding: '5px 12px', width: '100%' }}
                        onClick={async () => {
                          await artistsService.updateArtist(a._id, { verification: 'approved', status: 'verified' });
                          fetchArtists();
                        }}>
                        Approve Verification
                      </button>
                    ) : (
                      <button className="btn-camsound-outline" style={{ fontSize: '0.78rem', padding: '5px 12px', width: '100%', borderColor: 'rgba(239,68,68,0.4)', color: '#f87171' }}
                        onClick={async () => {
                          await artistsService.updateArtist(a._id, { verification: 'rejected', status: 'pending' });
                          fetchArtists();
                        }}>
                        Revoke Status
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payments & Withdrawals */}
      {(activeView === 'payments' || activeView === 'withdrawals') && (
        <div className="section-card">
          <div className="section-header"><h2>{activeView === 'payments' ? 'Payments' : 'Withdrawals'}</h2></div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Date</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Amount</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Status</th>
                {activeView === 'withdrawals' && <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {(activeView === 'payments' ? payments : withdrawals).map((item: any) => (
                <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 8px' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 8px', fontWeight: 600 }}>XAF {item.amount}</td>
                  <td style={{ padding: '12px 8px' }}><span style={{ fontSize: '0.8rem', color: item.status === 'completed' ? '#51cf66' : 'var(--text-muted)' }}>{item.status}</span></td>
                  {activeView === 'payments' && (
                    <td style={{ padding: '12px 8px' }}>
                      {item.status === 'pending' && (
                        <>
                          <button className="btn-camsound-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', marginRight: 8 }} onClick={async () => { await paymentsService.updatePaymentStatus(item._id, { status: 'completed' }); fetchPayments(); }}>Complete</button>
                          <button className="btn-camsound-outline" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={async () => { await paymentsService.updatePaymentStatus(item._id, { status: 'failed' }); fetchPayments(); }}>Fail</button>
                        </>
                      )}
                    </td>
                  )}
                  {activeView === 'withdrawals' && (
                    <td style={{ padding: '12px 8px' }}>
                      {item.status === 'pending' && (
                        <button className="btn-camsound-outline" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={async () => { await withdrawalsService.updateWithdrawal(item._id, { status: 'completed' }); fetchWithdrawals(); }}>Mark Paid</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Featured View */}
      {activeView === 'featured' && (
        <div className="section-card">
          <div className="section-header"><h2>Featured Content</h2></div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <input placeholder="Title" value={featuredForm.title} onChange={e => setFeaturedForm((prev: any) => ({ ...prev, title: e.target.value }))} />
            <input placeholder="Image URL" value={featuredForm.image} onChange={e => setFeaturedForm((prev: any) => ({ ...prev, image: e.target.value }))} />
            <input placeholder="Link (optional)" value={featuredForm.link} onChange={e => setFeaturedForm((prev: any) => ({ ...prev, link: e.target.value }))} />
            <input placeholder="Short description" value={featuredForm.description} onChange={e => setFeaturedForm((prev: any) => ({ ...prev, description: e.target.value }))} />
            <button className="btn-camsound-yellow" onClick={async () => {
              try {
                if (editingFeaturedId) {
                  await featuredService.updateFeatured(editingFeaturedId, featuredForm);
                  await adminLogsService.createLog({ action: 'Updated Featured', details: featuredForm.title });
                  setEditingFeaturedId(null);
                } else {
                  const r = await featuredService.createFeatured(featuredForm);
                  if (r.data?.success) await adminLogsService.createLog({ action: 'Created Featured', details: r.data.data.title });
                }
                setFeaturedForm({ title: '', description: '', image: '', link: '' });
                fetchFeatured();
              } catch (err) { console.error(err); }
            }}>{editingFeaturedId ? 'Update' : 'Create'}</button>
            {editingFeaturedId && <button className="btn-camsound-outline" onClick={() => { setEditingFeaturedId(null); setFeaturedForm({ title: '', description: '', image: '', link: '' }); }}>Cancel</button>}
          </div>
          {featuredList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No featured items yet.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {featuredList.map(f => (
                <div key={f._id} style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {f.image && <img src={f.image} style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 6 }} />}
                    <div>
                      <div style={{ fontWeight: 700 }}>{f.title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{f.description}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-camsound-outline" onClick={() => { setEditingFeaturedId(f._id); setFeaturedForm({ title: f.title || '', description: f.description || '', image: f.image || '', link: f.link || '' }); }}>Edit</button>
                    <button className="btn-camsound-outline" onClick={async () => { if (window.confirm('Delete featured item?')) { await featuredService.deleteFeatured(f._id); await adminLogsService.createLog({ action: 'Deleted Featured', details: f.title }); fetchFeatured(); } }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ad Revenue View */}
      {activeView === 'adRevenue' && (
        <div className="section-card">
          <div className="section-header"><h2>Ad Revenue</h2></div>
          <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
            <input type="date" value={adForm.date} onChange={e => setAdForm((prev: any) => ({ ...prev, date: e.target.value }))} />
            <input placeholder="Source" value={adForm.source} onChange={e => setAdForm((prev: any) => ({ ...prev, source: e.target.value }))} />
            <input placeholder="Amount" value={adForm.amount} onChange={e => setAdForm((prev: any) => ({ ...prev, amount: e.target.value }))} />
            <input placeholder="Description" value={adForm.description} onChange={e => setAdForm((prev: any) => ({ ...prev, description: e.target.value }))} />
            <button className="btn-camsound-yellow" onClick={async () => {
              try {
                if (editingAdId) {
                  await adRevenueService.updateAdRevenue(editingAdId, adForm);
                  await adminLogsService.createLog({ action: 'Updated AdRevenue', details: `Updated ${adForm.source} (${adForm.amount})` });
                  setEditingAdId(null);
                } else {
                  const r = await adRevenueService.createAdRevenue(adForm);
                  if (r.data?.success) await adminLogsService.createLog({ action: 'Created AdRevenue', details: `${r.data.data.source} (${r.data.data.amount})` });
                }
                setAdForm({ date: '', source: '', amount: '', description: '' });
                fetchAdRevenue();
              } catch (err) { console.error(err); }
            }}>{editingAdId ? 'Update' : 'Create'}</button>
            {editingAdId && <button className="btn-camsound-outline" onClick={() => { setEditingAdId(null); setAdForm({ date: '', source: '', amount: '', description: '' }); }}>Cancel</button>}
          </div>
          {adRevenue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <p>No ad revenue entries yet.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Date</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Source</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Amount</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Description</th>
                  <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adRevenue.map(a => (
                  <tr key={a._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 8px' }}>{new Date(a.date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 8px' }}>{a.source}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>XAF {a.amount}</td>
                    <td style={{ padding: '12px 8px' }}>{a.description || '-'}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <button className="btn-camsound-outline" onClick={() => { setEditingAdId(a._id); setAdForm({ date: a.date ? new Date(a.date).toISOString().slice(0,10) : '', source: a.source || '', amount: a.amount || '', description: a.description || '' }); }}>Edit</button>
                      <button className="btn-camsound-outline" onClick={async () => { if (window.confirm('Delete ad revenue entry?')) { await adRevenueService.deleteAdRevenue(a._id); await adminLogsService.createLog({ action: 'Deleted AdRevenue', details: `${a.source} (${a.amount})` }); fetchAdRevenue(); } }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Admin Logs View */}
      {activeView === 'logs' && (
        <div className="section-card">
          <div className="section-header"><h2>Admin Activity Logs</h2></div>
          {adminLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <p>No admin logs yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {adminLogs.map(l => (
                <div key={l._id} style={{ padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{l.action}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{l.details}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <div>{l.adminId?.name || 'Admin'}</div>
                    <div>{new Date(l.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reports View */}
      {activeView === 'reports' && (
        <div className="section-card">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Reports & Violations</h2>
            <button
              className="btn-camsound-yellow"
              style={{ fontSize: '0.85rem', padding: '6px 14px' }}
              onClick={() => {
                const rows = [
                  ['Type', 'Item ID', 'Reason', 'Status', 'Date'],
                  ...reports.map((r: any) => [
                    `"${r.type || ''}"`,
                    `"${r.itemId || ''}"`,
                    `"${(r.reason || '').replace(/"/g, '""')}"`,
                    `"${r.status || 'pending'}"`,
                    `"${r.createdAt ? new Date(r.createdAt).toISOString() : ''}"`,
                  ]),
                ];
                const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `camsound_reports_${new Date().toISOString().slice(0, 10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <i className="fas fa-file-csv" style={{ marginRight: 6 }} /> Export CSV
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Type</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Reported Item</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Reason</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No reports yet</td>
                </tr>
              ) : (
                reports.map((r: any) => (
                  <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 8px' }}>{r.type}</td>
                    <td style={{ padding: '12px 8px' }}>{r.itemId}</td>
                    <td style={{ padding: '12px 8px' }}>{r.reason}</td>
                    <td style={{ padding: '12px 8px' }}><span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem', background: 'rgba(250,204,21,0.1)', color: 'var(--accent-color)' }}>{r.status || 'pending'}</span></td>
                    <td style={{ padding: '12px 8px' }}>
                      <button className="btn-camsound-outline" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={async () => { await adminService.updateReport(r._id, 'resolved'); fetchReports(); }}>Resolve</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Settings View */}
      {activeView === 'settings' && (
        <div className="section-card">
          <div className="section-header"><h2>Platform Settings</h2></div>
          {settingsMessage && (
            <div style={{ marginTop: 16, padding: '10px 16px', borderRadius: 8, background: settingsMessage.startsWith('✅') ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: settingsMessage.startsWith('✅') ? '#4ade80' : '#f87171', fontSize: '0.9rem' }}>
              {settingsMessage}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Platform Name</label>
              <input
                type="text"
                value={settingsForm.platformName}
                onChange={e => setSettingsForm(f => ({ ...f, platformName: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Support Email</label>
              <input
                type="email"
                value={settingsForm.supportEmail}
                onChange={e => setSettingsForm(f => ({ ...f, supportEmail: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Commission Rate (%)</label>
              <input
                type="number"
                value={settingsForm.commissionRate}
                onChange={e => setSettingsForm(f => ({ ...f, commissionRate: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Maintenance Mode</label>
              <select
                value={settingsForm.maintenanceMode}
                onChange={e => setSettingsForm(f => ({ ...f, maintenanceMode: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'white' }}
              >
                <option value="off">Off</option>
                <option value="on">On</option>
              </select>
            </div>
          </div>
          <button
            className="btn-camsound-yellow"
            style={{ marginTop: 24, padding: '10px 24px' }}
            onClick={handleSaveSettings}
            disabled={settingsSaving}
          >
            {settingsSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}

      {/* Subscription Plans View */}
      {activeView === 'plans' && (
        <div className="section-card">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Subscription Plans</h2>
          </div>

          {/* Add / Edit Plan Form */}
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 24, marginTop: 24, border: '1px solid var(--border-color)' }}>
            <h4 style={{ marginBottom: 16, color: 'var(--text-white)' }}>{editingPlanId ? 'Edit Plan' : 'Add New Plan'}</h4>
            {planMessage && (
              <div style={{ marginBottom: 12, padding: '8px 14px', borderRadius: 8, background: planMessage.startsWith('✅') ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: planMessage.startsWith('✅') ? '#4ade80' : '#f87171', fontSize: '0.88rem' }}>
                {planMessage}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Plan Name</label>
                <input type="text" placeholder="e.g. Artist Pro" value={planForm.name} onChange={e => setPlanForm((f: any) => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'white', fontSize: '0.9rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Price (XAF)</label>
                <input type="number" placeholder="5000" value={planForm.price} onChange={e => setPlanForm((f: any) => ({ ...f, price: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'white', fontSize: '0.9rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Period</label>
                <select value={planForm.period} onChange={e => setPlanForm((f: any) => ({ ...f, period: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'white', fontSize: '0.9rem' }}>
                  <option value="/month">/month</option>
                  <option value="/year">/year</option>
                  <option value="/forever">/forever</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Features (comma-separated)</label>
                <input type="text" placeholder="Unlimited uploads, Analytics, MoMo Payouts" value={planForm.features} onChange={e => setPlanForm((f: any) => ({ ...f, features: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'white', fontSize: '0.9rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Description</label>
                <input type="text" placeholder="Short description" value={planForm.description} onChange={e => setPlanForm((f: any) => ({ ...f, description: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'white', fontSize: '0.9rem' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 22 }}>
                <input type="checkbox" id="planPopular" checked={planForm.isPopular} onChange={e => setPlanForm((f: any) => ({ ...f, isPopular: e.target.checked }))} />
                <label htmlFor="planPopular" style={{ color: 'var(--text-light)', fontSize: '0.9rem', cursor: 'pointer' }}>Mark as Popular</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="btn-camsound-yellow" style={{ padding: '9px 24px' }} onClick={async () => {
                setPlanMessage('');
                try {
                  const payload = { ...planForm, price: Number(planForm.price), features: planForm.features.split(',').map((f: string) => f.trim()).filter(Boolean) };
                  if (editingPlanId) {
                    await subscriptionsService.updatePlan(editingPlanId, payload);
                    setPlanMessage('✅ Plan updated successfully.');
                  } else {
                    await subscriptionsService.createPlan(payload);
                    setPlanMessage('✅ Plan created successfully.');
                  }
                  setPlanForm({ name: '', price: '', currency: 'XAF', period: '/month', description: '', features: '', isPopular: false });
                  setEditingPlanId(null);
                  await fetchPlans();
                } catch (err: any) { setPlanMessage(err.response?.data?.message || 'Failed to save plan.'); }
                setTimeout(() => setPlanMessage(''), 4000);
              }}>
                {editingPlanId ? 'Update Plan' : 'Add Plan'}
              </button>
              {editingPlanId && (
                <button className="btn-camsound-outline" style={{ padding: '9px 24px' }} onClick={() => { setEditingPlanId(null); setPlanForm({ name: '', price: '', currency: 'XAF', period: '/month', description: '', features: '', isPopular: false }); }}>Cancel</button>
              )}
            </div>
          </div>

          {/* Plans Table */}
          <div style={{ overflowX: 'auto', marginTop: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Plan Name', 'Price', 'Period', 'Features', 'Popular', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 8px', color: 'var(--text-muted)', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No plans yet. Add one above.</td></tr>
                ) : plans.map((p: any) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      {p.isPopular && <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', background: 'rgba(250,204,21,0.15)', color: 'var(--accent-color)' }}>POPULAR</span>}
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--accent-color)', fontWeight: 700 }}>XAF {Number(p.price).toLocaleString()}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{p.period || '/month'}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {Array.isArray(p.features) ? p.features.slice(0, 2).join(', ') + (p.features.length > 2 ? '...' : '') : p.features}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {p.isPopular ? <i className="fas fa-check" style={{ color: '#4ade80' }} /> : <i className="fas fa-times" style={{ color: 'var(--text-muted)' }} />}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-camsound-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => {
                          setEditingPlanId(p._id);
                          setPlanForm({ name: p.name, price: String(p.price), currency: p.currency || 'XAF', period: p.period || '/month', description: p.description || '', features: Array.isArray(p.features) ? p.features.join(', ') : p.features || '', isPopular: p.isPopular || false });
                        }}>Edit</button>
                        <button style={{ padding: '4px 12px', fontSize: '0.8rem', background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, cursor: 'pointer' }}
                          onClick={async () => { if (!confirm(`Delete plan "${p.name}"?`)) return; await subscriptionsService.deletePlan(p._id); fetchPlans(); }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;

