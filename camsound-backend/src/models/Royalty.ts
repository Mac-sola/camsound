import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRoyalty extends Document {
    artistId: Types.ObjectId;
    songId: Types.ObjectId;
    amount: number;
    periodStart?: Date;
    periodEnd?: Date;
    playsCount?: number;
    status: 'pending' | 'paid';
    paidAt?: Date;
}

const RoyaltySchema = new Schema<IRoyalty>(
    {
        artistId: { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
        songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
        amount: { type: Number, required: true },
        periodStart: { type: Date },
        periodEnd: { type: Date },
        playsCount: { type: Number },
        status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
        paidAt: { type: Date },
    },
    { timestamps: true }
);

RoyaltySchema.index({ artistId: 1, status: 1 });

const Royalty = mongoose.model<IRoyalty>('Royalty', RoyaltySchema);
export default Royalty;
