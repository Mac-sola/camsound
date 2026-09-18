import React from 'react';
import { Link } from 'react-router-dom';
import FanBrowse from '../components/FanBrowse';
import { PlayerBar } from '../components/Layout';
import SongPlayerModal from '../components/SongPlayerModal';
import { usePlatformSettings } from '../context/SettingsContext';

const Browse: React.FC = () => {
  const { settings } = usePlatformSettings();

  return (
    <div className="public-browse-page">
      <nav className="navbar-camsound public-browse-nav">
        <div className="container">
          <div className="navbar-inner">
            <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt={settings.platformName} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <i className={`fas ${settings.logoIcon || 'fa-drum'}`} />
              )}
              {' '}{settings.platformName || 'CamSound'}
            </Link>
            <div className="public-browse-links">
              <Link to="/">Home</Link>
              <Link to="/browse" className="active">Browse</Link>
              <Link to="/login">Login</Link>
            </div>
          </div>
        </div>
      </nav>

      <header className="public-browse-hero">
        <div className="container">
          <h1>Discover Cameroonian Magic</h1>
          <p>Explore the best Makossa, Bikutsi, Afrobeat, and more.</p>
        </div>
      </header>

      <main className="container public-browse-content">
        <FanBrowse />
      </main>

      <PlayerBar />
      <SongPlayerModal />
    </div>
  );
};

export default Browse;
