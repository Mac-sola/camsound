import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
    userId: Types.ObjectId;
    message: string;
    type: string;
    targetId?: Types.ObjectId;
    isRead: boolean;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, required: true },
        type: { type: String, default: 'system' },
        targetId: { type: Schema.Types.ObjectId },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1 });

const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;
