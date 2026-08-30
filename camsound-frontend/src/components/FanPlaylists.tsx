import React, { useState } from 'react';

const MOCK_PLAYLISTS = [
  { _id: 'p1', name: 'Weekend Vibes', trackCount: 15, coverUrl: '' },
  { _id: 'p2', name: 'Workout Mix', trackCount: 22, coverUrl: '' },
  { _id: 'p3', name: 'Late Night Afrobeats', trackCount: 10, coverUrl: '' },
];

const FanPlaylists: React.FC = () => {
  const [playlists] = useState(MOCK_PLAYLISTS);

  return (
    <div className="fan-history-container">
      <div className="fan-section-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="fan-page-title">🎧 My Playlists</h2>
          <p className="fan-page-subtitle">Your personal collections</p>
        </div>
        <button className="fan-primary-btn" style={{ fontSize: '0.8rem', padding: '8px 16px' }}>
          <i className="fas fa-plus" /> Create Playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <div className="fan-empty-state">
          <i className="fas fa-list-music" />
          <h4>No playlists yet</h4>
          <p>Create your first playlist and add your favorite tracks.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {playlists.map((playlist) => (
            <div key={playlist._id} className="music-card" style={{ cursor: 'pointer' }}>
              <div className="music-card-cover" style={{ background: 'var(--gradient-dark)' }}>
                {playlist.coverUrl ? (
                  <img src={playlist.coverUrl} alt={playlist.name} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-list" style={{ color: 'var(--text-muted)', fontSize: '2rem' }} />
                  </div>
                )}
                <div className="play-overlay">
                  <button className="play-circle-btn">
                    <i className="fas fa-play" />
                  </button>
                </div>
              </div>
              <div className="music-card-info">
                <div className="music-card-title">{playlist.name}</div>
                <div className="music-card-artist">{playlist.trackCount} tracks</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FanPlaylists;
