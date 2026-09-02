import React, { useState, useEffect, useCallback } from 'react';
import { notificationsService } from '../services/api';

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
    } catch {}
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsService.markAllRead();
      setReadSet(new Set(notifications.map(n => n._id)));
    } catch {
      setReadSet(new Set(notifications.map(n => n._id)));
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter(n => !readSet.has(n._id)).length;

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
    <div className="fan-notifs-container">
      <div className="fan-section-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 className="fan-page-title">
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="fan-notif-count-badge">{unreadCount}</span>
            )}
          </h2>
          <p className="fan-page-subtitle">Stay up to date with what's happening</p>
        </div>
        {unreadCount > 0 && (
          <button
            className="fan-secondary-btn"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            <i className={`fas ${markingAll ? 'fa-spinner fa-spin' : 'fa-check-double'}`} />
            {markingAll ? 'Marking...' : 'Mark All Read'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="fan-loading">
          <i className="fas fa-spinner fa-spin" />
          <span>Loading notifications...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="fan-empty-state">
          <i className="fas fa-bell-slash" />
          <h4>You're all caught up!</h4>
          <p>No notifications at the moment.</p>
        </div>
      ) : (
        <div className="fan-notifs-list">
          {notifications.map(notif => {
            const isRead = readSet.has(notif._id);
            const meta = getMeta(notif.type);
            return (
              <div
                key={notif._id}
                className={`fan-notif-row ${isRead ? 'read' : 'unread'}`}
                onClick={() => !isRead && handleMarkRead(notif._id)}
              >
                <div className="fan-notif-icon" style={{ color: meta.color }}>
                  <i className={`fas ${meta.icon}`} />
                </div>
                <div className="fan-notif-body">
                  {notif.title && <div className="fan-notif-title">{notif.title}</div>}
                  <div className="fan-notif-message">{notif.message ?? notif.title}</div>
                  <div className="fan-notif-time">{formatTime(notif.createdAt)}</div>
                </div>
                {!isRead && <div className="fan-notif-dot" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FanNotifications;
