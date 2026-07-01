import mongoose, { Document, Schema, Types } from 'mongoose';

// Tracks user→artist follows (replacing MySQL follows junction table)
export interface IFollow extends Document {
    userId: Types.ObjectId;
    artistId: Types.ObjectId;
}

const FollowSchema = new Schema<IFollow>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        artistId: { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
    },
    { timestamps: true }
);

// Unique constraint: a user can only follow an artist once
FollowSchema.index({ userId: 1, artistId: 1 }, { unique: true });

const Follow = mongoose.model<IFollow>('Follow', FollowSchema);
export default Follow;
