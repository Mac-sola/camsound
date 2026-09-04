import React, { useState } from 'react';

interface Genre {
  name: string;
  icon: string;
  description: string;
  color: string;
}

const GENRES: Genre[] = [
  { name: 'Makossa', icon: 'fa-compact-disc', description: 'Traditional & modern Cameroonian urban rhythms', color: '#facc15' },
  { name: 'Afrobeat', icon: 'fa-fire', description: 'Pan-African energetic beats & dance vibes', color: '#10b981' },
  { name: 'Bikutsi', icon: 'fa-drum', description: 'Beti tribal high-tempo dance music', color: '#f43f5e' },
  { name: 'Assiko', icon: 'fa-guitar', description: 'Bassa coastal acoustic string rhythms', color: '#3b82f6' },
  { name: 'Hip Hop', icon: 'fa-microphone-alt', description: 'Camer urban flow, rap & street poetry', color: '#a855f7' },
  { name: 'Gospel', icon: 'fa-synagogue', description: 'Uplifting spiritual & choir harmonies', color: '#fbbf24' },
  { name: 'R&B', icon: 'fa-heart', description: 'Smooth soul & contemporary love jams', color: '#ec4899' },
  { name: 'Jazz', icon: 'fa-music', description: 'Afro-jazz fusion & improvisational grooves', color: '#14b8a6' },
];

const FanGenres: React.FC = () => {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="fan-genres-container">
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

      <div className="fan-genres-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
        {GENRES.map(genre => (
          <div
            key={genre.name}
            className="stat-card-premium"
            onMouseEnter={() => setHovered(genre.name)}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding: '24px', cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', gap: 14,
              borderColor: hovered === genre.name ? genre.color : 'rgba(255, 255, 255, 0.08)',
              background: hovered === genre.name ? 'rgba(24, 34, 28, 0.9)' : 'rgba(18, 26, 22, 0.75)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div
                className="stat-card-icon"
                style={{
                  color: genre.color, borderColor: `${genre.color}40`,
                  background: `${genre.color}15`, width: 48, height: 48
                }}
              >
                <i className={`fas ${genre.icon}`} style={{ fontSize: '1.25rem' }} />
              </div>
              <div style={{ color: genre.color, fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                Explore <i className="fas fa-arrow-right" style={{ transform: hovered === genre.name ? 'translateX(4px)' : 'none', transition: 'transform 0.2s' }} />
              </div>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{genre.name}</h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.5 }}>
                {genre.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FanGenres;

