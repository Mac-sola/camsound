import React, { useState } from 'react';
import QuickStatsAccordion from './QuickStatsAccordion';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  navItems: { label?: string; icon?: string; view?: string; section?: string }[];
  activeView: string;
  onNavClick: (view: string) => void;
  onLogout: () => void;
  totalPlays?: number;
  totalLikes?: number;
}

export const Sidebar: React.FC<SidebarProps & { isOpen: boolean; onClose: () => void }> = ({
  navItems, activeView, onNavClick, onLogout, isOpen, onClose
}) => {

  return (
    <>
      {/* Overlay for mobile */}
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />
      
      <div className={`sidebar-wrapper ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1><i className="fas fa-drum" /> <span>CamSound</span></h1>
          <p>Cameroonian Music Platform</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            if (item.section) {
              return <div key={`sec-${idx}`} style={{ marginTop: 24, marginBottom: 8, paddingLeft: 12, fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1 }}>{item.section}</div>;
            }
            return (
              <button
                key={item.view}
                className={`sidebar-nav-btn ${activeView === item.view ? 'active' : ''}`}
                onClick={() => { if(item.view) { onNavClick(item.view); onClose(); } }}
              >
                <i className={`fas ${item.icon}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 8 }}>
            <button className="sidebar-nav-btn" onClick={onLogout}>
              <i className="fas fa-sign-out-alt" />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        <QuickStatsAccordion />
      </div>
    </>
  );
};

/* ─── Top Bar ─── */
interface TopBarProps {
  onMenuToggle: () => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
  notifCount?: number;
  userName?: string;
  userAvatar?: string;
  onLogout: () => void;
  onNavClick?: (view: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onMenuToggle, searchValue, onSearchChange, notifCount, userName, userAvatar, onLogout, onNavClick
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <button
          className="notif-btn d-lg-none"
          onClick={onMenuToggle}
          style={{ width: 38, height: 38 }}
        >
          <i className="fas fa-bars" />
        </button>
        <div className="search-wrap">
          <i className="fas fa-search" />
          <input
            type="text"
            className="search-input-db"
            placeholder="Search songs, artists, playlists..."
            value={searchValue}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="top-bar-right">
        <button className="notif-btn" onClick={() => onNavClick?.('notifications')} title="Notifications">
          <i className="fas fa-bell" />
          {notifCount ? <span className="notif-badge">{notifCount}</span> : null}
        </button>

        <div style={{ position: 'relative' }}>
          <button
            className="user-dropdown-btn"
            onClick={() => setDropdownOpen(o => !o)}
          >
            <div className="user-avatar-sm">
              {userAvatar
                ? <img src={userAvatar} alt={userName} />
                : (userName?.charAt(0) ?? 'U')}
            </div>
            <span className="d-none d-md-inline">{userName || 'User'}</span>
            <i className="fas fa-chevron-down" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }} />
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 180,
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              borderRadius: 12, padding: 4, zIndex: 999, boxShadow: 'var(--shadow-medium)'
            }}>
              {[
                { label: 'Profile', icon: 'fa-user', view: 'profile' },
                { label: 'Settings', icon: 'fa-cog', view: 'settings' },
              ].map(item => (
                <button
                  key={item.label}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--text-light)', fontSize: '0.9rem', cursor: 'pointer', borderRadius: 8 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  onClick={() => { setDropdownOpen(false); onNavClick?.(item.view); }}
                >
                  <i className={`fas ${item.icon}`} style={{ width: 16 }} />
                  {item.label}
                </button>
              ))}
              <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
              <button
                onClick={() => { setDropdownOpen(false); onLogout(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: '#EF4444', fontSize: '0.9rem', cursor: 'pointer', borderRadius: 8 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <i className="fas fa-sign-out-alt" style={{ width: 16 }} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Player Bar ─── */
export const PlayerBar: React.FC = () => {
  const { currentSong, isPlaying, progress, duration, togglePlay, seek, skipForward, skipBackward, volume, setVolume, isMuted, toggleMute } = useAudio();
  const pct = duration ? (progress / duration) * 100 : 0;

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="music-player-bar">
      <div className="player-info">
        <div className="player-cover-art" style={{ background: 'var(--bg-tertiary)', borderRadius: 6, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {currentSong?.coverArt
            ? <img src={currentSong.coverArt} alt="" className="player-cover-art" />
            : <i className="fas fa-music" style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }} />}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div className="player-song-name">{currentSong?.title ?? 'No track selected'}</div>
          <div className="player-artist-name">{currentSong?.artistId?.name ?? 'Select a track to play'}</div>
        </div>
      </div>

      <div className="player-controls">
        <div className="control-buttons">
          <button className="ctrl-btn" onClick={skipBackward} disabled={!currentSong}><i className="fas fa-step-backward" /></button>
          <button className="ctrl-btn play-main" onClick={togglePlay} disabled={!currentSong}>
            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`} />
          </button>
          <button className="ctrl-btn" onClick={skipForward} disabled={!currentSong}><i className="fas fa-step-forward" /></button>
        </div>
        <div className="progress-row">
          <span>{fmt(progress)}</span>
          <div
            className="progress-bar-bg"
            onClick={e => {
              if (!currentSong) return;
              const rect = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - rect.left) / rect.width) * 100);
            }}
          >
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      <div className="player-volume-area">
        <i className={`fas ${isMuted || volume === 0 ? 'fa-volume-mute' : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'} vol-icon`} onClick={toggleMute} style={{ cursor: 'pointer' }} />
        <input 
          type="range" min={0} max={1} step={0.01} 
          value={isMuted ? 0 : volume} 
          onChange={e => setVolume(parseFloat(e.target.value))} 
          style={{ width: 80, accentColor: 'var(--accent-color)' }} 
        />
      </div>
    </div>
  );
};

/* ─── Layout Wrapper ─── */
interface LayoutProps {
  children: React.ReactNode;
  navItems: { label?: string; icon?: string; view?: string; section?: string }[];
  activeView: string;
  onNavClick: (view: string) => void;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  notifCount?: number;
  totalPlays?: number;
  totalLikes?: number;
}

const Layout: React.FC<LayoutProps> = ({
  children, navItems, activeView, onNavClick, searchValue = '', onSearchChange = () => {}, notifCount = 0, totalPlays = 0, totalLikes = 0
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="app-shell">
      <Sidebar
        navItems={navItems}
        activeView={activeView}
        onNavClick={onNavClick}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        totalPlays={totalPlays}
        totalLikes={totalLikes}
      />

      <div className="main-col">
        <TopBar
          onMenuToggle={() => setSidebarOpen(o => !o)}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          notifCount={notifCount}
          userName={user?.name}
          userAvatar={user?.avatar}
          onLogout={handleLogout}
          onNavClick={onNavClick}
        />

        <div className="content-area">
          {children}
        </div>

        <PlayerBar />
      </div>
    </div>
  );
};

export default Layout;


