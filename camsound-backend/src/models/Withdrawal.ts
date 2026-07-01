import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IWithdrawal extends Document {
    artistId: Types.ObjectId;
    amount: number;
    momoNumber: string;
    status: 'pending' | 'completed' | 'failed';
    transactionId?: string;
    processedAt?: Date;
}

const WithdrawalSchema = new Schema<IWithdrawal>(
    {
        artistId: { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
        amount: { type: Number, required: true },
        momoNumber: { type: String, required: true, trim: true },
        status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
        transactionId: { type: String },
        processedAt: { type: Date },
    },
    { timestamps: true }
);

WithdrawalSchema.index({ artistId: 1, status: 1 });

const Withdrawal = mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema);
export default Withdrawal;
