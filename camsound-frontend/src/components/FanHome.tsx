import React, { useState, useEffect, useCallback } from 'react';
import { songsService, artistsService, favoritesService, playlistsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import SongCard, { type SongItem } from './SongCard';
import ArtistCard, { type ArtistItem } from './ArtistCard';
import PlaylistCard, { type PlaylistItem } from './PlaylistCard';
import ArtistDetailsModal from './ArtistDetailsModal';
import HeroCarousel from './HeroCarousel';
import { GENRE_CARDS_DATA } from '../utils/musicImages';

const GENRES = ['All', 'Makossa', 'Bikutsi', 'Afrobeat', 'Traditional', 'Assiko', 'Gospel', 'Hip Hop', 'R&B'];

export const FanHome: React.FC = () => {
  const { user } = useAuth();
  const { playSong } = useAudio();
  const [newReleases, setNewReleases] = useState<SongItem[]>([]);
  const [trending, setTrending] = useState<SongItem[]>([]);
  const [artists, setArtists] = useState<ArtistItem[]>([]);
  const [favoriteArtists, setFavoriteArtists] = useState<ArtistItem[]>([]);
  const [recommendedPlaylists, setRecommendedPlaylists] = useState<PlaylistItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [activeGenre, setActiveGenre] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [songsResult, artistsResult, favoritesResult, playlistsResult] = await Promise.allSettled([
        songsService.getSongs({ limit: 30, sort: 'date' }),
        artistsService.getArtists({ limit: 12 }),
        favoritesService.getFavorites(),
        playlistsService.getPlaylists(),
      ]);

      const songs: SongItem[] =
        songsResult.status === 'fulfilled' ? songsResult.value.data?.data ?? songsResult.value.data ?? [] : [];
      const artistList: ArtistItem[] =
        artistsResult.status === 'fulfilled' ? artistsResult.value.data?.data ?? artistsResult.value.data ?? [] : [];
      const favList: any[] =
        favoritesResult.status === 'fulfilled' ? favoritesResult.value.data?.data ?? favoritesResult.value.data ?? [] : [];
      const playList: PlaylistItem[] =
        playlistsResult.status === 'fulfilled' ? playlistsResult.value.data?.data ?? playlistsResult.value.data ?? [] : [];

      const favSet = new Set<string>(favList.map((f: any) => f._id || f.id || f.songId?._id));
      setFavoriteIds(favSet);

      setNewReleases(songs.slice(0, 6));
      const byPlays = [...songs].sort((a, b) => (b.plays ?? 0) - (a.plays ?? 0));
      setTrending(byPlays.slice(0, 6));
      setArtists(artistList.slice(0, 6));
      setFavoriteArtists(artistList.slice(0, 4));
      setRecommendedPlaylists(playList.slice(0, 4));
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
      } else {
        await favoritesService.likeSong(song._id);
        setFavoriteIds((prev) => new Set(prev).add(song._id));
      }
    } catch {
      // ignore
    }
  };

  const handlePlayPlaylist = (playlist: PlaylistItem) => {
    if (playlist.songs && playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs);
    }
  };

  const totalPlays = newReleases.reduce((acc, s) => acc + (s.plays ?? 0), 0);

  return (
    <div className="fan-home-container view-enter">
      {/* ── Spotlight Music Carousel ── */}
      <div style={{ marginBottom: 28 }}>
        <HeroCarousel />
      </div>

      {/* ── Hero Welcome Banner ── */}
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
                <i className="fas fa-sparkles" /> PREMIUM DISCOVERY
              </div>
              <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                Welcome back, <span style={{ color: 'var(--accent-color)' }}>{user?.name ?? 'Music Lover'}</span>!
              </h2>
              <p style={{ margin: '6px 0 0 0', color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.95rem' }}>
                Explore the latest sounds, artists, and trending releases in Cameroon
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div className="stat-card-premium" style={{ padding: '14px 20px', minWidth: 130 }}>
              <div className="stat-card-icon" style={{ width: 40, height: 40, fontSize: '1rem' }}>
                <i className="fas fa-compact-disc" />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{newReleases.length}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>New Tracks</div>
              </div>
            </div>

            <div className="stat-card-premium" style={{ padding: '14px 20px', minWidth: 130 }}>
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
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Plays</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Browse by Genre (Chips & Visual Grid) ── */}
      <section className="fan-section" style={{ marginBottom: 28 }}>
        <div className="fan-section-header-premium">
          <div className="fan-section-label">
            <div className="fan-section-icon-badge">
              <i className="fas fa-music" />
            </div>
            <div>
              <div className="fan-section-title-premium">Browse by Genre</div>
              <div className="fan-section-subtitle-premium">Filter by your favourite style</div>
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

      {loading ? (
        <div className="fan-loading" style={{ padding: 40 }}>
          <i className="fas fa-spinner fa-spin" />
          <span>Loading music library...</span>
        </div>
      ) : (
        <>
          {/* ── New Releases (Cards Grid) ── */}
          <section className="fan-section" style={{ marginBottom: 32 }}>
            <div className="fan-section-header-premium">
              <div className="fan-section-label">
                <div className="fan-section-icon-badge">
                  <i className="fas fa-compact-disc" />
                </div>
                <div>
                  <div className="fan-section-title-premium">New Releases</div>
                  <div className="fan-section-subtitle-premium">Fresh tracks just dropped</div>
                </div>
              </div>
            </div>
            <div className="cards-grid">
              {newReleases
                .filter((s) => activeGenre === 'All' || s.genre?.toLowerCase() === activeGenre.toLowerCase())
                .map((song) => (
                  <SongCard
                    key={song._id}
                    song={song}
                    playlist={newReleases}
                    isFavorite={favoriteIds.has(song._id)}
                    onFavoriteToggle={handleFavoriteToggle}
                    onArtistClick={setSelectedArtist}
                  />
                ))}
            </div>
          </section>

          {/* ── Trending Songs (Cards Grid) ── */}
          <section className="fan-section" style={{ marginBottom: 32 }}>
            <div className="fan-section-header-premium">
              <div className="fan-section-label">
                <div className="fan-section-icon-badge" style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>
                  <i className="fas fa-fire" />
                </div>
                <div>
                  <div className="fan-section-title-premium">Trending Now</div>
                  <div className="fan-section-subtitle-premium">What's hot in Cameroon right now</div>
                </div>
              </div>
            </div>
            <div className="cards-grid">
              {trending
                .filter((s) => activeGenre === 'All' || s.genre?.toLowerCase() === activeGenre.toLowerCase())
                .map((song) => (
                  <SongCard
                    key={song._id}
                    song={song}
                    playlist={trending}
                    isFavorite={favoriteIds.has(song._id)}
                    onFavoriteToggle={handleFavoriteToggle}
                    onArtistClick={setSelectedArtist}
                  />
                ))}
            </div>
          </section>

          {/* ── Recommended Playlists (Cards Grid) ── */}
          {recommendedPlaylists.length > 0 && (
            <section className="fan-section" style={{ marginBottom: 32 }}>
              <div className="fan-section-header-premium">
                <div className="fan-section-label">
                  <div className="fan-section-icon-badge" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
                    <i className="fas fa-list" />
                  </div>
                  <div>
                    <div className="fan-section-title-premium">Made For You</div>
                    <div className="fan-section-subtitle-premium">Handpicked playlists for your taste</div>
                  </div>
                </div>
              </div>
              <div className="cards-grid">
                {recommendedPlaylists.map((pl) => (
                  <PlaylistCard key={pl._id} playlist={pl} onPlayPlaylist={handlePlayPlaylist} />
                ))}
              </div>
            </section>
          )}

          {/* ── Trending Artists (Cards Grid) ── */}
          {artists.length > 0 && (
            <section className="fan-section" style={{ marginBottom: 32 }}>
              <div className="fan-section-header-premium">
                <div className="fan-section-label">
                  <div className="fan-section-icon-badge" style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>
                    <i className="fas fa-users" />
                  </div>
                  <div>
                    <div className="fan-section-title-premium">Trending Artists</div>
                    <div className="fan-section-subtitle-premium">Cameroonian talents to watch</div>
                  </div>
                </div>
              </div>
              <div className="cards-grid">
                {artists.map((artist) => (
                  <ArtistCard
                    key={artist._id}
                    artist={artist}
                    onArtistClick={setSelectedArtist}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Favorite Artists (Cards Grid) ── */}
          {favoriteArtists.length > 0 && (
            <section className="fan-section">
              <div className="fan-section-header-premium">
                <div className="fan-section-label">
                  <div className="fan-section-icon-badge" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                    <i className="fas fa-heart" />
                  </div>
                  <div>
                    <div className="fan-section-title-premium">Favorite Artists</div>
                    <div className="fan-section-subtitle-premium">Artists in your collection</div>
                  </div>
                </div>
              </div>
              <div className="cards-grid">
                {favoriteArtists.map((artist) => (
                  <ArtistCard
                    key={artist._id}
                    artist={artist}
                    isFollowing={true}
                    onArtistClick={setSelectedArtist}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <ArtistDetailsModal artist={selectedArtist} onClose={() => setSelectedArtist(null)} />
    </div>
  );
};

export default FanHome;
