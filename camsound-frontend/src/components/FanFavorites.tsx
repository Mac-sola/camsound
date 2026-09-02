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

  return (
    <div className="fan-history-container">
      <div className="fan-section-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 className="fan-page-title">❤️ My Favorites</h2>
          <p className="fan-page-subtitle">Tracks you've loved</p>
        </div>
      </div>

      {loading ? (
        <div className="fan-loading">
          <i className="fas fa-spinner fa-spin" />
          <span>Loading favorites...</span>
        </div>
      ) : favorites.length === 0 ? (
        <div className="fan-empty-state">
          <i className="fas fa-heart-broken" />
          <h4>No favorites yet</h4>
          <p>Like some tracks to see them here.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {favorites.map((song: any) => {
            const isActive = currentSong?._id === song._id;
            return (
              <div key={song._id} className="music-card" onClick={() => handlePlay(song)}>
                <div className="music-card-cover">
                  {song.coverArt ? <img src={song.coverArt} alt={song.title} /> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}><i className="fas fa-music" style={{color:'var(--text-muted)'}} /></div>}
                  <div className="play-overlay">
                    <button className="play-circle-btn">
                      <i className={`fas ${isActive && isPlaying ? 'fa-pause' : 'fa-play'}`} />
                    </button>
                  </div>
                </div>
                <div className="music-card-info">
                  <div className="music-card-title" style={{ color: isActive ? 'var(--accent-color)' : 'var(--text-white)' }}>
                    {song.title}
                  </div>
                  <div className="music-card-artist">{song.artistId?.name || 'Unknown Artist'}</div>
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
