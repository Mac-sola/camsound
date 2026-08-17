import React, { useEffect, useMemo, useState } from 'react';
import { songsService } from '../services/api';

interface Song {
  _id: string;
  title: string;
  genre?: string;
  coverArt?: string;
  artistId?: { name?: string };
}

const FanBrowse: React.FC = () => {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchSongs = async () => {
      setLoading(true);
      try {
        const resp = await songsService.getSongs({ limit: 100 });
        if (!cancelled && resp.data.success) setSongs(resp.data.data);
      } catch {
        if (!cancelled) setSongs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSongs();
    return () => { cancelled = true; };
  }, []);

  const filteredSongs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(song =>
      song.title?.toLowerCase().includes(q) ||
      song.artistId?.name?.toLowerCase().includes(q) ||
      song.genre?.toLowerCase().includes(q)
    );
  }, [query, songs]);

  return (
    <div className="section-card">
      <div className="section-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <h2>Browse All Music</h2>
        <div className="search-wrap">
          <i className="fas fa-search" />
          <input
            type="text"
            placeholder="Search songs, artists..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="search-input-db"
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>Loading...</div>
      ) : (
        <div className="cards-grid">
          {filteredSongs.map(song => (
            <div key={song._id} className="music-card">
              <div className="music-card-cover">
                {song.coverArt ? (
                  <img src={song.coverArt} alt={song.title} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-green-section)' }}>
                    <i className="fas fa-music" style={{ fontSize: '2rem', color: 'var(--accent-color)' }} />
                  </div>
                )}
              </div>
              <div className="music-card-info">
                <div className="music-card-title">{song.title}</div>
                <div className="music-card-artist">{song.artistId?.name || 'Unknown Artist'}</div>
              </div>
            </div>
          ))}
          {filteredSongs.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>No results found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default FanBrowse;
