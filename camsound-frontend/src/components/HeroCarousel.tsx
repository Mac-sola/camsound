import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

export interface CarouselSlide {
  id: string;
  badge: string;
  badgeIcon?: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  primaryBtnText: string;
  primaryBtnLink: string;
  secondaryBtnText?: string;
  secondaryBtnLink?: string;
  genreTag?: string;
}

const DEFAULT_SLIDES: CarouselSlide[] = [
  {
    id: 'slide-1',
    badge: 'TRENDING IN CAMEROON',
    badgeIcon: 'fa-fire',
    genreTag: 'Makossa & Afrobeat',
    title: 'The Heartbeat of Cameroonian Rhythms',
    subtitle: 'Makossa • Bikutsi • Afrobeat • Assiko',
    description: 'From Douala street anthems to Yaoundé concert halls — stream the hottest tracks and discover raw Cameroonian talent.',
    image: '/music/aditya-chinchure-ZhQCZjr9fHo-unsplash.jpg',
    primaryBtnText: 'Start Listening',
    primaryBtnLink: '/browse',
    secondaryBtnText: 'Join as Artist',
    secondaryBtnLink: '/signup?role=artist',
  },
  {
    id: 'slide-2',
    badge: 'ARTIST SPOTLIGHT',
    badgeIcon: 'fa-sparkles',
    genreTag: 'Fresh Discoveries',
    title: 'Empowering Local Artists & Creators',
    subtitle: 'Fair visibility • Direct community • Monetization',
    description: 'Upload your music, build an active fanbase across Africa and the diaspora, and get recognized for your craft.',
    image: '/music/charismatic-modern-young-attractive-africanamerican-girl-with-afro-haircut-listening-music-headph.jpg',
    primaryBtnText: 'Upload Your Music',
    primaryBtnLink: '/signup?role=artist',
    secondaryBtnText: 'Explore Artists',
    secondaryBtnLink: '/browse',
  },
  {
    id: 'slide-3',
    badge: 'HIGH ENERGY STAGES',
    badgeIcon: 'fa-bolt',
    genreTag: 'Live Concerts & Mixes',
    title: 'Feel the Electric Energy of Live Sets',
    subtitle: 'Lossless audio streaming • Curated daily',
    description: 'Immerse yourself in handpicked festival playlists designed for high energy, parties, workout drive, and cultural vibes.',
    image: '/music/danny-howe-bn-D2bCvpik-unsplash.jpg',
    primaryBtnText: 'Browse All Tracks',
    primaryBtnLink: '/browse',
    secondaryBtnText: 'View Charts',
    secondaryBtnLink: '#songs',
  },
  {
    id: 'slide-4',
    badge: 'AUTHENTIC SOUND',
    badgeIcon: 'fa-guitar',
    genreTag: 'Traditional & Fusion',
    title: 'Pure Acoustic Vibrations & Modern Sound',
    subtitle: 'Heritage • Contemporary fusions',
    description: 'Experience authentic sounds, folk rhythms, and modern electronic fusions crafted with passion by top Cameroonian musicians.',
    image: '/music/israel-palacio-Y20JJ_ddy9M-unsplash.jpg',
    primaryBtnText: 'Discover Genres',
    primaryBtnLink: '#discover',
    secondaryBtnText: 'Sign In',
    secondaryBtnLink: '/login',
  },
];

interface HeroCarouselProps {
  slides?: CarouselSlide[];
  autoPlayInterval?: number;
  className?: string;
  isFullWidth?: boolean;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  slides = DEFAULT_SLIDES,
  autoPlayInterval = 6000,
  className = '',
  isFullWidth = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
  };

  useEffect(() => {
    if (isPaused) return;

    const stepMs = 50;
    const increment = (stepMs / autoPlayInterval) * 100;

    const timer = setInterval(() => {
      setProgress((old) => {
        if (old >= 100) {
          nextSlide();
          return 0;
        }
        return old + increment;
      });
    }, stepMs);

    return () => clearInterval(timer);
  }, [isPaused, autoPlayInterval, nextSlide]);

  return (
    <div
      className={`camsound-hero-carousel ${isFullWidth ? 'is-full-width' : ''} ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Featured music carousel"
    >
      {/* Top Animated Progress Timer Line */}
      <div className="carousel-timer-bar">
        <div
          className="carousel-timer-progress"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Slides Container */}
      <div className="carousel-slides-wrapper">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.id}
              className={`carousel-slide ${isActive ? 'active' : ''}`}
              aria-hidden={!isActive}
            >
              {/* Background with Ken Burns zoom effect */}
              <div
                className={`carousel-slide-bg ${isActive ? 'ken-burns' : ''}`}
                style={{
                  backgroundImage: `linear-gradient(to right, rgba(8, 12, 22, 0.95) 0%, rgba(8, 12, 22, 0.78) 40%, rgba(8, 12, 22, 0.4) 75%, rgba(8, 12, 22, 0.7) 100%), url('${slide.image}')`,
                }}
              />

              <div className="carousel-slide-content container">
                <div className="carousel-slide-grid">
                  {/* Left Column: Animated Text Content */}
                  <div className="carousel-slide-inner">
                    <div className="carousel-top-row">
                      <div className="carousel-badge pulse-badge">
                        <i className={`fas ${slide.badgeIcon || 'fa-sparkles'}`} />
                        <span>{slide.badge}</span>
                      </div>

                      {/* Animated Soundwave Equalizer */}
                      <div className="carousel-equalizer" title="Live audio pulse">
                        <span className="eq-bar eq-bar-1" />
                        <span className="eq-bar eq-bar-2" />
                        <span className="eq-bar eq-bar-3" />
                        <span className="eq-bar eq-bar-4" />
                        <span className="eq-bar eq-bar-5" />
                      </div>
                    </div>

                    <h1 className="carousel-title text-shimmer">
                      {slide.title}
                    </h1>

                    {slide.subtitle && (
                      <div className="carousel-subtitle">
                        <i className="fas fa-music" style={{ marginRight: 6, fontSize: '0.85rem' }} />
                        {slide.subtitle}
                      </div>
                    )}

                    <p className="carousel-description">{slide.description}</p>

                    <div className="carousel-actions">
                      {slide.primaryBtnLink.startsWith('#') ? (
                        <a href={slide.primaryBtnLink} className="btn-camsound-yellow carousel-cta-btn glow-effect">
                          <i className="fas fa-play" style={{ marginRight: 8, fontSize: '0.85rem' }} />
                          {slide.primaryBtnText}
                        </a>
                      ) : (
                        <Link to={slide.primaryBtnLink} className="btn-camsound-yellow carousel-cta-btn glow-effect">
                          <i className="fas fa-play" style={{ marginRight: 8, fontSize: '0.85rem' }} />
                          {slide.primaryBtnText}
                        </Link>
                      )}

                      {slide.secondaryBtnText && slide.secondaryBtnLink && (
                        slide.secondaryBtnLink.startsWith('#') ? (
                          <a href={slide.secondaryBtnLink} className="btn-camsound-outline carousel-secondary-btn">
                            {slide.secondaryBtnText}
                          </a>
                        ) : (
                          <Link to={slide.secondaryBtnLink} className="btn-camsound-outline carousel-secondary-btn">
                            {slide.secondaryBtnText}
                          </Link>
                        )
                      )}
                    </div>
                  </div>

                  {/* Right Column: Floating Vinyl Aura Artwork Showcase */}
                  <div className="carousel-floating-showcase d-none d-lg-flex">
                    <div className="vinyl-disk-wrapper">
                      <div
                        className="vinyl-disk-art"
                        style={{ backgroundImage: `url('${slide.image}')` }}
                      >
                        <div className="vinyl-center-groove">
                          <i className="fas fa-compact-disc" />
                        </div>
                      </div>
                      <div className="vinyl-glow-ring" />
                    </div>

                    {slide.genreTag && (
                      <div className="vinyl-genre-pill">
                        <i className="fas fa-wave-square" /> {slide.genreTag}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows with clean margin spacing */}
      <button
        type="button"
        className="carousel-arrow carousel-arrow-prev"
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        <i className="fas fa-chevron-left" />
      </button>

      <button
        type="button"
        className="carousel-arrow carousel-arrow-next"
        onClick={nextSlide}
        aria-label="Next slide"
      >
        <i className="fas fa-chevron-right" />
      </button>

      {/* Bottom Indicator Dots & Pause Status */}
      <div className="carousel-dots-container">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;

