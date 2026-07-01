import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IListeningHistory extends Document {
    userId: Types.ObjectId;
    songId: Types.ObjectId;
    playedAt: Date;
}

const ListeningHistorySchema = new Schema<IListeningHistory>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
        playedAt: { type: Date, default: Date.now },
    },
    { timestamps: false }
);

ListeningHistorySchema.index({ userId: 1, playedAt: -1 });
ListeningHistorySchema.index({ songId: 1 });

const ListeningHistory = mongoose.model<IListeningHistory>('ListeningHistory', ListeningHistorySchema);
export default ListeningHistory;
