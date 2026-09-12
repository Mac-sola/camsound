import React, { useState, useEffect, useCallback } from 'react';
import { followsService, songsService } from '../services/api';
import ArtistCard, { type ArtistItem } from './ArtistCard';
import ArtistDetailsModal from './ArtistDetailsModal';

interface Song {
  _id: string;
  title: string;
  genre?: string;
  coverArt?: string;
  artistId?: { name?: string };
}

export const FanFollowing: React.FC<{ onNavClick?: (view: string) => void }> = ({ onNavClick }) => {
  const [following, setFollowing] = useState<ArtistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [latestSongs, setLatestSongs] = useState<Song[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);

  const fetchFollowing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await followsService.getFollowing();
      const raw: any[] = res.data?.data ?? res.data ?? [];
      const artists: ArtistItem[] = raw.map((item) =>
        item.artistId ? { ...item.artistId, _id: item.artistId._id ?? item._id } : item
      );
      setFollowing(artists);
      if (artists.length) {
        const response = await songsService.getSongs({
          artistId: artists.map((artist) => artist._id).join(','),
          sort: 'date',
          limit: 8,
        });
        setLatestSongs(response.data?.data ?? response.data ?? []);
      } else {
        setLatestSongs([]);
      }
    } catch {
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  const handleUnfollow = async (artist: ArtistItem) => {
    try {
      await followsService.unfollowArtist(artist._id);
      setFollowing((prev) => prev.filter((a) => a._id !== artist._id));
    } catch {
      fetchFollowing();
    }
  };

  return (
    <div className="fan-following-container view-enter">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 20, color: '#c084fc', fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
            <i className="fas fa-users" /> SUBSCRIPTIONS
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Following
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
            Artists you follow on CamSound to get new release updates
          </p>
        </div>
        <div className="glass-badge" style={{ fontSize: '0.88rem', padding: '8px 16px' }}>
          {following.length} artist{following.length !== 1 ? 's' : ''} followed
        </div>
      </div>

      {loading ? (
        <div className="fan-loading" style={{ padding: 40 }}>
          <i className="fas fa-spinner fa-spin" />
          <span>Loading followed artists...</span>
        </div>
      ) : following.length === 0 ? (
        <div className="fan-empty-state" style={{ background: 'rgba(18, 26, 22, 0.6)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
          <i className="fas fa-user-friends" style={{ color: '#c084fc', opacity: 0.4 }} />
          <h4 style={{ color: '#fff' }}>You're not following anyone yet</h4>
          <p>Discover Cameroonian artists and follow them to see their latest drops.</p>
          <button
            onClick={() => onNavClick?.('browse')}
            className="btn-camsound-yellow"
            style={{ marginTop: 16 }}
          >
            <i className="fas fa-search" /> Discover Artists
          </button>
        </div>
      ) : (
        <>
          <div className="cards-grid">
            {following.map((artist) => (
              <ArtistCard
                key={artist._id}
                artist={artist}
                isFollowing={true}
                onFollowToggle={handleUnfollow}
                onArtistClick={setSelectedArtist}
              />
            ))}
          </div>

          <div className="section-card" style={{ marginTop: 32 }}>
            <div className="section-header">
              <h2>Latest from Followed Artists</h2>
            </div>
            {latestSongs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No recent releases from followed artists.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {latestSongs.map((song) => (
                  <div
                    key={song._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      background: 'var(--bg-tertiary)',
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        overflow: 'hidden',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {song.coverArt ? (
                        <img src={song.coverArt} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <i className="fas fa-music" style={{ color: 'var(--accent-color)' }} />
                      )}
                    </div>
                    <div>
                      <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{song.title}</strong>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {song.artistId?.name || 'Unknown Artist'}
                        {song.genre ? ` • ${song.genre}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <ArtistDetailsModal artist={selectedArtist} onClose={() => setSelectedArtist(null)} />
    </div>
  );
};

export default FanFollowing;
