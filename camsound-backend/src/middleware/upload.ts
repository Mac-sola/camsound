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
    const allowedMimeTypes = [
        // Audio
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/x-wav',
        'audio/ogg',
        'application/ogg',
        'audio/aac',
        'audio/flac',
        'application/octet-stream',
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    const allowedAudioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'];
    const extension = path.extname(file.originalname).toLowerCase();
    const isFallbackAudio = file.mimetype === 'application/octet-stream' && allowedAudioExtensions.includes(extension);

    if (allowedMimeTypes.includes(file.mimetype) || isFallbackAudio) {
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
