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
  const { user } = useAuth();
  const { isPlaying } = useAudio();

  return (
    <>
      {/* Overlay for mobile */}
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />
      
      <div className={`sidebar-wrapper ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: '#facc15',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(250, 204, 21, 0.4)'
            }}>
              <i className={`fas fa-compact-disc ${isPlaying ? 'fa-spin' : ''}`} style={{ color: '#0b0f0c', fontSize: '1.3rem' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#facc15' }}>
                CamSound
              </h1>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 600, letterSpacing: 0.5 }}>
                MUSIC PLATFORM
              </p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            if (item.section) {
              return (
                <div key={`sec-${idx}`} style={{
                  marginTop: 22, marginBottom: 8, paddingLeft: 14,
                  fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700,
                  color: 'rgba(250, 204, 21, 0.7)', letterSpacing: 1.2
                }}>
                  {item.section}
                </div>
              );
            }
            return (
              <button
                key={item.view}
                className={`sidebar-nav-btn ${activeView === item.view ? 'active' : ''}`}
                onClick={() => { if(item.view) { onNavClick(item.view); onClose(); } }}
              >
                <i className={`fas ${item.icon}`} style={{ width: 20, textAlign: 'center' }} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 16, paddingTop: 16 }}>
            {user && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: 10
              }}>
                <div className="hero-avatar-ring" style={{ padding: 2 }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: 34, height: 34, borderRadius: '50%' }} />
                  ) : (
                    <div className="avatar-placeholder" style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-color)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                      {user.name?.charAt(0) ?? 'U'}
                    </div>
                  )}
                </div>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-color)', textTransform: 'capitalize', fontWeight: 600 }}>
                    {user.type || (user as any).role || 'Fan'} Account
                  </div>
                </div>
              </div>
            )}

            <button className="sidebar-nav-btn" onClick={onLogout} style={{ color: '#ef4444' }}>
              <i className="fas fa-sign-out-alt" style={{ width: 20, textAlign: 'center' }} />
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
    <div className="top-bar" style={{ backdropFilter: 'blur(16px)', background: 'rgba(11, 15, 12, 0.85)', borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
      <div className="top-bar-left">
        <button
          className="notif-btn d-lg-none"
          onClick={onMenuToggle}
          style={{ width: 38, height: 38 }}
        >
          <i className="fas fa-bars" />
        </button>
        <div className="search-wrap" style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
          <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }} />
          <input
            type="text"
            className="search-input-db"
            placeholder="Search songs, artists, genres..."
            value={searchValue}
            onChange={e => onSearchChange(e.target.value)}
            style={{
              width: '100%', paddingLeft: 40, paddingRight: searchValue ? 36 : 14,
              background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 20, color: '#fff', fontSize: '0.9rem', outline: 'none', transition: 'all 0.25s'
            }}
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      </div>

      <div className="top-bar-right" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button className="notif-btn" onClick={() => onNavClick?.('notifications')} title="Notifications" style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>
          <i className="fas fa-bell" />
          {notifCount ? (
            <span className="notif-badge" style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 10, boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)' }}>
              {notifCount}
            </span>
          ) : null}
        </button>

        <div style={{ position: 'relative' }}>
          <button
            className="user-dropdown-btn"
            onClick={() => setDropdownOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 6px 6px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 24, cursor: 'pointer' }}
          >
            <div className="user-avatar-sm" style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: 'var(--accent-color)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {userAvatar
                ? <img src={userAvatar} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (userName?.charAt(0) ?? 'U')}
            </div>
            <span className="d-none d-md-inline" style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{userName || 'User'}</span>
            <i className="fas fa-chevron-down" style={{ fontSize: '0.7rem', color: 'var(--accent-color)' }} />
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 190,
              background: 'rgba(18, 26, 22, 0.95)', border: '1px solid rgba(250, 204, 21, 0.3)',
              borderRadius: 14, padding: 6, zIndex: 999, boxShadow: '0 12px 30px rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)'
            }}>
              {[
                { label: 'Profile', icon: 'fa-user', view: 'profile' },
                { label: 'Settings', icon: 'fa-cog', view: 'settings' },
              ].map(item => (
                <button
                  key={item.label}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--text-light)', fontSize: '0.88rem', cursor: 'pointer', borderRadius: 8, transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(250,204,21,0.15)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  onClick={() => { setDropdownOpen(false); onNavClick?.(item.view); }}
                >
                  <i className={`fas ${item.icon}`} style={{ width: 16, color: 'var(--accent-color)' }} />
                  {item.label}
                </button>
              ))}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
              <button
                onClick={() => { setDropdownOpen(false); onLogout(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.88rem', cursor: 'pointer', borderRadius: 8, transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')}
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

/* ─── Equalizer Stub Animation ─── */
const AudioEqualizer: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 16, width: 18 }}>
    {[0.4, 0.8, 0.5, 0.9].map((h, i) => (
      <div
        key={i}
        style={{
          width: 3,
          height: isPlaying ? `${h * 100}%` : '20%',
          background: 'var(--accent-color, #facc15)',
          borderRadius: 2,
          transition: 'height 0.2s ease',
          animation: isPlaying ? `equalizerPulse ${0.5 + i * 0.2}s ease-in-out infinite alternate` : 'none'
        }}
      />
    ))}
  </div>
);

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
    <div className="music-player-bar" style={{ background: 'rgba(15, 22, 18, 0.92)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(250, 204, 21, 0.2)', boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.5)' }}>
      <div className="player-info">
        <div className="player-cover-art" style={{ background: 'var(--bg-tertiary)', borderRadius: 10, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          {currentSong?.coverArt
            ? <img src={currentSong.coverArt} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <i className="fas fa-music" style={{ color: 'var(--accent-color)', fontSize: '1.3rem' }} />}
        </div>
        <div style={{ overflow: 'hidden', minWidth: 120 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="player-song-name" style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>
              {currentSong?.title ?? 'No track selected'}
            </span>
            {currentSong && <AudioEqualizer isPlaying={isPlaying} />}
          </div>
          <div className="player-artist-name" style={{ color: 'var(--accent-color)', fontSize: '0.78rem', fontWeight: 500 }}>
            {currentSong?.artistId?.name ?? 'Select a track to play'}
          </div>
        </div>
      </div>

      <div className="player-controls" style={{ flex: 1, maxWidth: 540 }}>
        <div className="control-buttons" style={{ gap: 16 }}>
          <button className="ctrl-btn" onClick={skipBackward} disabled={!currentSong} style={{ opacity: currentSong ? 1 : 0.4 }}>
            <i className="fas fa-step-backward" />
          </button>
          <button className="ctrl-btn play-main" onClick={togglePlay} disabled={!currentSong} style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--accent-color)', color: '#000', border: 'none', cursor: currentSong ? 'pointer' : 'default', opacity: currentSong ? 1 : 0.4, boxShadow: '0 4px 15px rgba(250, 204, 21, 0.4)' }}>
            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`} style={{ marginLeft: isPlaying ? 0 : 2 }} />
          </button>
          <button className="ctrl-btn" onClick={skipForward} disabled={!currentSong} style={{ opacity: currentSong ? 1 : 0.4 }}>
            <i className="fas fa-step-forward" />
          </button>
        </div>
        <div className="progress-row" style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>{fmt(progress)}</span>
          <div
            className="progress-bar-bg"
            style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', cursor: currentSong ? 'pointer' : 'default', position: 'relative', overflow: 'hidden' }}
            onClick={e => {
              if (!currentSong) return;
              const rect = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - rect.left) / rect.width) * 100);
            }}
          >
            <div className="progress-bar-fill" style={{ width: `${pct}%`, height: '100%', background: '#facc15', borderRadius: 3 }} />
          </div>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      <div className="player-volume-area" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className={`fas ${isMuted || volume === 0 ? 'fa-volume-mute' : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'} vol-icon`} onClick={toggleMute} style={{ cursor: 'pointer', color: 'var(--accent-color)', fontSize: '1rem' }} />
        <input 
          type="range" min={0} max={1} step={0.01} 
          value={isMuted ? 0 : volume} 
          onChange={e => setVolume(parseFloat(e.target.value))} 
          style={{ width: 84, accentColor: 'var(--accent-color)', cursor: 'pointer' }} 
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



