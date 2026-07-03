import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFeaturedContent extends Document {
    type: 'song' | 'artist' | 'playlist';
    itemId: Types.ObjectId;
    title: string;
    description?: string;
    image?: string;
    priority: number;
    isActive: boolean;
}

const FeaturedContentSchema = new Schema<IFeaturedContent>(
    {
        type: { type: String, enum: ['song', 'artist', 'playlist'], required: true },
        itemId: { type: Schema.Types.ObjectId, required: true },
        title: { type: String, required: true, trim: true },
        description: { type: String },
        image: { type: String },
        priority: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

FeaturedContentSchema.index({ priority: -1, isActive: -1 });

const FeaturedContent = mongoose.model<IFeaturedContent>('FeaturedContent', FeaturedContentSchema);
export default FeaturedContent;
