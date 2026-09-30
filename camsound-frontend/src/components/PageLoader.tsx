import React from 'react';

interface PageLoaderProps {
  message?: string;
}

/**
 * PageLoader Component
 * 
 * Displayed as a Suspense fallback during route transitions when a lazy-loaded
 * chunk is being fetched from the server.
 */
export const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading...' }) => {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        color: '#fff',
        userSelect: 'none',
      }}
    >
      {/* Animated Glowing Vinyl Icon */}
      <div
        style={{
          position: 'relative',
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #0F3D2E 0%, #061A13 100%)',
          border: '2px solid var(--accent-color, #FACC15)',
          boxShadow: '0 0 25px rgba(250, 204, 21, 0.25), 0 0 50px rgba(16, 185, 129, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          animation: 'spin 3s linear infinite',
        }}
      >
        <i
          className="fas fa-compact-disc"
          style={{
            fontSize: '2rem',
            color: 'var(--accent-color, #FACC15)',
          }}
        />
      </div>

      {/* Pulsing Audio Waves Visualizer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, height: 20 }}>
        <span style={{ width: 3, height: 12, background: 'var(--accent-color)', borderRadius: 2, animation: 'wave 1s ease-in-out infinite alternate' }} />
        <span style={{ width: 3, height: 20, background: '#10B981', borderRadius: 2, animation: 'wave 0.8s ease-in-out infinite alternate 0.2s' }} />
        <span style={{ width: 3, height: 16, background: 'var(--accent-color)', borderRadius: 2, animation: 'wave 1.1s ease-in-out infinite alternate 0.4s' }} />
        <span style={{ width: 3, height: 8, background: '#10B981', borderRadius: 2, animation: 'wave 0.9s ease-in-out infinite alternate 0.1s' }} />
      </div>

      <div
        style={{
          fontSize: '0.95rem',
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.85)',
          letterSpacing: '0.5px',
        }}
      >
        {message}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes wave {
          0% { transform: scaleY(0.4); opacity: 0.5; }
          100% { transform: scaleY(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
