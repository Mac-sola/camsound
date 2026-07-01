import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISong extends Document {
    title: string;
    artistId: Types.ObjectId;
    genre?: string;
    duration?: string;
    plays: number;
    likes: number;
    downloads: number;
    filePath?: string;
    coverArt?: string;
    cloudinaryAudioId?: string;
    cloudinaryImageId?: string;
    status: 'active' | 'pending' | 'blocked';
    moderationStatus: 'pending' | 'approved' | 'rejected';
    moderationNotes?: string;
    moderatedBy?: Types.ObjectId;
    moderatedAt?: Date;
}

const SongSchema = new Schema<ISong>(
    {
        title: { type: String, required: true, trim: true },
        artistId: { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
        genre: { type: String, trim: true },
        duration: { type: String },
        plays: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        downloads: { type: Number, default: 0 },
        filePath: { type: String },
        coverArt: { type: String },
        cloudinaryAudioId: { type: String },
        cloudinaryImageId: { type: String },
        status: { type: String, enum: ['active', 'pending', 'blocked'], default: 'active' },
        moderationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        moderationNotes: { type: String },
        moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        moderatedAt: { type: Date },
    },
    { timestamps: true }
);

// Index for fast searches by artist and status
SongSchema.index({ artistId: 1, status: 1 });
SongSchema.index({ status: 1, moderationStatus: 1 });

const Song = mongoose.model<ISong>('Song', SongSchema);
export default Song;
