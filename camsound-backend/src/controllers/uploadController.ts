import { NextFunction, Request, Response } from 'express';
import { upload } from '../middleware/upload';
import { uploadAudio, uploadImage, deleteFile } from '../utils/cloudinary';
import Song from '../models/Song';
import Artist from '../models/Artist';
import User from '../models/User';
import { randomBytes } from 'crypto';

const genId = () => randomBytes(8).toString('hex');

const uploadSongFiles = (req: Request, res: Response, next: NextFunction) => {
    upload.fields([{ name: 'song_file', maxCount: 1 }, { name: 'cover_art', maxCount: 1 }])(req, res, (error) => {
        if (error) {
            return res.status(400).json({ success: false, message: error.message || 'Invalid upload' });
        }
        next();
    });
};

// POST /api/upload/song — multipart: song_file + optional cover_art
export const uploadSong = [
    uploadSongFiles,
    async (req: Request, res: Response) => {
        try {
            // Check user type
            if (req.user?.type !== 'artist') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Only artist accounts can upload songs' 
                });
            }

            // Get artist profile
            const artist = await Artist.findOne({ userId: req.user.id });
            if (!artist) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Artist profile not found' 
                });
            }

            // Validate files
            const files = req.files as Record<string, Express.Multer.File[]>;
            if (!files?.song_file?.[0]) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Song file is required' 
                });
            }

            // Validate audio file type
            const audioFile = files.song_file[0];
            if (audioFile.size > 50 * 1024 * 1024) {
                return res.status(400).json({ success: false, message: 'Audio file must be smaller than 50MB' });
            }
            const acceptedAudioTypes = ['audio/'];
            const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];
            const audioExt = audioFile.originalname ? audioFile.originalname.toLowerCase().split('.').pop() : '';
            const isValidAudio = acceptedAudioTypes.some((type) => audioFile.mimetype.startsWith(type))
                || (audioFile.mimetype === 'application/octet-stream' && audioExtensions.includes(`.${audioExt}`));

            if (!isValidAudio) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid file type. Please upload an audio file (MP3, WAV, etc.)' 
                });
            }

            // Legacy PHP contract expects an explicit upload type, so keep that compatibility layer here.
            const uploadType = String(req.body.upload_type || 'song').toLowerCase().trim();
            if (uploadType !== 'song') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid upload type' 
                });
            }

            // Validate body fields
            const { title, genre } = req.body;
            if (!title || !title.trim()) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Track title is required' 
                });
            }
            if (!genre || !genre.trim()) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Genre is required' 
                });
            }

            // Upload audio to Cloudinary (or mock)
            const audioResult = await uploadAudio(audioFile.buffer, `song_${genId()}`, audioExt || 'mp3');
            const duration = audioResult.duration 
                ? `${Math.floor(audioResult.duration / 60)}:${String(Math.floor(audioResult.duration % 60)).padStart(2, '0')}`
                : '3:00';

            // Upload cover art if provided
            let coverArtUrl: string | undefined;
            let coverArtId: string | undefined;
            if (files?.cover_art?.[0]) {
                const coverFile = files.cover_art[0];
                if (coverFile.size > 5 * 1024 * 1024) {
                    return res.status(400).json({ success: false, message: 'Cover art must be smaller than 5MB' });
                }
                if (!coverFile.mimetype.startsWith('image/')) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Invalid cover art. Please upload an image file (PNG, JPG, etc.)' 
                    });
                }
                const imageResult = await uploadImage(
                    coverFile.buffer, 
                    `cover_${genId()}`, 
                    'camsound/artwork',
                    coverFile.originalname?.toLowerCase().split('.').pop() || 'jpg'
                );
                coverArtUrl = imageResult.secure_url;
                coverArtId = imageResult.public_id;
            }

            // Create song document
            const song = await Song.create({
                title: title.trim(),
                artistId: artist._id,
                genre: genre.trim(),
                duration,
                filePath: audioResult.secure_url,
                coverArt: coverArtUrl,
                cloudinaryAudioId: audioResult.public_id,
                cloudinaryImageId: coverArtId,
                status: 'active',
                moderationStatus: 'approved',
            });

            // Update artist song count
            await Artist.findByIdAndUpdate(artist._id, { $inc: { songsCount: 1 } });

            res.status(201).json({ 
                success: true, 
                message: 'Song uploaded successfully and is pending moderation',
                data: {
                    id: song._id,
                    title: song.title,
                    artistId: song.artistId,
                    genre: song.genre,
                    duration: song.duration,
                    filePath: song.filePath,
                    coverArt: song.coverArt,
                    status: song.status,
                    moderationStatus: song.moderationStatus,
                }
            });
        } catch (error: any) {
            console.error('Upload error:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Upload failed. Please try again.' 
            });
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
            if (req.file.size > 5 * 1024 * 1024) {
                return res.status(400).json({ success: false, message: 'Image file must be smaller than 5MB' });
            }
            if (!req.file.mimetype.startsWith('image/')) {
                return res.status(400).json({ success: false, message: 'Only image files are allowed' });
            }
            const result = await uploadImage(
                req.file.buffer,
                `avatar_${genId()}`,
                'camsound/avatars',
                req.file.originalname?.toLowerCase().split('.').pop() || 'jpg'
            );

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
            if (req.file.size > 5 * 1024 * 1024) {
                return res.status(400).json({ success: false, message: 'Cover art must be smaller than 5MB' });
            }
            if (!req.file.mimetype.startsWith('image/')) {
                return res.status(400).json({ success: false, message: 'Only image files are allowed' });
            }
            const result = await uploadImage(
                req.file.buffer,
                `cover_${genId()}`,
                'camsound/artwork',
                req.file.originalname?.toLowerCase().split('.').pop() || 'jpg'
            );
            res.json({ success: true, message: 'Cover art uploaded', data: { file_path: result.secure_url } });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
];
