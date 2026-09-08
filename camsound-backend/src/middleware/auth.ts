import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

declare global {
    namespace Express {
        interface Request {
            user?: any;
            csrfToken?: string;
        }
    }
}

const getTokenFromCookie = (req: Request) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return undefined;
    const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
    const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
    return tokenCookie?.split('=')[1];
};

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeaderToken = req.headers.authorization?.split(' ')[1];
        const token = authHeaderToken || getTokenFromCookie(req);

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        const user = await User.findById((decoded as any).id).select('-password');
        if (!user || user.status !== 'active') {
            return res.status(401).json({ success: false, message: 'Account is not active' });
        }
        req.user = user;
        req.csrfToken = (decoded as any).csrfToken;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.type)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
};