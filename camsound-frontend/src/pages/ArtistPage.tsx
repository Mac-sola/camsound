import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlatformSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import ArtistProfilePage from '../components/ArtistProfilePage';
import { PlayerBar } from '../components/Layout';
import SongPlayerModal from '../components/SongPlayerModal';

const ArtistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const { settings } = usePlatformSettings();
  const navigate = useNavigate();

  const dashboardPath =
    user?.type === 'admin' ? '/admin' : user?.type === 'artist' ? '/artist' : '/fan';

  if (!id) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
        <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', marginBottom: 16 }} />
        <h2>Artist not found</h2>
        <Link to="/browse" className="btn-camsound-yellow" style={{ marginTop: 16 }}>
          Browse Artists
        </Link>
      </div>
    );
  }

  return (
    <div className="artist-page-wrapper">
      {/* Minimal Navbar */}
      <nav
        className="navbar-camsound"
        style={{ position: 'sticky', top: 0, zIndex: 100 }}
      >
        <div className="container">
          <div className="navbar-inner">
            <Link
              to="/"
              className="navbar-brand"
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.platformName}
                  style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <i
                  className={`fas ${settings.logoIcon || 'fa-drum'}`}
                  style={{ color: 'var(--accent-color)', fontSize: '1.2rem' }}
                />
              )}
              <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                {settings.platformName || 'CamSound'}
              </span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link
                to="/browse"
                className="btn-camsound-outline"
                style={{ padding: '7px 16px', fontSize: '0.88rem', borderRadius: 30 }}
              >
                <i className="fas fa-search" style={{ marginRight: 6 }} />
                Browse
              </Link>
              {user ? (
                <>
                  <Link
                    to={dashboardPath}
                    className="btn-camsound-yellow"
                    style={{ padding: '7px 16px', fontSize: '0.88rem' }}
                  >
                    Dashboard
                  </Link>
                  <button
                    className="btn-camsound-outline"
                    style={{ padding: '7px 16px', fontSize: '0.88rem' }}
                    onClick={async () => {
                      await logout();
                      navigate('/');
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn-camsound-outline"
                    style={{ padding: '7px 16px', fontSize: '0.88rem', borderRadius: 30 }}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="btn-camsound-yellow"
                    style={{ padding: '7px 16px', fontSize: '0.88rem' }}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Artist Profile Content */}
      <ArtistProfilePage artistId={id} />

      {/* Global Player Bar & Modal */}
      <PlayerBar />
      <SongPlayerModal />
    </div>
  );
};

export default ArtistPage;
