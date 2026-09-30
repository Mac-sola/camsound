import React, { useState, useEffect, useCallback } from 'react';
import { favoritesService, playlistsService } from '../services/api';
import { useAudio } from '../context/AudioContext';
import { useToast } from '../context/ToastContext';
import SongCard, { type SongItem } from './SongCard';
import PlaylistCard, { type PlaylistItem } from './PlaylistCard';
import ArtistDetailsModal from './ArtistDetailsModal';
import ScrollReveal from './ScrollReveal';
import ScrollRow from './ScrollRow';

export const FanFavorites: React.FC = () => {
  const { playSong } = useAudio();
  const toast = useToast();
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
      toast.info(`Removed "${song.title}" from your favorites`);
    } catch {
      toast.error('Unable to remove from favorites');
    }
  };

  const handlePlayAll = () => {
    if (favorites.length > 0) {
      playSong(favorites[0] as any, favorites as any[]);
      toast.music(`Playing all ${favorites.length} favorite songs`);
    }
  };

  const handlePlayPlaylist = (playlist: PlaylistItem) => {
    if (playlist.songs && playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs);
      toast.music(`Playing playlist "${playlist.name}"`);
    }
  };

  return (
    <div className="fan-favorites-container view-enter">
      <ScrollReveal direction="up" delay={50}>
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
      </ScrollReveal>

      {loading ? (
        <div className="fan-loading" style={{ padding: 40 }}>
          <i className="fas fa-spinner fa-spin" />
          <span>Loading your favorites...</span>
        </div>
      ) : (
        <>
          {/* Favorite Songs */}
          <ScrollReveal direction="up" delay={100}>
            {favorites.length > 4 ? (
              <ScrollRow
                title="Favorite Songs"
                subtitle={`${favorites.length} ${favorites.length === 1 ? 'track' : 'tracks'} liked`}
                icon="fa-heart"
                iconBg="rgba(239,68,68,0.12)"
                iconColor="#ef4444"
              >
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
              </ScrollRow>
            ) : (
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
            )}
          </ScrollReveal>

          {/* User Playlists */}
          {playlists.length > 0 && (
            <ScrollReveal direction="up" delay={150}>
              <ScrollRow
                title="My Playlists"
                subtitle="Custom collections you created"
                icon="fa-list"
                iconBg="rgba(250,204,21,0.12)"
                iconColor="var(--accent-color)"
              >
                {playlists.map((playlist) => (
                  <PlaylistCard
                    key={playlist._id}
                    playlist={playlist}
                    onPlayPlaylist={handlePlayPlaylist}
                  />
                ))}
              </ScrollRow>
            </ScrollReveal>
          )}
        </>
      )}

      <ArtistDetailsModal artist={selectedArtist} onClose={() => setSelectedArtist(null)} />
    </div>
  );
};

export default FanFavorites;

