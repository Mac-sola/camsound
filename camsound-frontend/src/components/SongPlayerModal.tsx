import React from 'react';
import Modal from './Modal';
import { useAudio } from '../context/AudioContext';
import { useLanguage } from '../context/LanguageContext';
import { getMusicImage } from '../utils/musicImages';

const SongPlayerModal: React.FC = () => {
  const { t } = useLanguage();
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    audioError,
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

  if (!currentSong) return null;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainder}`;
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const fileUrl = currentSong.filePath || currentSong.fileUrl;
    if (!fileUrl) return;

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

        {/* Action Row with Download Button */}
        <div className="now-playing-actions-row">
          <button
            type="button"
            className="np-download-btn"
            onClick={handleDownload}
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
    </Modal>
  );
};

export default SongPlayerModal;

