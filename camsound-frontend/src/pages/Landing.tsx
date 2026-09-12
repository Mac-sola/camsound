import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { songsService, artistsService } from '../services/api';
import SongCard, { type SongItem } from '../components/SongCard';
import ArtistCard, { type ArtistItem } from '../components/ArtistCard';
import ArtistDetailsModal from '../components/ArtistDetailsModal';
import HeroCarousel from '../components/HeroCarousel';
import { GENRE_CARDS_DATA } from '../utils/musicImages';

const Landing: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuredSongs, setFeaturedSongs] = useState<SongItem[]>([]);
  const [featuredArtists, setFeaturedArtists] = useState<ArtistItem[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const dashboardPath = user?.type === 'admin' ? '/admin' : user?.type === 'artist' ? '/artist' : '/fan';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Fetch live approved songs and artists from backend
    songsService.getSongs({ limit: 6, sort: 'date' }).then((res) => {
      setFeaturedSongs(res.data?.data ?? res.data ?? []);
    }).catch(() => {});

    artistsService.getArtists({ limit: 6 }).then((res) => {
      setFeaturedArtists(res.data?.data ?? res.data ?? []);
    }).catch(() => {});
  }, []);

  return (
    <div className="landing-page">
      {/* ── Navbar ── */}
      <nav className="navbar-camsound" style={{ boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.5)' : undefined }}>
        <div className="container">
          <div className="navbar-inner">
            <a href="/" className="navbar-brand">
              <i className="fas fa-music" style={{ marginRight: 8, color: 'var(--accent-color, #facc15)' }} />
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
              <li><Link className="nav-link" to="/browse">Discover</Link></li>
              <li><a className="nav-link" href="#songs">Trending Songs</a></li>
              <li><a className="nav-link" href="#artists">Artists</a></li>
              <li><a className="nav-link" href="#pricing">Pricing</a></li>
            </ul>
            <div className="navbar-actions d-none d-lg-flex">
              {user ? <>
                <Link to={dashboardPath} className="btn-camsound-yellow" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Dashboard</Link>
                <button className="btn-camsound-outline" style={{ padding: '8px 20px', fontSize: '0.9rem' }} onClick={async () => { await logout(); navigate('/'); }}>Logout</button>
              </> : <>
                <Link to="/login" className="btn-camsound-outline" style={{ borderRadius: 30, padding: '8px 20px', fontSize: '0.9rem' }}>Login</Link>
                <Link to="/signup" className="btn-camsound-yellow" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>Sign Up</Link>
              </>}
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <a className="nav-link" href="/" onClick={() => setMobileMenuOpen(false)}>Home</a>
            <Link className="nav-link" to="/browse" onClick={() => setMobileMenuOpen(false)}>Discover</Link>
            <a className="nav-link" href="#songs" onClick={() => setMobileMenuOpen(false)}>Trending Songs</a>
            <a className="nav-link" href="#artists" onClick={() => setMobileMenuOpen(false)}>Artists</a>
            <a className="nav-link" href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {user ? <>
                <Link to={dashboardPath} className="btn-camsound-yellow" style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }} onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                <button className="btn-camsound-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={async () => { await logout(); setMobileMenuOpen(false); navigate('/'); }}>Logout</button>
              </> : <>
                <Link to="/login" className="btn-camsound-outline" style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }} onClick={() => setMobileMenuOpen(false)}>Login</Link>
                <Link to="/signup" className="btn-camsound-yellow" style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }} onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
              </>}
            </div>
          </div>
        )}
      </nav>

      {/* ── Full-Width Dynamic Hero Carousel with Music Imagery ── */}
      <section className="hero-carousel-section-full">
        <HeroCarousel isFullWidth={true} />
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

      {/* ── Live Published Songs ── */}
      <section className="songs-section" id="songs" style={{ padding: '60px 0', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: '2rem', margin: 0 }}>Latest Published Releases</h2>
              <p style={{ color: 'var(--text-muted)', margin: '6px 0 0 0' }}>Freshly approved tracks from Cameroonian artists</p>
            </div>
            <Link to="/browse" className="btn-camsound-outline" style={{ fontSize: '0.88rem', padding: '8px 18px' }}>
              View All Songs <i className="fas fa-arrow-right" style={{ marginLeft: 6 }} />
            </Link>
          </div>

          {featuredSongs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <i className="fas fa-music" style={{ fontSize: '2.5rem', opacity: 0.4, marginBottom: 12 }} />
              <p>Approved artist releases will appear here automatically.</p>
            </div>
          ) : (
            <div className="cards-grid">
              {featuredSongs.map((song) => (
                <SongCard
                  key={song._id}
                  song={song}
                  playlist={featuredSongs}
                  onArtistClick={setSelectedArtist}
                />
              ))}
            </div>
          )}
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
      <section className="artists-section" id="artists" style={{ padding: '60px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: '2rem', margin: 0 }}>Featured Artists</h2>
              <p style={{ color: 'var(--text-muted)', margin: '6px 0 0 0' }}>Trending talent across Cameroon</p>
            </div>
            <Link to="/browse" className="btn-camsound-outline" style={{ fontSize: '0.88rem', padding: '8px 18px' }}>
              Explore All Artists <i className="fas fa-arrow-right" style={{ marginLeft: 6 }} />
            </Link>
          </div>

          {featuredArtists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <i className="fas fa-users" style={{ fontSize: '2.5rem', opacity: 0.4, marginBottom: 12 }} />
              <p>Registered artists will appear here.</p>
            </div>
          ) : (
            <div className="cards-grid">
              {featuredArtists.map((artist) => (
                <ArtistCard
                  key={artist._id}
                  artist={artist}
                  onArtistClick={setSelectedArtist}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Trending Genres with Rich Photography ── */}
      <section className="genres-section" id="discover">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: '2.2rem', margin: '0 0 8px 0' }}>Explore Cameroonian Genres</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Immerse yourself in authentic sonic cultures and signature styles</p>
          </div>

          <div className="genre-image-grid">
            {GENRE_CARDS_DATA.map((genre) => (
              <Link
                key={genre.name}
                to={`/browse?genre=${encodeURIComponent(genre.name)}`}
                className="genre-image-card"
              >
                <div
                  className="genre-image-bg"
                  style={{ backgroundImage: `url('${genre.image}')` }}
                />
                <div className="genre-image-overlay">
                  <span className="genre-image-tag" style={{ background: genre.color }}>
                    <i className="fas fa-compact-disc" /> {genre.name}
                  </span>
                  <h3 className="genre-image-title">{genre.name}</h3>
                  <p className="genre-image-desc">{genre.desc}</p>
                </div>
              </Link>
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
                <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />Stream &amp; play analytics</li>
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
                <li><a href="#songs">Trending Songs</a></li>
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

      <ArtistDetailsModal artist={selectedArtist} onClose={() => setSelectedArtist(null)} />
    </div>
  );
};

export default Landing;
