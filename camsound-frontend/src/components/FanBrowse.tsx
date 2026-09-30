import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { songsService, artistsService, favoritesService, playlistsService } from '../services/api';
import SongCard, { type SongItem } from './SongCard';
import ArtistCard, { type ArtistItem } from './ArtistCard';
import ScrollReveal from './ScrollReveal';
import ScrollRow from './ScrollRow';
import Modal from './Modal';
import { type PlaylistItem } from './PlaylistCard';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

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
  // Add-to-playlist modal
  const [addToPlaylistSong, setAddToPlaylistSong] = useState<SongItem | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<PlaylistItem[]>([]);
  const [addingToPlaylist, setAddingToPlaylist] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const toast = useToast();

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
        toast.info(`Removed "${song.title}" from favorites`);
      } else {
        await favoritesService.likeSong(song._id);
        setFavoriteIds((prev) => new Set(prev).add(song._id));
        toast.music(`Added "${song.title}" to favorites!`);
      }
    } catch {
      toast.error('Unable to update favorite status');
    }
  };

  const handleAddToPlaylist = async (song: SongItem) => {
    try {
      const res = await playlistsService.getPlaylists();
      const list: PlaylistItem[] = res.data?.data ?? res.data ?? [];
      setUserPlaylists(list);
    } catch {
      setUserPlaylists([]);
    }
    setAddToPlaylistSong(song);
  };

  const handlePickPlaylist = async (playlist: PlaylistItem) => {
    if (!addToPlaylistSong) return;
    setAddingToPlaylist(true);
    try {
      await playlistsService.addSong(playlist._id, addToPlaylistSong._id);
      toast.success(`"${addToPlaylistSong.title}" added to "${playlist.name}"!`);
      setAddToPlaylistSong(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg && msg.toLowerCase().includes('already')) {
        toast.info(`"${addToPlaylistSong.title}" is already in "${playlist.name}"`);
      } else {
        toast.error('Unable to add to playlist. Please try again.');
      }
    } finally {
      setAddingToPlaylist(false);
    }
  };

  return (
    <div className="fan-browse-container view-enter">
      {/* Search Bar */}
      <ScrollReveal direction="up" delay={50}>
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
      </ScrollReveal>

      {/* Genre Filter */}
      <ScrollReveal direction="up" delay={100}>
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
      </ScrollReveal>

      {loading ? (
        <div className="fan-loading" style={{ padding: 40 }}>
          <i className="fas fa-spinner fa-spin" />
          <span>{t('browse.searching')}</span>
        </div>
      ) : (
        <>
          {/* Artists Section */}
          {artists.length > 0 && (
            <ScrollReveal direction="up" delay={140}>
              <ScrollRow
                title={t('browse.discover_artists')}
                subtitle={t('browse.discover_artists_sub')}
                icon="fa-microphone"
                iconBg="rgba(168,85,247,0.12)"
                iconColor="#a855f7"
              >
                {artists.map((artist) => (
                  <ArtistCard
                    key={artist._id}
                    artist={artist}
                    onArtistClick={handleArtistClick}
                  />
                ))}
              </ScrollRow>
            </ScrollReveal>
          )}

          {/* Songs Section */}
          <ScrollReveal direction="up" delay={180}>
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
                      onAddToPlaylist={handleAddToPlaylist}
                      onArtistClick={handleArtistClick}
                    />
                  ))}
                </div>
              )}
            </section>
          </ScrollReveal>
        </>
      )}
      {/* Add-to-Playlist Picker Modal */}
      {addToPlaylistSong && (
        <Modal
          isOpen={!!addToPlaylistSong}
          title={`Add "${addToPlaylistSong.title}" to Playlist`}
          onClose={() => setAddToPlaylistSong(null)}
          size="sm"
        >
          {userPlaylists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.6)' }}>
              <i className="fas fa-compact-disc" style={{ fontSize: '2rem', color: 'var(--accent-color)', opacity: 0.5, display: 'block', marginBottom: 12 }} />
              <p style={{ margin: 0 }}>You have no playlists yet.</p>
              <p style={{ margin: '6px 0 0', fontSize: '0.85rem' }}>Create one from the Playlists section.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {userPlaylists.map((pl) => (
                <button
                  key={pl._id}
                  onClick={() => handlePickPlaylist(pl)}
                  disabled={addingToPlaylist}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12, cursor: 'pointer', textAlign: 'left', color: '#fff',
                    transition: 'all 0.2s', opacity: addingToPlaylist ? 0.6 : 1,
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(250,204,21,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="fas fa-list" style={{ color: 'var(--accent-color)' }} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                      {pl.songs?.length ?? 0} {(pl.songs?.length ?? 0) === 1 ? 'track' : 'tracks'}
                    </div>
                  </div>
                  <i className="fas fa-plus" style={{ color: 'var(--accent-color)', fontSize: '0.9rem' }} />
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default FanBrowse;

