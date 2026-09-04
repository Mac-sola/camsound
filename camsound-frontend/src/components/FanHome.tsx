import React, { useState, useEffect, useCallback } from 'react';
import { songsService, artistsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import ArtistSocialLinks from './ArtistSocialLinks';
import ArtistDetailsModal from './ArtistDetailsModal';

interface Song {
  _id: string;
  title: string;
  genre?: string;
  plays?: number;
  coverArt?: string;
  artistId?: { name?: string; _id?: string };
  fileUrl?: string;
}

interface Artist {
  _id: string;
  name: string;
  genre?: string;
  followers?: number;
  image?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
}

const GENRES = ['Afrobeat', 'Hip Hop', 'Makossa', 'Bikutsi', 'Assiko', 'R&B', 'Jazz', 'Gospel'];

const SkeletonSongCard: React.FC = () => (
  <div className="skeleton-card">
    <div className="skeleton-cover" />
    <div className="skeleton-info">
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
    </div>
  </div>
);

const PremiumSongCard: React.FC<{
  song: Song;
  onPlay: (song: Song) => void;
  onArtistClick: (artist: Artist) => void;
  isPlaying: boolean;
  isActive: boolean;
}> = ({ song, onPlay, onArtistClick, isPlaying, isActive }) => (
  <div
    className="fan-song-card-premium"
    onClick={() => onPlay(song)}
    role="button"
    tabIndex={0}
    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onPlay(song); }}
    aria-label={`Play ${song.title}`}
  >
    <div className="fan-song-cover-premium">
      {song.coverArt
        ? <img src={song.coverArt} alt={song.title} loading="lazy" />
        : <div className="fan-song-cover-icon-premium"><i className="fas fa-music" /></div>}
      {isActive && isPlaying && (
        <div className="fan-song-playing-indicator">
          <div className="fan-song-playing-bar" />
          <div className="fan-song-playing-bar" />
          <div className="fan-song-playing-bar" />
        </div>
      )}
      <button
        className="fan-song-play-btn-premium"
        onClick={e => { e.stopPropagation(); onPlay(song); }}
        aria-label="Play"
      >
        <i className={`fas ${isActive && isPlaying ? 'fa-pause' : 'fa-play'}`} />
      </button>
    </div>
    <div className="fan-song-info-premium">
      <div className="fan-song-title-premium">{song.title}</div>
      {song.artistId?._id ? (
        <button
          className="fan-song-artist-premium"
          onClick={e => {
            e.stopPropagation();
            onArtistClick({ _id: song.artistId!._id!, name: song.artistId!.name || 'Artist' });
          }}
        >
          {song.artistId.name ?? 'Unknown Artist'}
        </button>
      ) : (
        <div className="fan-song-artist-premium">Unknown Artist</div>
      )}
      <div className="fan-song-meta-row">
        {song.genre && <span className="fan-song-genre-badge">{song.genre}</span>}
        {song.plays != null && (
          <span className="fan-song-plays-count">
            <i className="fas fa-headphones" /> {song.plays.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  </div>
);

const FanHome: React.FC = () => {
  const { user } = useAuth();
  const { playSong, currentSong, isPlaying } = useAudio();
  const [newReleases, setNewReleases] = useState<Song[]>([]);
  const [trending, setTrending] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [activeGenre, setActiveGenre] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [songsResult, artistsResult] = await Promise.allSettled([
        songsService.getSongs({ limit: 12, sort: 'date' }),
        artistsService.getArtists({ limit: 6 }),
      ]);
      const songs: Song[] = songsResult.status === 'fulfilled' ? songsResult.value.data?.data ?? songsResult.value.data ?? [] : [];
      const artistList: Artist[] = artistsResult.status === 'fulfilled' ? artistsResult.value.data?.data ?? artistsResult.value.data ?? [] : [];
      setNewReleases(songs.slice(0, 6));
      const byPlays = [...songs].sort((a, b) => (b.plays ?? 0) - (a.plays ?? 0));
      setTrending(byPlays.slice(0, 6));
      setArtists(artistList);
    } catch {
      setNewReleases([]);
      setTrending([]);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePlay = (song: Song) => {
    try { playSong(song as any); } catch { console.log('Play:', song.title); }
  };

  const totalPlays = newReleases.reduce((acc, s) => acc + (s.plays ?? 0), 0);

  return (
    <div className="fan-home-container view-enter">
      {/* ── Premium Hero Welcome Banner ── */}
      <div className="hero-welcome">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div className="hero-avatar-ring">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <div className="avatar-placeholder" style={{ background: 'var(--accent-color)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.8rem' }}>
                  {user?.name?.charAt(0) ?? 'M'}
                </div>
              )}
            </div>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(250, 204, 21, 0.15)', border: '1px solid rgba(250, 204, 21, 0.3)', borderRadius: 20, color: 'var(--accent-color)', fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
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
              <div className="stat-card-icon" style={{ width: 40, height: 40, fontSize: '1rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.15)' }}>
                <i className="fas fa-headphones" />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{totalPlays.toLocaleString()}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Plays</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Genre Filter ── */}
      <section className="fan-section" style={{ marginBottom: 28 }}>
        <div className="fan-section-header-premium">
          <div className="fan-section-label">
            <div className="fan-section-icon-badge"><i className="fas fa-music" /></div>
            <div>
              <div className="fan-section-title-premium">Browse by Genre</div>
              <div className="fan-section-subtitle-premium">Filter by your favourite style</div>
            </div>
          </div>
        </div>
        <div className="fan-genre-tags" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`fan-filter-chip-premium ${activeGenre === '' ? 'active' : ''}`}
            onClick={() => setActiveGenre('')}
          >All</button>
          {GENRES.map(g => (
            <button
              key={g}
              className={`fan-filter-chip-premium ${activeGenre === g ? 'active' : ''}`}
              onClick={() => setActiveGenre(activeGenre === g ? '' : g)}
            >{g}</button>
          ))}
        </div>
      </section>

      {loading ? (
        <>
          {/* ── Skeleton Loaders ── */}
          <section className="fan-section" style={{ marginBottom: 32 }}>
            <div className="fan-section-header-premium" style={{ marginBottom: 16 }}>
              <div className="skeleton-line" style={{ width: 160, height: 18, margin: 0 }} />
            </div>
            <div className="fan-songs-grid-premium">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonSongCard key={i} />)}
            </div>
          </section>
          <section className="fan-section">
            <div className="fan-section-header-premium" style={{ marginBottom: 16 }}>
              <div className="skeleton-line" style={{ width: 140, height: 18, margin: 0 }} />
            </div>
            <div className="fan-songs-grid-premium">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonSongCard key={i} />)}
            </div>
          </section>
        </>
      ) : (
        <>
          {/* ── New Releases ── */}
          <section className="fan-section" style={{ marginBottom: 32 }}>
            <div className="fan-section-header-premium">
              <div className="fan-section-label">
                <div className="fan-section-icon-badge"><i className="fas fa-compact-disc" /></div>
                <div>
                  <div className="fan-section-title-premium">New Releases</div>
                  <div className="fan-section-subtitle-premium">Fresh tracks just dropped</div>
                </div>
              </div>
            </div>
            <div className="fan-songs-grid-premium">
              {newReleases
                .filter(s => !activeGenre || s.genre === activeGenre)
                .map(song => (
                  <PremiumSongCard
                    key={song._id}
                    song={song}
                    onPlay={handlePlay}
                    onArtistClick={setSelectedArtist}
                    isActive={currentSong?._id === song._id}
                    isPlaying={isPlaying}
                  />
                ))}
            </div>
          </section>

          {/* ── Trending Songs ── */}
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
            <div className="fan-songs-grid-premium">
              {trending
                .filter(s => !activeGenre || s.genre === activeGenre)
                .map(song => (
                  <PremiumSongCard
                    key={song._id}
                    song={song}
                    onPlay={handlePlay}
                    onArtistClick={setSelectedArtist}
                    isActive={currentSong?._id === song._id}
                    isPlaying={isPlaying}
                  />
                ))}
            </div>
          </section>

          {/* ── Trending Artists ── */}
          {artists.length > 0 && (
            <section className="fan-section">
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
              <div className="fan-artists-grid">
                {artists.map(artist => (
                  <div
                    key={artist._id}
                    className="fan-artist-card-premium"
                    onClick={() => setSelectedArtist(artist)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedArtist(artist); }}
                  >
                    <div className="fan-artist-avatar-premium">
                      {artist.image
                        ? <img src={artist.image} alt={artist.name} />
                        : <span>{artist.name.charAt(0)}</span>}
                    </div>
                    <div className="fan-artist-name-premium">{artist.name}</div>
                    {artist.genre && <div className="fan-artist-genre-premium">{artist.genre}</div>}
                    {artist.followers != null && (
                      <div className="fan-artist-followers-premium">
                        <i className="fas fa-users" /> {artist.followers.toLocaleString()} followers
                      </div>
                    )}
                    <ArtistSocialLinks artist={artist} />
                  </div>
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
