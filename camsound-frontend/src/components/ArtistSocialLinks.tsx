import React from 'react';
import { FaFacebookF, FaInstagram, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import type { IconType } from 'react-icons';

interface ArtistSocialLinksProps {
  artist: {
    instagramUrl?: string;
    twitterUrl?: string;
    facebookUrl?: string;
    youtubeUrl?: string;
  };
}

const SOCIAL_LINKS = [
  { field: 'instagramUrl', label: 'Instagram', icon: FaInstagram, color: '#e1306c' },
  { field: 'twitterUrl', label: 'X', icon: FaXTwitter, color: '#ffffff' },
  { field: 'facebookUrl', label: 'Facebook', icon: FaFacebookF, color: '#4267b2' },
  { field: 'youtubeUrl', label: 'YouTube', icon: FaYoutube, color: '#ff0000' },
] as const;

const ArtistSocialLinks: React.FC<ArtistSocialLinksProps> = ({ artist }) => {
  const links = SOCIAL_LINKS
    .map(link => ({ ...link, url: artist[link.field] }))
    .filter(link => link.url?.trim());

  if (links.length === 0) return null;

  return (
    <div className="artist-social-links" aria-label="Artist social links">
      {links.map(link => (
        (() => {
          const Icon = link.icon as IconType;
          return (
        <a
          key={link.label}
          href={link.url}
          target={/^https?:\/\//i.test(link.url || '') ? '_blank' : undefined}
          rel={/^https?:\/\//i.test(link.url || '') ? 'noopener noreferrer' : undefined}
          aria-label={`Visit ${link.label}`}
          title={`Visit ${link.label}`}
          onClick={event => event.stopPropagation()}
        >
          <Icon aria-hidden="true" style={{ color: link.color }} />
        </a>
          );
        })()
      ))}
    </div>
  );
};

export default ArtistSocialLinks;
