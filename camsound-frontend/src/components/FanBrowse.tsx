import React, { useState, useEffect, useCallback } from 'react';
import { songsService } from '../services/api';
import { useAudio } from '../context/AudioContext';

interface Song {
  _id: string;
  title: string;
  genre?: string;
  plays?: number;
  coverArt?: string;
  artistId?: { name?: string };
  fileUrl?: string;
}

const GENRES = ['All', 'Afrobeat', 'Hip Hop', 'Makossa', 'Bikutsi', 'Assiko', 'R&B', 'Jazz', 'Gospel'];

const FanBrowse: React.FC = () => {
  const { playSong } = useAudio();
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [genreFilter, setGenreFilter] = useState('All');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const fetchSongs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (debouncedQuery) params.search = debouncedQuery;
      if (genreFilter !== 'All') params.genre = genreFilter;
      const res = await songsService.getSongs(params);
      setSongs(res.data?.data ?? res.data ?? []);
    } catch {
      // Mock fallback
      const mock: Song[] = Array.from({ length: 12 }, (_, i) => ({
        _id: String(i),
        title: `Track ${i + 1}`,
        artistId: { name: `Artist ${i + 1}` },
        genre: GENRES[(i % (GENRES.length - 1)) + 1],
        plays: Math.floor(Math.random() * 20000),
      }));
      setSongs(mock);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, genreFilter]);

  useEffect(() => { fetchSongs(); }, [fetchSongs]);

  const handlePlay = (song: Song) => {
    try { playSong(song as any); } catch {}
  };

  return (
    <div className="fan-browse-container">
      {/* Search Bar */}
      <div className="fan-browse-search">
        <i className="fas fa-search fan-search-icon" />
        <input
          type="text"
          className="fan-search-input"
          placeholder="Search songs, artists, genres..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          id="fan-browse-search-input"
        />
        {query && (
          <button className="fan-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
            <i className="fas fa-times" />
          </button>
        )}
      </div>

      {/* Genre Filter */}
      <div className="fan-browse-filters">
        {GENRES.map(g => (
          <button
            key={g}
            className={`fan-filter-chip ${genreFilter === g ? 'active' : ''}`}
            onClick={() => setGenreFilter(g)}
          >{g}</button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="fan-loading">
          <i className="fas fa-spinner fa-spin" />
          <span>Searching...</span>
        </div>
      ) : (
        <>
          <div className="fan-browse-count">
            {songs.length} {songs.length === 1 ? 'track' : 'tracks'} found
            {debouncedQuery && <> for "<strong>{debouncedQuery}</strong>"</>}
          </div>
          <div className="fan-songs-grid">
            {songs.map(song => (
              <div key={song._id} className="fan-song-card" onClick={() => handlePlay(song)}>
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
                  <div className="fan-song-artist">{song.artistId?.name ?? 'Unknown'}</div>
                  {song.genre && <div className="fan-song-genre">{song.genre}</div>}
                  {song.plays != null && (
                    <div className="fan-song-plays">
                      <i className="fas fa-headphones" /> {song.plays.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {songs.length === 0 && !loading && (
            <div className="fan-empty-state">
              <i className="fas fa-search" />
              <h4>No tracks found</h4>
              <p>Try a different search term or genre filter</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FanBrowse;
