import React, { useState, useEffect, useCallback } from 'react';
import { songsService, artistsService, favoritesService, playlistsService, followsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { useToast } from '../context/ToastContext';
import SongCard, { type SongItem } from './SongCard';
import ArtistCard, { type ArtistItem } from './ArtistCard';
import PlaylistCard, { type PlaylistItem } from './PlaylistCard';
import ArtistDetailsModal from './ArtistDetailsModal';
import FanSpotlightCarousel from './FanSpotlightCarousel';
import ScrollReveal from './ScrollReveal';
import ScrollRow from './ScrollRow';
import Modal from './Modal';
import { GENRE_CARDS_DATA } from '../utils/musicImages';
import { useLanguage } from '../context/LanguageContext';

const GENRES = ['All', 'Makossa', 'Bikutsi', 'Afrobeat', 'Traditional', 'Assiko', 'Gospel', 'Hip Hop', 'R&B'];

interface FanHomeProps {
  onNavClick?: (view: string) => void;
}

export const FanHome: React.FC<FanHomeProps> = ({ onNavClick }) => {
  const { user } = useAuth();
  const { playSong } = useAudio();
  const { t } = useLanguage();
  const toast = useToast();
  const [newReleases, setNewReleases] = useState<SongItem[]>([]);
  const [trending, setTrending] = useState<SongItem[]>([]);
  const [artists, setArtists] = useState<ArtistItem[]>([]);
  const [favoriteArtists, setFavoriteArtists] = useState<ArtistItem[]>([]);
  const [recommendedPlaylists, setRecommendedPlaylists] = useState<PlaylistItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [activeGenre, setActiveGenre] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  // Add-to-playlist modal
  const [addToPlaylistSong, setAddToPlaylistSong] = useState<SongItem | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<PlaylistItem[]>([]);
  const [addingToPlaylist, setAddingToPlaylist] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [songsResult, artistsResult, favoritesResult, playlistsResult, followsResult] = await Promise.allSettled([
        songsService.getSongs({ limit: 30, sort: 'date' }),
        artistsService.getArtists({ limit: 12 }),
        favoritesService.getFavorites(),
        playlistsService.getPlaylists(),
        followsService.getFollowing(),
      ]);

      const songs: SongItem[] =
        songsResult.status === 'fulfilled' ? songsResult.value.data?.data ?? songsResult.value.data ?? [] : [];
      const artistList: ArtistItem[] =
        artistsResult.status === 'fulfilled' ? artistsResult.value.data?.data ?? artistsResult.value.data ?? [] : [];
      const favList: any[] =
        favoritesResult.status === 'fulfilled' ? favoritesResult.value.data?.data ?? favoritesResult.value.data ?? [] : [];
      const playList: PlaylistItem[] =
        playlistsResult.status === 'fulfilled' ? playlistsResult.value.data?.data ?? playlistsResult.value.data ?? [] : [];
      const followingList: any[] =
        followsResult.status === 'fulfilled' ? followsResult.value.data?.data ?? followsResult.value.data ?? [] : [];

      const favSet = new Set<string>(favList.map((f: any) => f._id || f.id || f.songId?._id));
      setFavoriteIds(favSet);

      const followSet = new Set<string>(
        followingList.map((f: any) => f.artistId?._id || f.artistId || f._id)
      );
      setFollowingIds(followSet);

      setNewReleases(songs.slice(0, 10));
      const byPlays = [...songs].sort((a, b) => (b.plays ?? 0) - (a.plays ?? 0));
      setTrending(byPlays.slice(0, 10));
      setArtists(artistList.slice(0, 10));
      setFavoriteArtists(artistList.slice(0, 8));
      setRecommendedPlaylists(playList.slice(0, 8));
    } catch {
      setNewReleases([]);
      setTrending([]);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFavoriteToggle = async (song: SongItem) => {
    const isFav = favoriteIds.has(song._id);
    try {
      if (isFav) {
        await favoritesService.unlikeSong(song._id);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(song._id);
          return next;
        });
        toast.info(`Removed "${song.title}" from favorites`);
      } else {
        await favoritesService.likeSong(song._id);
        setFavoriteIds((prev) => new Set(prev).add(song._id));
        toast.music(`Added "${song.title}" to favorites!`);
      }
    } catch {
      toast.error('Unable to update favorite status');
    }
  };

  const handleFollowToggle = async (artist: ArtistItem) => {
    const isFollowing = followingIds.has(artist._id);
    try {
      if (isFollowing) {
        await followsService.unfollowArtist(artist._id);
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(artist._id);
          return next;
        });
        toast.info(`Unfollowed ${artist.name}`);
      } else {
        await followsService.followArtist(artist._id);
        setFollowingIds((prev) => new Set(prev).add(artist._id));
        toast.success(`You are now following ${artist.name}!`);
      }
    } catch {
      toast.error(`Unable to update follow for ${artist.name}`);
    }
  };

  const handleAddToPlaylist = async (song: SongItem) => {
    // Load user's playlists and show picker modal
    try {
      const res = await playlistsService.getPlaylists();
      const list: PlaylistItem[] = res.data?.data ?? res.data ?? [];
      setUserPlaylists(list);
    } catch {
      setUserPlaylists([]);
    }
    setAddToPlaylistSong(song);
  };

  const handlePickPlaylist = async (playlist: PlaylistItem) => {
    if (!addToPlaylistSong) return;
    setAddingToPlaylist(true);
    try {
      await playlistsService.addSong(playlist._id, addToPlaylistSong._id);
      toast.success(`"${addToPlaylistSong.title}" added to "${playlist.name}"!`);
      setAddToPlaylistSong(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg && msg.toLowerCase().includes('already')) {
        toast.info(`"${addToPlaylistSong.title}" is already in "${playlist.name}"`);
      } else {
        toast.error('Unable to add to playlist. Please try again.');
      }
    } finally {
      setAddingToPlaylist(false);
    }
  };

  const handlePlayPlaylist = (playlist: PlaylistItem) => {
    if (playlist.songs && playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs);
      toast.music(`Playing playlist "${playlist.name}"`);
    } else {
      toast.info(`Playlist "${playlist.name}" is currently empty`);
    }
  };

  const totalPlays = newReleases.reduce((acc, s) => acc + (s.plays ?? 0), 0);

  const filteredNewReleases = newReleases.filter(
    (s) => activeGenre === 'All' || s.genre?.toLowerCase() === activeGenre.toLowerCase()
  );
  const filteredTrending = trending.filter(
    (s) => activeGenre === 'All' || s.genre?.toLowerCase() === activeGenre.toLowerCase()
  );

  return (
    <div className="fan-home-container view-enter">
      {/* ── Fan Spotlight Carousel ── */}
      <ScrollReveal direction="fade" duration={700}>
        <div style={{ marginBottom: 28 }}>
          <FanSpotlightCarousel songs={newReleases} artists={artists} />
        </div>
      </ScrollReveal>

      {/* ── Hero Welcome Banner ── */}
      <ScrollReveal direction="up" delay={80} duration={600}>
        <div className="hero-welcome" style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div className="hero-avatar-ring">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <div
                    className="avatar-placeholder"
                    style={{
                      background: 'var(--accent-color)',
                      color: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.8rem',
                    }}
                  >
                    {user?.name?.charAt(0) ?? 'M'}
                  </div>
                )}
              </div>
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    background: 'rgba(250, 204, 21, 0.15)',
                    border: '1px solid rgba(250, 204, 21, 0.3)',
                    borderRadius: 20,
                    color: 'var(--accent-color)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  <i className="fas fa-sparkles" /> {t('fan.premium_discovery')}
                </div>
                <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                  {t('fan.welcome_back')} <span style={{ color: 'var(--accent-color)' }}>{user?.name ?? t('fan.music_lover')}</span>!
                </h2>
                <p style={{ margin: '6px 0 0 0', color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.95rem' }}>
                  {t('fan.welcome_desc')}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div className="stat-card-premium" style={{ padding: '14px 20px', minWidth: 120 }}>
                <div className="stat-card-icon" style={{ width: 40, height: 40, fontSize: '1rem' }}>
                  <i className="fas fa-compact-disc" />
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{newReleases.length}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('fan.new_tracks')}</div>
                </div>
              </div>

              <div
                className="stat-card-premium"
                onClick={() => onNavClick?.('favorites')}
                style={{
                  padding: '14px 20px',
                  minWidth: 120,
                  cursor: onNavClick ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                }}
                title="View your Favorites"
              >
                <div
                  className="stat-card-icon"
                  style={{
                    width: 40,
                    height: 40,
                    fontSize: '1rem',
                    color: '#ef4444',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.15)',
                  }}
                >
                  <i className="fas fa-heart" />
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444' }}>
                    {favoriteIds.size}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Favorites <i className="fas fa-arrow-right" style={{ fontSize: '0.6rem' }} />
                  </div>
                </div>
              </div>

              <div className="stat-card-premium" style={{ padding: '14px 20px', minWidth: 120 }}>
                <div
                  className="stat-card-icon"
                  style={{
                    width: 40,
                    height: 40,
                    fontSize: '1rem',
                    color: '#10b981',
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                    background: 'rgba(16, 185, 129, 0.15)',
                  }}
                >
                  <i className="fas fa-headphones" />
                </div>
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                    {totalPlays.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('fan.total_plays')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ── Browse by Genre (Chips & Visual Grid) ── */}
      <ScrollReveal direction="up" delay={120} duration={600}>
        <section className="fan-section" style={{ marginBottom: 28 }}>
          <div className="fan-section-header-premium">
            <div className="fan-section-label">
              <div className="fan-section-icon-badge">
                <i className="fas fa-music" />
              </div>
              <div>
                <div className="fan-section-title-premium">{t('fan.browse_genre')}</div>
                <div className="fan-section-subtitle-premium">{t('fan.browse_genre_sub')}</div>
              </div>
            </div>
          </div>
          <div className="fan-genre-tags" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {GENRES.map((g) => (
              <button
                key={g}
                className={`fan-filter-chip ${activeGenre === g ? 'active' : ''}`}
                onClick={() => setActiveGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>

          {activeGenre === 'All' && (
            <div className="genre-image-grid" style={{ marginTop: 16 }}>
              {GENRE_CARDS_DATA.slice(0, 4).map((genre) => (
                <div
                  key={genre.name}
                  className="genre-image-card"
                  onClick={() => setActiveGenre(genre.name)}
                  style={{ height: 140 }}
                  role="button"
                  tabIndex={0}
                >
                  <div
                    className="genre-image-bg"
                    style={{ backgroundImage: `url('${genre.image}')` }}
                  />
                  <div className="genre-image-overlay" style={{ padding: 14 }}>
                    <span className="genre-image-tag" style={{ background: genre.color }}>
                      {genre.name}
                    </span>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{genre.name}</h4>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>{genre.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </ScrollReveal>

      {loading ? (
        <div className="fan-loading" style={{ padding: 40 }}>
          <i className="fas fa-spinner fa-spin" />
          <span>{t('fan.loading_music')}</span>
        </div>
      ) : (
        <>
          {/* ── New Releases (Smooth Scroll Row) ── */}
          {filteredNewReleases.length > 0 && (
            <ScrollReveal direction="up" delay={150} duration={600}>
              <ScrollRow
                title={t('fan.new_releases')}
                subtitle={t('fan.new_releases_sub')}
                icon="fa-compact-disc"
                iconBg="rgba(250, 204, 21, 0.15)"
                iconColor="var(--accent-color)"
              >
                {filteredNewReleases.map((song) => (
                  <SongCard
                    key={song._id}
                    song={song}
                    playlist={newReleases}
                    isFavorite={favoriteIds.has(song._id)}
                    onFavoriteToggle={handleFavoriteToggle}
                    onAddToPlaylist={handleAddToPlaylist}
                    onArtistClick={setSelectedArtist}
                  />
                ))}
              </ScrollRow>
            </ScrollReveal>
          )}

          {/* ── Trending Songs (Smooth Scroll Row) ── */}
          {filteredTrending.length > 0 && (
            <ScrollReveal direction="up" delay={180} duration={600}>
              <ScrollRow
                title={t('fan.trending_now')}
                subtitle={t('fan.trending_now_sub')}
                icon="fa-fire"
                iconBg="rgba(249,115,22,0.15)"
                iconColor="#f97316"
              >
                {filteredTrending.map((song) => (
                  <SongCard
                    key={song._id}
                    song={song}
                    playlist={trending}
                    isFavorite={favoriteIds.has(song._id)}
                    onFavoriteToggle={handleFavoriteToggle}
                    onAddToPlaylist={handleAddToPlaylist}
                    onArtistClick={setSelectedArtist}
                  />
                ))}
              </ScrollRow>
            </ScrollReveal>
          )}

          {/* ── Recommended Playlists (Smooth Scroll Row) ── */}
          {recommendedPlaylists.length > 0 && (
            <ScrollReveal direction="up" delay={200} duration={600}>
              <ScrollRow
                title={t('fan.made_for_you')}
                subtitle={t('fan.made_for_you_sub')}
                icon="fa-list"
                iconBg="rgba(59,130,246,0.15)"
                iconColor="#3b82f6"
              >
                {recommendedPlaylists.map((pl) => (
                  <PlaylistCard key={pl._id} playlist={pl} onPlayPlaylist={handlePlayPlaylist} />
                ))}
              </ScrollRow>
            </ScrollReveal>
          )}

          {/* ── Trending Artists (Smooth Scroll Row) ── */}
          {artists.length > 0 && (
            <ScrollReveal direction="up" delay={220} duration={600}>
              <ScrollRow
                title={t('fan.trending_artists')}
                subtitle={t('fan.trending_artists_sub')}
                icon="fa-users"
                iconBg="rgba(168,85,247,0.15)"
                iconColor="#a855f7"
              >
                {artists.map((artist) => (
                  <ArtistCard
                    key={artist._id}
                    artist={artist}
                    isFollowing={followingIds.has(artist._id)}
                    onFollowToggle={handleFollowToggle}
                    onArtistClick={setSelectedArtist}
                  />
                ))}
              </ScrollRow>
            </ScrollReveal>
          )}

          {/* ── Favorite Artists (Smooth Scroll Row) ── */}
          {favoriteArtists.length > 0 && (
            <ScrollReveal direction="up" delay={240} duration={600}>
              <ScrollRow
                title={t('fan.favorite_artists')}
                subtitle={t('fan.favorite_artists_sub')}
                icon="fa-heart"
                iconBg="rgba(239,68,68,0.15)"
                iconColor="#ef4444"
              >
                {favoriteArtists.map((artist) => (
                  <ArtistCard
                    key={artist._id}
                    artist={artist}
                    isFollowing={true}
                    onFollowToggle={handleFollowToggle}
                    onArtistClick={setSelectedArtist}
                  />
                ))}
              </ScrollRow>
            </ScrollReveal>
          )}
        </>
      )}

      <ArtistDetailsModal artist={selectedArtist} onClose={() => setSelectedArtist(null)} />

      {/* Add-to-Playlist Picker Modal */}
      {addToPlaylistSong && (
        <Modal
          isOpen={!!addToPlaylistSong}
          title={`Add "${addToPlaylistSong.title}" to Playlist`}
          onClose={() => setAddToPlaylistSong(null)}
          size="sm"
        >
          {userPlaylists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.6)' }}>
              <i className="fas fa-compact-disc" style={{ fontSize: '2rem', color: 'var(--accent-color)', opacity: 0.5, display: 'block', marginBottom: 12 }} />
              <p style={{ margin: 0 }}>You have no playlists yet.</p>
              <p style={{ margin: '6px 0 0', fontSize: '0.85rem' }}>Create one from the Playlists section.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {userPlaylists.map((pl) => (
                <button
                  key={pl._id}
                  onClick={() => handlePickPlaylist(pl)}
                  disabled={addingToPlaylist}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, cursor: 'pointer', textAlign: 'left', color: '#fff',
                    transition: 'all 0.2s', opacity: addingToPlaylist ? 0.6 : 1,
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(250,204,21,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="fas fa-list" style={{ color: 'var(--accent-color)' }} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                      {pl.songs?.length ?? 0} {(pl.songs?.length ?? 0) === 1 ? 'track' : 'tracks'}
                    </div>
                  </div>
                  <i className="fas fa-plus" style={{ color: 'var(--accent-color)', fontSize: '0.9rem' }} />
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default FanHome;

