import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { songsService, artistsService, favoritesService } from '../services/api';
import SongCard, { type SongItem } from './SongCard';
import ArtistCard, { type ArtistItem } from './ArtistCard';
import { useLanguage } from '../context/LanguageContext';

const GENRES = ['All', 'Makossa', 'Bikutsi', 'Afrobeat', 'Traditional', 'Assiko', 'Gospel', 'Hip Hop', 'R&B'];

interface FanBrowseProps {
  initialQuery?: string;
}

export const FanBrowse: React.FC<FanBrowseProps> = ({ initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [artists, setArtists] = useState<ArtistItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [genreFilter, setGenreFilter] = useState('All');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleArtistClick = (artist: { _id?: string }) => {
    if (artist._id) navigate(`/artists/${artist._id}`);
  };

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const songParams: any = { limit: 50 };
      if (debouncedQuery) songParams.search = debouncedQuery;
      if (genreFilter !== 'All') songParams.genre = genreFilter;

      const artistParams: any = { limit: 20 };
      if (debouncedQuery) artistParams.search = debouncedQuery;

      const [songsRes, artistsRes, favsRes] = await Promise.allSettled([
        songsService.getSongs(songParams),
        artistsService.getArtists(artistParams),
        favoritesService.getFavorites(),
      ]);

      const songList: SongItem[] =
        songsRes.status === 'fulfilled' ? songsRes.value.data?.data ?? songsRes.value.data ?? [] : [];
      const artistList: ArtistItem[] =
        artistsRes.status === 'fulfilled' ? artistsRes.value.data?.data ?? artistsRes.value.data ?? [] : [];
      const favList: any[] =
        favsRes.status === 'fulfilled' ? favsRes.value.data?.data ?? favsRes.value.data ?? [] : [];

      setSongs(songList);
      setArtists(artistList);
      setFavoriteIds(new Set(favList.map((f: any) => f._id || f.id || f.songId?._id)));
    } catch {
      setSongs([]);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, genreFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  return (
    <div className="fan-browse-container view-enter">
      {/* Search Bar */}
      <div className="fan-browse-search" style={{ marginBottom: 20 }}>
        <i className="fas fa-search fan-search-icon" />
        <input
          type="text"
          className="fan-search-input"
        placeholder={t('browse.search_placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          id="fan-browse-search-input"
        />
        {query && (
          <button className="fan-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
            <i className="fas fa-times" />
          </button>
        )}
      </div>

      {/* Genre Filter */}
      <div className="fan-browse-filters" style={{ marginBottom: 28, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {GENRES.map((g) => (
          <button
            key={g}
            className={`fan-filter-chip ${genreFilter === g ? 'active' : ''}`}
            onClick={() => setGenreFilter(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="fan-loading" style={{ padding: 40 }}>
          <i className="fas fa-spinner fa-spin" />
          <span>{t('browse.searching')}</span>
        </div>
      ) : (
        <>
          {/* Artists Section */}
          {artists.length > 0 && (
            <section className="fan-section" style={{ marginBottom: 36 }}>
              <div className="fan-section-header-premium">
                <div className="fan-section-label">
                  <div className="fan-section-icon-badge" style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>
                    <i className="fas fa-microphone" />
                  </div>
                  <div>
                    <div className="fan-section-title-premium">{t('browse.discover_artists')}</div>
                    <div className="fan-section-subtitle-premium">{t('browse.discover_artists_sub')}</div>
                  </div>
                </div>
              </div>
              <div className="cards-grid">
                {artists.map((artist) => (
                  <ArtistCard
                    key={artist._id}
                    artist={artist}
                    onArtistClick={handleArtistClick}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Songs Section */}
          <section className="fan-section">
            <div className="fan-section-header-premium">
              <div className="fan-section-label">
                <div className="fan-section-icon-badge">
                  <i className="fas fa-music" />
                </div>
                <div>
                  <div className="fan-section-title-premium">{t('browse.all_music')}</div>
                  <div className="fan-section-subtitle-premium">
                    {songs.length} {songs.length === 1 ? t('browse.track_singular') : t('browse.tracks_available')}
                    {debouncedQuery && ` ${t('browse.matching')} "${debouncedQuery}"`}
                  </div>
                </div>
              </div>
            </div>

            {songs.length === 0 ? (
              <div className="fan-empty-state">
                <i className="fas fa-search" />
                <h4>{t('browse.no_tracks_found')}</h4>
                <p>{t('browse.no_tracks_try')}</p>
              </div>
            ) : (
              <div className="cards-grid">
                {songs.map((song) => (
                  <SongCard
                    key={song._id}
                    song={song}
                    playlist={songs}
                    isFavorite={favoriteIds.has(song._id)}
                    onFavoriteToggle={handleFavoriteToggle}
                    onArtistClick={handleArtistClick}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

    </div>
  );
};

export default FanBrowse;
