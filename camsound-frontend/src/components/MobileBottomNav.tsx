import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export interface MobileBottomNavProps {
  activeView: string;
  onNavClick: (view: string) => void;
  onMenuToggle: () => void;
  notifCount?: number;
  totalLikes?: number;
  navItems?: { label?: string; icon?: string; view?: string; section?: string }[];
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onNavClick,
  onMenuToggle,
  notifCount = 0,
  totalLikes = 0,
  navItems = [],
}) => {
  const { t } = useLanguage();

  // Filter out section headers
  const validItems = navItems.filter((item) => item.view);

  // Determine top 4 quick access tabs based on available items
  let primaryTabs: { label: string; icon: string; view: string; badge?: number }[] = [];

  const hasView = (view: string) => validItems.some((i) => i.view === view);

  if (hasView('favorites')) {
    // Fan dashboard
    primaryTabs = [
      { label: t('nav.home', 'Home'), icon: 'fa-home', view: 'home' },
      { label: t('nav.browse', 'Search'), icon: 'fa-search', view: 'browse' },
      { label: t('nav.favorites', 'Favorites'), icon: 'fa-heart', view: 'favorites', badge: totalLikes },
      { label: t('nav.subscription', 'Premium'), icon: 'fa-crown', view: 'subscription' },
    ];
  } else if (hasView('music') && hasView('revenue')) {
    // Artist dashboard
    primaryTabs = [
      { label: t('nav.overview', 'Overview'), icon: 'fa-tachometer-alt', view: 'dashboard' },
      { label: t('nav.music uploads', 'Uploads'), icon: 'fa-cloud-upload-alt', view: 'music' },
      { label: t('nav.analytics', 'Stats'), icon: 'fa-chart-line', view: 'analytics' },
      { label: t('nav.revenue & royalties', 'Royalties'), icon: 'fa-dollar-sign', view: 'revenue' },
    ];
  } else if (hasView('users') && hasView('songs')) {
    // Admin dashboard
    primaryTabs = [
      { label: t('nav.overview', 'Overview'), icon: 'fa-tachometer-alt', view: 'dashboard' },
      { label: t('nav.users', 'Users'), icon: 'fa-users', view: 'users' },
      { label: t('nav.songs', 'Songs'), icon: 'fa-music', view: 'songs' },
      { label: t('nav.payments', 'Payments'), icon: 'fa-money-bill-wave', view: 'payments' },
    ];
  } else {
    // Fallback: take first 4 items
    primaryTabs = validItems.slice(0, 4).map((i) => ({
      label: i.label || i.view || '',
      icon: i.icon || 'fa-circle',
      view: i.view || '',
    }));
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {primaryTabs.map((tab) => {
        const isActive = activeView === tab.view;
        return (
          <button
            key={tab.view}
            type="button"
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onNavClick(tab.view)}
            aria-label={tab.label}
          >
            <div className="mobile-nav-icon-wrapper">
              <i className={`fas ${tab.icon}`} />
              {tab.badge && tab.badge > 0 ? (
                <span className="mobile-nav-badge">{tab.badge > 99 ? '99+' : tab.badge}</span>
              ) : null}
            </div>
            <span className="mobile-nav-label">{tab.label}</span>
            {isActive && <div className="mobile-nav-active-dot" />}
          </button>
        );
      })}

      {/* "More / Menu" button to open the full drawer sidebar */}
      <button
        type="button"
        className="mobile-nav-item mobile-nav-menu-btn"
        onClick={onMenuToggle}
        aria-label="Open navigation menu"
      >
        <div className="mobile-nav-icon-wrapper">
          <i className="fas fa-bars" />
          {notifCount > 0 && <span className="mobile-nav-badge notif">{notifCount > 99 ? '99+' : notifCount}</span>}
        </div>
        <span className="mobile-nav-label">{t('nav.settings', 'Menu')}</span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
