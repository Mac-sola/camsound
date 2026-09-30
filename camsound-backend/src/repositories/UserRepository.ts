import User, { IUser } from '../models/User';

/**
 * UserRepository
 * 
 * Responsibility: Direct database operations (CRUD) for the User model.
 * Does NOT contain HTTP logic or business rules.
 */
export class UserRepository {
    /**
     * Find a single user by their email address.
     */
    async findByEmail(email: string): Promise<IUser | null> {
        return User.findOne({ email });
    }

    /**
     * Find a user by their unique MongoDB ObjectId.
     * Excludes the password hash by default for safety unless requested.
     */
    async findById(id: string, includePassword = false): Promise<IUser | null> {
        if (includePassword) {
            return User.findById(id);
        }
        return User.findById(id).select('-password') as unknown as (IUser | null);
    }

    /**
     * Create and persist a new user record in MongoDB.
     */
    async create(userData: Partial<IUser>): Promise<IUser> {
        return User.create(userData);
    }

    /**
     * Update an existing user's profile information.
     */
    async updateProfile(id: string, profileData: Partial<IUser>): Promise<IUser | null> {
        return User.findByIdAndUpdate(
            id,
            profileData,
            { new: true, runValidators: true }
        ).select('-password') as unknown as (IUser | null);
    }

    /**
     * Update the user's last login timestamp.
     */
    async updateLastLogin(id: string): Promise<void> {
        await User.findByIdAndUpdate(id, { lastLogin: new Date() });
    }

    /**
     * Update the user's password hash.
     */
    async updatePassword(id: string, newPasswordPlain: string): Promise<void> {
        const user = await User.findById(id);
        if (user) {
            user.password = newPasswordPlain;
            // The Mongoose pre-save hook on the User model will automatically hash this password
            await user.save();
        }
    }
}

export default new UserRepository();
