import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISubscription extends Document {
    userId: Types.ObjectId;
    planId?: Types.ObjectId;
    planName: string;
    amount: number;
    currency: string;
    status: 'active' | 'expired' | 'cancelled';
    startDate: Date;
    endDate: Date;
    autoRenew: boolean;
    paymentTransactionId?: string;
    cancelledAt?: Date;
    cancelReason?: string;
}

const SubscriptionSchema = new Schema<ISubscription>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        planId: { type: Schema.Types.ObjectId, ref: 'Plan' },
        planName: { type: String, required: true },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'XAF' },
        status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        autoRenew: { type: Boolean, default: false },
        paymentTransactionId: { type: String },
        cancelledAt: { type: Date },
        cancelReason: { type: String },
    },
    { timestamps: true }
);

SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ endDate: 1, status: 1 }); // For expiry checker queries

const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
export default Subscription;
