import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    phone?: string;
    password: string;
    firstName?: string;
    lastName?: string;
    type: 'fan' | 'artist' | 'admin';
    status: 'active' | 'pending' | 'blocked';
    accountNotes?: string;
    avatar?: string;
    bio?: string;
    lastLogin?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone: { type: String, trim: true },
        password: { type: String, required: true, minlength: 6 },
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        type: { type: String, enum: ['fan', 'artist', 'admin'], default: 'fan' },
        status: { type: String, enum: ['active', 'pending', 'blocked'], default: 'active' },
        accountNotes: { type: String, default: '' },
        avatar: { type: String, default: '' },
        bio: { type: String, default: '' },
        lastLogin: { type: Date },
    },
    { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare passwords
UserSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
