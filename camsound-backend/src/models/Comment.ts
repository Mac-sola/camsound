import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IComment extends Document {
    userId: Types.ObjectId;
    songId: Types.ObjectId;
    content: string;
    parentId?: Types.ObjectId;
    isPinned: boolean;
}

const CommentSchema = new Schema<IComment>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
        content: { type: String, required: true, trim: true },
        parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
        isPinned: { type: Boolean, default: false },
    },
    { timestamps: true }
);

CommentSchema.index({ songId: 1, createdAt: -1 });

const Comment = mongoose.model<IComment>('Comment', CommentSchema);
export default Comment;
