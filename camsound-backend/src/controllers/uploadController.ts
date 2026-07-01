import { Request, Response } from 'express';
import { upload } from '../middleware/upload';
import { uploadAudio, uploadImage, deleteFile } from '../utils/cloudinary';
import Song from '../models/Song';
import Artist from '../models/Artist';
import User from '../models/User';
import { randomBytes } from 'crypto';

const genId = () => randomBytes(8).toString('hex');

// POST /api/upload/song — multipart: song_file + optional cover_art
export const uploadSong = [
    upload.fields([{ name: 'song_file', maxCount: 1 }, { name: 'cover_art', maxCount: 1 }]),
    async (req: Request, res: Response) => {
        try {
            if (req.user?.type !== 'artist') {
                return res.status(403).json({ success: false, message: 'Only artist accounts can upload songs' });
            }
            const artist = await Artist.findOne({ userId: req.user.id });
            if (!artist) return res.status(404).json({ success: false, message: 'Artist profile not found' });

            const files = req.files as Record<string, Express.Multer.File[]>;
            if (!files?.song_file?.[0]) {
                return res.status(400).json({ success: false, message: 'Song file is required' });
            }

            const { title, genre } = req.body;
            if (!title || !genre) {
                return res.status(400).json({ success: false, message: 'Title and genre are required' });
            }

            // Upload audio to Cloudinary
            const audioFile = files.song_file[0];
            const audioResult = await uploadAudio(audioFile.buffer, `song_${genId()}`);
            const duration = audioResult.duration ? `${Math.floor(audioResult.duration / 60)}:${String(Math.floor(audioResult.duration % 60)).padStart(2, '0')}` : '0:00';

            // Upload cover art if provided
            let coverArtUrl: string | undefined;
            let coverArtId: string | undefined;
            if (files?.cover_art?.[0]) {
                const imageResult = await uploadImage(files.cover_art[0].buffer, `cover_${genId()}`, 'camsound/artwork');
                coverArtUrl = imageResult.secure_url;
                coverArtId = imageResult.public_id;
            }

            const song = await Song.create({
                title,
                artistId: artist._id,
                genre,
                duration,
                filePath: audioResult.secure_url,
                coverArt: coverArtUrl,
                cloudinaryAudioId: audioResult.public_id,
                cloudinaryImageId: coverArtId,
                status: 'active',
                moderationStatus: 'pending',
            });
            await Artist.findByIdAndUpdate(artist._id, { $inc: { songsCount: 1 } });

            res.status(201).json({ success: true, message: 'Song uploaded successfully', data: song });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
];

// POST /api/upload/avatar — profile image
export const uploadAvatar = [
    upload.single('profile_image'),
    async (req: Request, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Image file is required' });
            }
            if (!req.file.mimetype.startsWith('image/')) {
                return res.status(400).json({ success: false, message: 'Only image files are allowed' });
            }
            const result = await uploadImage(req.file.buffer, `avatar_${genId()}`, 'camsound/avatars');

            await User.findByIdAndUpdate(req.user?.id, { avatar: result.secure_url });

            // Sync artist image if user is an artist
            if (req.user?.type === 'artist') {
                await Artist.findOneAndUpdate({ userId: req.user.id }, { image: result.secure_url });
            }
            res.json({ success: true, message: 'Profile photo updated', data: { file_path: result.secure_url } });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
];

// POST /api/upload/artwork — standalone cover art
export const uploadArtwork = [
    upload.single('cover_art'),
    async (req: Request, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'Cover art file is required' });
            }
            if (!req.file.mimetype.startsWith('image/')) {
                return res.status(400).json({ success: false, message: 'Only image files are allowed' });
            }
            const result = await uploadImage(req.file.buffer, `cover_${genId()}`, 'camsound/artwork');
            res.json({ success: true, message: 'Cover art uploaded', data: { file_path: result.secure_url } });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
];
