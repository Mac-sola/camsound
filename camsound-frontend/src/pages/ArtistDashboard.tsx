import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { statsService, songsService, artistsService, notificationsService, subscriptionsService, withdrawalsService } from '../services/api';
import { useSearchParams } from 'react-router-dom';

const ARTIST_NAV = [
  { label: 'Dashboard Overview', icon: 'fa-tachometer-alt', view: 'dashboard' },
  { label: 'Profile Management', icon: 'fa-user', view: 'profile' },
  { label: 'Music Uploads', icon: 'fa-music', view: 'music' },
  { label: 'Performance & Analytics', icon: 'fa-chart-line', view: 'analytics' },
  { label: 'Social Interaction', icon: 'fa-comments', view: 'social' },
  { label: 'Revenue & Royalties', icon: 'fa-dollar-sign', view: 'revenue' },
  { label: 'Subscription Plan', icon: 'fa-crown', view: 'subscription' },
  { label: 'Notifications', icon: 'fa-bell', view: 'notifications' },
];

const ArtistDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeView, setActiveView] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Upload form
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Afrobeat');
  const [songFile, setSongFile] = useState<File | null>(null);
  const [coverArt, setCoverArt] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  // Initialize activeView from URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveView(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await statsService.getArtistStats();
        if (res.data.success) setStats(res.data.data);
      } catch (_) {}
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  const fetchProfile = async () => { try { const res = await artistsService.getArtistMe(); if (res.data.success) setProfile(res.data.data); } catch (_) {} };
  const fetchPlans = async () => { try { const res = await subscriptionsService.getPlans(); if (res.data.success) setPlans(res.data.data); } catch (_) {} };
  const fetchWithdrawals = async () => { try { const res = await withdrawalsService.getWithdrawals(); if (res.data.success) setWithdrawals(res.data.data); } catch (_) {} };
  const fetchNotifications = async () => { try { const res = await notificationsService.getNotifications(); if (res.data.success) { setNotifications(res.data.data); } } catch (_) {} };

  useEffect(() => {
    if (activeView === 'profile') fetchProfile();
    else if (activeView === 'subscription') fetchPlans();
    else if (activeView === 'revenue') fetchWithdrawals();
    else if (activeView === 'notifications') fetchNotifications();
  }, [activeView]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      setUploadError('Please enter a track title');
      return;
    }
    if (!songFile) {
      setUploadError('Please select an audio file');
      return;
    }
    if (songFile.size > 50 * 1024 * 1024) {
      setUploadError('Audio file must be less than 50MB');
      return;
    }
    if (!songFile.type.startsWith('audio/')) {
      setUploadError('Please select a valid audio file (MP3, WAV, etc.)');
      return;
    }
    
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    
    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('genre', genre);
    fd.append('song_file', songFile);
    if (coverArt) {
      if (coverArt.type.startsWith('image/')) {
        fd.append('cover_art', coverArt);
      } else {
        setUploadError('Cover art must be an image file');
        setUploading(false);
        return;
      }
    }
    
    try {
      const res = await songsService.createSong(fd);
      if (res.data.success) {
        setUploadSuccess('✅ Track uploaded! It is now pending moderation.');
        setTitle('');
        setSongFile(null);
        setCoverArt(null);
        if (fileRef.current) fileRef.current.value = '';
        if (coverRef.current) coverRef.current.value = '';
        // Clear success message after 5 seconds
        setTimeout(() => setUploadSuccess(''), 5000);
      } else {
        setUploadError(res.data.message || 'Upload failed');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message ||
                      err.message ||
                      'Upload failed. Please try again.';
      setUploadError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const DashOverview = () => (
    <div>
      {/* Artist Profile Header */}
      <div style={{ background: 'var(--bg-green-section)', borderRadius: 16, padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '3px solid var(--accent-color)', zIndex: 2 }}>
          <i className="fas fa-user" style={{ color: '#555' }} />
        </div>
        <div style={{ zIndex: 2 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>Artist Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Manage your music and connect with fans</p>
        </div>
        <button className="btn-camsound-yellow" style={{ marginLeft: 'auto', zIndex: 2 }} onClick={() => setActiveView('profile')}>
          <i className="fas fa-edit" style={{ marginRight: 8 }} />Edit Profile
        </button>
        <div style={{ position: 'absolute', right: -80, top: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(250,204,21,0.05)' }} />
      </div>

      {/* Stats Cards */}
      <div className="stats-cards-grid">
        {[
          { label: 'Total Plays', value: loading ? '...' : stats?.totalPlays?.toLocaleString() ?? 0, icon: 'fa-headphones', color: '' },
          { label: 'Total Tracks', value: loading ? '...' : stats?.totalSongs ?? 0, icon: 'fa-music', color: '' },
          { label: 'Followers', value: loading ? '...' : stats?.followers ?? 0, icon: 'fa-users', color: 'green' },
          { label: 'Pending Revenue', value: 'XAF 0', icon: 'fa-dollar-sign', color: 'blue' },
        ].map(s => (
          <div key={s.label} className="stat-dash-card">
            <div className={`stat-dash-icon ${s.color}`}><i className={`fas ${s.icon}`} /></div>
            <div>
              <div className="stat-dash-label">{s.label}</div>
              <div className="stat-dash-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Tracks */}
      <div className="section-card">
        <div className="section-header">
          <h2><i className="fas fa-chart-bar" style={{ color: 'var(--accent-color)', marginRight: 10 }} />Your Top Tracks</h2>
          <button className="view-all-btn" onClick={() => setActiveView('music')}>
            All Tracks <i className="fas fa-arrow-right" />
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem' }} />
          </div>
        ) : !stats?.topSongs?.length ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <i className="fas fa-music" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 12, opacity: 0.4 }} />
            <p>You haven't uploaded any tracks yet.</p>
            <button className="btn-camsound-yellow" style={{ marginTop: 16 }} onClick={() => setActiveView('music')}>
              <i className="fas fa-upload" style={{ marginRight: 8 }} />Upload Your First Track
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.topSongs.map((song: any, idx: number) => (
              <div key={song._id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 12 }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-muted)', width: 24 }}>{idx + 1}</span>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0 }}>
                  {song.coverArt ? <img src={song.coverArt} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-music" style={{ color: 'var(--text-muted)' }} /></div>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{song.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{song.plays?.toLocaleString()} plays</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const UploadView = () => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="upload-form-card">
          <div className="upload-form-title">
            <i className="fas fa-upload" />Upload New Track
          </div>

          {uploadSuccess && (
            <div style={{ background: 'rgba(40,167,69,0.15)', border: '1px solid rgba(40,167,69,0.3)', color: '#51cf66', borderRadius: 8, padding: '12px 14px', marginBottom: 20, fontSize: '0.88rem' }}>
              {uploadSuccess}
            </div>
          )}
          {uploadError && (
            <div className="auth-error">{uploadError}</div>
          )}

          <form onSubmit={handleUpload}>
            <div className="form-field">
              <label>Track Title</label>
              <input type="text" placeholder="e.g. African Giant" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Genre</label>
              <select value={genre} onChange={e => setGenre(e.target.value)}>
                {['Afrobeat','Makossa','Bikutsi','Assiko','Hip Hop','R&B','Ndombolo','Highlife'].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Audio File (MP3 / WAV)</label>
              <input ref={fileRef} type="file" accept="audio/*" onChange={e => setSongFile(e.target.files?.[0] || null)} required />
            </div>
            <div className="form-field">
              <label>Cover Art (Optional)</label>
              <input ref={coverRef} type="file" accept="image/*" onChange={e => setCoverArt(e.target.files?.[0] || null)} />
            </div>
            <button type="submit" className="btn-camsound-yellow" style={{ width: '100%', marginTop: 8, justifyContent: 'center', borderRadius: 10 }} disabled={uploading}>
              {uploading ? <><i className="fas fa-spinner fa-spin" /> Uploading...</> : <><i className="fas fa-upload" /> Publish Track</>}
            </button>
          </form>
        </div>

        {/* Uploaded tracks */}
        <div className="section-card" style={{ alignSelf: 'start' }}>
          <div className="section-header"><h2>My Tracks</h2></div>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
          ) : !stats?.topSongs?.length ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              <i className="fas fa-music" style={{ fontSize: '2rem', opacity: 0.4, display: 'block', marginBottom: 12 }} />
              <p>No tracks uploaded yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.topSongs.map((song: any) => (
                <div key={song._id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {song.coverArt ? <img src={song.coverArt} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fas fa-music" style={{ color: 'var(--text-muted)' }} />}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{song.genre}</div>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(250,204,21,0.1)', color: 'var(--accent-color)', padding: '3px 10px', borderRadius: 999, fontWeight: 600 }}>
                    {song.status || 'active'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );



  return (
    <Layout
      navItems={ARTIST_NAV}
      activeView={activeView}
      onNavClick={(view) => {
        setActiveView(view);
        setSearchParams({ tab: view });
      }}
    >
      {activeView === 'dashboard' && <DashOverview />}
      {activeView === 'music' && <UploadView />}
      {/* Profile Management */}
      {activeView === 'profile' && profile && (
        <div className="section-card">
          <div className="section-header"><h2>Profile Management</h2></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'var(--bg-tertiary)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', color: 'var(--text-muted)' }}>
                {profile.name?.charAt(0) || 'A'}
              </div>
              <button className="btn-camsound-outline" style={{ width: '100%' }}>Change Avatar</button>
            </div>
            <div>
              <div className="form-field">
                <label>Artist Name</label>
                <input type="text" defaultValue={profile.name} className="search-input-db" />
              </div>
              <div className="form-field">
                <label>Genre</label>
                <input type="text" defaultValue={profile.genre} className="search-input-db" />
              </div>
              <div className="form-field">
                <label>Bio</label>
                <textarea rows={4} defaultValue={profile.bio} className="search-input-db" />
              </div>
              <button className="btn-camsound-yellow">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Performance & Analytics */}
      {activeView === 'analytics' && (
        <div>
          <div className="section-card" style={{ marginBottom: 24 }}>
            <div className="section-header"><h2>Performance Overview</h2></div>
            <div className="stats-cards-grid">
              <div className="stat-dash-card"><div className="stat-dash-label">Total Plays</div><div className="stat-dash-value">{stats?.totalPlays || 0}</div></div>
              <div className="stat-dash-card"><div className="stat-dash-label">Total Likes</div><div className="stat-dash-value">{stats?.totalLikes || 0}</div></div>
              <div className="stat-dash-card"><div className="stat-dash-label">Total Downloads</div><div className="stat-dash-value">{stats?.totalDownloads || 0}</div></div>
            </div>
            <div style={{ marginTop: 24, height: 200, background: 'var(--bg-tertiary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <i className="fas fa-chart-area" style={{ fontSize: '2rem', marginRight: 12 }} /> Play Trend Chart (30 Days)
            </div>
          </div>
        </div>
      )}

      {/* Social Interaction */}
      {activeView === 'social' && (
        <div className="section-card">
          <div className="section-header"><h2>Fan Interaction</h2></div>
          <p style={{ color: 'var(--text-muted)' }}>You have {stats?.followers || 0} followers.</p>
          <div style={{ marginTop: 24, padding: 32, textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: 12 }}>
            <i className="fas fa-comments" style={{ fontSize: '2rem', color: 'var(--text-muted)', marginBottom: 12 }} />
            <p>Comments and discussions will appear here.</p>
          </div>
        </div>
      )}

      {/* Revenue & Royalties */}
      {activeView === 'revenue' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="section-card">
            <div className="section-header"><h2>Available Balance</h2></div>
            <h1 style={{ color: 'var(--accent-color)', fontSize: '2.5rem', margin: '0 0 24px' }}>XAF 0</h1>
            <div className="form-field">
              <label>Mobile Money Number</label>
              <input type="text" placeholder="e.g. 670000000" className="search-input-db" />
            </div>
            <button className="btn-camsound-yellow" style={{ width: '100%' }}>Request Withdrawal</button>
          </div>
          <div className="section-card">
            <div className="section-header"><h2>Withdrawal History</h2></div>
            {withdrawals.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No withdrawals yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {withdrawals.map(w => (
                  <div key={w._id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>XAF {w.amount}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(w.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: w.status === 'completed' ? '#51cf66' : 'var(--text-muted)' }}>{w.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subscription Plan */}
      {activeView === 'subscription' && (
        <div className="section-card">
          <div className="section-header"><h2>Artist Subscription Plans</h2></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
            {plans.map(p => (
              <div key={p._id} style={{ padding: 24, background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 12px' }}>{p.name}</h3>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-color)', marginBottom: 24 }}>XAF {p.price}</div>
                <div style={{ color: 'var(--text-muted)', marginBottom: 24, minHeight: 60 }}>{p.description}</div>
                <button className="btn-camsound-outline" style={{ width: '100%' }}>Subscribe</button>
              </div>
            ))}
            {plans.length === 0 && <p>Loading plans...</p>}
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeView === 'notifications' && (
        <div className="section-card">
          <div className="section-header">
            <h2>Notifications</h2>
            {notifications.length > 0 && (
              <button className="btn-camsound-outline" style={{ padding: '6px 14px', fontSize: '0.82rem' }} onClick={async () => { await notificationsService.markAllRead(); fetchNotifications(); }}>
                Mark all as read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <i className="fas fa-bell-slash" style={{ fontSize: '2.5rem', opacity: 0.4, display: 'block', marginBottom: 12 }} />
              <p>No notifications yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notifications.map(n => (
                <div key={n._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: n.isRead ? 'var(--bg-tertiary)' : 'rgba(250,204,21,0.06)', border: '1px solid', borderColor: n.isRead ? 'var(--border-color)' : 'rgba(250,204,21,0.2)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <i className="fas fa-info-circle" style={{ color: n.isRead ? 'var(--text-muted)' : 'var(--accent-color)' }} />
                    <span style={{ fontSize: '0.9rem', color: n.isRead ? 'var(--text-light)' : 'var(--text-white)', fontWeight: n.isRead ? 400 : 600 }}>{n.message}</span>
                  </div>
                  {!n.isRead && <button className="view-all-btn" onClick={async () => { await notificationsService.markRead(n._id); fetchNotifications(); }}>Mark read</button>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default ArtistDashboard;
