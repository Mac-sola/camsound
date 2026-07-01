import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IArtist extends Document {
    userId: Types.ObjectId;
    name: string;
    realName?: string;
    genre?: string;
    followers: number;
    songsCount: number;
    status: 'verified' | 'pending' | 'rejected';
    verification: 'approved' | 'pending' | 'rejected';
    bio?: string;
    image?: string;
    location?: string;
    instagramUrl?: string;
    twitterUrl?: string;
    facebookUrl?: string;
    youtubeUrl?: string;
    website?: string;
}

const ArtistSchema = new Schema<IArtist>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true, trim: true },
        realName: { type: String, trim: true },
        genre: { type: String, trim: true },
        followers: { type: Number, default: 0 },
        songsCount: { type: Number, default: 0 },
        status: { type: String, enum: ['verified', 'pending', 'rejected'], default: 'pending' },
        verification: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'pending' },
        bio: { type: String, default: '' },
        image: { type: String, default: '' },
        location: { type: String, trim: true },
        instagramUrl: { type: String },
        twitterUrl: { type: String },
        facebookUrl: { type: String },
        youtubeUrl: { type: String },
        website: { type: String },
    },
    { timestamps: true }
);

const Artist = mongoose.model<IArtist>('Artist', ArtistSchema);
export default Artist;
