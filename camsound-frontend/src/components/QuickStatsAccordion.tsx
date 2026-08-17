import React, { useEffect, useState } from 'react';
import { favoritesService, historyService } from '../services/api';

interface FanStats {
  totalPlays: number;
  totalLikes: number;
  totalHours: number;
}

const QuickStatsAccordion: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [stats, setStats] = useState<FanStats>({ totalPlays: 0, totalLikes: 0, totalHours: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const [historyRes, favoritesRes] = await Promise.all([
          historyService.getHistory({ limit: 1000 }),
          favoritesService.getFavorites(),
        ]);
        if (cancelled) return;
        const history = historyRes.data.success ? historyRes.data.data : [];
        const favorites = favoritesRes.data.success ? favoritesRes.data.data : [];
        const totalMinutes = history.reduce((sum: number, entry: any) => {
          const duration = entry.songId?.duration || '3:30';
          const [minutes = '0', seconds = '0'] = String(duration).split(':');
          return sum + Number(minutes) + Number(seconds) / 60;
        }, 0);
        setStats({
          totalPlays: history.length,
          totalLikes: favorites.length,
          totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        });
      } catch {
        if (!cancelled) setStats({ totalPlays: 0, totalLikes: 0, totalHours: 0 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ margin: '18px 16px 0', borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 0, background: 'none', color: 'var(--text-light)', fontWeight: 700, cursor: 'pointer', padding: '6px 0' }}
      >
        <span>Quick Stats</span>
        <i className={`fas fa-chevron-${open ? 'up' : 'down'}`} />
      </button>
      {open && (
        <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          {[
            { icon: 'fa-play', label: 'Total Plays', value: loading ? '...' : stats.totalPlays },
            { icon: 'fa-heart', label: 'Songs Liked', value: loading ? '...' : stats.totalLikes },
            { icon: 'fa-clock', label: 'Hours Listened', value: loading ? '...' : stats.totalHours },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.8rem' }}><i className={`fas ${item.icon}`} />{item.label}</span>
              <strong style={{ color: 'var(--accent-color)' }}>{item.value}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuickStatsAccordion;
