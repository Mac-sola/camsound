import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { favoritesService } from '../services/api';
import { getMusicImage } from '../utils/musicImages';
import MoMoPaymentModal from './MoMoPaymentModal';

const SongPlayerModal: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const { user, updateUser } = useAuth();
  const [isFav, setIsFav] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);

  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    audioError,
    isPreviewMode,
    previewEnded,
    resetPreviewModal,
    togglePlay,
    seek,
    nextSong,
    previousSong,
    isPlayerOpen,
    closePlayer,
    volume,
    setVolume,
    isMuted,
    toggleMute,
  } = useAudio();

  // Automatically trigger upgrade dialog when 30s preview finishes
  useEffect(() => {
    if (previewEnded) {
      setIsUpgradeModalOpen(true);
    }
  }, [previewEnded]);

  useEffect(() => {
    if (!currentSong?._id) return;
    favoritesService.getFavorites().then(res => {
      const favList: any[] = res.data?.data ?? res.data ?? [];
      const favSet = new Set(favList.map((f: any) => f._id || f.id || f.songId?._id));
      setIsFav(favSet.has(currentSong._id));
    }).catch(() => {});
  }, [currentSong?._id]);

  if (!currentSong) return null;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainder}`;
  };

  const handleFavoriteToggle = async () => {
    if (!currentSong?._id) return;
    try {
      if (isFav) {
        await favoritesService.unlikeSong(currentSong._id);
        setIsFav(false);
        toast.info(`Removed "${currentSong.title}" from favorites`);
      } else {
        await favoritesService.likeSong(currentSong._id);
        setIsFav(true);
        toast.music(`Added "${currentSong.title}" to favorites!`);
      }
    } catch {
      toast.error('Unable to update favorite status');
    }
  };

  const handleShare = () => {
    const text = `Listening to "${currentSong.title}" on CamSound! 🎵`;
    navigator.clipboard?.writeText?.(text);
    toast.success('Track info copied to clipboard!');
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const fileUrl = currentSong.filePath || currentSong.fileUrl;
    if (!fileUrl) {
      toast.warning('Audio file is not available for download');
      return;
    }
    toast.info(`Starting download for "${currentSong.title}"...`);

    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${currentSong.title || 'track'}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `${currentSong.title || 'track'}.mp3`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const artistName = currentSong.artistId?.name || (currentSong as any).artist || t('player.unknown_artist', 'Unknown Artist');
  const coverUrl = currentSong.coverArt || getMusicImage(currentSong._id || currentSong.title);

  return (
    <Modal isOpen={isPlayerOpen} title={t('player.now_playing', 'Now Playing')} size="md" onClose={closePlayer}>
      <div className="now-playing-modal-body">
        {/* Cover Art */}
        <div className="now-playing-cover">
          {coverUrl ? (
            <img src={coverUrl} alt={currentSong.title} />
          ) : (
            <div className="now-playing-placeholder">
              <i className="fas fa-music" />
            </div>
          )}
        </div>

        {/* Track Title & Artist */}
        <div className="now-playing-info">
          <h3 className="now-playing-title">{currentSong.title}</h3>
          <div className="now-playing-artist">{artistName}</div>
        </div>

        {/* Timestamps & Progress Bar */}
        <div className="now-playing-timeline-container">
          <div className="now-playing-timestamps">
            <span className="time-current">{formatTime(progress)}</span>
            <span className="time-total">{formatTime(duration)}</span>
          </div>
          <div className="now-playing-progressbar-wrapper">
            <input
              type="range"
              className="now-playing-range"
              min="0"
              max="100"
              step="0.1"
              value={progressPercent}
              onChange={(e) => seek(Number(e.target.value))}
              style={{
                background: `linear-gradient(to right, #f97316 ${progressPercent}%, rgba(255, 255, 255, 0.2) ${progressPercent}%)`,
              }}
              aria-label="Track progress"
            />
          </div>
        </div>

        {/* Playback Controls (Prev, Play/Pause, Next) */}
        <div className="now-playing-controls">
          <button
            type="button"
            className="np-btn-control np-btn-prev"
            onClick={previousSong}
            title={t('player.prev_track', 'Previous track')}
            aria-label={t('player.prev_track', 'Previous track')}
          >
            <i className="fas fa-step-backward" />
          </button>

          <button
            type="button"
            className="np-btn-play"
            onClick={togglePlay}
            title={isPlaying ? t('player.pause', 'Pause') : t('player.play', 'Play')}
            aria-label={isPlaying ? t('player.pause', 'Pause') : t('player.play', 'Play')}
          >
            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`} />
          </button>

          <button
            type="button"
            className="np-btn-control np-btn-next"
            onClick={nextSong}
            title={t('player.next_track', 'Next track')}
            aria-label={t('player.next_track', 'Next track')}
          >
            <i className="fas fa-step-forward" />
          </button>
        </div>

        {/* Volume Row */}
        <div className="now-playing-volume-row">
          <button
            type="button"
            className="np-volume-btn"
            onClick={toggleMute}
            aria-label={isMuted ? t('player.unmute', 'Unmute') : t('player.mute', 'Mute')}
            title={isMuted ? t('player.unmute', 'Unmute') : t('player.mute', 'Mute')}
          >
            <i
              className={`fas ${
                isMuted || volume === 0
                  ? 'fa-volume-mute'
                  : volume < 0.5
                  ? 'fa-volume-down'
                  : 'fa-volume-up'
              }`}
            />
          </button>
          <input
            type="range"
            className="now-playing-volume-slider"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{
              background: `linear-gradient(to right, #3b82f6 ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.2) ${(isMuted ? 0 : volume) * 100}%)`,
            }}
            aria-label={t('player.volume', 'Volume slider')}
          />
        </div>

        {/* Preview Alert Banner */}
        {isPreviewMode && (
          <div
            style={{
              marginTop: 12,
              marginBottom: 8,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.15))',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600 }}>
              <i className="fas fa-crown" />
              <span>{previewEnded ? '30s Preview Finished' : '30s Free Preview Mode'}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(true)}
              style={{
                background: '#f59e0b',
                color: '#000',
                border: 'none',
                padding: '5px 12px',
                borderRadius: 14,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <span>Unlock Full Track</span>
              <i className="fas fa-arrow-right" style={{ fontSize: '0.7rem' }} />
            </button>
          </div>
        )}

        {/* Action Row with Favorite, Tip, Share, and Download Buttons */}
        <div className="now-playing-actions-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <button
            type="button"
            className={`np-action-btn ${isFav ? 'favorited' : ''}`}
            onClick={handleFavoriteToggle}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: isFav ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${isFav ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`,
              color: isFav ? '#ef4444' : '#fff', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
              transition: 'all 0.2s ease'
            }}
            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <i className={`${isFav ? 'fas' : 'far'} fa-heart`} /> {isFav ? 'Favorited' : 'Favorite'}
          </button>

          {/* Tip Artist Button */}
          <button
            type="button"
            className="np-action-btn"
            onClick={() => setIsTipModalOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.2))',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
              transition: 'all 0.2s ease'
            }}
            title="Tip this artist via MoMo"
          >
            <i className="fas fa-hand-holding-dollar" /> Tip Artist
          </button>

          <button
            type="button"
            className="np-action-btn"
            onClick={handleShare}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
              transition: 'all 0.2s ease'
            }}
            title="Share track"
          >
            <i className="fas fa-share-nodes" /> Share
          </button>

          <button
            type="button"
            className="np-download-btn"
            onClick={handleDownload}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: 'rgba(250, 204, 21, 0.15)', border: '1px solid rgba(250, 204, 21, 0.3)',
              color: 'var(--accent-color)', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
              transition: 'all 0.2s ease'
            }}
            title={t('player.download', 'Download track')}
          >
            <i className="fas fa-download" /> {t('player.download', 'Download')}
          </button>
        </div>

        {audioError && (
          <div className="now-playing-error" role="alert">
            <i className="fas fa-circle-exclamation" /> {audioError}
          </div>
        )}
      </div>

      {/* MoMo Upgrade Modal */}
      <MoMoPaymentModal
        isOpen={isUpgradeModalOpen}
        onClose={() => {
          setIsUpgradeModalOpen(false);
          resetPreviewModal();
        }}
        mode="subscription"
        amount={2500}
        planName="Pro Monthly"
        planPeriod="/month"
        onSuccess={(_data) => {
          setIsUpgradeModalOpen(false);
          resetPreviewModal();
          toast.success('👑 Welcome to CamSound Premium! All songs unlocked.');
          if (user) {
            updateUser({ ...user, subscriptionStatus: 'premium' });
          }
        }}
      />

      {/* MoMo Tip Artist Modal */}
      <MoMoPaymentModal
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        mode="tip"
        amount={1000}
        artistName={artistName}
        artistId={currentSong.artistId?._id}
        onSuccess={(data) => {
          setIsTipModalOpen(false);
          toast.success(`🎉 You sent ${data.amount} XAF tip to ${artistName}!`);
        }}
      />
    </Modal>
  );
};

export default SongPlayerModal;

