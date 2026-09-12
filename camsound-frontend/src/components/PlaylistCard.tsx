import React from 'react';

export interface PlaylistItem {
  _id: string;
  name: string;
  description?: string;
  creator?: string;
  trackCount?: number;
  songs?: any[];
  duration?: string;
  coverUrl?: string;
  isUserPlaylist?: boolean;
}

interface PlaylistCardProps {
  playlist: PlaylistItem;
  onPlayPlaylist?: (playlist: PlaylistItem) => void;
  onClick?: (playlist: PlaylistItem) => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  onPlayPlaylist,
  onClick,
}) => {
  const songCount = playlist.songs?.length ?? playlist.trackCount ?? 0;

  return (
    <div
      className="playlist-card"
      onClick={() => (onClick ? onClick(playlist) : onPlayPlaylist?.(playlist))}
      role="button"
      tabIndex={0}
    >
      <div className="playlist-cover">
        {playlist.coverUrl ? (
          <img src={playlist.coverUrl} alt={playlist.name} loading="lazy" />
        ) : (
          <i className="fas fa-music" />
        )}
        <div className="playlist-overlay">
          <button
            type="button"
            className="play-playlist-btn"
            title="Play playlist"
            onClick={(e) => {
              e.stopPropagation();
              onPlayPlaylist?.(playlist);
            }}
          >
            <i className="fas fa-play" />
          </button>
        </div>
        <span className="playlist-count">
          {songCount} {songCount === 1 ? 'song' : 'songs'}
        </span>
        {playlist.isUserPlaylist && <span className="playlist-badge">Your Playlist</span>}
      </div>

      <div className="playlist-info">
        <h4 title={playlist.name}>{playlist.name}</h4>
        <p className="playlist-description">
          {playlist.description || 'Your personal playlist'}
        </p>
        <div className="playlist-meta">
          <span className="playlist-creator">
            <i className="fas fa-user" /> {playlist.creator || 'You'}
          </span>
          <span className="playlist-songs">
            <i className="fas fa-music" /> {songCount} songs
          </span>
        </div>
        <div className="playlist-footer">
          <span className="playlist-duration">
            <i className="fas fa-clock" /> {playlist.duration || '0:00'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlaylistCard;
