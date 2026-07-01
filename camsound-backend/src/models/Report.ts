import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReport extends Document {
    reporterId: Types.ObjectId;
    reportedUserId?: Types.ObjectId;
    reportedSongId?: Types.ObjectId;
    type: 'user' | 'song' | 'playlist';
    reason?: string;
    status: 'pending' | 'reviewed' | 'resolved';
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;
}

const ReportSchema = new Schema<IReport>(
    {
        reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        reportedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
        reportedSongId: { type: Schema.Types.ObjectId, ref: 'Song' },
        type: { type: String, enum: ['user', 'song', 'playlist'], required: true },
        reason: { type: String },
        status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: { type: Date },
    },
    { timestamps: true }
);

ReportSchema.index({ status: 1 });

const Report = mongoose.model<IReport>('Report', ReportSchema);
export default Report;
