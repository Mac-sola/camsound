import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div>
      {/* ── Navbar ── */}
      <nav className="navbar-camsound" style={{ boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.5)' : undefined }}>
        <div className="container">
          <div className="navbar-inner">
            <a href="/" className="navbar-brand">
              <i className="fas fa-drum" />
              CamSound
            </a>
            <ul className="navbar-nav" style={{ display: 'flex', alignItems: 'center', gap: 32, listStyle: 'none' }}>
              <li><a className="nav-link active" href="/">Home</a></li>
              <li><a className="nav-link" href="#discover">Discover</a></li>
              <li><a className="nav-link" href="#artists">Artists</a></li>
              <li><a className="nav-link" href="#pricing">Pricing</a></li>
            </ul>
            <div className="navbar-actions">
              <Link to="/login" className="btn-camsound-outline" style={{ borderRadius: 30, padding: '8px 20px', fontSize: '0.9rem' }}>Login</Link>
              <Link to="/signup" className="btn-camsound-yellow" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <h1 className="hero-title">Discover, Stream &amp; Promote Cameroonian Music.</h1>
              <p className="hero-subtitle">The premier platform connecting local talent with fans across Cameroon and beyond.</p>
              <div className="hero-actions">
                <Link to="/signup?role=artist" className="btn-camsound-yellow">Join as an Artist</Link>
                <Link to="/signup" className="btn-camsound-outline-green">Listen as a Fan</Link>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div className="hero-stacked-cards">
                <div className="stacked-card">
                  <svg className="vinyl-record" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <radialGradient id="vinyl" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" style={{stopColor: '#FACC15', stopOpacity: 1}} />
                        <stop offset="50%" style={{stopColor: '#F59E0B', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#1e1e1e', stopOpacity: 1}} />
                      </radialGradient>
                    </defs>
                    <circle cx="100" cy="100" r="95" fill="url(#vinyl)" />
                    <circle cx="100" cy="100" r="70" fill="#1a1a1a" opacity="0.8" />
                    <circle cx="100" cy="100" r="55" fill="#0F3D2E" />
                    <circle cx="100" cy="100" r="45" fill="#1a1a1a" opacity="0.6" />
                    <circle cx="100" cy="100" r="35" fill="#FACC15" />
                    <circle cx="100" cy="100" r="20" fill="#0F3D2E" />
                    <g stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none">
                      <circle cx="100" cy="100" r="65" />
                      <circle cx="100" cy="100" r="60" />
                      <circle cx="100" cy="100" r="50" />
                      <circle cx="100" cy="100" r="40" />
                    </g>
                  </svg>
                </div>
                <div className="stacked-card"></div>
                <div className="stacked-card"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="how-it-works-section" id="how">
        <div className="container">
          <h2 style={{ fontSize: '2rem', marginBottom: 8 }}>How CamSound Works</h2>
          <div className="how-it-works-grid" style={{ marginTop: 48 }}>
            <div className="how-it-works-card">
              <div className="how-icon-wrapper"><i className="fas fa-upload" /></div>
              <h4>1. Artists Upload</h4>
              <p>Register and share your tracks with the community.</p>
            </div>
            <div className="arrow-connector"><i className="fas fa-chevron-right" /></div>
            <div className="how-it-works-card">
              <div className="how-icon-wrapper"><i className="fas fa-headphones" /></div>
              <h4>2. Fans Discover</h4>
              <p>Explore new genres and stream local favorites.</p>
            </div>
            <div className="arrow-connector"><i className="fas fa-chevron-right" /></div>
            <div className="how-it-works-card">
              <div className="how-icon-wrapper"><i className="fas fa-chart-line" /></div>
              <h4>3. Grow Together</h4>
              <p>Artists gain visibility and build their fanbase.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="why-choose-us-section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 48, alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '2.2rem', color: 'white' }}>Why Choose Us</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {[
                { icon: 'fa-map-marker-alt', title: 'Local Focus', desc: 'Promoting Cameroonian artists and local music culture.' },
                { icon: 'fa-eye', title: 'Fair Visibility', desc: 'Fair algorithmic visibility for emerging and established artists.' },
                { icon: 'fa-user-check', title: 'Artist Subscriptions', desc: 'Revenue tools and subscription analytics for artists.' },
                { icon: 'fa-search', title: 'Easy Discovery', desc: 'Explore genres, playlists, and curated Cameroonian music.' },
              ].map((f) => (
                <div key={f.title} className="feature-card">
                  <div className="feature-icon"><i className={`fas ${f.icon}`} /></div>
                  <div className="feature-text">
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Artists ── */}
      <section className="artists-section" id="artists">
        <div className="container">
          <h2 style={{ fontSize: '2rem' }}>Featured Artists &mdash; <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 400 }}>Trending Cameroonian Talent</span></h2>
          <div className="artists-grid" style={{ marginTop: 40 }}>
            {[
              { name: 'Charlotte Dipanda', genre: 'Makossa / Acoustic', initials: 'CD', color: '#FF6B6B' },
              { name: 'Stanley Enow', genre: 'Hip Hop / Rap', initials: 'SE', color: '#4ECDC4' },
              { name: 'Tenor', genre: 'Afro-Trap / Rap', initials: 'TR', color: '#45B7D1' },
              { name: 'Daphne', genre: 'Afrobeat / Pop', initials: 'DA', color: '#FFA07A' },
              { name: 'Ko-C', genre: 'Afro-Pop', initials: 'KC', color: '#98D8C8' },
              { name: 'Locko', genre: 'R&B / Afro-Pop', initials: 'LO', color: '#F7DC6F' },
            ].map((artist, i) => (
              <div key={i} className="artist-card">
                <div className="artist-avatar-placeholder" style={{ background: artist.color }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'white' }}>{artist.initials}</span>
                </div>
                <div className="artist-name">{artist.name}</div>
                <div className="artist-genre">{artist.genre}</div>
                <div className="play-btn-float"><i className="fas fa-play" style={{ fontSize: '0.7rem' }} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending Genres ── */}
      <section className="genres-section" id="discover">
        <div className="container">
          <h2 style={{ fontSize: '2rem', textAlign: 'center' }}>Trending Genres</h2>
          <div className="genres-grid">
            {[
              { icon: 'fa-music', label: 'Makossa', sub: 'Classic rhythms' },
              { icon: 'fa-drum', label: 'Afrobeat', sub: 'Modern vibes' },
              { icon: 'fa-guitar', label: 'Bikutsi', sub: 'High energy' },
              { icon: 'fa-compact-disc', label: 'Assiko', sub: 'Traditional fusion' },
            ].map((g) => (
              <div key={g.label} className="genre-card">
                <div className="feature-icon" style={{ margin: '0 auto 16px' }}><i className={`fas ${g.icon}`} /></div>
                <h4>{g.label}</h4>
                <p className="text-muted-color" style={{ fontSize: '0.82rem' }}>{g.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform Stats ── */}
      <section className="platform-stats-section">
        <div className="container">
          <div className="stats-grid-3">
            {[
              { value: '1M+', label: 'Monthly Streams' },
              { value: '500+', label: 'Active Artists' },
              { value: '10K+', label: 'Songs Uploaded' },
            ].map((s) => (
              <div key={s.label}>
                <div className="stat-big text-gradient">{s.value}</div>
                <p className="text-muted-color stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="testimonials-section">
        <div className="container">
          <h2 style={{ fontSize: '2rem', textAlign: 'center' }}>What the Community Says</h2>
          <div className="testimonials-grid">
            {[
              { quote: '"CamSound completely changed how I connect with my fans in Douala. The platform is incredibly intuitive."', name: '- Balo K.', role: 'Independent Artist' },
              { quote: '"I discover new local talent every single day. The genre playlists are perfectly curated."', name: '- Murielle T.', role: 'Music Enthusiast' },
              { quote: '"The analytics dashboard helps me understand exactly where my listeners are coming from."', name: '- DJ Franck', role: 'Producer' },
            ].map((t) => (
              <div key={t.name} className="testimonial-card">
                <div className="testimonial-stars">
                  {[1,2,3,4,5].map(s => <i key={s} className="fas fa-star" style={{ marginRight: 2 }} />)}
                </div>
                <p className="testimonial-text">{t.quote}</p>
                <div className="testimonial-author">{t.name}</div>
                <div className="testimonial-role text-gradient">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section" id="pricing">
        <div className="container">
          <h2 className="cta-section h2">Start Promoting Your<br />Music Today</h2>
          <Link to="/signup?role=artist" className="btn-camsound-yellow" style={{ padding: '14px 40px', fontSize: '1.1rem', marginTop: 8 }}>GET STARTED</Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer-camsound">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-brand"><i className="fas fa-drum" /> CamSound</div>
              <p className="footer-description">Discover, stream and promote local talent across Cameroon and beyond.</p>
            </div>
            <div className="footer-col">
              <h5>Quick Links</h5>
              <ul className="footer-links">
                <li><a href="/">About</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Terms</a></li>
                <li><a href="#">Privacy</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>Social</h5>
              <div className="footer-social">
                {['fa-facebook-f','fa-twitter','fa-instagram','fa-youtube'].map(icon => (
                  <a key={icon} href="#" className="footer-social-link"><i className={`fab ${icon}`} /></a>
                ))}
              </div>
            </div>
            <div className="footer-col">
              <h5>Legal</h5>
              <ul className="footer-links">
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 CamSound. All rights reserved.</p>
            <div style={{ marginTop: 8 }}>
              <Link to="/login?role=admin" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: 4 }}>Admin Portal</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* FontAwesome (loaded globally via CDN in index.html) */}
    </div>
  );
};

export default Landing;
