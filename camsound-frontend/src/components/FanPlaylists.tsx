import React, { useEffect, useState, useCallback } from 'react';
import Modal from './Modal';
import { playlistsService } from '../services/api';
import { useAudio } from '../context/AudioContext';
import PlaylistCard, { type PlaylistItem } from './PlaylistCard';

export const FanPlaylists: React.FC = () => {
  const { playSong } = useAudio();
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await playlistsService.getPlaylists();
      setPlaylists(res.data?.data ?? res.data ?? []);
    } catch {
      setMessage('Unable to load playlists.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await playlistsService.createPlaylist({
        name: name.trim(),
        description: description.trim(),
        isPublic: true,
      });
      const created = res.data?.data ?? res.data;
      setPlaylists((current) => [created, ...current]);
      setName('');
      setDescription('');
      setIsCreateOpen(false);
    } catch {
      setMessage('Unable to create playlist. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePlayPlaylist = (playlist: PlaylistItem) => {
    if (playlist.songs && playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs);
    }
  };

  return (
    <div className="fan-playlists-container view-enter">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(250, 204, 21, 0.15)', border: '1px solid rgba(250, 204, 21, 0.3)', borderRadius: 20, color: 'var(--accent-color)', fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
            <i className="fas fa-list" /> PERSONAL COLLECTIONS
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Playlists
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
            Group your favorite Cameroonian tracks into custom playlists
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-camsound-yellow"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <i className="fas fa-plus" /> Create Playlist
        </button>
      </div>

      {message && (
        <div className="fan-submit-msg" role="alert" style={{ marginBottom: 20 }}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="fan-loading" style={{ padding: 40 }}>
          <i className="fas fa-spinner fa-spin" />
          <span>Loading playlists...</span>
        </div>
      ) : playlists.length === 0 ? (
        <div className="fan-empty-state" style={{ background: 'rgba(18, 26, 22, 0.6)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
          <i className="fas fa-compact-disc" style={{ color: 'var(--accent-color)', opacity: 0.4 }} />
          <h4 style={{ color: '#fff' }}>No playlists yet</h4>
          <p>Create your first custom playlist to group your favorite songs together.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist._id}
              playlist={playlist}
              onPlayPlaylist={handlePlayPlaylist}
            />
          ))}
        </div>
      )}

      <Modal isOpen={isCreateOpen} title="Create New Playlist" onClose={() => !saving && setIsCreateOpen(false)} size="sm">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-field">
            <label>Playlist Name</label>
            <input
              type="text"
              placeholder="e.g. Makossa Classics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="search-input-db"
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <label>Description (Optional)</label>
            <textarea
              rows={3}
              placeholder="Give your playlist a vibe or theme..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="search-input-db"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              className="btn-camsound-outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn-camsound-yellow" disabled={saving || !name.trim()}>
              {saving ? 'Creating...' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FanPlaylists;
