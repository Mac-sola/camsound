import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { statsService, adminService, artistsService, paymentsService, withdrawalsService, adRevenueService, adminLogsService, featuredService } from '../services/api';

const ADMIN_NAV = [
  { label: 'Overview', icon: 'fa-tachometer-alt', view: 'overview' },
  { label: 'Users', icon: 'fa-users', view: 'users' },
  { label: 'Songs', icon: 'fa-music', view: 'songs' },
  { label: 'Artists', icon: 'fa-microphone', view: 'artists' },
  { label: 'Moderation Queue', icon: 'fa-shield-alt', view: 'moderation' },
  { label: 'Payments', icon: 'fa-dollar-sign', view: 'payments' },
  { label: 'Ad Revenue', icon: 'fa-ad', view: 'adRevenue' },
  { label: 'Withdrawals', icon: 'fa-wallet', view: 'withdrawals' },
  { label: 'Admin Logs', icon: 'fa-clipboard-list', view: 'logs' },
  { label: 'Reports', icon: 'fa-chart-bar', view: 'reports' },
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
  const [, setSettings] = useState<any>(null);
  const [stats, setStats] = useState<any>({ totalUsers: 0, totalArtists: 0, totalSongs: 0, totalRevenue: 0, userGrowth: [], userGrowthLabels: [], genreDistribution: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await statsService.getGlobalStats();
        if (res.data.success) setStats(res.data.data);
      } catch (_) {
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const fetchUsers = async () => { try { const res = await adminService.getUsers(); if (res.data.success) setUsers(res.data.data); } catch (_) {} };
  const fetchSongs = async () => { try { const res = await adminService.getSongs(); if (res.data.success) setSongs(res.data.data); } catch (_) {} };
  const fetchArtists = async () => { try { const res = await artistsService.getArtists(); if (res.data.success) setArtists(res.data.data); } catch (_) {} };
  const fetchPayments = async () => { try { const res = await paymentsService.getPayments(); if (res.data.success) setPayments(res.data.data); } catch (_) {} };
  const fetchWithdrawals = async () => { try { const res = await withdrawalsService.getWithdrawals(); if (res.data.success) setWithdrawals(res.data.data); } catch (_) {} };
  const fetchAdRevenue = async () => { try { const res = await adRevenueService.getAdRevenue(); if (res.data.success) setAdRevenue(res.data.data); } catch (_) {} };
  const fetchFeatured = async () => { try { const res = await featuredService.getFeatured(); if (res.data.success) setFeaturedList(res.data.data); } catch (_) {} };
  const fetchAdminLogs = async () => { try { const res = await adminLogsService.getLogs(); if (res.data.success) setAdminLogs(res.data.data); } catch (_) {} };
  const fetchReports = async () => { try { const res = await adminService.getReports(); if (res.data.success) setReports(res.data.data); } catch (_) {} };
  const fetchSettings = async () => { try { const res = await adminService.getSettings(); if (res.data.success) setSettings(res.data.data); } catch (_) {} };

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
            {artists.map(a => (
              <div key={a._id} className="music-card" style={{ padding: 16, textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-tertiary)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {a.image ? <img src={a.image} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : <i className="fas fa-user" />}
                </div>
                <h4 style={{ margin: '0 0 4px' }}>{a.name}</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.genre}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.followers} followers</div>
                {a.verification === 'verified' && <i className="fas fa-check-circle" style={{ color: '#1da1f2', marginTop: 8 }} />}
              </div>
            ))}
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
          <div className="section-header"><h2>Reports & Violations</h2></div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Platform Name</label>
              <input type="text" defaultValue="CamSound" style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Support Email</label>
              <input type="email" defaultValue="support@camsound.com" style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Commission Rate (%)</label>
              <input type="number" defaultValue="15" style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Maintenance Mode</label>
              <select style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'white' }}>
                <option>Off</option>
                <option>On</option>
              </select>
            </div>
          </div>
          <button className="btn-camsound-yellow" style={{ marginTop: 24, padding: '10px 24px' }}>Save Settings</button>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;
