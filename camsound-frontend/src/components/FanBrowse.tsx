import React, { useState, useEffect, useCallback } from 'react';
import { songsService, artistsService, favoritesService } from '../services/api';
import SongCard, { type SongItem } from './SongCard';
import ArtistCard, { type ArtistItem } from './ArtistCard';
import ArtistDetailsModal from './ArtistDetailsModal';

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
  const [selectedArtist, setSelectedArtist] = useState<any>(null);

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
          placeholder="Search songs, artists, genres..."
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
          <span>Searching tracks and artists...</span>
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
                    <div className="fan-section-title-premium">Discover Artists</div>
                    <div className="fan-section-subtitle-premium">Browse Cameroonian music creators</div>
                  </div>
                </div>
              </div>
              <div className="cards-grid">
                {artists.map((artist) => (
                  <ArtistCard
                    key={artist._id}
                    artist={artist}
                    onArtistClick={setSelectedArtist}
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
                  <div className="fan-section-title-premium">Browse All Music</div>
                  <div className="fan-section-subtitle-premium">
                    {songs.length} {songs.length === 1 ? 'track' : 'tracks'} available
                    {debouncedQuery && ` matching "${debouncedQuery}"`}
                  </div>
                </div>
              </div>
            </div>

            {songs.length === 0 ? (
              <div className="fan-empty-state">
                <i className="fas fa-search" />
                <h4>No tracks found</h4>
                <p>Try a different search term or genre filter</p>
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
                    onArtistClick={setSelectedArtist}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <ArtistDetailsModal artist={selectedArtist} onClose={() => setSelectedArtist(null)} />
    </div>
  );
};

export default FanBrowse;
