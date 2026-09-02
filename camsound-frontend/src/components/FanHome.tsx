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

const SongCard: React.FC<{ song: Song; onPlay: (song: Song) => void; onArtistClick: (artist: Artist) => void }> = ({ song, onPlay, onArtistClick }) => (
  <div className="fan-song-card" onClick={() => onPlay(song)}>
    <div className="fan-song-cover">
      {song.coverArt
        ? <img src={song.coverArt} alt={song.title} />
        : <i className="fas fa-music" />}
      <div className="fan-song-play-overlay">
        <i className="fas fa-play" />
      </div>
    </div>
    <div className="fan-song-info">
      <div className="fan-song-title">{song.title}</div>
      {song.artistId?._id ? (
        <button className="fan-song-artist" onClick={event => { event.stopPropagation(); onArtistClick({ _id: song.artistId!._id!, name: song.artistId!.name || 'Artist' }); }}>
          {song.artistId.name ?? 'Unknown Artist'}
        </button>
      ) : <div className="fan-song-artist">Unknown Artist</div>}
      {song.genre && <div className="fan-song-genre">{song.genre}</div>}
    </div>
  </div>
);

const FanHome: React.FC = () => {
  const { user } = useAuth();
  const { playSong } = useAudio();
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
      // "Trending" = sort by plays
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
    try {
      playSong(song as any);
    } catch {
      console.log('Play:', song.title);
    }
  };

  return (
    <div className="fan-home-container">
      {/* Welcome Banner */}
      <div className="fan-welcome-banner">
        <div className="fan-welcome-text">
          <h2>Welcome back, <span className="fan-welcome-name">{user?.name ?? 'Music Lover'}</span>! 🎵</h2>
          <p>Discover fresh Cameroonian sounds today</p>
        </div>
        <div className="fan-welcome-icon">
          <i className="fas fa-headphones-alt" />
        </div>
      </div>

      {/* Genre Filter Tags */}
      <section className="fan-section">
        <h3 className="fan-section-title">Browse by Genre</h3>
        <div className="fan-genre-tags">
          <button
            className={`fan-genre-tag ${activeGenre === '' ? 'active' : ''}`}
            onClick={() => setActiveGenre('')}
          >All</button>
          {GENRES.map(g => (
            <button
              key={g}
              className={`fan-genre-tag ${activeGenre === g ? 'active' : ''}`}
              onClick={() => setActiveGenre(activeGenre === g ? '' : g)}
            >{g}</button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="fan-loading">
          <i className="fas fa-spinner fa-spin" />
          <span>Loading music...</span>
        </div>
      ) : (
        <>
          {/* New Releases */}
          <section className="fan-section">
            <div className="fan-section-header">
              <h3 className="fan-section-title">🆕 New Releases</h3>
              <span className="fan-section-subtitle">Fresh tracks just dropped</span>
            </div>
            <div className="fan-songs-grid">
              {newReleases
                .filter(s => !activeGenre || s.genre === activeGenre)
                .map(song => <SongCard key={song._id} song={song} onPlay={handlePlay} onArtistClick={setSelectedArtist} />)}
            </div>
          </section>

          {/* Trending Songs */}
          <section className="fan-section">
            <div className="fan-section-header">
              <h3 className="fan-section-title">🔥 Trending Songs</h3>
              <span className="fan-section-subtitle">What's hot right now</span>
            </div>
            <div className="fan-songs-grid">
              {trending
                .filter(s => !activeGenre || s.genre === activeGenre)
                .map(song => <SongCard key={song._id} song={song} onPlay={handlePlay} onArtistClick={setSelectedArtist} />)}
            </div>
          </section>

          {/* Trending Artists */}
          {artists.length > 0 && (
            <section className="fan-section">
              <div className="fan-section-header">
                <h3 className="fan-section-title">⭐ Trending Artists</h3>
                <span className="fan-section-subtitle">Cameroonian talents to watch</span>
              </div>
              <div className="fan-artists-grid">
                {artists.map(artist => (
                  <div key={artist._id} className="fan-artist-card" onClick={() => setSelectedArtist(artist)} role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setSelectedArtist(artist); }}>
                    <div className="fan-artist-avatar">
                      {artist.image
                        ? <img src={artist.image} alt={artist.name} />
                        : <span>{artist.name.charAt(0)}</span>}
                    </div>
                    <div className="fan-artist-name">{artist.name}</div>
                    {artist.genre && <div className="fan-artist-genre">{artist.genre}</div>}
                    {artist.followers != null && (
                      <div className="fan-artist-followers">
                        <i className="fas fa-users" /> {artist.followers.toLocaleString()}
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
