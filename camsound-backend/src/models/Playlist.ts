import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPlaylist extends Document {
    userId: Types.ObjectId;
    name: string;
    description?: string;
    isPublic: boolean;
    songs: Types.ObjectId[];
}

const PlaylistSchema = new Schema<IPlaylist>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        isPublic: { type: Boolean, default: false },
        songs: [{ type: Schema.Types.ObjectId, ref: 'Song' }],
    },
    { timestamps: true }
);

PlaylistSchema.index({ userId: 1 });

const Playlist = mongoose.model<IPlaylist>('Playlist', PlaylistSchema);
export default Playlist;
