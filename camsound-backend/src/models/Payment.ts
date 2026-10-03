import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPayment extends Document {
    userId: Types.ObjectId;
    subscriptionId?: Types.ObjectId;
    amount: number;
    currency: string;
    paymentMethod?: string;
    transactionId?: string;
    gatewayTransactionId?: string;
    phone?: string;
    purpose: 'subscription' | 'tip' | 'withdrawal' | 'other';
    metadata?: Record<string, any>;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
}

const PaymentSchema = new Schema<IPayment>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'XAF' },
        paymentMethod: { type: String },
        transactionId: { type: String },
        gatewayTransactionId: { type: String },
        phone: { type: String },
        purpose: { type: String, enum: ['subscription', 'tip', 'withdrawal', 'other'], default: 'other' },
        metadata: { type: Schema.Types.Mixed },
        status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    },
    { timestamps: true }
);

PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ transactionId: 1 });

const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
export default Payment;
