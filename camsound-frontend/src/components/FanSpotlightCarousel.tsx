import React, { useState, useEffect, useCallback } from 'react';
import { useAudio } from '../context/AudioContext';
import type { SongItem } from './SongCard';
import type { ArtistItem } from './ArtistCard';

interface FanSpotlightCarouselProps {
  songs: SongItem[];
  artists: ArtistItem[];
}

const PROMO_SLIDES = [
  {
    type: 'promo' as const,
    badge: 'NEW THIS WEEK',
    badgeIcon: 'fa-compact-disc',
    title: 'Fresh Drops Are In',
    subtitle: 'Makossa · Bikutsi · Afrobeat',
    desc: 'Your weekly batch of the freshest Cameroonian tracks is ready. Hit play and discover what\'s new.',
    image: '/music/aditya-chinchure-ZhQCZjr9fHo-unsplash.jpg',
    accentColor: '#FACC15',
  },
  {
    type: 'promo' as const,
    badge: 'TRENDING NOW',
    badgeIcon: 'fa-fire',
    title: "What's Burning in Cameroon",
    subtitle: 'Charts · Top 100 · Live Picks',
    desc: 'The most-played, most-loved tracks across every region. Stream what everybody is talking about.',
    image: '/music/danny-howe-bn-D2bCvpik-unsplash.jpg',
    accentColor: '#f97316',
  },
  {
    type: 'promo' as const,
    badge: 'ARTIST SPOTLIGHT',
    badgeIcon: 'fa-sparkles',
    title: 'Rising Stars to Watch',
    subtitle: 'Authentic Sound · Raw Talent',
    desc: 'We spotlight independent Cameroonian artists making waves. Support local, stream direct.',
    image: '/music/charismatic-modern-young-attractive-africanamerican-girl-with-afro-haircut-listening-music-headph.jpg',
    accentColor: '#a855f7',
  },
];

type Slide = {
  type: 'song' | 'artist' | 'promo';
  badge: string;
  badgeIcon: string;
  title: string;
  subtitle: string;
  desc: string;
  image: string;
  accentColor: string;
  song?: SongItem;
  artist?: ArtistItem;
};

const COVERS = [
  '/music/aditya-chinchure-ZhQCZjr9fHo-unsplash.jpg',
  '/music/danny-howe-bn-D2bCvpik-unsplash.jpg',
  '/music/israel-palacio-Y20JJ_ddy9M-unsplash.jpg',
];
const SONG_ACCENTS = ['#FACC15', '#f97316', '#10b981'];
const SONG_BADGES = ['FEATURED TRACK', 'TRENDING NOW', 'NEW RELEASE'];
const SONG_ICONS = ['fa-star', 'fa-fire', 'fa-compact-disc'];

const FanSpotlightCarousel: React.FC<FanSpotlightCarouselProps> = ({ songs, artists }) => {
  const { playSong } = useAudio();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const slides: Slide[] = React.useMemo(() => {
    const result: Slide[] = [];

    songs.slice(0, 3).forEach((song, i) => {
      result.push({
        type: 'song',
        badge: SONG_BADGES[i],
        badgeIcon: SONG_ICONS[i],
        title: song.title,
        subtitle: `${song.artist ?? 'Unknown Artist'} · ${song.genre ?? 'Music'}`,
        desc: `${(song.plays ?? 0).toLocaleString()} plays · Tap play to stream this track`,
        image: song.coverArt ?? COVERS[i % COVERS.length],
        accentColor: SONG_ACCENTS[i],
        song,
      });
    });

    if (artists.length > 0) {
      const a = artists[0];
      result.push({
        type: 'artist',
        badge: 'FEATURED ARTIST',
        badgeIcon: 'fa-user',
        title: a.name,
        subtitle: `${a.genre ?? 'Cameroonian Music'} · ${a.followers ?? 0} fans`,
        desc: a.bio ?? 'Discover this incredible Cameroonian talent and explore their full discography.',
        image: a.image || COVERS[0],
        accentColor: '#a855f7',
        artist: a,
      });
    }

    return result.length > 0 ? result : PROMO_SLIDES;
  }, [songs, artists]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((p) => (p + 1) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((p) => (p - 1 + slides.length) % slides.length);
    setProgress(0);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused) return;
    const step = 50;
    const inc = (step / 5500) * 100;
    const t = setInterval(() => {
      setProgress((old) => {
        if (old >= 100) { nextSlide(); return 0; }
        return old + inc;
      });
    }, step);
    return () => clearInterval(t);
  }, [isPaused, nextSlide]);

  const current = slides[currentIndex];

  return (
    <div
      className="fan-spotlight-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Progress bar */}
      <div className="fsc-progress-bar">
        <div className="fsc-progress-fill" style={{ width: `${progress}%`, background: current.accentColor }} />
      </div>

      {slides.map((slide, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={index}
            className={`fsc-slide${isActive ? ' fsc-slide--active' : ''}`}
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(10,24,18,0.97) 0%, rgba(10,24,18,0.82) 45%, rgba(10,24,18,0.5) 100%), url('${slide.image}')`,
            }}
          >
            <div className="fsc-slide-inner">
              {/* Left content */}
              <div className="fsc-content">
                <div
                  className="fsc-badge"
                  style={{
                    borderColor: `${slide.accentColor}50`,
                    color: slide.accentColor,
                    background: `${slide.accentColor}18`,
                  }}
                >
                  <i className={`fas ${slide.badgeIcon}`} />
                  <span>{slide.badge}</span>
                </div>

                <h2 className="fsc-title">{slide.title}</h2>
                <p className="fsc-subtitle">{slide.subtitle}</p>
                <p className="fsc-desc">{slide.desc}</p>

                <div className="fsc-actions">
                  {slide.type === 'song' && slide.song ? (
                    <button
                      className="fsc-btn-play"
                      style={{ background: slide.accentColor }}
                      onClick={() => playSong(slide.song!, songs)}
                    >
                      <i className="fas fa-play" /> Play Now
                    </button>
                  ) : (
                    <button className="fsc-btn-play" style={{ background: slide.accentColor }}>
                      <i className="fas fa-headphones" /> Explore
                    </button>
                  )}

                  <div className="fsc-equaliser">
                    {[1, 2, 3, 4, 5].map((b) => (
                      <span key={b} className={`fsc-bar fsc-bar-${b}`} style={{ background: slide.accentColor }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right artwork */}
              <div className="fsc-artwork">
                <div className="fsc-artwork-ring" style={{ borderColor: `${slide.accentColor}55` }}>
                  <div className="fsc-artwork-img" style={{ backgroundImage: `url('${slide.image}')` }}>
                    {slide.type === 'song' && slide.song && (
                      <button
                        className="fsc-artwork-play-btn"
                        onClick={() => playSong(slide.song!, songs)}
                        aria-label="Play track"
                      >
                        <i className="fas fa-play" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="fsc-artwork-glow" style={{ background: `${slide.accentColor}25` }} />
              </div>
            </div>
          </div>
        );
      })}

      <button className="fsc-arrow fsc-arrow-prev" onClick={prevSlide} aria-label="Previous slide">
        <i className="fas fa-chevron-left" />
      </button>
      <button className="fsc-arrow fsc-arrow-next" onClick={nextSlide} aria-label="Next slide">
        <i className="fas fa-chevron-right" />
      </button>

      <div className="fsc-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`fsc-dot${i === currentIndex ? ' fsc-dot--active' : ''}`}
            style={i === currentIndex ? { background: current.accentColor, width: 24 } : {}}
            onClick={() => { setCurrentIndex(i); setProgress(0); }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default FanSpotlightCarousel;
