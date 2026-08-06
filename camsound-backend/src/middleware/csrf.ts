import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const openMutatingPaths = [
    '/auth/login',
    '/auth/signup',
    '/momo/webhook',
];

export const verifyCsrf = (req: Request, res: Response, next: NextFunction) => {
    const requestPath = req.originalUrl.replace(/^\/api/, '') || req.path;
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    if (openMutatingPaths.includes(requestPath)) {
        return next();
    }

    const csrfHeader = req.headers['x-csrf-token'] as string | undefined;

    // If protect middleware hasn't run yet, attempt to derive csrfToken from JWT
    if (!req.csrfToken) {
        try {
            const authHeader = (req.headers.authorization as string) || '';
            let token: string | undefined = authHeader.split(' ')[1];
            if (!token && req.headers.cookie) {
                const cookies = (req.headers.cookie as string).split(';').map(c => c.trim());
                const tokenCookie = cookies.find(c => c.startsWith('token='));
                token = tokenCookie?.split('=')[1];
            }
            if (token) {
                const decoded = jwt.verify(token as string, process.env.JWT_SECRET!);
                (req as any).csrfToken = (decoded as any).csrfToken;
            }
        } catch (_err) {
            // ignore - we'll handle missing token below
        }
    }

    if (!csrfHeader || !req.csrfToken) {
        return res.status(403).json({ success: false, message: 'Missing CSRF token' });
    }

    if (csrfHeader !== req.csrfToken) {
        return res.status(403).json({ success: false, message: 'Invalid CSRF token' });
    }

    next();
};
