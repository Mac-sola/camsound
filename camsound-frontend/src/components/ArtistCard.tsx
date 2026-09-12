import React from 'react';

export interface ArtistItem {
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
}

interface ArtistCardProps {
  artist: ArtistItem;
  isFollowing?: boolean;
  onFollowToggle?: (artist: ArtistItem) => void;
  onArtistClick?: (artist: ArtistItem) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({
  artist,
  isFollowing = false,
  onFollowToggle,
  onArtistClick,
}) => {
  const hasSocial = !!(
    artist.instagramUrl ||
    artist.twitterUrl ||
    artist.facebookUrl ||
    artist.youtubeUrl
  );

  return (
    <div
      className="artist-card"
      onClick={() => onArtistClick?.(artist)}
      role="button"
      tabIndex={0}
    >
      <div className="artist-avatar">
        {artist.image ? (
          <img src={artist.image} alt={artist.name} loading="lazy" />
        ) : (
          artist.name?.charAt(0)?.toUpperCase() || 'A'
        )}
      </div>

      <h4 title={artist.name}>{artist.name}</h4>
      <p>{(artist.followers || 0).toLocaleString()} followers</p>

      {onFollowToggle && (
        <button
          type="button"
          className={`follow-btn ${isFollowing ? 'following' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onFollowToggle(artist);
          }}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      )}

      {hasSocial && (
        <div className="artist-social-links">
          {artist.instagramUrl && (
            <a
              href={
                artist.instagramUrl.startsWith('http')
                  ? artist.instagramUrl
                  : `https://instagram.com/${artist.instagramUrl.replace('@', '')}`
              }
              target="_blank"
              rel="noreferrer"
              className="social-icon instagram"
              onClick={(e) => e.stopPropagation()}
              title="Instagram"
            >
              <i className="fab fa-instagram" />
            </a>
          )}
          {artist.twitterUrl && (
            <a
              href={
                artist.twitterUrl.startsWith('http')
                  ? artist.twitterUrl
                  : `https://twitter.com/${artist.twitterUrl.replace('@', '')}`
              }
              target="_blank"
              rel="noreferrer"
              className="social-icon twitter"
              onClick={(e) => e.stopPropagation()}
              title="Twitter / X"
            >
              <i className="fab fa-twitter" />
            </a>
          )}
          {artist.facebookUrl && (
            <a
              href={
                artist.facebookUrl.startsWith('http')
                  ? artist.facebookUrl
                  : `https://facebook.com/${artist.facebookUrl}`
              }
              target="_blank"
              rel="noreferrer"
              className="social-icon facebook"
              onClick={(e) => e.stopPropagation()}
              title="Facebook"
            >
              <i className="fab fa-facebook" />
            </a>
          )}
          {artist.youtubeUrl && (
            <a
              href={
                artist.youtubeUrl.startsWith('http')
                  ? artist.youtubeUrl
                  : `https://youtube.com/${artist.youtubeUrl}`
              }
              target="_blank"
              rel="noreferrer"
              className="social-icon youtube"
              onClick={(e) => e.stopPropagation()}
              title="YouTube"
            >
              <i className="fab fa-youtube" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default ArtistCard;
