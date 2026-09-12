/**
 * Curated music assets from /public/music/
 */
export const MUSIC_IMAGES = [
  '/music/aditya-chinchure-ZhQCZjr9fHo-unsplash.jpg',
  '/music/adrian-korte-5gn2soeAc40-unsplash.jpg',
  '/music/beautiful-woman-listening-music-through-headphones-digital-device.jpg',
  '/music/c-d-x-PDX_a_82obo-unsplash.jpg',
  '/music/caught-in-joy-ptVBlniJi50-unsplash.jpg',
  '/music/charismatic-modern-young-attractive-africanamerican-girl-with-afro-haircut-listening-music-headph.jpg',
  '/music/danny-howe-bn-D2bCvpik-unsplash.jpg',
  '/music/funny-unshaven-man-with-healthy-dark-skin-enjoys-loud-sound-stereo-headphones-laughs-from-happiness-spends-free-time-with-favourite-music.jpg',
  '/music/israel-palacio-Y20JJ_ddy9M-unsplash.jpg',
  '/music/john-matychuk-gUK3lA3K7Yo-unsplash.jpg',
  '/music/leo-wieling-bG8U3kaZltE-unsplash.jpg',
  '/music/lewis-guapo-XJK8gdWpxWk-unsplash.jpg',
  '/music/luis-gherasim-aLPY2rRTYQI-unsplash.jpg',
  '/music/marcela-laskoski-YrtFlrLo2DQ-unsplash.jpg',
  '/music/nainoa-shizuru-NcdG9mK3PBY-unsplash.jpg',
  '/music/rene-bohmer-YeUVDKZWSZ4-unsplash.jpg',
  '/music/simon-noh-0rmby-3OTeI-unsplash.jpg',
  '/music/wes-hicks-MEL-jJnm7RQ-unsplash.jpg',
  '/music/young-cheerful-ethnic-woman-enjoys-music-floor-sits-crossed-legs-wears-pink-shirt-jeans-socks-listens-audio-track-with-loud-sound-isolated-yellow-wall-empty-space.jpg',
];

/**
 * Returns a consistent music image for a given ID or title
 */
export const getMusicImage = (seed?: string, index?: number): string => {
  if (index !== undefined && index >= 0) {
    return MUSIC_IMAGES[index % MUSIC_IMAGES.length];
  }
  if (!seed) return MUSIC_IMAGES[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const positiveIndex = Math.abs(hash) % MUSIC_IMAGES.length;
  return MUSIC_IMAGES[positiveIndex];
};

export const GENRE_CARDS_DATA = [
  {
    name: 'Makossa',
    desc: 'Classic Douala beats & legendary basslines',
    image: '/music/simon-noh-0rmby-3OTeI-unsplash.jpg',
    color: '#f59e0b',
  },
  {
    name: 'Afrobeat',
    desc: 'Modern energetic club and street anthems',
    image: '/music/caught-in-joy-ptVBlniJi50-unsplash.jpg',
    color: '#ef4444',
  },
  {
    name: 'Bikutsi',
    desc: 'Fast acoustic 6/8 rhythms from Center Cameroon',
    image: '/music/wes-hicks-MEL-jJnm7RQ-unsplash.jpg',
    color: '#10b981',
  },
  {
    name: 'Assiko',
    desc: 'Traditional guitar picking & lively percussion',
    image: '/music/rene-bohmer-YeUVDKZWSZ4-unsplash.jpg',
    color: '#8b5cf6',
  },
  {
    name: 'Gospel',
    desc: 'Inspiring Cameroonian praise and worship melodies',
    image: '/music/nainoa-shizuru-NcdG9mK3PBY-unsplash.jpg',
    color: '#3b82f6',
  },
  {
    name: 'Hip Hop / R&B',
    desc: 'Urban rap, drill, and smooth Afro-R&B fusion',
    image: '/music/lewis-guapo-XJK8gdWpxWk-unsplash.jpg',
    color: '#ec4899',
  },
];
