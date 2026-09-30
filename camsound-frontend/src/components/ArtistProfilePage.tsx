import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { artistsService, followsService } from '../services/api';
import { useAudio } from '../context/AudioContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getMusicImage } from '../utils/musicImages';
import MoMoPaymentModal from './MoMoPaymentModal';

interface Song {
  _id: string;
  title: string;
  filePath?: string;
  fileUrl?: string;
  coverArt?: string;
  genre?: string;
  plays?: number;
  likes?: number;
  duration?: string;
  artistId?: { _id?: string; name?: string };
}

interface ArtistDetail {
  _id: string;
  name: string;
  genre?: string;
  bio?: string;
  image?: string;
  location?: string;
  followers?: number;
  songsCount?: number;
  status?: string;
  verification?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  website?: string;
  songs?: Song[];
}

interface ArtistProfilePageProps {
  artistId: string;
}

const ArtistProfilePage: React.FC<ArtistProfilePageProps> = ({ artistId }) => {
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [tipSuccessMsg, setTipSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'songs' | 'about'>('songs');

  const { playSong, currentSong, isPlaying } = useAudio();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const fetchArtist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await artistsService.getArtist(artistId);
      if (res.data?.success) {
        setArtist(res.data.data);
      } else {
        setError(t('common.not_found', 'Artist not found.'));
      }
    } catch {
      setError(t('common.error_load', 'Failed to load artist. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [artistId, t]);

  useEffect(() => {
    fetchArtist();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchArtist]);

  const handleFollow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!artist?._id) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await followsService.unfollowArtist(artist._id);
        setIsFollowing(false);
      } else {
        await followsService.followArtist(artist._id);
        setIsFollowing(true);
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePlaySong = (song: Song) => {
    if (!artist?.songs) return;
    playSong(song as any, artist.songs as any[]);
  };

  const handlePlayAll = () => {
    if (!artist?.songs?.length) return;
    playSong(artist.songs[0] as any, artist.songs as any[]);
  };

  const isVerified =
    artist?.verification === 'approved' || artist?.status === 'verified';

  const hasSocial =
    artist?.instagramUrl ||
    artist?.twitterUrl ||
    artist?.facebookUrl ||
    artist?.youtubeUrl ||
    artist?.website;

  const totalPlays = artist?.songs?.reduce((sum, s) => sum + (s.plays || 0), 0) ?? 0;

  const socialUrl = (raw: string, platform: string) => {
    if (!raw) return '#';
    if (raw.startsWith('http')) return raw;
    const bases: Record<string, string> = {
      instagram: 'https://instagram.com/',
      twitter: 'https://twitter.com/',
      facebook: 'https://facebook.com/',
      youtube: 'https://youtube.com/',
    };
    return (bases[platform] || '') + raw.replace('@', '');
  };

  if (loading) {
    return (
      <div className="artist-profile-loading">
        <div className="artist-profile-spinner">
          <i className="fas fa-spinner fa-spin" />
        </div>
        <p>Loading artist profile…</p>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="artist-profile-error">
        <i className="fas fa-exclamation-circle" />
        <h3>{error || 'Artist not found'}</h3>
        <button className="btn-camsound-yellow" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="artist-profile-page">
      {/* ── Hero ── */}
      <div className="artist-profile-hero">
        {/* Blurred background */}
        <div
          className="artist-profile-hero-bg"
          style={{
            backgroundImage: artist.image
              ? `url('${artist.image}')`
              : `linear-gradient(135deg, var(--primary-color) 0%, var(--bg-secondary) 100%)`,
          }}
        />
        <div className="artist-profile-hero-overlay" />

        {/* Back button */}
        <button
          className="artist-profile-back-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <i className="fas fa-arrow-left" />
          <span>Back</span>
        </button>

        {/* Hero content */}
        <div className="artist-profile-hero-content">
          {/* Avatar */}
          <div className="artist-profile-avatar-wrap">
            <div className="artist-profile-avatar">
              {artist.image ? (
                <img src={artist.image} alt={artist.name} />
              ) : (
                <span>{artist.name?.charAt(0)?.toUpperCase() || 'A'}</span>
              )}
            </div>
            {isVerified && (
              <div className="artist-profile-verified-badge" title="Verified Artist">
                <i className="fas fa-check" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="artist-profile-hero-info">
            <div className="artist-profile-meta-row">
              {isVerified && (
                <span className="artist-profile-verified-label">
                  <i className="fas fa-check-circle" /> Verified Artist
                </span>
              )}
              {artist.genre && (
                <span className="artist-profile-genre-pill">{artist.genre}</span>
              )}
              {artist.location && (
                <span className="artist-profile-location">
                  <i className="fas fa-map-marker-alt" /> {artist.location}
                </span>
              )}
            </div>

            <h1 className="artist-profile-name">{artist.name}</h1>

            {/* Stats row */}
            <div className="artist-profile-stats-row">
              <div className="artist-profile-stat">
                <span className="artist-profile-stat-value">
                  {(artist.followers || 0).toLocaleString()}
                </span>
                <span className="artist-profile-stat-label">{t('profile.followers', 'Followers')}</span>
              </div>
              <div className="artist-profile-stat-divider" />
              <div className="artist-profile-stat">
                <span className="artist-profile-stat-value">
                  {(artist.songs?.length ?? artist.songsCount ?? 0).toLocaleString()}
                </span>
                <span className="artist-profile-stat-label">{t('profile.tracks', 'Songs')}</span>
              </div>
              <div className="artist-profile-stat-divider" />
              <div className="artist-profile-stat">
                <span className="artist-profile-stat-value">
                  {totalPlays.toLocaleString()}
                </span>
                <span className="artist-profile-stat-label">{t('fan.total_plays', 'Total Plays')}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="artist-profile-actions">
              {(artist.songs?.length ?? 0) > 0 && (
                <button
                  className="btn-camsound-yellow artist-profile-play-all"
                  onClick={handlePlayAll}
                >
                  <i className="fas fa-play" /> {t('profile.play_all', 'Play All')}
                </button>
              )}
              <button
                className={`artist-profile-follow-btn ${isFollowing ? 'following' : ''}`}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <i className="fas fa-spinner fa-spin" />
                ) : isFollowing ? (
                  <><i className="fas fa-user-check" /> {t('profile.unfollow', 'Following')}</>
                ) : (
                  <><i className="fas fa-user-plus" /> {t('profile.follow', 'Follow')}</>
                )}
              </button>
              <button
                className="artist-profile-tip-btn"
                onClick={() => {
                  if (!user) { navigate('/login'); return; }
                  setIsTipModalOpen(true);
                }}
                title={t('profile.tip_artist', 'Tip this artist via MTN MoMo')}
              >
                <i className="fas fa-coins" /> {t('profile.tip_artist', 'Tip')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="artist-profile-tabs">
        <div className="container">
          <button
            className={`artist-profile-tab ${activeTab === 'songs' ? 'active' : ''}`}
            onClick={() => setActiveTab('songs')}
          >
            <i className="fas fa-music" /> {t('profile.tracks', 'Songs')}
            {(artist.songs?.length ?? 0) > 0 && (
              <span className="artist-profile-tab-count">{artist.songs!.length}</span>
            )}
          </button>
          <button
            className={`artist-profile-tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <i className="fas fa-info-circle" /> {t('profile.about', 'About')}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container artist-profile-content">

        {/* ── Songs Tab ── */}
        {activeTab === 'songs' && (
          <div className="artist-discography">
            {tipSuccessMsg && (
              <div className="artist-profile-tip-success">
                <i className="fas fa-check-circle" /> {tipSuccessMsg}
              </div>
            )}

            {(!artist.songs || artist.songs.length === 0) ? (
              <div className="artist-profile-empty">
                <i className="fas fa-music" />
                <h3>{t('profile.no_tracks', 'No songs yet')}</h3>
                <p>{t('artist.no_uploads', "This artist hasn't published any songs yet. Follow them to get notified!")}</p>
              </div>
            ) : (
              <>
                <div className="artist-discography-header">
                  <span>#</span>
                  <span>{t('admin.title', 'Title')}</span>
                  <span className="hide-sm">{t('admin.genre', 'Genre')}</span>
                  <span className="hide-sm"><i className="fas fa-play" /></span>
                  <span><i className="fas fa-clock" /></span>
                </div>
                <div className="artist-song-list">
                  {artist.songs.map((song, idx) => {
                    const isActive = currentSong?._id === song._id;
                    const coverUrl = song.coverArt || getMusicImage(song._id || song.title);
                    return (
                      <div
                        key={song._id}
                        className={`artist-song-row ${isActive ? 'active' : ''}`}
                        onClick={() => handlePlaySong(song)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handlePlaySong(song)}
                      >
                        {/* Track number / play indicator */}
                        <div className="artist-song-row-num">
                          {isActive && isPlaying ? (
                            <div className="artist-song-playing-bars">
                              <span /><span /><span />
                            </div>
                          ) : (
                            <span className="track-num">{idx + 1}</span>
                          )}
                          <i className="fas fa-play play-on-hover" />
                        </div>

                        {/* Cover + title */}
                        <div className="artist-song-row-title">
                          <div className="artist-song-cover">
                            <img
                              src={coverUrl}
                              alt={song.title}
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div>
                            <div className="artist-song-name">{song.title}</div>
                          </div>
                        </div>

                        {/* Genre */}
                        <div className="artist-song-row-genre hide-sm">
                          {song.genre ? (
                            <span className="artist-song-genre-tag">{song.genre}</span>
                          ) : (
                            <span style={{ color: 'var(--text-subtle)' }}>—</span>
                          )}
                        </div>

                        {/* Plays */}
                        <div className="artist-song-row-plays hide-sm">
                          {(song.plays || 0).toLocaleString()}
                        </div>

                        {/* Duration */}
                        <div className="artist-song-row-duration">
                          {song.duration || '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── About Tab ── */}
        {activeTab === 'about' && (
          <div className="artist-about-section">
            {artist.bio ? (
              <div className="artist-about-bio">
                <h3><i className="fas fa-align-left" /> {t('profile.bio', 'Biography')}</h3>
                <p>{artist.bio}</p>
              </div>
            ) : (
              <div className="artist-profile-empty" style={{ marginTop: 0 }}>
                <i className="fas fa-user" />
                <h3>{t('profile.no_bio', 'No bio yet')}</h3>
                <p>{t('profile.no_bio_desc', "This artist hasn't added a biography.")}</p>
              </div>
            )}

            {/* Details */}
            <div className="artist-about-details">
              {artist.genre && (
                <div className="artist-about-detail-row">
                  <span className="artist-about-detail-label">
                    <i className="fas fa-music" /> {t('admin.genre', 'Genre')}
                  </span>
                  <span>{artist.genre}</span>
                </div>
              )}
              {artist.location && (
                <div className="artist-about-detail-row">
                  <span className="artist-about-detail-label">
                    <i className="fas fa-map-marker-alt" /> {t('profile.location', 'Location')}
                  </span>
                  <span>{artist.location}</span>
                </div>
              )}
              {isVerified && (
                <div className="artist-about-detail-row">
                  <span className="artist-about-detail-label">
                    <i className="fas fa-check-circle" /> {t('admin.status', 'Status')}
                  </span>
                  <span style={{ color: '#34d399' }}>{t('profile.verified', 'Verified Artist')}</span>
                </div>
              )}
            </div>

            {/* Social links */}
            {hasSocial && (
              <div className="artist-about-social">
                <h3><i className="fas fa-share-alt" /> {t('artist.social_links', 'Socials')}</h3>
                <div className="artist-social-pills">
                  {artist.instagramUrl && (
                    <a
                      href={socialUrl(artist.instagramUrl, 'instagram')}
                      target="_blank"
                      rel="noreferrer"
                      className="artist-social-pill instagram"
                    >
                      <i className="fab fa-instagram" /> Instagram
                    </a>
                  )}
                  {artist.twitterUrl && (
                    <a
                      href={socialUrl(artist.twitterUrl, 'twitter')}
                      target="_blank"
                      rel="noreferrer"
                      className="artist-social-pill twitter"
                    >
                      <i className="fab fa-twitter" /> Twitter / X
                    </a>
                  )}
                  {artist.facebookUrl && (
                    <a
                      href={socialUrl(artist.facebookUrl, 'facebook')}
                      target="_blank"
                      rel="noreferrer"
                      className="artist-social-pill facebook"
                    >
                      <i className="fab fa-facebook-f" /> Facebook
                    </a>
                  )}
                  {artist.youtubeUrl && (
                    <a
                      href={socialUrl(artist.youtubeUrl, 'youtube')}
                      target="_blank"
                      rel="noreferrer"
                      className="artist-social-pill youtube"
                    >
                      <i className="fab fa-youtube" /> YouTube
                    </a>
                  )}
                  {artist.website && (
                    <a
                      href={artist.website.startsWith('http') ? artist.website : `https://${artist.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="artist-social-pill website"
                    >
                      <i className="fas fa-globe" /> Website
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MoMo Tip Modal */}
      {isTipModalOpen && artist && (
        <MoMoPaymentModal
          isOpen={isTipModalOpen}
          onClose={() => setIsTipModalOpen(false)}
          mode="tip"
          amount={1000}
          artistName={artist.name}
          artistId={artist._id}
          onSuccess={(data) => {
            setTipSuccessMsg(
              `🎉 Successfully sent ${data.amount.toLocaleString()} FCFA tip to ${artist.name} via MTN MoMo!`
            );
            setIsTipModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ArtistProfilePage;
