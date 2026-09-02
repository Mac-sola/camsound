import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { playlistsService } from '../services/api';

const FanPlaylists: React.FC = () => {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    playlistsService.getPlaylists()
      .then(res => setPlaylists(res.data?.data ?? res.data ?? []))
      .catch(() => setMessage('Unable to load playlists.'));
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await playlistsService.createPlaylist({ name: name.trim(), description: '', isPublic: false });
      const created = res.data?.data ?? res.data;
      setPlaylists(current => [created, ...current]);
      setName('');
      setIsCreateOpen(false);
    } catch {
      setMessage('Unable to create playlist. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fan-history-container">
      <div className="fan-section-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="fan-page-title">🎧 My Playlists</h2>
          <p className="fan-page-subtitle">Your personal collections</p>
        </div>
        <button className="fan-primary-btn" style={{ fontSize: '0.8rem', padding: '8px 16px' }} onClick={() => setIsCreateOpen(true)}>
          <i className="fas fa-plus" /> Create Playlist
        </button>
      </div>

      {message && <div className="fan-submit-msg" role="alert">{message}</div>}

      {playlists.length === 0 ? (
        <div className="fan-empty-state">
          <i className="fas fa-list-music" />
          <h4>No playlists yet</h4>
          <p>Create your first playlist and add your favorite tracks.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {playlists.map((playlist) => (
            <div key={playlist._id} className="music-card" style={{ cursor: 'pointer' }}>
              <div className="music-card-cover" style={{ background: 'var(--gradient-dark)' }}>
                {playlist.coverUrl ? (
                  <img src={playlist.coverUrl} alt={playlist.name} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-list" style={{ color: 'var(--text-muted)', fontSize: '2rem' }} />
                  </div>
                )}
                <div className="play-overlay">
                  <button className="play-circle-btn">
                    <i className="fas fa-play" />
                  </button>
                </div>
              </div>
              <div className="music-card-info">
                <div className="music-card-title">{playlist.name}</div>
                <div className="music-card-artist">{playlist.trackCount} tracks</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isCreateOpen} title="Create Playlist" onClose={() => !saving && setIsCreateOpen(false)} size="sm">
        <form onSubmit={handleCreate}>
          <label htmlFor="playlist-name">Playlist name</label>
          <input
            id="playlist-name"
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="e.g. Sunday Chill"
            required
            autoFocus
          />
          <button type="submit" className="fan-primary-btn" disabled={saving || !name.trim()}>
            {saving ? 'Creating...' : 'Create Playlist'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default FanPlaylists;
