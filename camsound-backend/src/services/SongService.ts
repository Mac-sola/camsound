import { SongRepository } from '../repositories/SongRepository';
import { ArtistRepository } from '../repositories/ArtistRepository';
import { ListeningHistoryRepository } from '../repositories/ListeningHistoryRepository';
import { ISong } from '../models/Song';

export interface GetSongsQuery {
    genre?: string;
    search?: string;
    sort?: string;
    artistId?: string;
    page?: number;
    limit?: number;
}

export interface PaginatedSongsResult {
    songs: ISong[];
    total: number;
    page: number;
    pages: number;
}

export interface CreateSongInput {
    title: string;
    genre: string;
    duration?: string;
    filePath?: string;
    coverArt?: string;
    description?: string;
}

/**
 * SongService
 * 
 * Responsibility: Contains all business rules, catalog filtering, stream tracking,
 * and permissions logic for the Music Catalog domain.
 */
export class SongService {
    private songRepository: SongRepository;
    private artistRepository: ArtistRepository;
    private historyRepository: ListeningHistoryRepository;

    /**
     * Dependency Injection:
     * Receives required repositories to coordinate actions across Songs, Artists, and Listening History.
     */
    constructor(
        songRepository: SongRepository,
        artistRepository: ArtistRepository,
        historyRepository: ListeningHistoryRepository
    ) {
        this.songRepository = songRepository;
        this.artistRepository = artistRepository;
        this.historyRepository = historyRepository;
    }

    /**
     * Retrieve paginated catalog of songs based on filters, search queries, and sorting.
     */
    async getSongs(query: GetSongsQuery, currentUser?: { id: string; type: string }): Promise<PaginatedSongsResult> {
        const { genre, search, sort = 'date', artistId, page = 1, limit = 20 } = query;

        const isAdmin = currentUser?.type === 'admin';
        const filter: any = isAdmin ? {} : { status: 'active', moderationStatus: 'approved' };

        if (genre) {
            filter.genre = genre;
        }

        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }

        // Handle artist filtering (supports 'me' alias for logged-in artists)
        if (artistId === 'me' && currentUser?.type === 'artist') {
            const artist = await this.artistRepository.findByUserId(currentUser.id);
            if (artist) {
                filter.artistId = artist._id;
            }
        } else if (artistId && artistId !== 'me') {
            filter.artistId = artistId;
        }

        // Determine sort order
        let sortOption: any = { createdAt: -1 };
        if (sort === 'plays') {
            sortOption = { plays: -1, createdAt: -1 };
        } else if (sort === 'likes') {
            sortOption = { likes: -1, createdAt: -1 };
        } else if (sort === 'date') {
            sortOption = { createdAt: -1 };
        }

        const numericPage = Math.max(1, Number(page));
        const numericLimit = Math.max(1, Number(limit));
        const skip = (numericPage - 1) * numericLimit;

        const [songs, total] = await Promise.all([
            this.songRepository.findSongs(filter, sortOption, skip, numericLimit),
            this.songRepository.countSongs(filter),
        ]);

        return {
            songs,
            total,
            page: numericPage,
            pages: Math.ceil(total / numericLimit),
        };
    }

    /**
     * Retrieve single song details by ID.
     */
    async getSongById(id: string): Promise<ISong> {
        const song = await this.songRepository.findById(id);
        if (!song) {
            const error: any = new Error('Song not found');
            error.statusCode = 404;
            throw error;
        }
        return song;
    }

    /**
     * Create a new song record for an artist.
     */
    async createSong(currentUser: { id: string; type: string }, input: CreateSongInput): Promise<ISong> {
        if (currentUser.type !== 'artist') {
            const error: any = new Error('Only artist accounts can create songs');
            error.statusCode = 403;
            throw error;
        }

        const artist = await this.artistRepository.findByUserId(currentUser.id);
        if (!artist) {
            const error: any = new Error('Artist profile not found');
            error.statusCode = 404;
            throw error;
        }

        const { title, genre, duration, filePath, coverArt, description } = input;
        if (!title || !genre) {
            const error: any = new Error('Title and genre are required');
            error.statusCode = 400;
            throw error;
        }

        const song = await this.songRepository.create({
            title,
            artistId: artist._id,
            genre,
            duration,
            filePath,
            coverArt,
            description,
        });

        // Automatically update the artist's total songs count
        await this.artistRepository.incrementSongsCount(artist._id.toString(), 1);

        return song;
    }

    /**
     * Update an existing song's metadata (requires ownership or admin role).
     */
    async updateSong(
        currentUser: { id: string; type: string },
        songId: string,
        data: { title?: string; genre?: string; duration?: string }
    ): Promise<ISong> {
        const song = await this.songRepository.findByIdRaw(songId);
        if (!song) {
            const error: any = new Error('Song not found');
            error.statusCode = 404;
            throw error;
        }

        const isAdmin = currentUser.type === 'admin';
        const artist = song.artistId as any;
        const isOwner = currentUser.type === 'artist' && artist.userId?.toString() === currentUser.id;

        if (!isAdmin && !isOwner) {
            const error: any = new Error('Forbidden');
            error.statusCode = 403;
            throw error;
        }

        const updatedSong = await this.songRepository.update(songId, data);
        if (!updatedSong) {
            const error: any = new Error('Song not found');
            error.statusCode = 404;
            throw error;
        }

        return updatedSong;
    }

    /**
     * Delete a song (requires ownership or admin role).
     */
    async deleteSong(currentUser: { id: string; type: string }, songId: string): Promise<void> {
        const song = await this.songRepository.findByIdRaw(songId);
        if (!song) {
            const error: any = new Error('Song not found');
            error.statusCode = 404;
            throw error;
        }

        const isAdmin = currentUser.type === 'admin';
        const artist = song.artistId as any;
        const isOwner = currentUser.type === 'artist' && artist.userId?.toString() === currentUser.id;

        if (!isAdmin && !isOwner) {
            const error: any = new Error('Forbidden');
            error.statusCode = 403;
            throw error;
        }

        await this.songRepository.delete(songId);

        // Decrement artist songs count
        await this.artistRepository.incrementSongsCount(artist._id.toString(), -1);
    }

    /**
     * Track a song stream/play event and log to listening history if user is logged in.
     */
    async trackPlay(songId: string, userId?: string): Promise<number> {
        const updatedSong = await this.songRepository.incrementPlays(songId);
        if (!updatedSong) {
            const error: any = new Error('Song not found');
            error.statusCode = 404;
            throw error;
        }

        // Record history for authenticated listener
        if (userId) {
            await this.historyRepository.logPlay(userId, songId);
        }

        return updatedSong.plays;
    }
}

// Default export an instance pre-wired with singleton repositories
import songRepositoryInstance from '../repositories/SongRepository';
import artistRepositoryInstance from '../repositories/ArtistRepository';
import historyRepositoryInstance from '../repositories/ListeningHistoryRepository';

export default new SongService(
    songRepositoryInstance,
    artistRepositoryInstance,
    historyRepositoryInstance
);
