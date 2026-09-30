import React, { useState, useEffect, useCallback } from 'react';
import { notificationsService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

interface Notification {
  _id: string;
  message?: string;
  title?: string;
  type?: string;
  isRead?: boolean;
  read?: boolean;
  createdAt?: string;
}

const TYPE_META: Record<string, { icon: string; color: string }> = {
  new_release:   { icon: 'fa-compact-disc', color: '#a855f7' },
  follow:        { icon: 'fa-user-plus',    color: '#3b82f6' },
  like:          { icon: 'fa-heart',         color: '#ef4444' },
  comment:       { icon: 'fa-comment',       color: '#22c55e' },
  system:        { icon: 'fa-bell',          color: 'var(--accent-color)' },
  default:       { icon: 'fa-bell',          color: 'var(--text-muted)' },
};

const FanNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [readSet, setReadSet] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { t } = useLanguage();
  const toast = useToast();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsService.getNotifications();
      const data: Notification[] = res.data?.data ?? res.data ?? [];
      setNotifications(data);
      setReadSet(new Set(data.filter(n => n.isRead || n.read).map(n => n._id)));
    } catch {
      setNotifications([]);
      setReadSet(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    setReadSet(prev => new Set(prev).add(id));
    try {
      await notificationsService.markRead(id);
      toast.info('Notification marked as read');
    } catch {}
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsService.markAllRead();
      setReadSet(new Set(notifications.map(n => n._id)));
      toast.success(t('notif.all_marked_read', 'All notifications marked as read'));
    } catch {
      setReadSet(new Set(notifications.map(n => n._id)));
      toast.success(t('notif.all_marked_read', 'All notifications marked as read'));
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(n => !readSet.has(n._id)).length;

  const displayedNotifications = notifications.filter(n => {
    if (filter === 'unread') return !readSet.has(n._id);
    return true;
  });

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(iso).toLocaleDateString();
  };

  const getMeta = (type?: string) => TYPE_META[type ?? 'default'] ?? TYPE_META.default;

  return (
    <div className="fan-notifs-container view-enter">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(250, 204, 21, 0.15)', border: '1px solid rgba(250, 204, 21, 0.3)', borderRadius: 20, color: 'var(--accent-color)', fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
            <i className="fas fa-bell" /> {t('notif.updates_alerts')}
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            {t('notif.title')}
            {unreadCount > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.8rem', fontWeight: 800, padding: '2px 10px', borderRadius: 20, boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}>
                {unreadCount} {t('notif.new_badge')}
              </span>
            )}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
            {t('notif.stay_updated')}
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Quick Filter Pill */}
          <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 3 }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '6px 14px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
                background: filter === 'all' ? 'var(--accent-color)' : 'transparent',
                color: filter === 'all' ? '#000' : 'rgba(255,255,255,0.7)'
              }}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              style={{
                padding: '6px 14px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
                background: filter === 'unread' ? 'var(--accent-color)' : 'transparent',
                color: filter === 'unread' ? '#000' : 'rgba(255,255,255,0.7)'
              }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff', borderRadius: 20, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
              <i className={`fas ${markingAll ? 'fa-spinner fa-spin' : 'fa-check-double'}`} />
              {markingAll ? t('notif.marking') : t('notif.mark_all_read')}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="fan-loading">
          <i className="fas fa-spinner fa-spin" />
          <span>{t('notif.loading')}</span>
        </div>
      ) : displayedNotifications.length === 0 ? (
        <div className="fan-empty-state" style={{ background: 'rgba(18, 26, 22, 0.6)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
          <i className="fas fa-bell-slash" style={{ color: 'var(--accent-color)', opacity: 0.4 }} />
          <h4 style={{ color: '#fff' }}>{filter === 'unread' ? 'No unread notifications' : t('notif.all_caught_up')}</h4>
          <p>{filter === 'unread' ? 'You have read all your alerts!' : t('notif.no_new')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayedNotifications.map(notif => {
            const isRead = readSet.has(notif._id);
            const meta = getMeta(notif.type);
            return (
              <div
                key={notif._id}
                onClick={() => !isRead && handleMarkRead(notif._id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                  background: isRead ? 'rgba(18, 26, 22, 0.5)' : 'rgba(24, 34, 28, 0.85)',
                  border: `1px solid ${isRead ? 'rgba(255, 255, 255, 0.06)' : 'rgba(250, 204, 21, 0.3)'}`,
                  borderRadius: 16, backdropFilter: 'blur(10px)', cursor: isRead ? 'default' : 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative',
                  transform: isRead ? 'none' : 'translateY(-1px)',
                  boxShadow: isRead ? 'none' : '0 4px 16px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: `${meta.color}18`,
                  border: `1px solid ${meta.color}35`, color: meta.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0
                }}>
                  <i className={`fas ${meta.icon}`} />
                </div>
                <div style={{ flex: 1 }}>
                  {notif.title && <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginBottom: 2 }}>{notif.title}</div>}
                  <div style={{ color: isRead ? 'rgba(255,255,255,0.7)' : '#fff', fontSize: '0.88rem', lineHeight: 1.4 }}>{notif.message ?? notif.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{formatTime(notif.createdAt)}</div>
                </div>
                {!isRead ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 600 }}>Mark read</span>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-color)', boxShadow: '0 0 10px rgba(250, 204, 21, 0.8)', flexShrink: 0 }} />
                  </div>
                ) : (
                  <i className="fas fa-check" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem' }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FanNotifications;

