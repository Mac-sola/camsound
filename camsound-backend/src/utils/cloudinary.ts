import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary if credentials are provided
if (process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

const isCloudinaryConfigured = () => {
    return process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_API_KEY && 
           !process.env.CLOUDINARY_NAME.includes('your_') &&
           !process.env.CLOUDINARY_API_KEY.includes('your_');
};

// Mock upload for testing when Cloudinary is not configured
const mockUpload = (type: 'audio' | 'image', publicId: string) => {
    if (type === 'audio') {
        return {
            secure_url: `https://mock-cdn.example.com/audio/${publicId}.mp3`,
            public_id: publicId,
            duration: 180, // Mock 3-minute duration
        };
    }
    return {
        secure_url: `https://mock-cdn.example.com/image/${publicId}.jpg`,
        public_id: publicId,
    };
};

/**
 * Upload an audio buffer (MP3/WAV/OGG) to Cloudinary under the songs/ folder.
 */
export const uploadAudio = (
    buffer: Buffer,
    publicId: string
): Promise<{ secure_url: string; public_id: string; duration?: number }> => {
    // Use mock if Cloudinary is not configured
    if (!isCloudinaryConfigured()) {
        return Promise.resolve(mockUpload('audio', publicId));
    }

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'video', // Cloudinary uses 'video' for audio files
                folder: 'camsound/songs',
                public_id: publicId,
                overwrite: true,
            },
            (error, result) => {
                if (error || !result) return reject(error || new Error('Upload failed'));
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                    duration: result.duration,
                });
            }
        );
        stream.end(buffer);
    });
};

/**
 * Upload an image buffer (JPEG/PNG/WEBP) to Cloudinary under the given folder.
 */
export const uploadImage = (
    buffer: Buffer,
    publicId: string,
    folder: 'camsound/artwork' | 'camsound/avatars' = 'camsound/artwork'
): Promise<{ secure_url: string; public_id: string }> => {
    // Use mock if Cloudinary is not configured
    if (!isCloudinaryConfigured()) {
        return Promise.resolve(mockUpload('image', publicId));
    }

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                folder,
                public_id: publicId,
                overwrite: true,
                transformation: [{ quality: 'auto', fetch_format: 'auto' }],
            },
            (error, result) => {
                if (error || !result) return reject(error || new Error('Upload failed'));
                resolve({ secure_url: result.secure_url, public_id: result.public_id });
            }
        );
        stream.end(buffer);
    });
};

/**
 * Delete a file from Cloudinary by its public_id.
 */
export const deleteFile = async (
    publicId: string,
    resourceType: 'image' | 'video' = 'image'
): Promise<void> => {
    // Skip delete if Cloudinary is not configured (mock mode)
    if (!isCloudinaryConfigured()) {
        return Promise.resolve();
    }
    
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

export default cloudinary;
