import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAdminLog extends Document {
    adminId: Types.ObjectId;
    action: string;
    target?: string;
    details?: string;
}

const AdminLogSchema = new Schema<IAdminLog>(
    {
        adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        action: { type: String, required: true },
        target: { type: String },
        details: { type: String },
    },
    { timestamps: true }
);

AdminLogSchema.index({ adminId: 1, createdAt: -1 });

const AdminLog = mongoose.model<IAdminLog>('AdminLog', AdminLogSchema);
export default AdminLog;
