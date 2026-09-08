import React from 'react';
import Modal from './Modal';
import { useAudio } from '../context/AudioContext';

const SongPlayerModal: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    audioError,
    togglePlay,
    seek,
    skipForward,
    skipBackward,
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
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainder}`;
  };

  return (
    <Modal isOpen={isPlayerOpen} title="Now Playing" size="lg" onClose={closePlayer}>
      <div className="song-player-modal">
        <div className="song-player-artwork">
          {currentSong.coverArt ? (
            <img src={currentSong.coverArt} alt={currentSong.title} />
          ) : (
            <i className="fas fa-music" aria-hidden="true" />
          )}
          {isPlaying && <span className="song-player-live-badge"><i className="fas fa-volume-up" /> Playing</span>}
        </div>

        <div className="song-player-details">
          <div className="song-player-eyebrow">CamSound session</div>
          <h2>{currentSong.title}</h2>
          <p>{currentSong.artistId?.name || 'Unknown artist'}</p>
          <div className="song-player-tags">
            {currentSong.genre && <span>{currentSong.genre}</span>}
            {currentSong.plays != null && <span><i className="fas fa-headphones" /> {currentSong.plays.toLocaleString()} plays</span>}
            {currentSong.duration && <span><i className="fas fa-clock" /> {currentSong.duration}</span>}
          </div>

          <div className="song-player-timeline">
            <span>{formatTime(progress)}</span>
            <input aria-label="Seek within track" type="range" min="0" max="100" value={duration ? (progress / duration) * 100 : 0} onChange={event => seek(Number(event.target.value))} />
            <span>{formatTime(duration)}</span>
          </div>

          <div className="song-player-controls">
            <button type="button" onClick={previousSong} title="Previous track" aria-label="Previous track"><i className="fas fa-step-backward" /></button>
            <button type="button" onClick={skipBackward} title="Back 15 seconds" aria-label="Back 15 seconds"><i className="fas fa-rotate-left" /></button>
            <button type="button" className="song-player-main-control" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'} aria-label={isPlaying ? 'Pause' : 'Play'}><i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`} /></button>
            <button type="button" onClick={skipForward} title="Forward 15 seconds" aria-label="Forward 15 seconds"><i className="fas fa-rotate-right" /></button>
            <button type="button" onClick={nextSong} title="Next track" aria-label="Next track"><i className="fas fa-step-forward" /></button>
          </div>

          <div className="song-player-footer">
            <button type="button" className="song-player-volume" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'} title={isMuted ? 'Unmute' : 'Mute'}>
              <i className={`fas ${isMuted || volume === 0 ? 'fa-volume-mute' : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'}`} />
            </button>
            <input aria-label="Volume" type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={event => setVolume(Number(event.target.value))} />
            <a className="song-player-download" href={currentSong.filePath || currentSong.fileUrl || '#'} download title="Download track">
              <i className="fas fa-download" /> Download
            </a>
          </div>
          {audioError && <div className="song-player-error" role="alert"><i className="fas fa-circle-exclamation" /> {audioError}</div>}
        </div>
      </div>
    </Modal>
  );
};

export default SongPlayerModal;
