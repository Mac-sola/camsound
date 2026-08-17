import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { songsService, notificationsService, favoritesService, playlistsService, historyService, followsService, authService, featuredService, notificationSettingsService, categoriesService, commentsService, artistsService } from '../services/api';

import { useNavigate } from 'react-router-dom';

const FAN_NAV = [
  { section: 'Discover' },
  { label: 'Home', icon: 'fa-home', view: 'discover' },
  { label: 'Browse', icon: 'fa-search', view: 'browse' },
  { label: 'Genres', icon: 'fa-tags', view: 'genres' },
  { label: 'Community', icon: 'fa-users', view: 'community' },
  { section: 'My Music' },
  { label: 'My Music', icon: 'fa-music', view: 'mymusic' },
  { label: 'Playlists', icon: 'fa-list', view: 'playlists' },
  { label: 'History', icon: 'fa-history', view: 'history' },
  { section: 'Following' },
  { label: 'Following', icon: 'fa-user-friends', view: 'following' },
  { label: 'Notifications', icon: 'fa-bell', view: 'notifications' },
  { section: 'Account' },
  { label: 'Profile', icon: 'fa-user', view: 'profile' },
  { label: 'Settings', icon: 'fa-cog', view: 'settings' },
  { label: 'Get Premium', icon: 'fa-crown', view: 'subscription' },
];

const GENRES = ['Makossa', 'Afrobeat', 'Bikutsi', 'Assiko', 'Ndombolo', 'Hip Hop', 'R&B', 'Zouk'];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
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
  const [favorites, setFavorites] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [playlistActionMessage, setPlaylistActionMessage] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [following, setFollowing] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', country: '', bio: '', avatar: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Settings & Change Password states
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [notifPrefs, setNotifPrefs] = useState({ emailNotifs: true, pushNotifs: true, newReleaseNotifs: true });
  const [settingsSaveMsg, setSettingsSaveMsg] = useState('');

  // New states for Song Detail, Artist Detail, Community
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [songComments, setSongComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [artistStats, setArtistStats] = useState<any>(null);
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [communityTab, setCommunityTab] = useState('all');
  const [composerSongId, setComposerSongId] = useState('');
  const [composerText, setComposerText] = useState('');

  const fetchFavorites = async () => { try { const res = await favoritesService.getFavorites(); if (res.data.success) setFavorites(res.data.data); } catch {} };
  const fetchPlaylists = async () => { try { const res = await playlistsService.getPlaylists(); if (res.data.success) setPlaylists(res.data.data); } catch {} };
  const fetchHistory = async () => { try { const res = await historyService.getHistory(); if (res.data.success) setHistory(res.data.data); } catch {} };
  const fetchFollowing = async () => { try { const res = await followsService.getFollowing(); if (res.data.success) setFollowing(res.data.data); } catch {} };
  const fetchProfile = async () => {
    try {
      const res = await authService.getProfile();
      if (res.data.success) setProfile(res.data.data);
    } catch {
    }
  };

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        phone: profile.phone || '',
        country: profile.country || '',
        bio: profile.bio || '',
        avatar: profile.avatar || '',
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
    } catch {
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
        avatar: profile.avatar || '',
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
    } catch {}
  };

  const [newReleases, setNewReleases] = useState<any[]>([]);
  const [trendingSongs, setTrendingSongs] = useState<any[]>([]);
  const [trendingArtists, setTrendingArtists] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [allRes, newRes, trendRes, artistRes] = await Promise.all([
          songsService.getSongs({ limit: 50 }),
          songsService.getSongs({ sort: 'date', limit: 6 }),
          songsService.getSongs({ sort: 'plays', limit: 6 }),
          artistsService.getArtists({ limit: 6 }),
        ]);

        if (allRes.data.success) {
          setAllSongs(allRes.data.data);
          setSongs(allRes.data.data);
        }
        if (newRes.data.success) setNewReleases(newRes.data.data);
        if (trendRes.data.success) setTrendingSongs(trendRes.data.data);
        if (artistRes.data.success) setTrendingArtists(artistRes.data.data);
      } catch {
        // If backend is offline, fail gracefully
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    fetchNotifications();
    fetchHistory();

    const notifInterval = setInterval(fetchNotifications, 10000);

    (async () => {
      try {
        const r = await featuredService.getFeatured();
        if (r.data.success) setFeatured(r.data.data);
      } catch {}
      try {
        const c = await categoriesService.getCategories();
        if (c.data.success) setCategories(c.data.data.map((x: any) => x.name));
      } catch {}
      try {
        const s = await notificationSettingsService.getSettings();
        if (s.data.success) {
          setNotifPrefs(prev => ({
            ...prev,
            emailNotifs: s.data.data.emailNotifications,
            pushNotifs: s.data.data.pushNotifications,
          }));
        }
      } catch {}
    })();

    return () => clearInterval(notifInterval);
  }, []);

  useEffect(() => {
    if (activeView === 'notifications') fetchNotifications();
    else if (activeView === 'mymusic') fetchFavorites();
    else if (activeView === 'playlists') fetchPlaylists();
    else if (activeView === 'history') fetchHistory();
    else if (activeView === 'following') fetchFollowing();
    else if (activeView === 'profile') fetchProfile();
    else if (activeView === 'community') fetchCommunityPosts();
  }, [activeView]);

  const openSongDetails = async (song: any) => {
    setSelectedSong(song);
    setIsSongModalOpen(true);
    try {
      const res = await commentsService.getSongComments(song._id);
      if (res.data.success) setSongComments(res.data.data);
    } catch {}
    try {
      await fetchPlaylists();
    } catch {}
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || !selectedSong) return;
    try {
      await commentsService.postComment(selectedSong._id, commentText);
      setCommentText('');
      const res = await commentsService.getSongComments(selectedSong._id);
      if (res.data.success) setSongComments(res.data.data);
    } catch {}
  };

  const [artistTopSong, setArtistTopSong] = useState<any>(null);

  const openArtistDetails = async (artist: any) => {
    setSelectedArtist(artist);
    setArtistTopSong(null);
    setIsArtistModalOpen(true);
    try {
      const res = await artistsService.getArtistStats(artist._id || artist.id);
      if (res.data.success) setArtistStats(res.data.data);
    } catch {}
    try {
      const songRes = await songsService.getSongs({ artistId: artist._id || artist.id, limit: 1 });
      if (songRes.data.success && songRes.data.data.length > 0) {
        setArtistTopSong(songRes.data.data[0]);
      }
    } catch {}
  };

  const handleToggleFollow = async (artist: any) => {
    if (!artist) return;
    const artistId = artist._id || artist.id;
    const isFollowing = following.some(item => item._id === artistId || item.artistId?._id === artistId);
    try {
      if (isFollowing) {
        await followsService.unfollowArtist(artistId);
      } else {
        await followsService.followArtist(artistId);
      }
      await fetchFollowing();
    } catch {}
  };

  const fetchCommunityPosts = async () => {
    try {
      const res = await commentsService.getRecentActivity();
      if (res.data.success) setCommunityPosts(res.data.data);
    } catch {}
  };

  const handleCommunityPost = async () => {
    if (!composerText.trim() || !composerSongId) return;
    try {
      await commentsService.postComment(composerSongId, composerText);
      setComposerText('');
      setComposerSongId('');
      fetchCommunityPosts();
    } catch {}
  };

  const handleToggleFavorite = async (song: any) => {
    try {
      const isFavorite = favorites.some(f => f._id === song._id);
      if (isFavorite) {
        await favoritesService.unlikeSong(song._id);
      } else {
        await favoritesService.likeSong(song._id);
      }
      await fetchFavorites();
    } catch {}
  };

  const handleCreatePlaylist = async () => {
    const trimmedName = newPlaylistName.trim();
    if (!trimmedName) return;
    try {
      const res = await playlistsService.createPlaylist({ name: trimmedName, description: '', isPublic: false });
      if (res.data.success) {
        setPlaylists(prev => [res.data.data, ...prev]);
        setNewPlaylistName('');
        setPlaylistActionMessage('Playlist created');
        setSelectedPlaylistId(res.data.data._id);
      }
    } catch {
      setPlaylistActionMessage('Could not create playlist.');
    }
  };

  const handleAddSongToPlaylist = async (playlistId: string, song: any) => {
    if (!playlistId || !song) return;
    try {
      await playlistsService.addSong(playlistId, song._id);
      setPlaylistActionMessage('Song added to playlist.');
      await fetchPlaylists();
    } catch {
      setPlaylistActionMessage('Could not add song to playlist.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedSong) return;
    try {
      await commentsService.deleteComment(selectedSong._id, commentId);
      const res = await commentsService.getSongComments(selectedSong._id);
      if (res.data.success) setSongComments(res.data.data);
    } catch {}
  };

  const handleTogglePinComment = async (commentId: string, isPinned: boolean) => {
    if (!selectedSong) return;
    try {
      await commentsService.pinComment(selectedSong._id, commentId, !isPinned);
      const res = await commentsService.getSongComments(selectedSong._id);
      if (res.data.success) setSongComments(res.data.data);
    } catch {}
  };

  const filteredSongs = allSongs.filter(s => {
    const q = searchValue.toLowerCase();
    const matchesSearch = !q || s.title?.toLowerCase().includes(q) || s.artistId?.name?.toLowerCase().includes(q);
    const matchesGenre = !activeGenre || s.genre?.toLowerCase() === activeGenre.toLowerCase();
    return matchesSearch && matchesGenre;
  });

  const SongCard = ({ song }: { song: any }) => (
    <div className="music-card">
      <div className="music-card-cover" onClick={() => playSong(song)}>
        {song.coverArt
          ? <img src={song.coverArt} alt={song.title} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-green-section)' }}>
              <i className="fas fa-music" style={{ fontSize: '2rem', color: 'var(--accent-color)' }} />
            </div>}
        <div className="play-overlay">
          <button
            className="play-circle-btn"
            onClick={(e) => { e.stopPropagation(); playSong(song); }}
            aria-label={`Play ${song.title}`}
          >
            <i className="fas fa-play" />
          </button>
        </div>
      </div>
      <div className="music-card-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="music-card-title">{song.title}</div>
          <div className="music-card-artist" onClick={(e) => { e.stopPropagation(); openArtistDetails(song.artistId); }} style={{ cursor: 'pointer' }}>
            {song.artistId?.name || 'Unknown Artist'}
          </div>
        </div>
        <button onClick={() => openSongDetails(song)} className="btn-camsound-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: 4 }}>
          <i className="fas fa-info-circle" />
        </button>
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
      onNavClick={(view) => {
        if (view === 'subscription') {
          navigate('/subscription');
        } else {
          setActiveView(view);
        }
      }}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      notifCount={unreadCount}
      totalPlays={history.length}
      totalLikes={favorites.length}
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
                  <span className="hero-stat-value">{history.length}</span>
                  <span className="hero-stat-label">Plays Today</span>
                </div>
                <div>
                  <span className="hero-stat-value">{songs.length}</span>
                  <span className="hero-stat-label">New Releases</span>
                </div>
                <div>
                  <span className="hero-stat-value">{trendingArtists.length}</span>
                  <span className="hero-stat-label">Trending Artists</span>
                </div>
              </div>
            </div>
            <div style={{ position: 'absolute', right: -40, top: -40, width: 250, height: 250, borderRadius: '50%', background: 'rgba(250,204,21,0.05)', zIndex: 0 }} />
          </div>

          {/* Continue Listening Section (if user has history) */}
          {history.length > 0 && (
            <div className="section-card" style={{ marginBottom: 20 }}>
              <div className="section-header">
                <h2>🕒 Continue Listening</h2>
                <button className="view-all-btn" onClick={() => setActiveView('history')}>
                  View History <i className="fas fa-arrow-right" />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {history.slice(0, 4).map(h => h.songId && (
                  <div key={h._id} className="music-card" style={{ padding: 12, cursor: 'pointer' }} onClick={() => playSong(h.songId)}>
                    <div style={{ width: '100%', height: 120, background: 'var(--bg-tertiary)', borderRadius: 8, overflow: 'hidden', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {h.songId.coverArt ? <img src={h.songId.coverArt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fas fa-music" style={{ fontSize: '1.8rem', color: 'var(--accent-color)' }} />}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.songId.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{h.songId.artistId?.name || 'Unknown Artist'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                  : newReleases.length === 0
                    ? <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No new songs yet. Be the first to upload!</p>
                    : newReleases.map(s => <SongCard key={s._id} song={s} />)}
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
                  : trendingSongs.length === 0
                    ? <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No trending songs yet.</p>
                    : trendingSongs.map(s => <SongCard key={s._id} song={s} />)}
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
                  onClick={() => {
                    const newGenre = activeGenre === g ? '' : g;
                    setActiveGenre(newGenre);
                    if (newGenre) setActiveView('browse');
                  }}
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
              {playlists.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Create custom playlists to see them featured here.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {playlists.slice(0, 3).map(p => (
                    <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: 'var(--bg-tertiary)', borderRadius: 8, cursor: 'pointer' }} onClick={() => setActiveView('playlists')}>
                      <i className="fas fa-list" style={{ color: 'var(--accent-color)', fontSize: '1.2rem' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.songs?.length || 0} tracks</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="section-card">
              <div className="section-header">
                <h2>🔥 Trending Artists</h2>
                <button className="view-all-btn" onClick={() => setActiveView('browse')}>
                  Discover All <i className="fas fa-arrow-right" />
                </button>
              </div>
              {trendingArtists.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No trending artists yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {trendingArtists.map(artist => (
                    <div key={artist._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, background: 'var(--bg-tertiary)', borderRadius: 8, cursor: 'pointer' }} onClick={() => openArtistDetails(artist)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          {artist.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{artist.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{artist.genre || 'Artist'} • {artist.followers || 0} followers</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Browse View */}
      {activeView === 'browse' && (
        <div>
          <div className="section-card">
            <div className="section-header" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2>Browse All Music</h2>
                {activeGenre && (
                  <span style={{ fontSize: '0.85rem', background: 'rgba(250,204,21,0.15)', color: 'var(--accent-color)', padding: '3px 10px', borderRadius: 999, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    Genre: {activeGenre}
                    <button onClick={() => setActiveGenre('')} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}>×</button>
                  </span>
                )}
              </div>
              <div className="search-wrap">
                <i className="fas fa-search" />
                <input
                  type="text"
                  className="search-input-db"
                  placeholder="Filter songs by title or artist..."
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  style={{ width: 260 }}
                />
              </div>
            </div>

            {/* Genre Filter Bar in Browse View */}
            <div className="genre-chips" style={{ marginBottom: 20 }}>
              <button
                className={`genre-chip ${!activeGenre ? 'active' : ''}`}
                onClick={() => setActiveGenre('')}
              >
                All Genres
              </button>
              {categories.map(g => (
                <button
                  key={g}
                  className={`genre-chip ${activeGenre === g ? 'active' : ''}`}
                  onClick={() => setActiveGenre(activeGenre === g ? '' : g)}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="cards-grid">
              {loading
                ? [1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)
                : filteredSongs.length === 0
                  ? <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', gridColumn: '1/-1', textAlign: 'center', padding: '40px 0' }}>
                      {searchValue || activeGenre ? `No songs found matching current search/genre criteria.` : 'No songs available yet.'}
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
          {/* Hero Banner */}
          <div style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', borderRadius: 16, padding: '32px 40px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -60, top: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1 style={{ fontSize: '1.8rem', marginBottom: 8, margin: '0 0 8px 0' }}>🌐 Community Hub</h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 0 }}>Connect with artists and fans across Cameroon. Share your love for music.</p>
            </div>
          </div>

          {/* Post Composer */}
          <div className="community-composer" style={{ marginBottom: 24 }}>
            <div className="composer-avatar">{user?.name?.charAt(0) ?? '?'}</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select
                className="search-input-db"
                value={composerSongId}
                onChange={e => setComposerSongId(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.9rem' }}
              >
                <option value="">🎵 Select a track to discuss (required)</option>
                {allSongs.map(s => (
                  <option key={s._id} value={s._id}>{s.title} — {s.artistId?.name || 'Unknown'}</option>
                ))}
              </select>
              <textarea
                className="composer-input"
                placeholder="Share your thoughts about this track..."
                rows={3}
                value={composerText}
                onChange={e => setComposerText(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {composerSongId ? '✅ Track selected' : '⚠️ Select a track to post'}
                </span>
                <button
                  className="composer-submit"
                  onClick={handleCommunityPost}
                  disabled={!composerText.trim() || !composerSongId}
                  style={{ opacity: (!composerText.trim() || !composerSongId) ? 0.5 : 1 }}
                >
                  <i className="fas fa-paper-plane" style={{ marginRight: 6 }} />Post
                </button>
              </div>
            </div>
          </div>

          {/* Activity Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-tertiary)', borderRadius: 10, padding: 4 }}>
            {[
              { key: 'all', label: '🔥 All Activity' },
              { key: 'discussions', label: '💬 Discussions' },
              { key: 'artists', label: '🎤 Artist Spotlight' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setCommunityTab(tab.key)}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', fontSize: '0.88rem',
                  fontWeight: communityTab === tab.key ? 700 : 400,
                  background: communityTab === tab.key ? 'var(--primary-color)' : 'transparent',
                  color: communityTab === tab.key ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Activity Feed */}
          <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {communityPosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                <i className="fas fa-comments" style={{ fontSize: '3rem', opacity: 0.3, display: 'block', marginBottom: 16 }} />
                <p>No activity yet. Be the first to start a discussion!</p>
              </div>
            ) : (
              communityPosts
                .filter(post => {
                  if (communityTab === 'discussions') return true;
                  if (communityTab === 'artists') return post.userId?.type === 'artist';
                  return true;
                })
                .map((post, idx, arr) => (
                  <div
                    key={post._id}
                    style={{
                      display: 'flex', gap: 16,
                      padding: '20px 0',
                      borderBottom: idx < arr.length - 1 ? '1px solid var(--border-color)' : 'none',
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                      {post.userId?.name?.charAt(0) || 'U'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700 }}>{post.userId?.name || 'Community Member'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>commented on</span>
                        <span
                          style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => { if (post.songId) openSongDetails(post.songId); }}
                        >
                          🎵 {post.songId?.title || 'Unknown Track'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 12px 0', fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-light)' }}>{post.content}</p>
                      <div style={{ display: 'flex', gap: 16, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <i className="far fa-heart" /> 0
                        </span>
                        <span
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                          onClick={() => { if (post.songId) openSongDetails(post.songId); }}
                        >
                          <i className="far fa-comment" /> Reply
                        </span>
                      </div>
                    </div>
                  </div>
                ))
            )}
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
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <input
              className="search-input-db"
              placeholder="New playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              style={{ flex: 1, minWidth: 220 }}
            />
            <button className="btn-camsound-outline" style={{ padding: '6px 14px', fontSize: '0.9rem' }} onClick={handleCreatePlaylist}>
              <i className="fas fa-plus" /> Create Playlist
            </button>
          </div>
          {playlistActionMessage && (
            <div style={{ marginBottom: 12, color: 'var(--accent-color)', fontSize: '0.9rem' }}>{playlistActionMessage}</div>
          )}
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

      {/* Settings View */}
      {activeView === 'settings' && (
        <div className="section-card">
          <div className="section-header">
            <h2>Account Settings</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            {/* Change Password Form */}
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 24, border: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: 16, color: 'var(--text-white)' }}><i className="fas fa-lock" style={{ marginRight: 8, color: 'var(--accent-color)' }} /> Change Password</h4>
              {passwordMessage && (
                <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: passwordMessage.startsWith('✅') ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: passwordMessage.startsWith('✅') ? '#4ade80' : '#f87171', fontSize: '0.88rem' }}>
                  {passwordMessage}
                </div>
              )}
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>Current Password</label>
                  <input
                    type="password"
                    className="search-input-db"
                    placeholder="••••••••"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>New Password</label>
                  <input
                    type="password"
                    className="search-input-db"
                    placeholder="•••••••• (min 6 chars)"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>Confirm New Password</label>
                  <input
                    type="password"
                    className="search-input-db"
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  />
                </div>
                <button
                  className="btn-camsound-yellow"
                  style={{ marginTop: 6 }}
                  disabled={passwordSaving}
                  onClick={async () => {
                    setPasswordMessage('');
                    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
                      setPasswordMessage('❌ Please enter current and new password.');
                      return;
                    }
                    if (passwordForm.newPassword.length < 6) {
                      setPasswordMessage('❌ New password must be at least 6 characters.');
                      return;
                    }
                    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                      setPasswordMessage('❌ Passwords do not match.');
                      return;
                    }
                    setPasswordSaving(true);
                    try {
                      const res = await authService.changePassword({
                        currentPassword: passwordForm.currentPassword,
                        newPassword: passwordForm.newPassword,
                      });
                      if (res.data.success) {
                        setPasswordMessage('✅ Password changed successfully!');
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      } else {
                        setPasswordMessage('❌ ' + (res.data.message || 'Failed to change password.'));
                      }
                    } catch (err: any) {
                      setPasswordMessage('❌ ' + (err.response?.data?.message || 'Error updating password.'));
                    } finally {
                      setPasswordSaving(false);
                      setTimeout(() => setPasswordMessage(''), 4000);
                    }
                  }}
                >
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>

            {/* Notification Preferences */}
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 24, border: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: 16, color: 'var(--text-white)' }}><i className="fas fa-bell" style={{ marginRight: 8, color: 'var(--accent-color)' }} /> Notification Preferences</h4>
              {settingsSaveMsg && (
                <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.12)', color: '#4ade80', fontSize: '0.88rem' }}>
                  {settingsSaveMsg}
                </div>
              )}
              <div style={{ display: 'grid', gap: 16 }}>
                {[
                  { key: 'emailNotifs', label: 'Email Notifications', desc: 'Receive weekly digests & account updates via email' },
                  { key: 'pushNotifs', label: 'App Notifications', desc: 'In-app alert badges for new comments & likes' },
                  { key: 'newReleaseNotifs', label: 'New Release Alerts', desc: 'Get notified when followed artists drop new tracks' },
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.label}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={(notifPrefs as any)[item.key]}
                      onChange={e => setNotifPrefs(p => ({ ...p, [item.key]: e.target.checked }))}
                      style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                    />
                  </div>
                ))}
                <button
                  className="btn-camsound-outline"
                  style={{ marginTop: 6 }}
                  onClick={async () => {
                    setSettingsSaveMsg('');
                    try {
                      const res = await notificationSettingsService.updateSettings({
                        emailNotifications: notifPrefs.emailNotifs,
                        pushNotifications: notifPrefs.pushNotifs,
                        newReleaseNotifications: notifPrefs.newReleaseNotifs,
                      });
                      setSettingsSaveMsg(res.data.success ? 'Preferences saved.' : (res.data.message || 'Could not save preferences.'));
                    } catch (err: any) {
                      setSettingsSaveMsg(err.response?.data?.message || 'Could not save preferences.');
                    } finally {
                      setTimeout(() => setSettingsSaveMsg(''), 3000);
                    }
                  }}
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

<Modal
        isOpen={isSongModalOpen}
        title={selectedSong?.title || 'Song details'}
        size="lg"
        onClose={() => setIsSongModalOpen(false)}
      >
        {selectedSong && (
          <div style={{ display: 'grid', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 220px) 1fr', gap: 20, alignItems: 'start' }}>
              <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: 14, overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
                {selectedSong.coverArt ? <img src={selectedSong.coverArt} alt={selectedSong.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '2rem' }}><i className="fas fa-music" /></div>}
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--text-muted)', marginBottom: 8 }}>Now playing</div>
                <h3 style={{ margin: '0 0 8px', fontSize: '1.35rem' }}>{selectedSong.title}</h3>
                <div style={{ color: 'var(--text-muted)', marginBottom: 12, cursor: 'pointer' }} onClick={() => openArtistDetails(selectedSong.artistId)}>{selectedSong.artistId?.name || 'Unknown Artist'}</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                  <button className="btn-camsound-yellow" onClick={() => playSong(selectedSong)}><i className="fas fa-play" style={{ marginRight: 8 }} />Play</button>
                  <button className="btn-camsound-outline" onClick={() => handleToggleFavorite(selectedSong)}><i className={favorites.some(f => f._id === selectedSong._id) ? 'fas fa-heart' : 'far fa-heart'} style={{ marginRight: 8 }} />{favorites.some(f => f._id === selectedSong._id) ? 'Favorited' : 'Favorite'}</button>
                </div>
                <div style={{ display: 'flex', gap: 18, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <span><strong style={{ color: 'var(--text-white)' }}>{selectedSong.genre || 'Unknown'}</strong> • Genre</span>
                  <span><strong style={{ color: 'var(--text-white)' }}>{selectedSong.plays || 0}</strong> • Plays</span>
                  <span><strong style={{ color: 'var(--text-white)' }}>{selectedSong.duration || '0:00'}</strong> • Duration</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select value={selectedPlaylistId} onChange={(e) => setSelectedPlaylistId(e.target.value)} style={{ flex: 1, minWidth: 180, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--text-white)', border: '1px solid var(--border-color)' }}>
                <option value="">Add to playlist</option>
                {playlists.map((playlist) => <option key={playlist._id} value={playlist._id}>{playlist.name}</option>)}
              </select>
              <button className="btn-camsound-outline" style={{ padding: '10px 12px' }} onClick={() => handleAddSongToPlaylist(selectedPlaylistId, selectedSong)} disabled={!selectedPlaylistId}>Add</button>
            </div>
            {playlistActionMessage && <div style={{ fontSize: '0.82rem', color: 'var(--accent-color)' }}>{playlistActionMessage}</div>}

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{user?.name?.charAt(0) || 'U'}</div>
                <textarea className="search-input-db" rows={2} placeholder="What do you think of this track?" value={commentText} onChange={e => setCommentText(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
                <button className="btn-camsound-yellow" style={{ padding: '6px 16px', fontSize: '0.9rem' }} onClick={handlePostComment}>Post Comment</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {songComments.length === 0 ? <div style={{ textAlign: 'center', padding: '18px 0', color: 'var(--text-muted)' }}>No comments yet. Be the first!</div> : songComments.map(comment => {
                  const isCommentOwner = comment.userId?._id === user?._id;
                  const canModerate = user?.type === 'admin' || user?.type === 'artist' || isCommentOwner;
                  return (
                    <div key={comment._id} style={{ padding: '12px 14px', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ fontWeight: 600 }}>{comment.userId?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{new Date(comment.createdAt).toLocaleDateString()}</div>
                      </div>
                      <p style={{ margin: '0 0 8px', fontSize: '0.9rem', lineHeight: 1.5 }}>{comment.content}</p>
                      {canModerate && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(user?.type === 'admin' || user?.type === 'artist') && <button className="btn-camsound-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handleTogglePinComment(comment._id, comment.isPinned)}>{comment.isPinned ? 'Unpin' : 'Pin'}</button>}
                        {isCommentOwner && <button className="btn-camsound-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handleDeleteComment(comment._id)}>Delete</button>}
                      </div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isArtistModalOpen} title={selectedArtist?.name || 'Artist profile'} size="md" onClose={() => setIsArtistModalOpen(false)}>
        {selectedArtist && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 82, height: 82, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--text-muted)', border: '2px solid var(--border-color)' }}>
                {selectedArtist.image ? <img src={selectedArtist.image} alt={selectedArtist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (selectedArtist.name?.charAt(0) || 'A')}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem' }}>{selectedArtist.name}</h3>
                <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>{selectedArtist.genre || 'Artist'} • {selectedArtist.followers || 0} followers</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn-camsound-yellow" onClick={() => handleToggleFollow(selectedArtist)}>{following.some(item => item._id === (selectedArtist._id || selectedArtist.id) || item.artistId?._id === (selectedArtist._id || selectedArtist.id)) ? 'Following' : 'Follow'}</button>
                  <button className="btn-camsound-outline" onClick={() => artistTopSong && playSong(artistTopSong)} disabled={!artistTopSong}><i className="fas fa-play" style={{ marginRight: 8 }} />{artistTopSong ? 'Play Top Track' : 'No Tracks Yet'}</button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Instagram', icon: 'fa-instagram', url: selectedArtist.instagramUrl, color: '#e1306c' },
                { label: 'Twitter', icon: 'fa-twitter', url: selectedArtist.twitterUrl, color: '#1da1f2' },
                { label: 'Facebook', icon: 'fa-facebook', url: selectedArtist.facebookUrl, color: '#4267b2' },
                { label: 'YouTube', icon: 'fa-youtube', url: selectedArtist.youtubeUrl, color: '#ff0000' },
              ]
                .filter(item => item.url)
                .map(link => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: '8px 16px', borderRadius: 999, background: 'var(--bg-tertiary)', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', fontSize: '0.85rem' }}
                  >
                    <i className={`fab ${link.icon}`} style={{ color: link.color }} />
                    <span>{link.label}</span>
                  </a>
                ))}
              {!selectedArtist.instagramUrl && !selectedArtist.twitterUrl && !selectedArtist.facebookUrl && !selectedArtist.youtubeUrl && (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No social links linked yet.</div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{artistStats?.totalPlays || 0}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Plays</div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{artistStats?.totalLikes || 0}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Likes</div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{artistStats?.totalSongs || 0}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Tracks</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Dashboard;

