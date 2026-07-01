import mongoose, { Document, Schema, Types } from 'mongoose';

// Tracks which songs a user has liked (replacing MySQL user_likes junction table)
export interface IUserLike extends Document {
    userId: Types.ObjectId;
    songId: Types.ObjectId;
}

const UserLikeSchema = new Schema<IUserLike>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
    },
    { timestamps: true }
);

// Unique constraint: a user can only like a song once
UserLikeSchema.index({ userId: 1, songId: 1 }, { unique: true });

const UserLike = mongoose.model<IUserLike>('UserLike', UserLikeSchema);
export default UserLike;
