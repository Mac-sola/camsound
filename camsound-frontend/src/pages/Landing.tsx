import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Landing: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

            {/* Mobile Hamburger Toggle */}
            <button
              className="d-lg-none"
              onClick={() => setMobileMenuOpen(o => !o)}
              style={{ color: 'var(--text-white)', fontSize: '1.4rem', background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}
              aria-label="Toggle navigation"
            >
              <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`} />
            </button>

            {/* Desktop Navigation */}
            <ul className="navbar-nav d-none d-lg-flex" style={{ display: 'flex', alignItems: 'center', gap: 32, listStyle: 'none' }}>
              <li><a className="nav-link active" href="/">Home</a></li>
              <li><a className="nav-link" href="#discover">Discover</a></li>
              <li><a className="nav-link" href="#artists">Artists</a></li>
              <li><a className="nav-link" href="#pricing">Pricing</a></li>
            </ul>
            <div className="navbar-actions d-none d-lg-flex">
              <Link to="/login" className="btn-camsound-outline" style={{ borderRadius: 30, padding: '8px 20px', fontSize: '0.9rem' }}>Login</Link>
              <Link to="/signup" className="btn-camsound-yellow" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Sign Up</Link>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <a className="nav-link" href="/" onClick={() => setMobileMenuOpen(false)}>Home</a>
            <a className="nav-link" href="#discover" onClick={() => setMobileMenuOpen(false)}>Discover</a>
            <a className="nav-link" href="#artists" onClick={() => setMobileMenuOpen(false)}>Artists</a>
            <a className="nav-link" href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <Link to="/login" className="btn-camsound-outline" style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }} onClick={() => setMobileMenuOpen(false)}>Login</Link>
              <Link to="/signup" className="btn-camsound-yellow" style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }} onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-grid">
            <div>
              <h1 className="hero-title">Discover, Stream &amp; Promote Cameroonian Music.</h1>
              <p className="hero-subtitle">The premier platform connecting local talent with fans across Cameroon and beyond.</p>
              <div className="hero-actions">
                <Link to="/signup?role=artist" className="btn-camsound-yellow">Join as an Artist</Link>
                <Link to="/signup" className="btn-camsound-outline-green">Listen as a Fan</Link>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="hero-stacked-cards">
                <div className="stacked-card">
                  <svg className="vinyl-record" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="100" r="95" fill="#FACC15" />
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
          <div className="why-choose-grid">
            <div>
              <h2 style={{ fontSize: '2.2rem', color: 'white' }}>Why Choose Us</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
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

      {/* ── Pricing Section ── */}
      <section className="pricing-section" id="pricing" style={{ padding: '80px 0', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <h2 style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: 12 }}>Transparent Pricing</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 48 }}>Choose the plan that fits your musical journey.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 16, padding: 32, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <h3>Fan Free</h3>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, margin: '16px 0', color: 'var(--text-white)' }}>XAF 0 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>/forever</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, color: 'var(--text-light)', fontSize: '0.92rem' }}>
                <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />Stream Cameroonian songs</li>
                <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />Create personal playlists</li>
                <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />Follow favorite artists</li>
                <li style={{ opacity: 0.5 }}><i className="fas fa-times" style={{ marginRight: 8 }} />Ad-free experience</li>
              </ul>
              <Link to="/signup" className="btn-camsound-outline" style={{ justifyContent: 'center' }}>Get Started Free</Link>
            </div>

            <div style={{ background: 'var(--bg-green-section)', borderRadius: 16, padding: 32, border: '2px solid var(--accent-color)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -12, right: 24, background: 'var(--accent-color)', color: '#000', fontWeight: 700, fontSize: '0.75rem', padding: '3px 12px', borderRadius: 999 }}>POPULAR</div>
              <h3>Artist Pro</h3>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, margin: '16px 0', color: 'var(--accent-color)' }}>XAF 5,000 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>/month</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, color: 'var(--text-light)', fontSize: '0.92rem' }}>
                <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />Unlimited track uploads</li>
                <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />Stream & play analytics</li>
                <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />MoMo Mobile Money Payouts</li>
                <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />Verified Artist Badge</li>
              </ul>
              <Link to="/signup?role=artist" className="btn-camsound-yellow" style={{ justifyContent: 'center' }}>Join as Artist</Link>
            </div>

            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 16, padding: 32, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <h3>Fan VIP</h3>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, margin: '16px 0', color: 'var(--text-white)' }}>XAF 2,000 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>/month</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, color: 'var(--text-light)', fontSize: '0.92rem' }}>
                <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />Ad-free music streaming</li>
                <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />High quality audio playback</li>
                <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />Exclusive community access</li>
                <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />Direct artist support</li>
              </ul>
              <Link to="/signup" className="btn-camsound-outline" style={{ justifyContent: 'center' }}>Upgrade to VIP</Link>
            </div>
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
      <section className="cta-section">
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
              <Link to="/admin" className="footer-admin-doorway"><i className="fas fa-lock" /> Admin Portal</Link>
            </div>
            <div className="footer-col">
              <h5>Quick Links</h5>
              <ul className="footer-links">
                <li><a href="#how">How It Works</a></li>
                <li><a href="#discover">Discover</a></li>
                <li><a href="#artists">Artists</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="mailto:support@camsound.com">Contact Support</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>Social Media</h5>
              <div className="footer-social">
                {['fa-facebook-f','fa-twitter','fa-instagram','fa-youtube'].map(icon => (
                  <a key={icon} href="#" onClick={e => e.preventDefault()} aria-disabled="true" className="footer-social-link"><i className={`fab ${icon}`} /></a>
                ))}
              </div>
            </div>
            <div className="footer-col">
              <h5>Legal &amp; Policies</h5>
              <ul className="footer-links">
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 CamSound. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

