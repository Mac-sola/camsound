import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Artist from '../models/Artist';

const generateToken = (id: string, email: string, type: string) => {
    return jwt.sign({ id, email, type }, process.env.JWT_SECRET!, { expiresIn: '7d' });
};

export const signup = async (req: Request, res: Response) => {
    try {
        const { name, email, password, phone, country, type = 'fan' } = req.body;
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const normalizedName = typeof name === 'string' ? name.trim() : name;
        const normalizedCountry = typeof country === 'string' ? country.trim() : undefined;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }
        const allowedTypes = ['fan', 'artist'];
        if (!allowedTypes.includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid user type' });
        }
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        const subscriptionStatus = type === 'artist' ? 'artist' : 'free';
        const user = await User.create({
            name: normalizedName,
            email: normalizedEmail,
            password,
            phone,
            country: normalizedCountry,
            type,
            subscriptionStatus,
        });

        // Auto-create artist profile if signing up as artist
        if (type === 'artist') {
            await Artist.create({ userId: user._id, name: normalizedName });
        }

        const token = generateToken(user._id.toString(), user.email, user.type);
        res.status(201).json({
            success: true,
            message: 'Signup successful',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                type: user.type,
                status: user.status,
                country: user.country,
                subscriptionStatus: user.subscriptionStatus,
                avatar: user.avatar,
                bio: user.bio,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        if (user.status === 'blocked') {
            return res.status(403).json({ success: false, message: 'Your account has been suspended' });
        }
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id.toString(), user.email, user.type);
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                type: user.type,
                status: user.status,
                country: user.country,
                subscriptionStatus: user.subscriptionStatus,
                avatar: user.avatar,
                bio: user.bio,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user?.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, user, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { name, phone, bio, country } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user?.id,
            { name, phone, bio, country },
            { new: true, runValidators: true }
        ).select('-password');
        res.json({ success: true, message: 'Profile updated', user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const logout = (_req: Request, res: Response) => {
    // JWT is stateless; client should discard the token
    res.json({ success: true, message: 'Logged out successfully' });
};
