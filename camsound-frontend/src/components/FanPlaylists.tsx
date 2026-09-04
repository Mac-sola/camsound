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
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(250, 204, 21, 0.15)', border: '1px solid rgba(250, 204, 21, 0.3)', borderRadius: 20, color: 'var(--accent-color)', fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
            <i className="fas fa-list" /> PERSONAL COLLECTIONS
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            My Playlists
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
            Group your favorite Cameroonian tracks into custom playlists
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
            background: 'var(--accent-color)', color: '#000', borderRadius: 20, fontWeight: 700,
            fontSize: '0.88rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(250, 204, 21, 0.35)'
          }}
        >
          <i className="fas fa-plus" /> Create Playlist
        </button>
      </div>

      {message && <div className="fan-submit-msg" role="alert" style={{ marginBottom: 20 }}>{message}</div>}

      {playlists.length === 0 ? (
        <div className="fan-empty-state" style={{ background: 'rgba(18, 26, 22, 0.6)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
          <i className="fas fa-compact-disc" style={{ color: 'var(--accent-color)', opacity: 0.4 }} />
          <h4 style={{ color: '#fff' }}>No playlists yet</h4>
          <p>Create your first custom playlist to group your favorite songs together.</p>
        </div>
      ) : (
        <div className="fan-songs-grid-premium">
          {playlists.map((playlist) => (
            <div key={playlist._id} className="music-card" style={{ cursor: 'pointer' }}>
              <div className="music-card-cover-wrapper">
                {playlist.coverUrl ? (
                  <img src={playlist.coverUrl} alt={playlist.name} className="music-card-cover" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)', fontSize: '2rem' }}>
                    <i className="fas fa-list" />
                  </div>
                )}
                <div className="music-card-play-overlay">
                  <div className="play-btn-circle">
                    <i className="fas fa-play" style={{ marginLeft: 2 }} />
                  </div>
                </div>
              </div>
              <div className="fan-song-info-premium">
                <div className="fan-song-title-premium" style={{ fontWeight: 700, color: '#fff' }}>{playlist.name}</div>
                <div className="fan-song-artist-premium" style={{ color: 'var(--accent-color)', fontSize: '0.82rem' }}>
                  {playlist.trackCount ?? 0} {playlist.trackCount === 1 ? 'track' : 'tracks'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isCreateOpen} title="Create Playlist" onClose={() => !saving && setIsCreateOpen(false)} size="sm">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="playlist-name" style={{ display: 'block', marginBottom: 8, fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>
              Playlist Name
            </label>
            <input
              id="playlist-name"
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="e.g. Sunday Makossa Chill"
              required
              autoFocus
              style={{
                width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', outline: 'none'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            style={{
              padding: '12px', background: 'var(--accent-color)', color: '#000', borderRadius: 12,
              fontWeight: 700, border: 'none', cursor: 'pointer', opacity: saving || !name.trim() ? 0.5 : 1
            }}
          >
            {saving ? 'Creating...' : 'Create Playlist'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default FanPlaylists;

