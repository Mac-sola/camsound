import React, { useState } from 'react';

interface Genre {
  name: string;
  icon: string;
  description: string;
  color: string;
}

const GENRES: Genre[] = [
  { name: 'Makossa', icon: 'fa-drum', description: 'Traditional Cameroonian rhythms', color: '#FACC15' },
  { name: 'Afrobeat', icon: 'fa-music', description: 'Pan-African beats & vibes', color: '#34D399' },
  { name: 'Bikutsi', icon: 'fa-guitar', description: 'Beti tribal dance music', color: '#F87171' },
  { name: 'Assiko', icon: 'fa-record-vinyl', description: 'Bassa coastal rhythms', color: '#60A5FA' },
  { name: 'Hip Hop', icon: 'fa-microphone', description: 'Camer rap & urban flow', color: '#A78BFA' },
  { name: 'Gospel', icon: 'fa-church', description: 'Uplifting spiritual music', color: '#FBBF24' },
  { name: 'R&B', icon: 'fa-heart', description: 'Soul & contemporary vibes', color: '#F472B6' },
  { name: 'Jazz', icon: 'fa-saxophone', description: 'Smooth & improvisational', color: '#2DD4BF' },
];

const FanGenres: React.FC = () => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="fan-genres-container">
      <div className="fan-section-header">
        <h2 className="fan-page-title">🎸 Browse Genres</h2>
        <p className="fan-page-subtitle">Explore the rich tapestry of Cameroonian music styles</p>
      </div>

      <div className="fan-genres-grid">
        {GENRES.map(genre => (
          <div
            key={genre.name}
            className={`fan-genre-card ${hovered === genre.name ? 'hovered' : ''}`}
            onMouseEnter={() => setHovered(genre.name)}
            onMouseLeave={() => setHovered(null)}
            style={{ '--genre-color': genre.color } as React.CSSProperties}
          >
            <div className="fan-genre-icon-wrap">
              <i className={`fas ${genre.icon} fan-genre-icon`} />
            </div>
            <div className="fan-genre-card-body">
              <h3 className="fan-genre-name">{genre.name}</h3>
              <p className="fan-genre-desc">{genre.description}</p>
            </div>
            <div className="fan-genre-arrow">
              <i className="fas fa-arrow-right" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FanGenres;
