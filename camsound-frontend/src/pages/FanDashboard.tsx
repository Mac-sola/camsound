import React, { useState } from 'react';
import Layout from '../components/Layout';
import FanHome from '../components/FanHome';
import FanBrowse from '../components/FanBrowse';
import FanGenres from '../components/FanGenres';
import FanCommunity from '../components/FanCommunity';
import FanHistory from '../components/FanHistory';
import FanProfile from '../components/FanProfile';
import FanFollowing from '../components/FanFollowing';
import FanNotifications from '../components/FanNotifications';
import FanSettings from '../components/FanSettings';
import FanFavorites from '../components/FanFavorites';
import FanPlaylists from '../components/FanPlaylists';

/** Navigation items per LEGACY_PROJECT_SPEC § 3.3.1 */
const FAN_NAV = [
  { section: 'DISCOVER' },
  { label: 'Home',          icon: 'fa-home',         view: 'home' },
  { label: 'Browse',        icon: 'fa-search',        view: 'browse' },
  { label: 'Genres',        icon: 'fa-music',         view: 'genres' },
  { label: 'Community',     icon: 'fa-users',         view: 'community' },
  { section: 'MY MUSIC' },
  { label: 'Favorites',     icon: 'fa-heart',         view: 'favorites' },
  { label: 'Playlists',     icon: 'fa-list',          view: 'playlists' },
  { label: 'History',       icon: 'fa-history',       view: 'history' },
  { section: 'FOLLOWING' },
  { label: 'Following',     icon: 'fa-user-friends',  view: 'following' },
  { label: 'Notifications', icon: 'fa-bell',          view: 'notifications' },
  { section: 'ACCOUNT' },
  { label: 'Profile',       icon: 'fa-user',          view: 'profile' },
  { label: 'Settings',      icon: 'fa-cog',           view: 'settings' },
];

const FanDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) setActiveView('browse');
  };

  const renderView = () => {
    switch (activeView) {
      case 'home':          return <FanHome />;
      case 'browse':        return <FanBrowse initialQuery={searchQuery} />;
      case 'genres':        return <FanGenres />;
      case 'community':     return <FanCommunity />;
      case 'favorites':     return <FanFavorites />;
      case 'playlists':     return <FanPlaylists />;
      case 'history':       return <FanHistory />;
      case 'profile':       return <FanProfile />;
      case 'following':     return <FanFollowing onNavClick={setActiveView} />;
      case 'notifications': return <FanNotifications />;
      case 'settings':      return <FanSettings />;
      default:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, color: 'var(--text-muted)', gap: 12 }}>
            <i className="fas fa-tools" style={{ fontSize: '3rem', color: 'var(--accent-color)' }} />
            <h3 style={{ color: 'var(--text-light)', margin: 0 }}>Coming Soon</h3>
            <p style={{ margin: 0 }}>This feature is being built. Check back soon!</p>
          </div>
        );
    }
  };

  return (
    <Layout
      navItems={FAN_NAV}
      activeView={activeView}
      onNavClick={setActiveView}
      searchValue={searchQuery}
      onSearchChange={handleSearchChange}
    >
      <div key={activeView} className="view-fade-in">
        {renderView()}
      </div>
    </Layout>
  );
};

export default FanDashboard;
