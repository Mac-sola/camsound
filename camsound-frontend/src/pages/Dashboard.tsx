import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { songsService, notificationsService, favoritesService, playlistsService, historyService, followsService, authService, featuredService, notificationSettingsService, categoriesService } from '../services/api';

const FAN_NAV = [
  { section: 'Discover' },
  { label: 'Home', icon: 'fa-home', view: 'discover' },
  { label: 'Browse', icon: 'fa-search', view: 'browse' },
  { label: 'Genres', icon: 'fa-tags', view: 'genres' },
  { label: 'Community', icon: 'fa-users', view: 'community' },
  { section: 'Your Library' },
  { label: 'My Music', icon: 'fa-music', view: 'mymusic' },
  { label: 'Playlists', icon: 'fa-list', view: 'playlists' },
  { label: 'History', icon: 'fa-history', view: 'history' },
  { label: 'Following', icon: 'fa-user-friends', view: 'following' },
  { section: 'Account' },
  { label: 'Notifications', icon: 'fa-bell', view: 'notifications' },
  { label: 'Profile', icon: 'fa-user', view: 'profile' },
  { label: 'Settings', icon: 'fa-cog', view: 'settings' },
];

const GENRES = ['Makossa', 'Afrobeat', 'Bikutsi', 'Assiko', 'Ndombolo', 'Hip Hop', 'R&B', 'Zouk'];

const Dashboard: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { playSong } = useAudio();
  const [activeView, setActiveView] = useState('discover');
  const [searchValue, setSearchValue] = useState('');
  const [songs, setSongs] = useState<any[]>([]);
  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>(GENRES);
  const [notifSettings, setNotifSettings] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', country: '', bio: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchFavorites = async () => { try { const res = await favoritesService.getFavorites(); if (res.data.success) setFavorites(res.data.data); } catch (_) {} };
  const fetchPlaylists = async () => { try { const res = await playlistsService.getPlaylists(); if (res.data.success) setPlaylists(res.data.data); } catch (_) {} };
  const fetchHistory = async () => { try { const res = await historyService.getHistory(); if (res.data.success) setHistory(res.data.data); } catch (_) {} };
  const fetchFollowing = async () => { try { const res = await followsService.getFollowing(); if (res.data.success) setFollowing(res.data.data); } catch (_) {} };
  const fetchProfile = async () => {
    try {
      const res = await authService.getProfile();
      if (res.data.success) setProfile(res.data.data);
    } catch (_) {
    }
  };

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        phone: profile.phone || '',
        country: profile.country || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const handleProfileFormChange = (field: string, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      const res = await authService.updateProfile(profileForm);
      if (res.data.success) {
        const updatedUser = res.data.user;
        setProfile(updatedUser);
        if (user) {
          updateUser({
            ...user,
            name: updatedUser.name,
            country: updatedUser.country,
            avatar: updatedUser.avatar,
            bio: updatedUser.bio,
          });
        }
        setIsEditingProfile(false);
      }
    } catch (error) {
      // Leave the form open so the user can retry
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCancelProfileEdit = () => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        phone: profile.phone || '',
        country: profile.country || '',
        bio: profile.bio || '',
      });
    }
    setIsEditingProfile(false);
  };

  const fetchNotifications = async () => {
    try {
      const res = await notificationsService.getNotifications();
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (_) {}
  };

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await songsService.getSongs({ limit: 12 });
        if (res.data.success) {
          setSongs(res.data.data);
          setAllSongs(res.data.data);
        }
      } catch (err) {
        // If backend is offline, show placeholder state
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
    fetchNotifications();
    // fetch featured
    (async () => {
      try {
        const r = await featuredService.getFeatured();
        if (r.data.success) setFeatured(r.data.data);
      } catch (_) {}
      try {
        const c = await categoriesService.getCategories();
        if (c.data.success) setCategories(c.data.data.map((x: any) => x.name));
      } catch (_) {}
      try {
        const s = await notificationSettingsService.getSettings();
        if (s.data.success) setNotifSettings(s.data.data);
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    if (activeView === 'notifications') fetchNotifications();
    else if (activeView === 'mymusic') fetchFavorites();
    else if (activeView === 'playlists') fetchPlaylists();
    else if (activeView === 'history') fetchHistory();
    else if (activeView === 'following') fetchFollowing();
    else if (activeView === 'profile') fetchProfile();
  }, [activeView]);

  const filteredSongs = allSongs.filter(s => {
    const q = searchValue.toLowerCase();
    return s.title?.toLowerCase().includes(q) || s.artistId?.name?.toLowerCase().includes(q);
  });

  const SongCard = ({ song }: { song: any }) => (
    <div className="music-card" onClick={() => playSong(song)}>
      <div className="music-card-cover">
        {song.coverArt
          ? <img src={song.coverArt} alt={song.title} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-green-section)' }}>
              <i className="fas fa-music" style={{ fontSize: '2rem', color: 'var(--accent-color)' }} />
            </div>}
        <div className="play-overlay">
          <button className="play-circle-btn"><i className="fas fa-play" /></button>
        </div>
      </div>
      <div className="music-card-info">
        <div className="music-card-title">{song.title}</div>
        <div className="music-card-artist">{song.artistId?.name || 'Unknown Artist'}</div>
      </div>
    </div>
  );

  const SkeletonCard = () => (
    <div className="music-card">
      <div className="skeleton" style={{ width: '100%', aspectRatio: '1/1' }} />
      <div style={{ padding: 12 }}>
        <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: '55%' }} />
      </div>
    </div>
  );

  return (
    <Layout
      navItems={FAN_NAV}
      activeView={activeView}
      onNavClick={setActiveView}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      notifCount={unreadCount}
    >
      {/* Discover View */}
      {activeView === 'discover' && (
        <div>
          {/* Hero Welcome */}
          <div className="hero-welcome">
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h1 id="welcomeMessage">Welcome back, {user?.name?.split(' ')[0] || 'there'}! 🎵</h1>
              <p>Discover the best of Cameroonian music — from traditional rhythms to modern beats.</p>
              <div className="hero-stats">
                <div>
                  <span className="hero-stat-value">0</span>
                  <span className="hero-stat-label">Plays Today</span>
                </div>
                <div>
                  <span className="hero-stat-value">{songs.length}</span>
                  <span className="hero-stat-label">New Releases</span>
                </div>
                <div>
                  <span className="hero-stat-value">0</span>
                  <span className="hero-stat-label">Trending Artists</span>
                </div>
              </div>
            </div>
            <div style={{ position: 'absolute', right: -40, top: -40, width: 250, height: 250, borderRadius: '50%', background: 'rgba(250,204,21,0.05)', zIndex: 0 }} />
          </div>

          {/* New Releases & Trending Side by Side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div className="section-card">
              <div className="section-header">
                <h2>🔥 New Releases</h2>
                <button className="view-all-btn" onClick={() => setActiveView('browse')}>
                  View All <i className="fas fa-chevron-right" />
                </button>
              </div>
              <div className="cards-grid">
                {loading
                  ? [1,2,3,4].map(i => <SkeletonCard key={i} />)
                  : songs.length === 0
                    ? <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No songs yet. Be the first to upload!</p>
                    : songs.slice(0, 6).map(s => <SongCard key={s._id} song={s} />)}
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <h2>📈 Trending Songs</h2>
                <button className="view-all-btn" onClick={() => setActiveView('browse')}>
                  View All <i className="fas fa-chevron-right" />
                </button>
              </div>
              <div className="cards-grid">
                {loading
                  ? [1,2,3,4].map(i => <SkeletonCard key={i} />)
                  : songs.length === 0
                    ? <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No trending songs yet.</p>
                    : songs.slice(0, 6).map(s => <SongCard key={s._id} song={s} />)}
              </div>
            </div>
          </div>

          {/* Browse by Genre */}
          <div className="section-card" style={{ marginBottom: 20 }}>
            <div className="section-header">
              <h2>🎵 Browse by Genre</h2>
            </div>
            <div className="genre-chips">
              {categories.map(g => (
                <button
                  key={g}
                  className={`genre-chip ${activeGenre === g ? 'active' : ''}`}
                  onClick={() => setActiveGenre(ag => ag === g ? '' : g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Made For You & Trending Artists Side by Side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="section-card">
              <div className="section-header">
                <h2>🎧 Made For You</h2>
                <button className="view-all-btn" onClick={() => setActiveView('playlists')}>
                  View All <i className="fas fa-arrow-right" />
                </button>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Your personalized playlists will appear here.</p>
            </div>
            <div className="section-card">
              <div className="section-header">
                <h2>🔥 Trending Artists</h2>
                <button className="view-all-btn" onClick={() => setActiveView('browse')}>
                  Discover All <i className="fas fa-arrow-right" />
                </button>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Featured artists will appear here.</p>
            </div>
          </div>
        </div>
      )}

      {/* Browse View */}
      {activeView === 'browse' && (
        <div>
          <div className="section-card">
            <div className="section-header">
              <h2>Browse All Music</h2>
              <div className="search-wrap">
                <i className="fas fa-search" />
                <input
                  type="text"
                  className="search-input-db"
                  placeholder="Filter songs..."
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  style={{ width: 260 }}
                />
              </div>
            </div>
            <div className="cards-grid">
              {loading
                ? [1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)
                : filteredSongs.length === 0
                  ? <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', gridColumn: '1/-1' }}>
                      {searchValue ? `No songs matching "${searchValue}"` : 'No songs available yet.'}
                    </p>
                  : filteredSongs.map(s => <SongCard key={s._id} song={s} />)}
            </div>
          </div>
        </div>
      )}

      {/* Featured Section */}
      {featured.length > 0 && (
        <div className="section-card" style={{ marginTop: 20 }}>
          <div className="section-header"><h2>Featured</h2></div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '12px 6px' }}>
            {featured.map(f => (
              <div key={f._id} style={{ minWidth: 240, background: 'var(--bg-tertiary)', borderRadius: 12, padding: 12 }}>
                {f.image ? <img src={f.image} style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 8 }} /> : <div style={{ height: 130, background: 'var(--bg-secondary)', borderRadius: 8 }} />}
                <h4 style={{ margin: '8px 0 0' }}>{f.title}</h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{f.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Genres View */}
      {activeView === 'genres' && (
        <div>
          <div className="section-card">
            <div className="section-header"><h2>Music Genres</h2></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {categories.map((g, i) => {
                const icons = ['fa-music','fa-drum','fa-guitar','fa-compact-disc','fa-headphones','fa-microphone','fa-record-vinyl','fa-itunes-note'];
                return (
                  <div
                    key={g}
                    className="genre-card"
                    onClick={() => { setActiveGenre(g); setActiveView('browse'); }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="feature-icon" style={{ margin: '0 auto 16px' }}>
                      <i className={`fas ${icons[i % icons.length]}`} />
                    </div>
                    <h4>{g}</h4>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Community View */}
      {activeView === 'community' && (
        <div>
          <div style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', borderRadius: 16, padding: 32, marginBottom: 24 }}>
            <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>🌐 Community Hub</h1>
            <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 0 }}>Connect with artists and fans across Cameroon. Share your love for music.</p>
          </div>

          <div className="community-composer">
            <div className="composer-avatar">{user?.name?.charAt(0) ?? '?'}</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                className="composer-input"
                placeholder="Share your thoughts about a track, an artist, or Cameroonian music…"
                rows={2}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="composer-submit"><i className="fas fa-paper-plane" style={{ marginRight: 6 }} />Post</button>
              </div>
            </div>
          </div>

          <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { id: 1, user: 'Samuel Eto', text: 'Does anyone know the title of that new Makossa track playing on Trace Africa? It has a very catchy guitar riff.', time: '2 hours ago', likes: 14, comments: 3 },
              { id: 2, user: 'Charlotte D.', text: 'The new Afrobeat compilation on CamSound is pure fire! 🔥 Perfect for the weekend.', time: '5 hours ago', likes: 42, comments: 8 },
              { id: 3, user: 'Franck B.', text: 'Just discovered an amazing upcoming Bikutsi artist. You all should check out "Mvet Evolution" in the discover section.', time: '1 day ago', likes: 27, comments: 5 },
            ].map(post => (
              <div key={post.id} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                  {post.user.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{post.user}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{post.time}</span>
                  </div>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', lineHeight: 1.5 }}>{post.text}</p>
                  <div style={{ display: 'flex', gap: 16, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><i className="far fa-heart" /> {post.likes}</span>
                    <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><i className="far fa-comment" /> {post.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications View */}
      {activeView === 'notifications' && (
        <div className="section-card">
          <div className="section-header">
            <h2>Notifications</h2>
            {notifications.length > 0 && (
              <button
                className="btn-camsound-outline"
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                onClick={async () => {
                  await notificationsService.markAllRead();
                  fetchNotifications();
                }}
              >
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
                <div
                  key={n._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: n.isRead ? 'var(--bg-tertiary)' : 'rgba(250,204,21,0.06)',
                    border: '1px solid',
                    borderColor: n.isRead ? 'var(--border-color)' : 'rgba(250,204,21,0.2)',
                    borderRadius: 12,
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <i className="fas fa-info-circle" style={{ color: n.isRead ? 'var(--text-muted)' : 'var(--accent-color)' }} />
                    <span style={{ fontSize: '0.9rem', color: n.isRead ? 'var(--text-light)' : 'var(--text-white)', fontWeight: n.isRead ? 400 : 600 }}>
                      {n.message}
                    </span>
                  </div>
                  {!n.isRead && (
                    <button
                      className="view-all-btn"
                      onClick={async () => {
                        await notificationsService.markRead(n._id);
                        fetchNotifications();
                      }}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Music (Favorites) */}
      {activeView === 'mymusic' && (
        <div className="section-card">
          <div className="section-header">
            <h2><i className="fas fa-heart" style={{ color: 'var(--accent-color)', marginRight: 10 }} /> Liked Songs</h2>
          </div>
          <div className="cards-grid">
            {favorites.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>You haven't liked any songs yet.</p>
            ) : (
              favorites.map(song => <SongCard key={song._id} song={song} />)
            )}
          </div>
        </div>
      )}

      {/* Playlists */}
      {activeView === 'playlists' && (
        <div className="section-card">
          <div className="section-header">
            <h2>Your Playlists</h2>
            <button className="btn-camsound-outline" style={{ padding: '6px 14px', fontSize: '0.9rem' }}>
              <i className="fas fa-plus" /> Create Playlist
            </button>
          </div>
          {playlists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <i className="fas fa-list" style={{ fontSize: '2.5rem', opacity: 0.4, display: 'block', marginBottom: 12 }} />
              <p>You don't have any playlists yet.</p>
            </div>
          ) : (
            <div className="cards-grid">
              {playlists.map(p => (
                <div key={p._id} className="music-card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 150, background: 'var(--bg-tertiary)', borderRadius: 8, marginBottom: 12 }}>
                    <i className="fas fa-music" style={{ fontSize: '2.5rem', color: 'var(--text-muted)' }} />
                  </div>
                  <h4 style={{ margin: 0 }}>{p.name}</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.songs?.length || 0} tracks</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {activeView === 'history' && (
        <div className="section-card">
          <div className="section-header">
            <h2>Listening History</h2>
            {history.length > 0 && (
              <button 
                className="btn-camsound-outline" 
                style={{ padding: '6px 14px', fontSize: '0.9rem' }}
                onClick={async () => {
                  await historyService.clearHistory();
                  fetchHistory();
                }}
              >
                Clear History
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <i className="fas fa-history" style={{ fontSize: '2.5rem', opacity: 0.4, display: 'block', marginBottom: 12 }} />
              <p>Your listening history is empty.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.map(h => (
                <div key={h._id} style={{ display: 'flex', alignItems: 'center', padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8, cursor: 'pointer' }} onClick={() => playSong(h.songId)}>
                  <div style={{ width: 40, height: 40, background: 'var(--bg-green-section)', borderRadius: 4, marginRight: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {h.songId?.coverArt ? <img src={h.songId.coverArt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fas fa-music" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{h.songId?.title || 'Unknown Song'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.songId?.artistId?.name || 'Unknown Artist'}</div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(h.playedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Following */}
      {activeView === 'following' && (
        <div className="section-card">
          <div className="section-header">
            <h2>Following</h2>
          </div>
          {following.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <i className="fas fa-user-friends" style={{ fontSize: '2.5rem', opacity: 0.4, display: 'block', marginBottom: 12 }} />
              <p>You are not following any artists yet.</p>
            </div>
          ) : (
            <div className="cards-grid">
              {following.map(artist => (
                <div key={artist._id} className="music-card" style={{ padding: 16, textAlign: 'center' }}>
                  <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-tertiary)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {artist.image ? <img src={artist.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fas fa-user" style={{ fontSize: '2rem', color: 'var(--text-muted)' }} />}
                  </div>
                  <h4 style={{ margin: 0 }}>{artist.name}</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{artist.followers || 0} Followers</p>
                  <button 
                    className="btn-camsound-outline" 
                    style={{ marginTop: 12, padding: '4px 12px', fontSize: '0.8rem' }}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await followsService.unfollowArtist(artist._id);
                      fetchFollowing();
                    }}
                  >
                    Unfollow
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile */}
      {activeView === 'profile' && profile && (
        <div className="section-card">
          <div className="section-header">
            <h2>Your Profile</h2>
          </div>
          <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
            <div style={{ width: 150, height: 150, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', color: 'var(--text-muted)' }}>
              {profile.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              {isEditingProfile ? (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Full Name</label>
                    <input
                      type="text"
                      className="search-input-db"
                      value={profileForm.name}
                      onChange={e => handleProfileFormChange('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Phone</label>
                    <input
                      type="text"
                      className="search-input-db"
                      value={profileForm.phone}
                      onChange={e => handleProfileFormChange('phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Country</label>
                    <input
                      type="text"
                      className="search-input-db"
                      value={profileForm.country}
                      onChange={e => handleProfileFormChange('country', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Bio</label>
                    <textarea
                      rows={4}
                      className="search-input-db"
                      value={profileForm.bio}
                      onChange={e => handleProfileFormChange('bio', e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button
                      className="btn-camsound-yellow"
                      onClick={handleSaveProfile}
                      disabled={profileSaving}
                    >
                      {profileSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button className="btn-camsound-outline" onClick={handleCancelProfileEdit} disabled={profileSaving}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Full Name</label>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{profile.name}</div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Email</label>
                    <div style={{ fontSize: '1rem' }}>{profile.email}</div>
                  </div>
                  {profile.country && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Country</label>
                      <div style={{ fontSize: '1rem' }}>{profile.country}</div>
                    </div>
                  )}
                  {profile.subscriptionStatus && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Plan</label>
                      <div style={{ fontSize: '1rem', textTransform: 'capitalize' }}>{profile.subscriptionStatus}</div>
                    </div>
                  )}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Member Since</label>
                    <div style={{ fontSize: '1rem' }}>{new Date(profile.createdAt).toLocaleDateString()}</div>
                  </div>
                  <button className="btn-camsound" onClick={() => setIsEditingProfile(true)}>Edit Profile</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      {activeView === 'settings' && (
        <div className="section-card">
          <div className="section-header">
            <h2>Settings</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h4 style={{ marginBottom: 12 }}>Notifications</h4>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={notifSettings?.emailNotifications ?? true} onChange={e => setNotifSettings((prev: any) => ({ ...prev, emailNotifications: e.target.checked }))} />
                <span>Email me about new releases from artists I follow</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginTop: 8 }}>
                <input type="checkbox" checked={notifSettings?.smsNotifications ?? false} onChange={e => setNotifSettings((prev: any) => ({ ...prev, smsNotifications: e.target.checked }))} />
                <span>SMS notifications</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginTop: 8 }}>
                <input type="checkbox" checked={notifSettings?.pushNotifications ?? true} onChange={e => setNotifSettings((prev: any) => ({ ...prev, pushNotifications: e.target.checked }))} />
                <span>Push notifications</span>
              </label>
              <div style={{ marginTop: 12 }}>
                <button className="btn-camsound-yellow" onClick={async () => { try { await notificationSettingsService.updateSettings(notifSettings); alert('Notification settings saved'); } catch (err) { alert('Unable to save settings'); } }}>Save Notification Settings</button>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: 12 }}>Playback</h4>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked />
                <span>High quality audio (uses more data)</span>
              </label>
            </div>
            <div>
              <h4 style={{ marginBottom: 12 }}>Account Security</h4>
              <button className="btn-camsound-outline">Change Password</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
