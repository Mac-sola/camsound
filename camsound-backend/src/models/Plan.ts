import mongoose, { Document, Schema } from 'mongoose';

export interface IPlan extends Document {
    name: string;
    price: number;
    currency: string;
    period: string;
    description?: string;
    features: string[];
    isPopular: boolean;
    buttonText: string;
    buttonStyle: string;
}

const PlanSchema = new Schema<IPlan>(
    {
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true },
        currency: { type: String, default: 'FCFA' },
        period: { type: String, default: '/month' },
        description: { type: String },
        features: [{ type: String }],
        isPopular: { type: Boolean, default: false },
        buttonText: { type: String, default: 'Choose Plan' },
        buttonStyle: { type: String, default: 'btn-outline-primary' },
    },
    { timestamps: true }
);

const Plan = mongoose.model<IPlan>('Plan', PlanSchema);
export default Plan;
