import React, { useEffect, useState } from 'react';
import { useToast, type Toast } from '../context/ToastContext';

const TYPE_CONFIG = {
  success: {
    icon: 'fa-check-circle',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.35)',
    glow: 'rgba(16, 185, 129, 0.25)',
  },
  error: {
    icon: 'fa-times-circle',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.35)',
    glow: 'rgba(239, 68, 68, 0.25)',
  },
  info: {
    icon: 'fa-info-circle',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.35)',
    glow: 'rgba(59, 130, 246, 0.25)',
  },
  warning: {
    icon: 'fa-exclamation-circle',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.35)',
    glow: 'rgba(245, 158, 11, 0.25)',
  },
  music: {
    icon: 'fa-music',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(168, 85, 247, 0.35)',
    glow: 'rgba(168, 85, 247, 0.25)',
  },
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const cfg = TYPE_CONFIG[toast.type] ?? TYPE_CONFIG.info;

  useEffect(() => {
    // Animate in
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 350);
  };

  return (
    <div
      className="toast-item"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '14px 16px',
        background: 'rgba(12, 18, 14, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${cfg.border}`,
        borderRadius: 16,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${cfg.glow}`,
        minWidth: 290,
        maxWidth: 380,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: visible && !exiting ? 1 : 0,
        transform: visible && !exiting ? 'translateX(0) scale(1)' : 'translateX(40px) scale(0.95)',
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onClick={handleDismiss}
      role="alert"
    >
      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div
          className="toast-progress"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: 3,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)`,
            animation: `toast-progress ${toast.duration}ms linear forwards`,
          }}
        />
      )}

      {/* Icon */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1rem',
        flexShrink: 0,
      }}>
        <i className={`fas ${toast.icon ?? cfg.icon}`} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 700,
          color: '#fff',
          fontSize: '0.88rem',
          lineHeight: 1.3,
          marginBottom: toast.subtitle ? 3 : 0,
        }}>
          {toast.message}
        </div>
        {toast.subtitle && (
          <div style={{
            fontSize: '0.78rem',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.4,
          }}>
            {toast.subtitle}
          </div>
        )}
      </div>

      {/* Dismiss X */}
      <button
        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.35)',
          fontSize: '0.75rem',
          padding: '2px 4px',
          cursor: 'pointer',
          flexShrink: 0,
          lineHeight: 1,
          marginTop: 2,
          transition: 'color 0.15s',
        }}
        aria-label="Dismiss notification"
      >
        <i className="fas fa-times" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useToast();

  return (
    <div
      id="toast-container"
      style={{
        position: 'fixed',
        bottom: 100, // above the music player bar
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toast} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
