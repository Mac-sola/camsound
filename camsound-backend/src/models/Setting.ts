import mongoose, { Document, Schema } from 'mongoose';

// Platform-wide key-value settings (replaces MySQL settings table)
export interface ISetting extends Document {
    key: string;
    value: string;
}

const SettingSchema = new Schema<ISetting>(
    {
        key: { type: String, required: true, unique: true, trim: true },
        value: { type: String },
    },
    { timestamps: true }
);

const Setting = mongoose.model<ISetting>('Setting', SettingSchema);
export default Setting;
