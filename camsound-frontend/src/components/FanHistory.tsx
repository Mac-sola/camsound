import React, { useState, useEffect, useCallback } from 'react';
import { historyService } from '../services/api';
import { useAudio } from '../context/AudioContext';

interface HistoryEntry {
  _id: string;
  song?: {
    _id: string;
    title: string;
    coverArt?: string;
    filePath?: string;
    genre?: string;
    artistId?: { name?: string; _id?: string };
  };
  songId?: HistoryEntry['song'];
  song_id?: string;
  playedAt?: string;
  createdAt?: string;
}

const FanHistory: React.FC = () => {
  const { playSong, currentSong } = useAudio();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await historyService.getHistory({ limit: 50 });
      const data: HistoryEntry[] = res.data?.data ?? res.data ?? [];
      setHistory(data.map(entry => ({ ...entry, song: entry.song ?? entry.songId })));
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleClear = async () => {
    setClearing(true);
    try {
      await historyService.clearHistory();
    } catch {}
    setHistory([]);
    setCleared(true);
    setClearing(false);
  };

  const handlePlay = (entry: HistoryEntry) => {
    if (!entry.song) return;
    playSong({
      _id: entry.song._id,
      title: entry.song.title,
      filePath: entry.song.filePath ?? '',
      coverArt: entry.song.coverArt,
      artistId: entry.song.artistId as any,
    });
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(iso).toLocaleDateString();
  };

  return (
    <div className="fan-history-container">
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 20, color: '#60a5fa', fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
            <i className="fas fa-history" /> RECENT ACTIVITY
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Listening History
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
            Tracks and sessions you have recently played on CamSound
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClear}
            disabled={clearing}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444', borderRadius: 20, fontWeight: 700, fontSize: '0.82rem',
              cursor: 'pointer', opacity: clearing ? 0.6 : 1
            }}
          >
            <i className={`fas ${clearing ? 'fa-spinner fa-spin' : 'fa-trash-alt'}`} />
            {clearing ? 'Clearing...' : 'Clear History'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="fan-loading">
          <i className="fas fa-spinner fa-spin" />
          <span>Loading history...</span>
        </div>
      ) : cleared || history.length === 0 ? (
        <div className="fan-empty-state" style={{ background: 'rgba(18, 26, 22, 0.6)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
          <i className="fas fa-history" style={{ color: 'var(--accent-color)', opacity: 0.4 }} />
          <h4 style={{ color: '#fff' }}>No history yet</h4>
          <p>Start listening to songs to track your playing history here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map((entry, idx) => {
            const song = entry.song;
            const isActive = currentSong?._id === song?._id;
            return (
              <div
                key={entry._id}
                onClick={() => handlePlay(entry)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '12px 18px',
                  background: isActive ? 'rgba(250, 204, 21, 0.12)' : 'rgba(18, 26, 22, 0.65)',
                  border: `1px solid ${isActive ? 'rgba(250, 204, 21, 0.4)' : 'rgba(255, 255, 255, 0.07)'}`,
                  borderRadius: 14, backdropFilter: 'blur(10px)', cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: isActive ? 'var(--accent-color)' : 'rgba(255,255,255,0.4)', width: 24, textAlign: 'center' }}>
                  {idx + 1}
                </span>
                <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: '#121814', position: 'relative', flexShrink: 0 }}>
                  {song?.coverArt
                    ? <img src={song.coverArt} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)' }}><i className="fas fa-music" /></div>}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, color: isActive ? 'var(--accent-color)' : '#fff', fontSize: '0.92rem' }}>
                    {song?.title ?? 'Unknown Track'}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                    {song?.artistId?.name ?? 'Unknown Artist'}
                  </div>
                </div>
                {song?.genre && (
                  <span className="fan-song-genre-badge" style={{ display: 'none', minWidth: '80px' }}>{song.genre}</span>
                )}
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="far fa-clock" />
                  {formatTime(entry.playedAt ?? entry.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FanHistory;

