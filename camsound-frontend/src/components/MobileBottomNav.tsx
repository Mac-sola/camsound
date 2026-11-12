import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export interface MobileBottomNavProps {
  activeView: string;
  onNavClick: (view: string) => void;
  onMenuToggle: () => void;
  showMenu?: boolean;
  menuExpanded?: boolean;
  notifCount?: number;
  totalLikes?: number;
  navItems?: { label?: string; icon?: string; view?: string; section?: string }[];
}

const MOBILE_LABEL_KEYS: Record<string, string> = {
  dashboard: 'nav.home',
  overview: 'nav.home',
  music: 'nav.mobile_uploads',
  analytics: 'nav.mobile_stats',
  notifications: 'nav.mobile_alerts',
  profile: 'nav.profile',
  social: 'nav.mobile_social',
  revenue: 'nav.mobile_revenue',
  subscription: 'nav.mobile_premium',
  moderation: 'nav.moderation',
  reports: 'nav.mobile_reports',
  users: 'nav.mobile_users',
  settings: 'nav.mobile_config',
  featured: 'nav.mobile_featured',
  subscriptions: 'nav.mobile_plans',
  payments: 'nav.mobile_payments',
  adRevenue: 'nav.mobile_ads',
  withdrawals: 'nav.mobile_payouts',
};

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onNavClick,
  onMenuToggle,
  showMenu = true,
  menuExpanded = false,
  notifCount = 0,
  totalLikes = 0,
  navItems = [],
}) => {
  const { t } = useLanguage();

  // Filter out section headers
  const validItems = navItems.filter((item) => item.view);

  // Keep critical dashboard actions visible on mobile instead of hiding them behind the menu.
  const preferredViews = [
    'home', 'dashboard', 'overview',
    'browse', 'discover',
    'favorites', 'music', 'mymusic', 'playlists',
    'notifications',
    'profile', 'settings',
    'analytics', 'revenue',
    'users', 'songs', 'payments',
    'subscription', 'community'
  ];

  const resolveTab = (view: string) => {
    const match = validItems.find((i) => i.view === view);
    if (!match) return null;
    return {
      label: match.label || match.view || '',
      icon: match.icon || 'fa-circle',
      view: match.view || '',
      badge:
        view === 'notifications' ? notifCount :
        view === 'favorites' ? totalLikes : undefined,
    };
  };

  const selectedTabs: { label: string; icon: string; view: string; badge?: number }[] = [];
  for (const view of preferredViews) {
    const tab = resolveTab(view);
    if (tab && !selectedTabs.some((item) => item.view === tab.view)) {
      selectedTabs.push(tab);
    }
  }

  for (const item of validItems) {
    if (!item.view) continue;
    const tab = resolveTab(item.view);
    if (tab && !selectedTabs.some((entry) => entry.view === tab.view)) {
      selectedTabs.push(tab);
    }
  }

  const primaryTabs = selectedTabs.slice(0, 5);

  if (primaryTabs.length === 0) {
    primaryTabs.push(...validItems.slice(0, 4).map((i) => ({
      label: i.label || i.view || '',
      icon: i.icon || 'fa-circle',
      view: i.view || '',
      badge: i.view === 'notifications' ? notifCount : i.view === 'favorites' ? totalLikes : undefined,
    })));
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
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="mobile-nav-icon-wrapper">
              <i className={`fas ${tab.icon}`} />
              {tab.badge && tab.badge > 0 ? (
                <span className="mobile-nav-badge">{tab.badge > 99 ? '99+' : tab.badge}</span>
              ) : null}
            </div>
            <span className="mobile-nav-label">
              {MOBILE_LABEL_KEYS[tab.view] ? t(MOBILE_LABEL_KEYS[tab.view], tab.label) : tab.label}
            </span>
            {isActive && <div className="mobile-nav-active-dot" />}
          </button>
        );
      })}

      {showMenu && (
        <button
          type="button"
          className="mobile-nav-item mobile-nav-menu-btn"
          onClick={onMenuToggle}
          aria-label={menuExpanded ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuExpanded}
          aria-controls="primary-navigation"
        >
          <div className="mobile-nav-icon-wrapper">
            <i className={`fas ${menuExpanded ? 'fa-times' : 'fa-bars'}`} />
            {notifCount > 0 && <span className="mobile-nav-badge notif">{notifCount > 99 ? '99+' : notifCount}</span>}
          </div>
          <span className="mobile-nav-label">{t('nav.mobile_menu', 'Menu')}</span>
        </button>
      )}
    </nav>
  );
};

export default MobileBottomNav;
