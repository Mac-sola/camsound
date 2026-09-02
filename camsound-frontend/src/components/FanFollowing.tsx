import React, { useState, useEffect, useCallback } from 'react';
import { followsService } from '../services/api';
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

const FanFollowing: React.FC<{ onNavClick?: (view: string) => void }> = ({ onNavClick }) => {
  const [following, setFollowing] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [unfollowing, setUnfollowing] = useState<Set<string>>(new Set());

  const fetchFollowing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await followsService.getFollowing();
      const raw: any[] = res.data?.data ?? res.data ?? [];
      // API might return follow documents with an `artistId` sub-object
      const artists: Artist[] = raw.map(item =>
        item.artistId ? { ...item.artistId, _id: item.artistId._id ?? item._id } : item
      );
      setFollowing(artists);
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
      // Optimistic removal failed — put back
      fetchFollowing();
    } finally {
      setUnfollowing(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  return (
    <div className="fan-following-container">
      <div className="fan-section-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 className="fan-page-title">👥 Following</h2>
          <p className="fan-page-subtitle">Artists you're tracking</p>
        </div>
        <span className="fan-following-count">{following.length} artist{following.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="fan-loading">
          <i className="fas fa-spinner fa-spin" />
          <span>Loading your artists...</span>
        </div>
      ) : following.length === 0 ? (
        <div className="fan-empty-state">
          <i className="fas fa-user-friends" />
          <h4>You're not following anyone yet</h4>
          <p>Discover and follow Cameroonian artists to see them here.</p>
          <button
            className="fan-primary-btn"
            style={{ marginTop: 16 }}
            onClick={() => onNavClick?.('browse')}
          >
            <i className="fas fa-search" /> Browse Artists
          </button>
        </div>
      ) : (
        <div className="fan-following-grid">
          {following.map(artist => (
            <div key={artist._id} className="fan-following-card">
              <div className="fan-following-avatar">
                {artist.image
                  ? <img src={artist.image} alt={artist.name} />
                  : <span>{artist.name?.charAt(0)?.toUpperCase() ?? 'A'}</span>}
              </div>
              <div className="fan-following-info">
                <div className="fan-following-name">{artist.name}</div>
                {artist.genre && (
                  <div className="fan-following-genre">
                    <i className="fas fa-music" /> {artist.genre}
                  </div>
                )}
                {artist.followers != null && (
                  <div className="fan-following-followers">
                    <i className="fas fa-users" /> {artist.followers.toLocaleString()} followers
                  </div>
                )}
                {artist.bio && (
                  <div className="fan-following-bio">{artist.bio}</div>
                )}
                <ArtistSocialLinks artist={artist} />
              </div>
              <button
                className="fan-unfollow-btn"
                onClick={() => handleUnfollow(artist._id)}
                disabled={unfollowing.has(artist._id)}
              >
                {unfollowing.has(artist._id)
                  ? <><i className="fas fa-spinner fa-spin" /> Unfollowing...</>
                  : <><i className="fas fa-user-minus" /> Unfollow</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FanFollowing;
