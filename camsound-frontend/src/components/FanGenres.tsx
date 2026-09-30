import React, { useState, useEffect, useCallback } from 'react';
import { songsService, favoritesService } from '../services/api';
import { useAudio } from '../context/AudioContext';
import { useLanguage } from '../context/LanguageContext';
import SongCard, { type SongItem } from './SongCard';

interface GenreMeta {
  id: string;
  name: string;
  frenchName?: string;
  icon: string;
  description: string;
  frenchDesc: string;
  gradient: string;
  accentColor: string;
  image: string;
}

const CAMEROONIAN_GENRES: GenreMeta[] = [
  {
    id: 'makossa',
    name: 'Makossa',
    icon: 'fa-guitar',
    description: 'The iconic urban sound of Douala. Legendary basslines, brass riffs, and dance grooves popularized across the globe.',
    frenchDesc: 'Le son emblematique de Douala. Lignes de basse mythiques, cuivres et rythmes dansants mondialement celebres.',
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.9) 0%, rgba(180, 83, 9, 0.95) 100%)',
    accentColor: '#f59e0b',
    image: '/music/simon-noh-0rmby-3OTeI-unsplash.jpg',
  },
  {
    id: 'bikutsi',
    name: 'Bikutsi',
    icon: 'fa-drum',
    description: 'Fast, high-energy 6/8 acoustic rhythms and traditional Beti percussion originating from Center and South Cameroon.',
    frenchDesc: 'Rythmes 6/8 rapides et percussions Beti traditionnelles originaires du Centre et du Sud Cameroun.',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.95) 100%)',
    accentColor: '#10b981',
    image: '/music/wes-hicks-MEL-jJnm7RQ-unsplash.jpg',
  },
  {
    id: 'afrobeat',
    name: 'Afrobeat',
    icon: 'fa-fire',
    description: 'Modern Cameroonian Afro-pop, club anthems, and energetic fusion with international African rhythms.',
    frenchDesc: 'Afro-pop camerounaise moderne, hits de clubs et fusion energique avec les rythmes africains.',
    gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(185, 28, 28, 0.95) 100%)',
    accentColor: '#ef4444',
    image: '/music/caught-in-joy-ptVBlniJi50-unsplash.jpg',
  },
  {
    id: 'mbole',
    name: 'Mbole',
    icon: 'fa-drum-steelpan',
    description: 'The viral youth sound of Yaounde streets. Raw energetic percussion, call-and-response chanting, and vibrant local vibes.',
    frenchDesc: 'Le phenomene urbain des quartiers de Yaounde. Percussions intenses, refrains collectifs et ambiance 237.',
    gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.9) 0%, rgba(194, 65, 12, 0.95) 100%)',
    accentColor: '#f97316',
    image: '/music/danny-howe-bn-D2bCvpik-unsplash.jpg',
  },
  {
    id: 'assiko',
    name: 'Assiko',
    icon: 'fa-compact-disc',
    description: 'Traditional Bassa fingerstyle acoustic guitar mastery, lively rhythmic bottles, and celebratory folk cadence.',
    frenchDesc: 'Virtuosite de guitare acoustique Bassa, bouteilles rythmiques et cadences folkloriques de celebration.',
    gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(109, 40, 217, 0.95) 100%)',
    accentColor: '#8b5cf6',
    image: '/music/rene-bohmer-YeUVDKZWSZ4-unsplash.jpg',
  },
  {
    id: 'gospel',
    name: 'Gospel',
    icon: 'fa-praying-hands',
    description: 'Inspiring Cameroonian praise, choir harmonies, and soul-lifting spiritual worship melodies.',
    frenchDesc: 'Louanges camerounaises inspirantes, harmonies chorales et melodies spirituelles edifiantes.',
    gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(29, 78, 216, 0.95) 100%)',
    accentColor: '#3b82f6',
    image: '/music/young-cheerful-ethnic-woman-enjoys-music-floor-sits-crossed-legs-wears-pink-shirt-jeans-socks-listens-audio-track-with-loud-sound-isolated-yellow-wall-empty-space.jpg',
  },
  {
    id: 'hiphop',
    name: 'Hip Hop',
    icon: 'fa-microphone-alt',
    description: 'Authentic 237 street rap, Camfranglais lyricism, conscious storytelling, and punchy trap beats.',
    frenchDesc: 'Rap 237 authentique, textes en Camfranglais, storytelling engage et beats percutants.',
    gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(190, 24, 93, 0.95) 100%)',
    accentColor: '#ec4899',
    image: '/music/charismatic-modern-young-attractive-africanamerican-girl-with-afro-haircut-listening-music-headph.jpg',
  },
  {
    id: 'benskin',
    name: 'Benskin',
    icon: 'fa-music',
    description: 'Grassfields traditional rhythms from the West region. Celebratory drum patterns and cultural dances.',
    frenchDesc: 'Rythmes traditionnels des Grassfields de l Ouest. Percussions festives et danses culturelles.',
    gradient: 'linear-gradient(135deg, rgba(20, 184, 166, 0.9) 0%, rgba(13, 148, 136, 0.95) 100%)',
    accentColor: '#14b8a6',
    image: '/music/john-matychuk-gUK3lA3K7Yo-unsplash.jpg',
  },
  {
    id: 'traditional',
    name: 'Traditional',
    icon: 'fa-seedling',
    description: 'Roots heritage, indigenous acoustic instruments, and sacred melodies spanning Cameroon’s 250+ ethnic groups.',
    frenchDesc: 'Racines patrimoniales, instruments traditionnels et chants ancestraux des 250+ ethnies du Cameroun.',
    gradient: 'linear-gradient(135deg, rgba(217, 119, 6, 0.9) 0%, rgba(146, 64, 14, 0.95) 100%)',
    accentColor: '#d97706',
    image: '/music/adrian-korte-5gn2soeAc40-unsplash.jpg',
  },
  {
    id: 'highlife',
    name: 'Highlife',
    icon: 'fa-cocktail',
    description: 'Coastal swing, palm-wine acoustics, and classic West African brass melodies with a Cameroonian touch.',
    frenchDesc: 'Swing cotier, acoustique palm-wine et cuivres ouest-africains avec une touche camerounaise.',
    gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.9) 0%, rgba(126, 34, 206, 0.95) 100%)',
    accentColor: '#a855f7',
    image: '/music/aditya-chinchure-ZhQCZjr9fHo-unsplash.jpg',
  },
  {
    id: 'rnb',
    name: 'R&B',
    icon: 'fa-heart',
    description: 'Silky smooth vocal delivery, soulful Afro-romance ballads, and contemporary melodic vibes.',
    frenchDesc: 'Voix suaves, ballades romantiques afros et ambiances melodiques contemporaines.',
    gradient: 'linear-gradient(135deg, rgba(244, 63, 94, 0.9) 0%, rgba(190, 18, 60, 0.95) 100%)',
    accentColor: '#f43f5e',
    image: '/music/beautiful-woman-listening-music-through-headphones-digital-device.jpg',
  },
];

interface FanGenresProps {
  onSelectGenre?: (genre: string) => void;
  initialGenre?: string;
}

export const FanGenres: React.FC<FanGenresProps> = ({ onSelectGenre, initialGenre }) => {
  const { t, language } = useLanguage();
  const { playSong } = useAudio();

  const [selectedGenre, setSelectedGenre] = useState<GenreMeta | null>(() => {
    if (initialGenre) {
      return CAMEROONIAN_GENRES.find((g) => g.name.toLowerCase() === initialGenre.toLowerCase()) || null;
    }
    return null;
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [genreSongs, setGenreSongs] = useState<SongItem[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [genreCounts, setGenreCounts] = useState<Record<string, number>>({});

  // Fetch initial genre counts and favorites
  useEffect(() => {
    songsService
      .getSongs({ limit: 200 })
      .then((res) => {
        const songs: SongItem[] = res.data?.data || [];
        const counts: Record<string, number> = {};
        songs.forEach((s) => {
          if (s.genre) {
            const normalized = s.genre.toLowerCase();
            counts[normalized] = (counts[normalized] || 0) + 1;
          }
        });
        setGenreCounts(counts);
      })
      .catch(() => {});

    favoritesService
      .getFavorites()
      .then((res) => {
        const favs: any[] = res.data?.data || [];
        setFavoriteIds(new Set(favs.map((f) => f._id || f.id || f.songId?._id)));
      })
      .catch(() => {});
  }, []);

  // Fetch songs when a specific genre is selected
  const fetchGenreSongs = useCallback(async (genre: GenreMeta) => {
    setLoadingSongs(true);
    try {
      const res = await songsService.getSongs({ genre: genre.name, limit: 50 });
      let songs: SongItem[] = res.data?.data || [];

      // If backend returns empty due to case sensitivity, fetch all and filter locally
      if (songs.length === 0) {
        const allRes = await songsService.getSongs({ limit: 100 });
        const allSongs: SongItem[] = allRes.data?.data || [];
        songs = allSongs.filter(
          (s) =>
            s.genre?.toLowerCase() === genre.name.toLowerCase() ||
            s.genre?.toLowerCase().includes(genre.id) ||
            s.title?.toLowerCase().includes(genre.name.toLowerCase())
        );
      }
      setGenreSongs(songs);
    } catch {
      setGenreSongs([]);
    } finally {
      setLoadingSongs(false);
    }
  }, []);

  useEffect(() => {
    if (selectedGenre) {
      fetchGenreSongs(selectedGenre);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedGenre, fetchGenreSongs]);

  const handleFavoriteToggle = async (song: SongItem) => {
    const isFav = favoriteIds.has(song._id);
    try {
      if (isFav) {
        await favoritesService.unlikeSong(song._id);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(song._id);
          return next;
        });
      } else {
        await favoritesService.likeSong(song._id);
        setFavoriteIds((prev) => new Set(prev).add(song._id));
      }
    } catch {
      // ignore
    }
  };

  const handlePlayGenreRadio = () => {
    if (genreSongs.length > 0) {
      playSong(genreSongs[0], genreSongs);
    }
  };

  const filteredGenres = CAMEROONIAN_GENRES.filter((g) => {
    const query = searchFilter.toLowerCase().trim();
    if (!query) return true;
    return (
      g.name.toLowerCase().includes(query) ||
      g.description.toLowerCase().includes(query) ||
      g.frenchDesc.toLowerCase().includes(query)
    );
  });

  return (
    <div className="fan-genres-page view-enter">
      {/* ── If in Overview (Genre Hub) ── */}
      {!selectedGenre ? (
        <>
          {/* Header Section */}
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 14px',
                background: 'rgba(250, 204, 21, 0.12)',
                border: '1px solid rgba(250, 204, 21, 0.3)',
                borderRadius: 20,
                color: 'var(--accent-color)',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              <i className="fas fa-layer-group" /> {t('genres.badge', 'EXPLORE STYLES')}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {t('genres.title', 'Music Genres')}
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem', margin: '6px 0 0 0', maxWidth: 640 }}>
                  {t(
                    'genres.subtitle',
                    'Explore the rich tapestry of Cameroonian musical heritage, traditional folklore and modern sub-genres'
                  )}
                </p>
              </div>

              {/* Genre Search Box */}
              <div style={{ position: 'relative', minWidth: 260 }}>
                <i
                  className="fas fa-search"
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '0.88rem',
                  }}
                />
                <input
                  type="text"
                  placeholder={t('genres.search_placeholder', 'Filter genres by name...')}
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 20,
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Quick Genre Chips Bar */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 12,
              marginBottom: 24,
              scrollbarWidth: 'none',
            }}
          >
            {CAMEROONIAN_GENRES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setSelectedGenre(g);
                  onSelectGenre?.(g.name);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 20,
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(250, 204, 21, 0.15)';
                  e.currentTarget.style.borderColor = 'var(--accent-color)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <i className={`fas ${g.icon}`} style={{ color: g.accentColor, fontSize: '0.85rem' }} />
                <span>{g.name}</span>
                {genreCounts[g.name.toLowerCase()] ? (
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      fontSize: '0.7rem',
                      padding: '1px 6px',
                      borderRadius: 10,
                      color: 'rgba(255,255,255,0.8)',
                    }}
                  >
                    {genreCounts[g.name.toLowerCase()]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Visual Genre Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
              marginBottom: 40,
            }}
          >
            {filteredGenres.map((genre) => {
              const count = genreCounts[genre.name.toLowerCase()] || 0;
              const desc = language === 'fr' ? genre.frenchDesc : genre.description;

              return (
                <div
                  key={genre.id}
                  onClick={() => {
                    setSelectedGenre(genre);
                    onSelectGenre?.(genre.name);
                  }}
                  role="button"
                  tabIndex={0}
                  style={{
                    position: 'relative',
                    height: 190,
                    borderRadius: 16,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = `0 16px 36px rgba(0, 0, 0, 0.6), 0 0 24px ${genre.accentColor}40`;
                    e.currentTarget.style.borderColor = genre.accentColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  {/* Background Artwork */}
                  <img
                    src={genre.image}
                    alt={genre.name}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'brightness(0.55)',
                      transition: 'transform 0.5s ease',
                    }}
                  />

                  {/* Gradient Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(to top, rgba(11, 15, 12, 0.95) 0%, ${genre.accentColor}55 60%, rgba(0,0,0,0.4) 100%)`,
                    }}
                  />

                  {/* Card Content */}
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      padding: 20,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: 'rgba(0, 0, 0, 0.5)',
                          backdropFilter: 'blur(8px)',
                          border: `1px solid ${genre.accentColor}80`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 4px 12px ${genre.accentColor}40`,
                        }}
                      >
                        <i className={`fas ${genre.icon}`} style={{ color: genre.accentColor, fontSize: '1.25rem' }} />
                      </div>
                      <span
                        style={{
                          background: 'rgba(0, 0, 0, 0.6)',
                          backdropFilter: 'blur(6px)',
                          color: '#fff',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 20,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        {count > 0 ? `${count} ${t('genres.songs_count', 'tracks')}` : t('genres.badge', 'EXPLORE')}
                      </span>
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', margin: '0 0 6px 0', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                        {genre.name}
                      </h3>
                      <p
                        style={{
                          fontSize: '0.78rem',
                          color: 'rgba(255, 255, 255, 0.85)',
                          margin: 0,
                          lineHeight: 1.35,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* ── If in Deep Dive (Selected Genre Detail View) ── */
        <div>
          {/* Back Button & Navigation Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => setSelectedGenre(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 20,
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
            >
              <i className="fas fa-arrow-left" />
              <span>{t('genres.back_to_genres', 'All Genres')}</span>
            </button>
          </div>

          {/* Genre Hero Banner */}
          <div
            style={{
              position: 'relative',
              borderRadius: 20,
              overflow: 'hidden',
              padding: '36px 28px',
              marginBottom: 32,
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
              border: `1px solid ${selectedGenre.accentColor}50`,
            }}
          >
            {/* Ambient Background Artwork */}
            <img
              src={selectedGenre.image}
              alt={selectedGenre.name}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'brightness(0.35) blur(3px)',
                transform: 'scale(1.05)',
              }}
            />
            {/* Color Wash */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, ${selectedGenre.accentColor}88 0%, rgba(11, 15, 12, 0.95) 100%)`,
              }}
            />

            {/* Banner Inner Info */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 24,
              }}
            >
              <div style={{ maxWidth: 640 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(8px)',
                    color: selectedGenre.accentColor,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    marginBottom: 12,
                    border: `1px solid ${selectedGenre.accentColor}60`,
                  }}
                >
                  <i className={`fas ${selectedGenre.icon}`} />
                  <span>GENRE FOCUS</span>
                </div>

                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0 0 10px 0' }}>
                  {selectedGenre.name}
                </h1>

                <p style={{ color: 'rgba(255, 255, 255, 0.88)', fontSize: '0.98rem', lineHeight: 1.5, margin: 0 }}>
                  {language === 'fr' ? selectedGenre.frenchDesc : selectedGenre.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  type="button"
                  onClick={handlePlayGenreRadio}
                  disabled={genreSongs.length === 0}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '14px 28px',
                    borderRadius: 30,
                    background: 'var(--accent-color, #facc15)',
                    color: '#000',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: genreSongs.length > 0 ? 'pointer' : 'not-allowed',
                    opacity: genreSongs.length > 0 ? 1 : 0.5,
                    boxShadow: '0 4px 20px rgba(250, 204, 21, 0.4)',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => genreSongs.length > 0 && (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <i className="fas fa-play" />
                  <span>{t('genres.play_radio', 'Play Genre Radio')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Genre Song Library Section */}
          <div style={{ marginBottom: 40 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                {t('genres.top_tracks', 'Top Tracks in this Genre')}
              </h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {genreSongs.length} {t('genres.songs_count', 'tracks')}
              </span>
            </div>

            {loadingSongs ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 0',
                  color: 'var(--accent-color)',
                  fontSize: '1.5rem',
                }}
              >
                <i className="fas fa-spinner fa-spin" />
              </div>
            ) : genreSongs.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 16,
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <i className={`fas ${selectedGenre.icon}`} style={{ fontSize: '2.5rem', color: selectedGenre.accentColor, marginBottom: 12 }} />
                <h3 style={{ color: '#fff', margin: '0 0 6px 0' }}>{t('genres.no_tracks', 'No songs found in this genre yet.')}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                  Be the first artist to upload a {selectedGenre.name} track to the platform!
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 16,
                }}
              >
                {genreSongs.map((song) => (
                  <SongCard
                    key={song._id}
                    song={song}
                    playlist={genreSongs}
                    isFavorite={favoriteIds.has(song._id)}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FanGenres;
