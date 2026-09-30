import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Response } from 'express';
import { UserRepository } from '../repositories/UserRepository';
import { ArtistRepository } from '../repositories/ArtistRepository';
import { IUser } from '../models/User';

export interface SignupInput {
    name: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
    type?: 'fan' | 'artist';
}

export interface AuthResult {
    user: Partial<IUser>;
    token: string;
    csrfToken: string;
}

/**
 * AuthService
 * 
 * Responsibility: Contains all business rules and authentication domain logic.
 * Communicates with Repositories for data access.
 * Does NOT deal with Express Request/Response objects directly (except helper for cookie setting).
 */
export class AuthService {
    private userRepository: UserRepository;
    private artistRepository: ArtistRepository;

    /**
     * Dependency Injection:
     * Receives repositories so it doesn't create them internally or couple to direct Mongoose calls.
     */
    constructor(userRepository: UserRepository, artistRepository: ArtistRepository) {
        this.userRepository = userRepository;
        this.artistRepository = artistRepository;
    }

    /**
     * Generate a cryptographically secure random token for CSRF protection.
     */
    createCsrfToken(): string {
        return crypto.randomBytes(18).toString('hex');
    }

    /**
     * Generate a signed JWT token containing user identity and CSRF token.
     */
    generateToken(id: string, email: string, type: string, csrfToken: string): string {
        const secret = process.env.JWT_SECRET || 'camsound_super_secret_key_2026';
        return jwt.sign({ id, email, type, csrfToken }, secret, { expiresIn: '7d' });
    }

    /**
     * Set the HTTP-only authentication cookie on the response.
     */
    setAuthCookie(res: Response, token: string): void {
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        });
    }

    /**
     * Clean and format the authentication response payload expected by the frontend.
     */
    buildAuthResponse(user: any, token: string, csrfToken: string) {
        const cleanUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            type: user.type,
            status: user.status,
            country: user.country,
            subscriptionStatus: user.subscriptionStatus,
            avatar: user.avatar,
            bio: user.bio,
        };

        return {
            success: true,
            message: 'Authentication successful',
            token,
            csrfToken,
            data: {
                user: cleanUser,
                token,
                csrfToken,
            },
            user: cleanUser,
        };
    }

    /**
     * Execute user registration workflow:
     * 1. Validate inputs
     * 2. Ensure email uniqueness
     * 3. Persist user
     * 4. Provision artist profile if user selected 'artist' type
     * 5. Generate authentication credentials (JWT + CSRF)
     */
    async signup(input: SignupInput): Promise<AuthResult> {
        const { name, email, password, phone, country, type = 'fan' } = input;

        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const normalizedName = typeof name === 'string' ? name.trim() : '';
        const normalizedCountry = typeof country === 'string' ? country.trim() : undefined;

        // Validation rules
        if (!normalizedName || !normalizedEmail || typeof password !== 'string') {
            throw new Error('Name, email and password are required');
        }
        if (normalizedName.length < 2) {
            throw new Error('Name must be at least 2 characters long');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            throw new Error('Please provide a valid email address');
        }
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }
        const allowedTypes = ['fan', 'artist'];
        if (!allowedTypes.includes(type)) {
            throw new Error('Invalid user type');
        }

        // Check if user already exists
        const existingUser = await this.userRepository.findByEmail(normalizedEmail);
        if (existingUser) {
            const error: any = new Error('Email already registered');
            error.statusCode = 400;
            throw error;
        }

        const subscriptionStatus = type === 'artist' ? 'artist' : 'free';

        // Persist new user via repository
        const user = await this.userRepository.create({
            name: normalizedName,
            email: normalizedEmail,
            password,
            phone,
            country: normalizedCountry,
            type,
            subscriptionStatus,
        });

        // If the user registered as an artist, automatically create their artist profile
        if (type === 'artist') {
            await this.artistRepository.createProfile({
                userId: user._id,
                name: normalizedName,
            });
        }

        const csrfToken = this.createCsrfToken();
        const token = this.generateToken(user._id.toString(), user.email, user.type, csrfToken);

        return { user, token, csrfToken };
    }

    /**
     * Execute user login workflow:
     * 1. Validate email and password presence
     * 2. Find user by email
     * 3. Verify account status
     * 4. Verify password match
     * 5. Update last login timestamp
     * 6. Generate authentication tokens
     */
    async login(email: string, password: string): Promise<AuthResult> {
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

        if (!normalizedEmail || !password) {
            const error: any = new Error('Email and password required');
            error.statusCode = 400;
            throw error;
        }

        const user = await this.userRepository.findByEmail(normalizedEmail);
        if (!user) {
            const error: any = new Error('Invalid credentials');
            error.statusCode = 401;
            throw error;
        }

        if (user.status !== 'active') {
            const error: any = new Error('Account is not active');
            error.statusCode = 403;
            throw error;
        }

        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            const error: any = new Error('Invalid credentials');
            error.statusCode = 401;
            throw error;
        }

        // Update login timestamp
        await this.userRepository.updateLastLogin(user._id.toString());

        const csrfToken = this.createCsrfToken();
        const token = this.generateToken(user._id.toString(), user.email, user.type, csrfToken);

        return { user, token, csrfToken };
    }

    /**
     * Retrieve public profile of an authenticated user.
     */
    async getProfile(userId: string) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            const error: any = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        return user;
    }

    /**
     * Update an authenticated user's profile details.
     */
    async updateProfile(userId: string, data: { name?: string; phone?: string; bio?: string; country?: string }) {
        const updatedUser = await this.userRepository.updateProfile(userId, data);
        if (!updatedUser) {
            const error: any = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        return updatedUser;
    }

    /**
     * Verify old password and change to new password.
     */
    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        if (!currentPassword || !newPassword) {
            const error: any = new Error('Current and new password are required');
            error.statusCode = 400;
            throw error;
        }
        if (newPassword.length < 6) {
            const error: any = new Error('New password must be at least 6 characters');
            error.statusCode = 400;
            throw error;
        }

        // Retrieve user with password included for comparison
        const user = await this.userRepository.findById(userId, true);
        if (!user) {
            const error: any = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        const isValid = await user.comparePassword(currentPassword);
        if (!isValid) {
            const error: any = new Error('Incorrect current password');
            error.statusCode = 400;
            throw error;
        }

        await this.userRepository.updatePassword(userId, newPassword);
    }
}

// Default instance using standard singleton repositories
import userRepositoryInstance from '../repositories/UserRepository';
import artistRepositoryInstance from '../repositories/ArtistRepository';

export default new AuthService(userRepositoryInstance, artistRepositoryInstance);
