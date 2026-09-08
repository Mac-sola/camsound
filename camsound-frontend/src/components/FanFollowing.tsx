import React, { useState, useEffect, useCallback } from 'react';
import { followsService, songsService } from '../services/api';
import ArtistSocialLinks from './ArtistSocialLinks';

interface Artist {
  _id: string;
  name: string;
  genre?: string;
  followers?: number;
  image?: string;
  bio?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  artistId?: { _id: string; name: string; genre?: string; followers?: number; image?: string };
}

interface Song {
  _id: string;
  title: string;
  genre?: string;
  coverArt?: string;
  artistId?: { name?: string };
}

const FanFollowing: React.FC<{ onNavClick?: (view: string) => void }> = ({ onNavClick }) => {
  const [following, setFollowing] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [unfollowing, setUnfollowing] = useState<Set<string>>(new Set());
  const [latestSongs, setLatestSongs] = useState<Song[]>([]);

  const fetchFollowing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await followsService.getFollowing();
      const raw: any[] = res.data?.data ?? res.data ?? [];
      const artists: Artist[] = raw.map(item =>
        item.artistId ? { ...item.artistId, _id: item.artistId._id ?? item._id } : item
      );
      setFollowing(artists);
      if (artists.length) {
        const response = await songsService.getSongs({ artistId: artists.map(artist => artist._id).join(','), sort: 'date', limit: 8 });
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

  useEffect(() => { fetchFollowing(); }, [fetchFollowing]);

  const handleUnfollow = async (id: string) => {
    setUnfollowing(prev => new Set(prev).add(id));
    try {
      await followsService.unfollowArtist(id);
      setFollowing(prev => prev.filter(a => a._id !== id));
    } catch {
      fetchFollowing();
    } finally {
      setUnfollowing(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  return (
    <div className="fan-following-container">
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
        <div className="fan-loading">
          <i className="fas fa-spinner fa-spin" />
          <span>Loading artists...</span>
        </div>
      ) : following.length === 0 ? (
        <div className="fan-empty-state" style={{ background: 'rgba(18, 26, 22, 0.6)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)' }}>
          <i className="fas fa-user-friends" style={{ color: '#c084fc', opacity: 0.4 }} />
          <h4 style={{ color: '#fff' }}>You're not following anyone yet</h4>
          <p>Discover Cameroonian artists and follow them to see their latest drops.</p>
          <button
            onClick={() => onNavClick?.('browse')}
            style={{
              marginTop: 16, padding: '10px 20px', background: 'var(--accent-color)',
              color: '#000', borderRadius: 20, fontWeight: 700, border: 'none', cursor: 'pointer'
            }}
          >
            <i className="fas fa-search" /> Discover Artists
          </button>
        </div>
      ) : (
        <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {following.map(artist => (
            <div
              key={artist._id}
              className="stat-card-premium"
              style={{
                padding: '24px', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14
              }}
            >
              <div className="hero-avatar-ring">
                {artist.image ? (
                  <img src={artist.image} alt={artist.name} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--accent-color)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '2rem' }}>
                    {artist.name?.charAt(0)?.toUpperCase() ?? 'A'}
                  </div>
                )}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{artist.name}</h3>
                {artist.genre && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--accent-color)', fontWeight: 600, marginTop: 4 }}>
                    <i className="fas fa-music" /> {artist.genre}
                  </div>
                )}
                {artist.followers != null && (
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                    <i className="fas fa-users" /> {artist.followers.toLocaleString()} followers
                  </div>
                )}
                <ArtistSocialLinks artist={artist} />
              </div>
              <button
                onClick={() => handleUnfollow(artist._id)}
                disabled={unfollowing.has(artist._id)}
                style={{
                  width: '100%', padding: '10px', background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)', color: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: 12, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                  transition: 'all 0.2s ease', opacity: unfollowing.has(artist._id) ? 0.6 : 1
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'; }}
              >
                {unfollowing.has(artist._id)
                  ? <><i className="fas fa-spinner fa-spin" /> Unfollowing...</>
                  : <><i className="fas fa-user-minus" /> Unfollow</>}
              </button>
            </div>
          ))}
        </div>
        <div className="section-card" style={{ marginTop: 24 }}>
          <div className="section-header"><h2>Latest from Artists</h2></div>
          {latestSongs.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No recent releases from followed artists.</p> : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{latestSongs.map(song => <div key={song._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: 'var(--bg-tertiary)', borderRadius: 10 }}><div style={{ width: 42, height: 42, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{song.coverArt ? <img src={song.coverArt} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fas fa-music" style={{ color: 'var(--accent-color)' }} />}</div><div><strong>{song.title}</strong><div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{song.artistId?.name || 'Unknown Artist'}{song.genre ? ` • ${song.genre}` : ''}</div></div></div>)}</div>}
        </div>
        </>
      )}
    </div>
  );
};

export default FanFollowing;

