import React, { useState, useEffect } from 'react';
import { favoritesService } from '../services/api';
import { useAudio } from '../context/AudioContext';

const FanFavorites: React.FC = () => {
  const { playSong, currentSong, isPlaying } = useAudio();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await favoritesService.getFavorites();
        const data = res.data?.data ?? res.data ?? [];
        setFavorites(data);
      } catch {
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  const handlePlay = (song: any) => {
    playSong({
      _id: song._id,
      title: song.title,
      filePath: song.filePath ?? '',
      coverArt: song.coverArt,
      artistId: song.artistId,
    });
  };

  const handlePlayAll = () => {
    if (favorites.length) playSong(favorites[0], favorites);
  };

  return (
    <div className="fan-history-container">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 20, color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
          <i className="fas fa-heart" /> SAVED TRACKS
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>
          My Favorites
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
          Your personally curated collection of loved Cameroonian songs
        </p>
        </div>
        {favorites.length > 0 && <button className="btn-camsound-yellow" onClick={handlePlayAll}><i className="fas fa-play" /> Play All</button>}
      </div>

      {loading ? (
        <div className="fan-loading">
          <i className="fas fa-spinner fa-spin" />
          <span>Loading favorites...</span>
        </div>
      ) : favorites.length === 0 ? (
        <div className="fan-empty-state" style={{ background: 'rgba(18, 26, 22, 0.6)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
          <i className="fas fa-heart-broken" style={{ color: '#ef4444', opacity: 0.5 }} />
          <h4 style={{ color: '#fff' }}>No favorites yet</h4>
          <p>Click the heart icon on any song to save it to your library.</p>
        </div>
      ) : (
        <div className="fan-songs-grid-premium">
          {favorites.map((song: any) => {
            const isActive = currentSong?._id === song._id;
            return (
              <div key={song._id} className="music-card" onClick={() => handlePlay(song)} style={{ cursor: 'pointer' }}>
                <div className="music-card-cover-wrapper">
                  {song.coverArt ? (
                    <img src={song.coverArt} alt={song.title} className="music-card-cover" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '2rem' }}>
                      <i className="fas fa-heart" />
                    </div>
                  )}
                  <div className="music-card-play-overlay">
                    <div className="play-btn-circle" style={{ background: isActive && isPlaying ? '#ef4444' : 'var(--accent-color)' }}>
                      <i className={`fas ${isActive && isPlaying ? 'fa-pause' : 'fa-play'}`} style={{ marginLeft: isActive && isPlaying ? 0 : 2 }} />
                    </div>
                  </div>
                </div>
                <div className="fan-song-info-premium">
                  <div className="fan-song-title-premium" style={{ fontWeight: 700, color: isActive ? 'var(--accent-color)' : '#fff' }}>
                    {song.title}
                  </div>
                  <div className="fan-song-artist-premium" style={{ color: 'var(--accent-color)', fontSize: '0.82rem' }}>
                    {song.artistId?.name || 'Unknown Artist'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FanFavorites;

