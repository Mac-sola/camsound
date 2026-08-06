import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import Artist from '../models/Artist';

const createCsrfToken = () => crypto.randomBytes(18).toString('hex');

const generateToken = (id: string, email: string, type: string, csrfToken: string) => {
    return jwt.sign({ id, email, type, csrfToken }, process.env.JWT_SECRET!, { expiresIn: '7d' });
};

const setAuthCookie = (res: Response, token: string) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

const buildAuthResponse = (user: any, token: string, csrfToken: string) => ({
    success: true,
    message: 'Authentication successful',
    token,
    csrfToken,
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

        const csrfToken = createCsrfToken();
        const token = generateToken(user._id.toString(), user.email, user.type, csrfToken);
        setAuthCookie(res, token);
        res.status(201).json(buildAuthResponse(user, token, csrfToken));
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

        const csrfToken = createCsrfToken();
        const token = generateToken(user._id.toString(), user.email, user.type, csrfToken);
        setAuthCookie(res, token);
        res.json(buildAuthResponse(user, token, csrfToken));
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
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
};

export const session = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user?.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: { user, csrfToken: req.csrfToken } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }
        const user = await User.findById(req.user?.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const isValid = await user.comparePassword(currentPassword);
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Incorrect current password' });
        }
        user.password = newPassword;
        await user.save();
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

