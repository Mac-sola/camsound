import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { notificationsService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

type FanNavItemDef =
  | { section: string }
  | { labelKey: string; icon: string; view: string };

/** Navigation items per LEGACY_PROJECT_SPEC § 3.3.1 — labels resolved via i18n keys */
const FAN_NAV_DEF: FanNavItemDef[] = [
  { section: 'nav.discover_sec' },
  { labelKey: 'nav.home',          icon: 'fa-home',         view: 'home' },
  { labelKey: 'nav.browse',        icon: 'fa-search',        view: 'browse' },
  { labelKey: 'nav.genres',        icon: 'fa-music',         view: 'genres' },
  { labelKey: 'nav.community',     icon: 'fa-users',         view: 'community' },
  { section: 'nav.my_music_sec' },
  { labelKey: 'nav.my_music',      icon: 'fa-music',         view: 'favorites' },
  { labelKey: 'nav.playlists',     icon: 'fa-list',          view: 'playlists' },
  { labelKey: 'nav.history',       icon: 'fa-history',       view: 'history' },
  { section: 'nav.following_sec' },
  { labelKey: 'nav.following',     icon: 'fa-user-friends',  view: 'following' },
  { labelKey: 'nav.notifications', icon: 'fa-bell',          view: 'notifications' },
  { section: 'nav.account_sec' },
  { labelKey: 'nav.profile',       icon: 'fa-user',          view: 'profile' },
  { labelKey: 'nav.settings',      icon: 'fa-cog',           view: 'settings' },
  { labelKey: 'nav.get_premium',   icon: 'fa-crown',         view: 'subscription' },
];

const FanDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Resolve nav items with translated labels
  const FAN_NAV = FAN_NAV_DEF.map(item => {
    if ('section' in item) return { section: t(item.section) };
    return { ...item, label: t(item.labelKey) };
  });

  useEffect(() => {
    document.title = 'Music Lounge — CamSound';
    const fetchUnread = () => {
      notificationsService.getNotifications().then(response => {
        setUnreadCount(response.data?.unreadCount ?? (response.data?.data ?? []).filter((item: any) => !item.isRead && !item.read).length);
      }).catch(() => setUnreadCount(0));
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

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
            <h3 style={{ color: 'var(--text-light)', margin: 0 }}>{t('common.coming_soon_title')}</h3>
            <p style={{ margin: 0 }}>{t('common.coming_soon_feature')}</p>
          </div>
        );
    }
  };

  const handleNavClick = (view: string) => {
    if (view === 'subscription') {
      navigate('/subscription');
    } else {
      setActiveView(view);
    }
  };

  return (
    <Layout
      navItems={FAN_NAV}
      activeView={activeView}
      onNavClick={handleNavClick}
      searchValue={searchQuery}
      onSearchChange={handleSearchChange}
      showQuickStats
      notifCount={unreadCount}
    >
      <div key={activeView} className="view-fade-in">
        {renderView()}
      </div>
    </Layout>
  );
};

export default FanDashboard;
