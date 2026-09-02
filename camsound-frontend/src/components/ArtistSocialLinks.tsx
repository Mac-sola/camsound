import React from 'react';

interface ArtistSocialLinksProps {
  artist: {
    instagramUrl?: string;
    twitterUrl?: string;
    facebookUrl?: string;
    youtubeUrl?: string;
  };
}

const SOCIAL_LINKS = [
  { field: 'instagramUrl', label: 'Instagram', icon: 'fa-instagram', color: '#e1306c' },
  { field: 'twitterUrl', label: 'Twitter', icon: 'fa-twitter', color: '#1da1f2' },
  { field: 'facebookUrl', label: 'Facebook', icon: 'fa-facebook', color: '#4267b2' },
  { field: 'youtubeUrl', label: 'YouTube', icon: 'fa-youtube', color: '#ff0000' },
] as const;

const ArtistSocialLinks: React.FC<ArtistSocialLinksProps> = ({ artist }) => {
  const links = SOCIAL_LINKS
    .map(link => ({ ...link, url: artist[link.field] }))
    .filter(link => link.url?.trim());

  if (links.length === 0) return null;

  return (
    <div className="artist-social-links" aria-label="Artist social links">
      {links.map(link => (
        <a
          key={link.label}
          href={link.url}
          target={/^https?:\/\//i.test(link.url || '') ? '_blank' : undefined}
          rel={/^https?:\/\//i.test(link.url || '') ? 'noopener noreferrer' : undefined}
          aria-label={`Visit ${link.label}`}
          title={`Visit ${link.label}`}
          onClick={event => event.stopPropagation()}
        >
          <i className={`fab ${link.icon}`} style={{ color: link.color }} />
        </a>
      ))}
    </div>
  );
};

export default ArtistSocialLinks;
