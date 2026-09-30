import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePlatformSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';

interface LegalPageProps {
  type: 'terms' | 'privacy' | 'cookies';
}

const LegalPage: React.FC<LegalPageProps> = ({ type }) => {
  const { settings } = usePlatformSettings();
  const { t } = useLanguage();
  const platformName = settings.platformName || 'CamSound';

  const tp = (key: string) => t(key).replace('{name}', platformName);

  const titles: Record<LegalPageProps['type'], string> = {
    terms: t('legal.terms'),
    privacy: t('legal.privacy'),
    cookies: t('legal.cookies'),
  };

  const title = titles[type];

  useEffect(() => {
    document.title = `${title} — ${platformName}`;
    window.scrollTo(0, 0);
  }, [type, title, platformName]);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
      {/* Header / Nav */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 32px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(10, 10, 15, 0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.1rem'
          }}>
            CS
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.5px' }}>{platformName}</span>
        </Link>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }}>
            <i className="fas fa-arrow-left" style={{ marginRight: 6 }} /> {t('legal.back_home')}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, maxWidth: 840, width: '100%', margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{
          display: 'inline-flex',
          gap: 12,
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '6px',
          borderRadius: '12px',
          marginBottom: '32px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <Link
            to="/terms"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: type === 'terms' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: type === 'terms' ? '#f59e0b' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            {t('legal.terms')}
          </Link>
          <Link
            to="/privacy"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: type === 'privacy' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: type === 'privacy' ? '#f59e0b' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            {t('legal.privacy')}
          </Link>
          <Link
            to="/cookies"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: type === 'cookies' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: type === 'cookies' ? '#f59e0b' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            {t('legal.cookies')}
          </Link>
        </div>

        <div style={{
          background: 'rgba(18, 18, 24, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 16,
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 8, color: '#f8fafc', letterSpacing: '-0.5px' }}>
            {title}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 32 }}>
            {t('legal.last_updated')}
          </p>

          <hr style={{ borderColor: 'rgba(255, 255, 255, 0.08)', marginBottom: 32 }} />

          {type === 'terms' && (
            <div style={{ lineHeight: 1.7, color: '#cbd5e1', fontSize: '0.95rem' }}>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginTop: 24, marginBottom: 12 }}>{t('legal.terms_h1')}</h3>
              <p style={{ marginBottom: 16 }}>{tp('legal.terms_p1')}</p>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginTop: 24, marginBottom: 12 }}>{t('legal.terms_h2')}</h3>
              <p style={{ marginBottom: 16 }}>{tp('legal.terms_p2')}</p>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginTop: 24, marginBottom: 12 }}>{t('legal.terms_h3')}</h3>
              <p style={{ marginBottom: 16 }}>{tp('legal.terms_p3')}</p>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginTop: 24, marginBottom: 12 }}>{t('legal.terms_h4')}</h3>
              <p style={{ marginBottom: 16 }}>{tp('legal.terms_p4')}</p>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginTop: 24, marginBottom: 12 }}>{t('legal.terms_h5')}</h3>
              <p style={{ marginBottom: 16 }}>{tp('legal.terms_p5')}</p>
            </div>
          )}

          {type === 'privacy' && (
            <div style={{ lineHeight: 1.7, color: '#cbd5e1', fontSize: '0.95rem' }}>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginTop: 24, marginBottom: 12 }}>{t('legal.privacy_h1')}</h3>
              <p style={{ marginBottom: 16 }}>{tp('legal.privacy_p1')}</p>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginTop: 24, marginBottom: 12 }}>{t('legal.privacy_h2')}</h3>
              <p style={{ marginBottom: 16 }}>{tp('legal.privacy_p2')}</p>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginTop: 24, marginBottom: 12 }}>{t('legal.privacy_h3')}</h3>
              <p style={{ marginBottom: 16 }}>{tp('legal.privacy_p3')}</p>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginTop: 24, marginBottom: 12 }}>{t('legal.privacy_h4')}</h3>
              <p style={{ marginBottom: 16 }}>{tp('legal.privacy_p4')}</p>
            </div>
          )}

          {type === 'cookies' && (
            <div style={{ lineHeight: 1.7, color: '#cbd5e1', fontSize: '0.95rem' }}>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginTop: 24, marginBottom: 12 }}>{t('legal.cookies_h1')}</h3>
              <p style={{ marginBottom: 16 }}>{tp('legal.cookies_p1')}</p>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginTop: 24, marginBottom: 12 }}>{t('legal.cookies_h2')}</h3>
              <p style={{ marginBottom: 16 }}>{tp('legal.cookies_p2')}</p>
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginTop: 24, marginBottom: 12 }}>{t('legal.cookies_h3')}</h3>
              <p style={{ marginBottom: 16 }}>{tp('legal.cookies_p3')}</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '24px 32px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: '#64748b'
      }}>
        &copy; {new Date().getFullYear()} {platformName}. {t('legal.rights_reserved')}
      </footer>
    </div>
  );
};

export default LegalPage;
