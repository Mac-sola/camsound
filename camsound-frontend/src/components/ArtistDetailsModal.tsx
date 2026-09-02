import React, { useEffect, useState } from 'react';
import { artistsService, followsService } from '../services/api';
import ArtistSocialLinks from './ArtistSocialLinks';
import Modal from './Modal';

interface ArtistDetailsModalProps {
  artist: { _id: string; name: string; genre?: string; followers?: number; image?: string } | null;
  onClose: () => void;
}

const ArtistDetailsModal: React.FC<ArtistDetailsModalProps> = ({ artist, onClose }) => {
  const [details, setDetails] = useState<any>(artist);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    setDetails(artist);
    setIsFollowing(false);
    if (!artist) return;

    let cancelled = false;
    setLoading(true);
    artistsService.getArtist(artist._id)
      .then(response => {
        if (!cancelled && response.data?.success) setDetails(response.data.data);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [artist]);

  const handleFollow = async () => {
    if (!details?._id) return;
    setFollowLoading(true);
    try {
      if (isFollowing) await followsService.unfollowArtist(details._id);
      else await followsService.followArtist(details._id);
      setIsFollowing(value => !value);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <Modal isOpen={Boolean(artist)} title={details?.name || 'Artist profile'} size="md" onClose={onClose}>
      {details && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 82, height: 82, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--text-muted)' }}>
              {details.image ? <img src={details.image} alt={details.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : details.name?.charAt(0) || 'A'}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem' }}>{details.name}</h3>
              <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>{details.genre || 'Artist'} · {(details.followers || 0).toLocaleString()} followers</div>
              <button className="btn-camsound-yellow" onClick={handleFollow} disabled={followLoading}>
                {followLoading ? 'Updating...' : isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>
          {details.bio && <p style={{ color: 'var(--text-muted)', margin: 0 }}>{details.bio}</p>}
          <ArtistSocialLinks artist={details} />
          {loading && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading artist details...</div>}
          {!loading && !details.instagramUrl && !details.twitterUrl && !details.facebookUrl && !details.youtubeUrl && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No social links linked yet.</div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ArtistDetailsModal;
