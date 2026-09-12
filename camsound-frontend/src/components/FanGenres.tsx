import React from 'react';

interface Genre {
  name: string;
  icon: string;
  description: string;
  color: string;
  count: number;
}

const GENRES: Genre[] = [
  { name: 'Makossa', icon: 'fas fa-music', color: '#FF6B35', count: 245, description: 'Rhythmic dance music from Douala' },
  { name: 'Bikutsi', icon: 'fas fa-drum', color: '#2E8B57', count: 189, description: 'Traditional Beti dance music' },
  { name: 'Afrobeat', icon: 'fas fa-headphones', color: '#4A6CF7', count: 156, description: 'Modern African rhythms' },
  { name: 'Traditional', icon: 'fas fa-guitar', color: '#8B4513', count: 134, description: 'Heritage Cameroonian music' },
  { name: 'Assiko', icon: 'fas fa-drumstick-bite', color: '#9C27B0', count: 112, description: 'Urban dance music' },
  { name: 'Gospel', icon: 'fas fa-pray', color: '#2196F3', count: 98, description: 'Christian inspirational music' },
  { name: 'Hip Hop', icon: 'fas fa-microphone', color: '#FFA726', count: 87, description: 'Urban rap and hip hop' },
  { name: 'Highlife', icon: 'fas fa-glass-cheers', color: '#4CAF50', count: 76, description: 'West African guitar music' },
];

export const FanGenres: React.FC<{ onSelectGenre?: (genre: string) => void }> = ({ onSelectGenre }) => {
  return (
    <div className="fan-genres-container view-enter">
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(250, 204, 21, 0.12)', border: '1px solid rgba(250, 204, 21, 0.3)', borderRadius: 20, color: 'var(--accent-color)', fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
          <i className="fas fa-layer-group" /> EXPLORE STYLES
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>
          Music Genres
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
          Explore the rich tapestry of Cameroonian musical heritage and modern sub-genres
        </p>
      </div>

      <div className="cards-grid" id="genresGrid">
        {GENRES.map((genre) => (
          <div
            key={genre.name}
            className="song-card"
            data-genre={genre.name.toLowerCase()}
            onClick={() => onSelectGenre?.(genre.name)}
            role="button"
            tabIndex={0}
          >
            <div className="song-cover" style={{ background: genre.color }}>
              <i className={genre.icon} />
            </div>

            <div className="song-info">
              <h4>{genre.name}</h4>
              <p>{genre.count} songs • {genre.description}</p>
            </div>

            <div className="song-actions">
              <button
                type="button"
                className="action-btn"
                title={`Explore ${genre.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectGenre?.(genre.name);
                }}
              >
                <i className="fas fa-arrow-right" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FanGenres;
