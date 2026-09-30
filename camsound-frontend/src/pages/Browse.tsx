import React from 'react';
import { Link } from 'react-router-dom';
import FanBrowse from '../components/FanBrowse';
import { PlayerBar } from '../components/Layout';
import SongPlayerModal from '../components/SongPlayerModal';
import LanguageToggle from '../components/LanguageToggle';
import MobileBottomNav from '../components/MobileBottomNav';
import { useNavigate } from 'react-router-dom';
import { usePlatformSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';

const Browse: React.FC = () => {
  const { settings } = usePlatformSettings();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const guestNav = [
    { label: t('browse.nav_home', 'Home'), icon: 'fa-home', view: 'home' },
    { label: t('browse.nav_browse', 'Browse'), icon: 'fa-search', view: 'browse' },
    { label: t('nav.subscription', 'Premium'), icon: 'fa-crown', view: 'subscription' },
    { label: t('browse.nav_login', 'Login'), icon: 'fa-user', view: 'login' },
  ];

  const handleNavClick = (view: string) => {
    if (view === 'home') navigate('/');
    else if (view === 'browse') navigate('/browse');
    else if (view === 'subscription') navigate('/subscription');
    else if (view === 'login') navigate('/login');
  };

  return (
    <div className="public-browse-page">
      <nav className="navbar-camsound public-browse-nav">
        <div className="container">
          <div className="navbar-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt={settings.platformName} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <i className={`fas ${settings.logoIcon || 'fa-drum'}`} />
              )}
              {' '}{settings.platformName || 'CamSound'}
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="public-browse-links">
                <Link to="/">{t('browse.nav_home')}</Link>
                <Link to="/browse" className="active">{t('browse.nav_browse')}</Link>
                <Link to="/login">{t('browse.nav_login')}</Link>
              </div>
              <LanguageToggle />
            </div>
          </div>
        </div>
      </nav>

      <header className="public-browse-hero">
        <div className="container">
          <h1>{t('browse.hero_title')}</h1>
          <p>{t('browse.hero_desc')}</p>
        </div>
      </header>

      <main className="container public-browse-content" style={{ paddingBottom: 140 }}>
        <FanBrowse />
      </main>

      <PlayerBar />
      <SongPlayerModal />
      <MobileBottomNav
        activeView="browse"
        onNavClick={handleNavClick}
        onMenuToggle={() => navigate('/login')}
        navItems={guestNav}
      />
    </div>
  );
};

export default Browse;
