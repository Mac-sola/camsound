import React from 'react';
import { useAudio } from '../context/AudioContext';
import { getMusicImage } from '../utils/musicImages';

export interface SongItem {
  _id: string;
  title: string;
  artist?: string;
  artistId?: { _id?: string; name?: string };
  genre?: string;
  plays?: number;
  duration?: string;
  coverArt?: string;
  filePath?: string;
  fileUrl?: string;
  coverColor?: string;
}

interface SongCardProps {
  song: SongItem;
  playlist?: SongItem[];
  isFavorite?: boolean;
  onFavoriteToggle?: (song: SongItem) => void;
  onAddToPlaylist?: (song: SongItem) => void;
  onArtistClick?: (artist: { _id?: string; name: string }) => void;
  onSongDetails?: (song: SongItem) => void;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  playlist,
  isFavorite = false,
  onFavoriteToggle,
  onAddToPlaylist,
  onArtistClick,
  onSongDetails,
}) => {
  const { playSong, currentSong, isPlaying } = useAudio();
  const isActive = currentSong?._id === song._id;

  const artistName = song.artist || song.artistId?.name || 'Unknown Artist';
  const artistId = song.artistId?._id;
  const coverUrl = song.coverArt || getMusicImage(song._id || song.title);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSong(song as any, playlist || [song]);
  };

  const handleCardClick = () => {
    if (onSongDetails) {
      onSongDetails(song);
    } else {
      playSong(song as any, playlist || [song]);
    }
  };

  return (
    <div
      className={`song-card ${isActive ? 'is-active' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
    >
      <div className="song-cover">
        {coverUrl ? (
          <img src={coverUrl} alt={song.title} loading="lazy" />
        ) : (
          <div className="song-cover-placeholder">
            <i className="fas fa-music" />
          </div>
        )}
        <div className="song-cover-overlay">
          <button
            type="button"
            className="song-cover-play-btn"
            onClick={handlePlay}
            title={isActive && isPlaying ? 'Pause' : 'Play'}
            aria-label={isActive && isPlaying ? 'Pause' : 'Play'}
          >
            <i className={`fas ${isActive && isPlaying ? 'fa-pause' : 'fa-play'}`} />
          </button>
          {onFavoriteToggle && (
            <button
              type="button"
              className={`song-cover-fav-btn ${isFavorite ? 'favorited' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle(song);
              }}
              title={isFavorite ? 'Unfavorite' : 'Favorite'}
            >
              <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`} />
            </button>
          )}
          {onAddToPlaylist && (
            <button
              type="button"
              className="song-cover-playlist-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAddToPlaylist(song);
              }}
              title="Add to playlist"
            >
              <i className="fas fa-plus" />
            </button>
          )}
        </div>
      </div>

      <div className="song-info">
        <h4 className="song-title" title={song.title}>
          {song.title}
        </h4>
        <p
          className="song-artist artist-link"
          onClick={(e) => {
            if (onArtistClick && (artistId || artistName)) {
              e.stopPropagation();
              onArtistClick({ _id: artistId, name: artistName });
            }
          }}
          title={artistName}
        >
          {artistName}
        </p>
      </div>

      <div className="song-meta">
        <span className="song-plays">{(song.plays || 0).toLocaleString()} plays</span>
        <span className="song-duration">{song.duration || '0:00'}</span>
      </div>
    </div>
  );
};

export default SongCard;

