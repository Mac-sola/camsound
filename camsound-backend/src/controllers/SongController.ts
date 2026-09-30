import { Request, Response } from 'express';
import { SongService } from '../services/SongService';

/**
 * SongController
 * 
 * Responsibility:
 * 1. Extract query params, URL route params, and body data for song operations.
 * 2. Delegate business logic execution to SongService.
 * 3. Return consistent HTTP status codes and JSON responses.
 * 
 * Does NOT perform direct database queries.
 */
export class SongController {
    private songService: SongService;

    /**
     * Dependency Injection:
     * Receives an instance of SongService so the controller remains decoupled
     * from database models and catalog business rules.
     */
    constructor(songService: SongService) {
        this.songService = songService;
    }

    /**
     * GET /api/songs — Retrieve paginated song list with optional search/genre/artist filtering.
     */
    getSongs = async (req: Request, res: Response): Promise<void> => {
        try {
            const { genre, search, sort, artistId, page, limit } = req.query;

            const result = await this.songService.getSongs(
                {
                    genre: typeof genre === 'string' ? genre : undefined,
                    search: typeof search === 'string' ? search : undefined,
                    sort: typeof sort === 'string' ? sort : undefined,
                    artistId: typeof artistId === 'string' ? artistId : undefined,
                    page: page ? Number(page) : undefined,
                    limit: limit ? Number(limit) : undefined,
                },
                req.user ? { id: req.user.id, type: req.user.type } : undefined
            );

            res.status(200).json({
                success: true,
                data: result.songs,
                total: result.total,
                page: result.page,
                pages: result.pages,
            });
        } catch (error: any) {
            console.error('getSongs error:', error);
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ success: false, message: error.message });
        }
    };

    /**
     * GET /api/songs/:id — Retrieve single song details.
     */
    getSong = async (req: Request, res: Response): Promise<void> => {
        try {
            const song = await this.songService.getSongById(req.params.id);
            res.status(200).json({ success: true, data: song });
        } catch (error: any) {
            console.error('getSong error:', error);
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ success: false, message: error.message });
        }
    };

    /**
     * POST /api/songs — Create a new song (Artist only).
     */
    createSong = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const { title, genre, duration, filePath, coverArt, description } = req.body;

            const song = await this.songService.createSong(
                { id: req.user.id, type: req.user.type },
                { title, genre, duration, filePath, coverArt, description }
            );

            res.status(201).json({ success: true, message: 'Song created', data: song });
        } catch (error: any) {
            console.error('createSong error:', error);
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ success: false, message: error.message });
        }
    };

    /**
     * PUT /api/songs/:id — Update song metadata (Artist owner or Admin).
     */
    updateSong = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            const { title, genre, duration } = req.body;

            const updatedSong = await this.songService.updateSong(
                { id: req.user.id, type: req.user.type },
                req.params.id,
                { title, genre, duration }
            );

            res.status(200).json({ success: true, message: 'Song updated', data: updatedSong });
        } catch (error: any) {
            console.error('updateSong error:', error);
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ success: false, message: error.message });
        }
    };

    /**
     * DELETE /api/songs/:id — Delete a song (Artist owner or Admin).
     */
    deleteSong = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }

            await this.songService.deleteSong(
                { id: req.user.id, type: req.user.type },
                req.params.id
            );

            res.status(200).json({ success: true, message: 'Song deleted' });
        } catch (error: any) {
            console.error('deleteSong error:', error);
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ success: false, message: error.message });
        }
    };

    /**
     * POST /api/songs/:id/play — Record a play event and log listening history.
     */
    trackPlay = async (req: Request, res: Response): Promise<void> => {
        try {
            const plays = await this.songService.trackPlay(req.params.id, req.user?.id);
            res.status(200).json({ success: true, plays });
        } catch (error: any) {
            console.error('trackPlay error:', error);
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ success: false, message: error.message });
        }
    };
}

// Default export an instance pre-wired with the default SongService
import songServiceInstance from '../services/SongService';

export default new SongController(songServiceInstance);
