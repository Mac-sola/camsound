import React, { useEffect, useState } from 'react';
import { artistsService, followsService } from '../services/api';
import ArtistSocialLinks from './ArtistSocialLinks';
import Modal from './Modal';
import MoMoPaymentModal from './MoMoPaymentModal';

interface ArtistDetailsModalProps {
  artist: { _id: string; name: string; genre?: string; followers?: number; image?: string } | null;
  onClose: () => void;
}

const ArtistDetailsModal: React.FC<ArtistDetailsModalProps> = ({ artist, onClose }) => {
  const [details, setDetails] = useState<any>(artist);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipSuccessMsg, setTipSuccessMsg] = useState('');

  useEffect(() => {
    setDetails(artist);
    setIsFollowing(false);
    setTipSuccessMsg('');
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
    <>
      <Modal isOpen={Boolean(artist)} title={details?.name || 'Artist profile'} size="md" onClose={onClose}>
        {details && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 82, height: 82, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--text-muted)' }}>
                {details.image ? <img src={details.image} alt={details.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : details.name?.charAt(0) || 'A'}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem' }}>{details.name}</h3>
                <div style={{ color: 'var(--text-muted)', marginBottom: 10 }}>{details.genre || 'Artist'} · {(details.followers || 0).toLocaleString()} followers</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn-camsound-yellow" onClick={handleFollow} disabled={followLoading} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    {followLoading ? 'Updating...' : isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTipModalOpen(true)}
                    style={{
                      padding: '8px 14px',
                      background: 'rgba(250, 204, 21, 0.15)',
                      border: '1px solid #FACC15',
                      borderRadius: 8,
                      color: '#FACC15',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <i className="fas fa-coins" /> Tip with MoMo
                  </button>
                </div>
              </div>
            </div>

            {tipSuccessMsg && (
              <div style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.15)', color: '#34d399', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>
                {tipSuccessMsg}
              </div>
            )}

            {details.bio && <p style={{ color: 'var(--text-muted)', margin: 0 }}>{details.bio}</p>}
            <ArtistSocialLinks artist={details} />
            {loading && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading artist details...</div>}
            {!loading && !details.instagramUrl && !details.twitterUrl && !details.facebookUrl && !details.youtubeUrl && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No social links linked yet.</div>
            )}
          </div>
        )}
      </Modal>

      {/* MoMo Tip Modal */}
      {isTipModalOpen && details && (
        <MoMoPaymentModal
          isOpen={isTipModalOpen}
          onClose={() => setIsTipModalOpen(false)}
          mode="tip"
          amount={1000}
          artistName={details.name}
          artistId={details._id}
          onSuccess={(data) => {
            setTipSuccessMsg(`Successfully sent ${data.amount.toLocaleString()} FCFA tip to ${details.name} via MTN MoMo! 🎉`);
          }}
        />
      )}
    </>
  );
};

export default ArtistDetailsModal;

