import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Store files in memory so we can stream them to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowedAudioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];
    const extension = path.extname(file.originalname).toLowerCase();
    const isAudio = file.fieldname === 'song_file';
    const isCoverArt = file.fieldname === 'cover_art' || file.fieldname === 'profile_image';
    const isFallbackAudio = isAudio && file.mimetype === 'application/octet-stream' && allowedAudioExtensions.includes(extension);
    const isValidAudio = isAudio && (file.mimetype.startsWith('audio/') || isFallbackAudio);
    const isValidImage = isCoverArt && file.mimetype.startsWith('image/');

    if (isValidAudio || isValidImage) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
};

// 50MB max for audio, 5MB for images — multer applies per-file, controller enforces type limits
export const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter,
});
