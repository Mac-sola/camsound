import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAdRevenue extends Document {
    source: string;
    amount: number;
    currency: string;
    description?: string;
    date: Date;
}

const AdRevenueSchema = new Schema<IAdRevenue>(
    {
        source: { type: String, required: true, trim: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'XAF' },
        description: { type: String },
        date: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

AdRevenueSchema.index({ date: -1 });

const AdRevenue = mongoose.model<IAdRevenue>('AdRevenue', AdRevenueSchema);
export default AdRevenue;
