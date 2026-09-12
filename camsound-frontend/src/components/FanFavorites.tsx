import React, { useState, useEffect, useCallback } from 'react';
import { favoritesService, playlistsService } from '../services/api';
import { useAudio } from '../context/AudioContext';
import SongCard, { type SongItem } from './SongCard';
import PlaylistCard, { type PlaylistItem } from './PlaylistCard';
import ArtistDetailsModal from './ArtistDetailsModal';

export const FanFavorites: React.FC = () => {
  const { playSong } = useAudio();
  const [favorites, setFavorites] = useState<SongItem[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [favRes, playRes] = await Promise.allSettled([
        favoritesService.getFavorites(),
        playlistsService.getPlaylists(),
      ]);

      const favData: SongItem[] =
        favRes.status === 'fulfilled' ? favRes.value.data?.data ?? favRes.value.data ?? [] : [];
      const playData: PlaylistItem[] =
        playRes.status === 'fulfilled' ? playRes.value.data?.data ?? playRes.value.data ?? [] : [];

      setFavorites(favData);
      setPlaylists(playData);
    } catch {
      setFavorites([]);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFavoriteToggle = async (song: SongItem) => {
    try {
      await favoritesService.unlikeSong(song._id);
      setFavorites((prev) => prev.filter((s) => s._id !== song._id));
    } catch {
      // ignore
    }
  };

  const handlePlayAll = () => {
    if (favorites.length > 0) {
      playSong(favorites[0] as any, favorites as any[]);
    }
  };

  const handlePlayPlaylist = (playlist: PlaylistItem) => {
    if (playlist.songs && playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs);
    }
  };

  return (
    <div className="fan-favorites-container view-enter">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 20, color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
            <i className="fas fa-heart" /> SAVED TRACKS
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            My Favorites
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
            Your personally curated collection of loved Cameroonian songs
          </p>
        </div>
        {favorites.length > 0 && (
          <button className="btn-camsound-yellow" onClick={handlePlayAll}>
            <i className="fas fa-play" /> Play All
          </button>
        )}
      </div>

      {loading ? (
        <div className="fan-loading" style={{ padding: 40 }}>
          <i className="fas fa-spinner fa-spin" />
          <span>Loading your favorites...</span>
        </div>
      ) : (
        <>
          {/* Favorite Songs */}
          <section className="fan-section" style={{ marginBottom: 36 }}>
            <div className="fan-section-header-premium">
              <div className="fan-section-label">
                <div className="fan-section-icon-badge" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                  <i className="fas fa-heart" />
                </div>
                <div>
                  <div className="fan-section-title-premium">Favorite Songs</div>
                  <div className="fan-section-subtitle-premium">
                    {favorites.length} {favorites.length === 1 ? 'track' : 'tracks'} liked
                  </div>
                </div>
              </div>
            </div>

            {favorites.length === 0 ? (
              <div className="fan-empty-state" style={{ background: 'rgba(18, 26, 22, 0.6)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
                <i className="fas fa-heart-broken" style={{ color: '#ef4444', opacity: 0.5 }} />
                <h4 style={{ color: '#fff' }}>No favorites yet</h4>
                <p>Click the heart icon on any song to save it to your library.</p>
              </div>
            ) : (
              <div className="cards-grid">
                {favorites.map((song) => (
                  <SongCard
                    key={song._id}
                    song={song}
                    playlist={favorites}
                    isFavorite={true}
                    onFavoriteToggle={handleFavoriteToggle}
                    onArtistClick={setSelectedArtist}
                  />
                ))}
              </div>
            )}
          </section>

          {/* User Playlists */}
          {playlists.length > 0 && (
            <section className="fan-section">
              <div className="fan-section-header-premium">
                <div className="fan-section-label">
                  <div className="fan-section-icon-badge" style={{ background: 'rgba(250,204,21,0.12)', color: 'var(--accent-color)' }}>
                    <i className="fas fa-list" />
                  </div>
                  <div>
                    <div className="fan-section-title-premium">My Playlists</div>
                    <div className="fan-section-subtitle-premium">Custom collections you created</div>
                  </div>
                </div>
              </div>
              <div className="cards-grid">
                {playlists.map((playlist) => (
                  <PlaylistCard
                    key={playlist._id}
                    playlist={playlist}
                    onPlayPlaylist={handlePlayPlaylist}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <ArtistDetailsModal artist={selectedArtist} onClose={() => setSelectedArtist(null)} />
    </div>
  );
};

export default FanFavorites;
