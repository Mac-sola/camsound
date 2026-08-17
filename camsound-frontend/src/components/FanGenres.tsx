import React from 'react';

interface Genre {
  name: string;
  icon: string;
}

const genres: Genre[] = [
  { name: 'Makossa', icon: 'fa-record-vinyl' },
  { name: 'Afrobeat', icon: 'fa-music' },
  { name: 'Bikutsi', icon: 'fa-drum' },
  { name: 'Assiko', icon: 'fa-guitar' },
  { name: 'Hip Hop', icon: 'fa-microphone' },
  { name: 'R&B', icon: 'fa-headphones' },
];

const FanGenres: React.FC = () => (
  <div className="section-card">
    <div className="section-header"><h2>Browse Genres</h2></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
      {genres.map((genre) => (
        <div key={genre.name} className="genre-card">
          <div className="feature-icon" style={{ margin: '0 auto 16px' }}>
            <i className={`fas ${genre.icon}`} />
          </div>
          <h4>{genre.name}</h4>
        </div>
      ))}
    </div>
  </div>
);

export default FanGenres;
