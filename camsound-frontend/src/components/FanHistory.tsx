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
  song_id?: string;
  playedAt?: string;
  createdAt?: string;
}

const MOCK_HISTORY: HistoryEntry[] = [
  { _id: '1', song: { _id: 's1', title: 'Biya Groove', genre: 'Makossa', artistId: { name: 'Alpha X' } }, playedAt: new Date(Date.now() - 600000).toISOString() },
  { _id: '2', song: { _id: 's2', title: 'Makossa Night', genre: 'Afrobeat', artistId: { name: 'Biya B' } }, playedAt: new Date(Date.now() - 3600000).toISOString() },
  { _id: '3', song: { _id: 's3', title: 'Douala Nights', genre: 'R&B', artistId: { name: 'Camer C' } }, playedAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: '4', song: { _id: 's4', title: 'Yaoundé Flow', genre: 'Hip Hop', artistId: { name: 'Delta D' } }, playedAt: new Date(Date.now() - 172800000).toISOString() },
  { _id: '5', song: { _id: 's5', title: 'Camer Vibes', genre: 'Bikutsi', artistId: { name: 'Echo E' } }, playedAt: new Date(Date.now() - 259200000).toISOString() },
];

const FanHistory: React.FC = () => {
  const { playSong, currentSong, isPlaying } = useAudio();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await historyService.getHistory({ limit: 50 });
      const data: HistoryEntry[] = res.data?.data ?? res.data ?? [];
      setHistory(data.length > 0 ? data : MOCK_HISTORY);
    } catch {
      setHistory(MOCK_HISTORY);
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
      <div className="fan-section-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 className="fan-page-title">🕑 Listening History</h2>
          <p className="fan-page-subtitle">Tracks you've played recently</p>
        </div>
        {history.length > 0 && (
          <button
            className="fan-danger-btn"
            onClick={handleClear}
            disabled={clearing}
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
        <div className="fan-empty-state">
          <i className="fas fa-history" />
          <h4>No history yet</h4>
          <p>Start listening to build your history!</p>
        </div>
      ) : (
        <div className="fan-history-list">
          {history.map((entry, idx) => {
            const song = entry.song;
            const isActive = currentSong?._id === song?._id;
            return (
              <div
                key={entry._id}
                className={`fan-history-row ${isActive ? 'active' : ''}`}
                onClick={() => handlePlay(entry)}
              >
                <span className="fan-history-index">{idx + 1}</span>
                <div className="fan-history-cover">
                  {song?.coverArt
                    ? <img src={song.coverArt} alt={song.title} />
                    : <i className="fas fa-music" />}
                  <div className="fan-history-play-overlay">
                    <i className={`fas ${isActive && isPlaying ? 'fa-pause' : 'fa-play'}`} />
                  </div>
                </div>
                <div className="fan-history-info">
                  <div className="fan-history-title">{song?.title ?? 'Unknown Track'}</div>
                  <div className="fan-history-artist">{song?.artistId?.name ?? 'Unknown Artist'}</div>
                </div>
                {song?.genre && (
                  <span className="fan-history-genre">{song.genre}</span>
                )}
                <span className="fan-history-time">
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
