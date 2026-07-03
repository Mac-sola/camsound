import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotificationSetting extends Document {
    userId: Types.ObjectId;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
}

const NotificationSettingSchema = new Schema<INotificationSetting>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        emailNotifications: { type: Boolean, default: true },
        smsNotifications: { type: Boolean, default: false },
        pushNotifications: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const NotificationSetting = mongoose.model<INotificationSetting>('NotificationSetting', NotificationSettingSchema);
export default NotificationSetting;
