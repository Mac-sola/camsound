import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISubscription extends Document {
    userId: Types.ObjectId;
    planName: string;
    amount: number;
    status: 'active' | 'expired' | 'cancelled';
    startDate: Date;
    endDate: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        planName: { type: String, required: true },
        amount: { type: Number, required: true },
        status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
    },
    { timestamps: true }
);

SubscriptionSchema.index({ userId: 1, status: 1 });

const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
export default Subscription;
