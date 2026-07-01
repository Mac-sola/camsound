import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActivityLog extends Document {
    userId?: Types.ObjectId;
    action: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
}

const ActivityLogSchema = new Schema<IActivityLog>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        action: { type: String, required: true },
        details: { type: String },
        ipAddress: { type: String },
        userAgent: { type: String },
    },
    { timestamps: true }
);

ActivityLogSchema.index({ userId: 1 });
ActivityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
export default ActivityLog;
