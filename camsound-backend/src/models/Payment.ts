import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPayment extends Document {
    userId: Types.ObjectId;
    subscriptionId?: Types.ObjectId;
    amount: number;
    currency: string;
    paymentMethod?: string;
    transactionId?: string;
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
        status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    },
    { timestamps: true }
);

const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
export default Payment;
