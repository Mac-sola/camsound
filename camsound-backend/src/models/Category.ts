import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    description?: string;
    parentId?: Types.ObjectId;
    isActive: boolean;
}

const CategorySchema = new Schema<ICategory>(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String },
        parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Category = mongoose.model<ICategory>('Category', CategorySchema);
export default Category;
