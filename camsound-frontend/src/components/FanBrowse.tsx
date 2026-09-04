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

interface FanBrowseProps {
  initialQuery?: string;
}

const FanBrowse: React.FC<FanBrowseProps> = ({ initialQuery = '' }) => {
  const { playSong } = useAudio();
  const [query, setQuery] = useState(initialQuery);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [genreFilter, setGenreFilter] = useState('All');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

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
      setSongs([]);
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
          <span>Searching tracks...</span>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div className="glass-badge" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
              <i className="fas fa-music" /> {songs.length} {songs.length === 1 ? 'track' : 'tracks'} found
              {debouncedQuery && <> for "{debouncedQuery}"</>}
            </div>
          </div>
          <div className="fan-songs-grid-premium">
            {songs.map(song => (
              <div key={song._id} className="music-card" onClick={() => handlePlay(song)} style={{ cursor: 'pointer' }}>
                <div className="music-card-cover-wrapper">
                  {song.coverArt
                    ? <img src={song.coverArt} alt={song.title} className="music-card-cover" />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)', fontSize: '2rem' }}><i className="fas fa-music" /></div>}
                  <div className="music-card-play-overlay">
                    <div className="play-btn-circle">
                      <i className="fas fa-play" style={{ marginLeft: 2 }} />
                    </div>
                  </div>
                </div>
                <div className="fan-song-info-premium">
                  <div className="fan-song-title-premium" style={{ fontWeight: 700, color: '#fff' }}>{song.title}</div>
                  <div className="fan-song-artist-premium" style={{ color: 'var(--accent-color)', fontSize: '0.82rem' }}>{song.artistId?.name ?? 'Unknown Artist'}</div>
                  <div className="fan-song-meta-row" style={{ marginTop: 6 }}>
                    {song.genre && <span className="fan-song-genre-badge">{song.genre}</span>}
                    {song.plays != null && (
                      <span className="fan-song-plays-count">
                        <i className="fas fa-headphones" /> {song.plays.toLocaleString()}
                      </span>
                    )}
                  </div>
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
