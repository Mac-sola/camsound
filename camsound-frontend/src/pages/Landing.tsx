import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlatformSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';
import { songsService, artistsService, subscriptionsService } from '../services/api';
import SongCard, { type SongItem } from '../components/SongCard';
import ArtistCard, { type ArtistItem } from '../components/ArtistCard';
import HeroCarousel from '../components/HeroCarousel';
import MoMoPaymentModal from '../components/MoMoPaymentModal';
import { GENRE_CARDS_DATA } from '../utils/musicImages';

const Landing: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuredSongs, setFeaturedSongs] = useState<SongItem[]>([]);
  const [featuredArtists, setFeaturedArtists] = useState<ArtistItem[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [momoModalPlan, setMomoModalPlan] = useState<{ name: string; price: number; period?: string } | null>(null);
  const { user, logout } = useAuth();
  const { settings } = usePlatformSettings();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleArtistClick = (artist: { _id?: string }) => {
    if (artist._id) navigate(`/artists/${artist._id}`);
  };


  const dashboardPath = user?.type === 'admin' ? '/admin' : user?.type === 'artist' ? '/artist' : '/fan';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.title = `${settings.platformName || 'CamSound'} — Discover Cameroonian Music`;
  }, [settings.platformName]);

  useEffect(() => {
    // Fetch live approved songs and artists from backend
    songsService.getSongs({ limit: 6, sort: 'date' }).then((res) => {
      setFeaturedSongs(res.data?.data ?? res.data ?? []);
    }).catch(() => {});

    artistsService.getArtists({ limit: 6 }).then((res) => {
      setFeaturedArtists(res.data?.data ?? res.data ?? []);
    }).catch(() => {});

    subscriptionsService.getPlans().then((res) => {
      if (res.data?.success && res.data.data?.length) {
        setPlans(res.data.data);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="landing-page">
      {/* ── Navbar ── */}
      <nav className="navbar-camsound" style={{ boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.5)' : undefined }}>
        <div className="container">
          <div className="navbar-inner">
            <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt={settings.platformName} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <i className={`fas ${settings.logoIcon || 'fa-drum'}`} style={{ color: 'var(--accent-color, #facc15)', fontSize: '1.2rem' }} />
              )}
              <span>{settings.platformName || 'CamSound'}</span>
            </Link>

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
              <li><Link className="nav-link active" to="/">{t('landing.home')}</Link></li>
              <li><Link className="nav-link" to="/browse">{t('landing.discover')}</Link></li>
              <li><a className="nav-link" href="#songs">{t('landing.trending_songs')}</a></li>
              <li><a className="nav-link" href="#artists">{t('landing.artists')}</a></li>
              <li><a className="nav-link" href="#pricing">{t('landing.pricing')}</a></li>
            </ul>
            <div className="navbar-actions d-none d-lg-flex" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <LanguageToggle />
              {user ? <>
                <Link to={dashboardPath} className="btn-camsound-yellow" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>{t('landing.dashboard')}</Link>
                <button className="btn-camsound-outline" style={{ padding: '8px 20px', fontSize: '0.9rem' }} onClick={async () => { await logout(); navigate('/'); }}>{t('landing.logout')}</button>
              </> : <>
                <Link to="/login" className="btn-camsound-outline" style={{ borderRadius: 30, padding: '8px 20px', fontSize: '0.9rem' }}>{t('landing.login')}</Link>
                <Link to="/signup" className="btn-camsound-yellow" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>{t('landing.signup')}</Link>
              </>}
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('common.language')}</span>
              <LanguageToggle />
            </div>
            <Link className="nav-link" to="/" onClick={() => setMobileMenuOpen(false)}>{t('landing.home')}</Link>
            <Link className="nav-link" to="/browse" onClick={() => setMobileMenuOpen(false)}>{t('landing.discover')}</Link>
            <a className="nav-link" href="#songs" onClick={() => setMobileMenuOpen(false)}>{t('landing.trending_songs')}</a>
            <a className="nav-link" href="#artists" onClick={() => setMobileMenuOpen(false)}>{t('landing.artists')}</a>
            <a className="nav-link" href="#pricing" onClick={() => setMobileMenuOpen(false)}>{t('landing.pricing')}</a>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {user ? <>
                <Link to={dashboardPath} className="btn-camsound-yellow" style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }} onClick={() => setMobileMenuOpen(false)}>{t('landing.dashboard')}</Link>
                <button className="btn-camsound-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={async () => { await logout(); setMobileMenuOpen(false); navigate('/'); }}>{t('landing.logout')}</button>
              </> : <>
                <Link to="/login" className="btn-camsound-outline" style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }} onClick={() => setMobileMenuOpen(false)}>{t('landing.login')}</Link>
                <Link to="/signup" className="btn-camsound-yellow" style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }} onClick={() => setMobileMenuOpen(false)}>{t('landing.signup')}</Link>
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
          <h2 style={{ fontSize: '2rem', marginBottom: 8 }}>{t('landing.how_it_works').replace('{name}', settings.platformName || 'CamSound')}</h2>
          <div className="how-it-works-grid" style={{ marginTop: 48 }}>
            <div className="how-it-works-card">
              <div className="how-icon-wrapper"><i className="fas fa-upload" /></div>
              <h4>{t('landing.step1_title')}</h4>
              <p>{t('landing.step1_desc')}</p>
            </div>
            <div className="arrow-connector"><i className="fas fa-chevron-right" /></div>
            <div className="how-it-works-card">
              <div className="how-icon-wrapper"><i className="fas fa-headphones" /></div>
              <h4>{t('landing.step2_title')}</h4>
              <p>{t('landing.step2_desc')}</p>
            </div>
            <div className="arrow-connector"><i className="fas fa-chevron-right" /></div>
            <div className="how-it-works-card">
              <div className="how-icon-wrapper"><i className="fas fa-chart-line" /></div>
              <h4>{t('landing.step3_title')}</h4>
              <p>{t('landing.step3_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live Published Songs ── */}
      <section className="songs-section" id="songs" style={{ padding: '60px 0', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: '2rem', margin: 0 }}>{t('landing.latest_releases')}</h2>
              <p style={{ color: 'var(--text-muted)', margin: '6px 0 0 0' }}>{t('landing.latest_releases_sub')}</p>
            </div>
            <Link to="/browse" className="btn-camsound-outline" style={{ fontSize: '0.88rem', padding: '8px 18px' }}>
              {t('landing.view_all_songs')} <i className="fas fa-arrow-right" style={{ marginLeft: 6 }} />
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
                  onArtistClick={handleArtistClick}
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
              <h2 style={{ fontSize: '2.2rem', color: 'white' }}>{t('landing.why_choose_us')}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { icon: 'fa-map-marker-alt', title: t('landing.feat_local_title'), desc: t('landing.feat_local_desc') },
                { icon: 'fa-eye', title: t('landing.feat_vis_title'), desc: t('landing.feat_vis_desc') },
                { icon: 'fa-user-check', title: t('landing.feat_sub_title'), desc: t('landing.feat_sub_desc') },
                { icon: 'fa-search', title: t('landing.feat_disc_title'), desc: t('landing.feat_disc_desc') },
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
              <h2 style={{ fontSize: '2rem', margin: 0 }}>{t('landing.featured_artists')}</h2>
              <p style={{ color: 'var(--text-muted)', margin: '6px 0 0 0' }}>{t('landing.featured_artists_sub')}</p>
            </div>
            <Link to="/browse" className="btn-camsound-outline" style={{ fontSize: '0.88rem', padding: '8px 18px' }}>
              {t('landing.explore_all_artists')} <i className="fas fa-arrow-right" style={{ marginLeft: 6 }} />
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
                  onArtistClick={handleArtistClick}
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
            <h2 style={{ fontSize: '2.2rem', margin: '0 0 8px 0' }}>{t('landing.explore_genres')}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t('landing.explore_genres_sub')}</p>
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
              { value: '1M+', label: t('landing.monthly_streams') },
              { value: '500+', label: t('landing.active_artists') },
              { value: '10K+', label: t('landing.songs_uploaded') },
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
          <h2 style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: 12 }}>{t('landing.transparent_pricing')}</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 48 }}>{t('landing.pricing_sub')}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {plans && plans.length > 0 ? (
              plans.map((p, idx) => {
                const isPop = Boolean(p.isPopular);
                const feats: string[] = Array.isArray(p.features)
                  ? p.features
                  : typeof p.features === 'string'
                  ? p.features.split(',').map((f: string) => f.trim()).filter(Boolean)
                  : [];
                return (
                  <div
                    key={p._id || idx}
                    style={{
                      background: isPop ? 'var(--bg-green-section)' : 'var(--bg-tertiary)',
                      borderRadius: 16,
                      padding: 32,
                      border: isPop ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative'
                    }}
                  >
                    {isPop && (
                      <div style={{ position: 'absolute', top: -12, right: 24, background: 'var(--accent-color)', color: '#000', fontWeight: 700, fontSize: '0.75rem', padding: '3px 12px', borderRadius: 999 }}>
                        {t('landing.popular_badge')}
                      </div>
                    )}
                    <h3>{p.name}</h3>
                    {p.description && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 12px 0' }}>{p.description}</p>
                    )}
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, margin: '12px 0', color: isPop ? 'var(--accent-color)' : 'var(--text-white)' }}>
                      {p.currency || 'XAF'} {Number(p.price || 0).toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>{p.period || '/month'}</span>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, color: 'var(--text-light)', fontSize: '0.92rem' }}>
                      {feats.map((f, fIdx) => (
                        <li key={fIdx} style={{ display: 'flex', alignItems: 'center' }}>
                          <i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => {
                        if (p.price === 0) {
                          navigate('/signup');
                        } else {
                          setMomoModalPlan({ name: p.name, price: Number(p.price), period: p.period || '/month' });
                        }
                      }}
                      className={isPop ? 'btn-camsound-yellow' : 'btn-camsound-outline'}
                      style={{ justifyContent: 'center', cursor: 'pointer', border: 'none' }}
                    >
                      {p.buttonText || (p.price === 0 ? t('landing.get_started_free') : t('landing.pay_momo'))}
                    </button>
                  </div>
                );
              })
            ) : (
              <>
                <div style={{ background: 'var(--bg-tertiary)', borderRadius: 16, padding: 32, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                  <h3>Fan Free</h3>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, margin: '16px 0', color: 'var(--text-white)' }}>XAF 0 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>/forever</span></div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, color: 'var(--text-light)', fontSize: '0.92rem' }}>
                    <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />Stream Cameroonian songs</li>
                    <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />Create personal playlists</li>
                    <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />Follow favorite artists</li>
                    <li style={{ opacity: 0.5 }}><i className="fas fa-times" style={{ marginRight: 8 }} />Ad-free experience</li>
                  </ul>
                  <Link to="/signup" className="btn-camsound-outline" style={{ justifyContent: 'center' }}>{t('landing.get_started_free')}</Link>
                </div>

                <div style={{ background: 'var(--bg-green-section)', borderRadius: 16, padding: 32, border: '2px solid var(--accent-color)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: -12, right: 24, background: 'var(--accent-color)', color: '#000', fontWeight: 700, fontSize: '0.75rem', padding: '3px 12px', borderRadius: 999 }}>{t('landing.popular_badge')}</div>
                  <h3>Artist Pro</h3>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, margin: '16px 0', color: 'var(--accent-color)' }}>XAF 5,000 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>/month</span></div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, color: 'var(--text-light)', fontSize: '0.92rem' }}>
                    <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />Unlimited track uploads</li>
                    <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />Stream &amp; play analytics</li>
                    <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />MoMo Mobile Money Payouts</li>
                    <li><i className="fas fa-check" style={{ color: 'var(--accent-color)', marginRight: 8 }} />Verified Artist Badge</li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => setMomoModalPlan({ name: 'Artist Pro', price: 5000, period: '/month' })}
                    className="btn-camsound-yellow"
                    style={{ justifyContent: 'center', cursor: 'pointer', border: 'none' }}
                  >
                    {t('landing.pay_momo')}
                  </button>
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
                  <button
                    type="button"
                    onClick={() => setMomoModalPlan({ name: 'Fan VIP', price: 2000, period: '/month' })}
                    className="btn-camsound-outline"
                    style={{ justifyContent: 'center', cursor: 'pointer', border: 'none' }}
                  >
                    {t('landing.pay_momo')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="testimonials-section">
        <div className="container">
          <h2 style={{ fontSize: '2rem', textAlign: 'center' }}>{t('landing.community_says')}</h2>
          <div className="testimonials-grid">
            {[
              { quote: `"${settings.platformName || 'CamSound'} completely changed how I connect with my fans in Douala. The platform is incredibly intuitive."`, name: '- Balo K.', role: 'Independent Artist' },
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
          <h2 className="cta-heading" style={{ whiteSpace: 'pre-line' }}>{t('landing.cta_heading')}</h2>
          <Link to="/signup?role=artist" className="btn-camsound-yellow" style={{ padding: '14px 40px', fontSize: '1.1rem', marginTop: 8 }}>{t('landing.cta_button')}</Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer-camsound">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-brand" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt={settings.platformName} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <i className={`fas ${settings.logoIcon || 'fa-drum'}`} style={{ color: 'var(--accent-color)' }} />
                )}
                <span>{settings.platformName || 'CamSound'}</span>
              </div>
              <p className="footer-description">{settings.platformDesc || 'Discover, stream and promote local talent across Cameroon and beyond.'}</p>
            </div>
            <div className="footer-col">
              <h5>{t('landing.quick_links')}</h5>
              <ul className="footer-links">
                <li><a href="#how">{t('landing.how_it_works').replace('{name}', '')}</a></li>
                <li><a href="#songs">{t('landing.trending_songs')}</a></li>
                <li><a href="#artists">{t('landing.artists')}</a></li>
                <li><a href="#pricing">{t('landing.pricing')}</a></li>
                <li><a href={`mailto:${settings.supportEmail || 'support@camsound.cm'}`}>{t('landing.contact_support')}</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>{t('landing.social_media')}</h5>
              <div className="footer-social">
                {/* Social links — placeholder until official accounts are set up */}
                {['fa-facebook-f','fa-twitter','fa-instagram','fa-youtube'].map(icon => (
                  <span key={icon} className="footer-social-link" aria-hidden="true" title={t('landing.coming_soon')} style={{ cursor: 'default', opacity: 0.4 }}>
                    <i className={`fab ${icon}`} />
                  </span>
                ))}
              </div>
            </div>
            <div className="footer-col">
              <h5>{t('landing.legal_policies')}</h5>
              <ul className="footer-links">
                <li><Link to="/terms">{t('common.terms')}</Link></li>
                <li><Link to="/privacy">{t('common.privacy')}</Link></li>
                <li><Link to="/cookies">{t('common.cookies')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} {settings.platformName || 'CamSound'}. {t('landing.rights_reserved')}</p>
          </div>
        </div>
      </footer>

      {/* MoMo Payment Simulation Modal on Landing */}
      {momoModalPlan && (
        <MoMoPaymentModal
          isOpen={Boolean(momoModalPlan)}
          onClose={() => setMomoModalPlan(null)}
          mode="subscription"
          amount={momoModalPlan.price}
          planName={momoModalPlan.name}
          planPeriod={momoModalPlan.period || '/month'}
          onSuccess={() => {
            setTimeout(() => {
              navigate(user ? dashboardPath : '/signup');
            }, 1500);
          }}
        />
      )}
    </div>
  );
};


export default Landing;
