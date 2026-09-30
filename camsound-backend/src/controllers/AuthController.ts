import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

/**
 * AuthController
 * 
 * Responsibility:
 * 1. Extract request parameters, body, and user headers.
 * 2. Delegate business logic execution to AuthService.
 * 3. Return appropriate HTTP status codes and JSON response.
 * 
 * Does NOT perform direct database queries or heavy calculations.
 */
export class AuthController {
    private authService: AuthService;

    /**
     * Dependency Injection:
     * Receives an instance of AuthService so the controller doesn't need to know
     * how authentication is implemented under the hood.
     */
    constructor(authService: AuthService) {
        this.authService = authService;
    }

    /**
     * Handle user signup request (POST /api/auth/signup).
     */
    signup = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, email, password, phone, country, type } = req.body;

            const { user, token, csrfToken } = await this.authService.signup({
                name,
                email,
                password,
                phone,
                country,
                type,
            });

            this.authService.setAuthCookie(res, token);

            const responsePayload = this.authService.buildAuthResponse(user, token, csrfToken);
            res.status(201).json(responsePayload);
        } catch (error: any) {
            console.error('Signup error:', error);
            const statusCode = error.statusCode || (error?.code === 11000 ? 409 : 400);
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Unable to create account',
            });
        }
    };

    /**
     * Handle user login request (POST /api/auth/login).
     */
    login = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password } = req.body;

            const { user, token, csrfToken } = await this.authService.login(email, password);

            this.authService.setAuthCookie(res, token);

            const responsePayload = this.authService.buildAuthResponse(user, token, csrfToken);
            res.status(200).json(responsePayload);
        } catch (error: any) {
            console.error('Login error:', error);
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Unable to log in. Please try again.',
            });
        }
    };

    /**
     * Handle user logout (POST /api/auth/logout, DELETE /api/auth/logout).
     */
    logout = (_req: Request, res: Response): void => {
        res.clearCookie('token');
        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    };

    /**
     * Retrieve the authenticated user's current session state (GET /api/auth/session).
     */
    session = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;
            const user = await this.authService.getProfile(userId);

            if (user.status !== 'active') {
                res.status(403).json({ success: false, message: 'Account is not active' });
                return;
            }

            res.status(200).json({
                success: true,
                data: {
                    user,
                    csrfToken: req.csrfToken,
                },
            });
        } catch (error: any) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ success: false, message: error.message });
        }
    };

    /**
     * Retrieve the profile of the currently logged-in user (GET /api/auth/me).
     */
    getProfile = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;
            const user = await this.authService.getProfile(userId);

            res.status(200).json({
                success: true,
                user,
                data: user,
            });
        } catch (error: any) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ success: false, message: error.message });
        }
    };

    /**
     * Update profile information for the authenticated user (PUT /api/auth/me).
     */
    updateProfile = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;
            const { name, phone, bio, country } = req.body;

            const updatedUser = await this.authService.updateProfile(userId, { name, phone, bio, country });

            res.status(200).json({
                success: true,
                message: 'Profile updated',
                user: updatedUser,
            });
        } catch (error: any) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ success: false, message: error.message });
        }
    };

    /**
     * Change the authenticated user's password (PUT /api/auth/change-password).
     */
    changePassword = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;
            const { currentPassword, newPassword } = req.body;

            await this.authService.changePassword(userId, currentPassword, newPassword);

            res.status(200).json({
                success: true,
                message: 'Password changed successfully',
            });
        } catch (error: any) {
            const statusCode = error.statusCode || 500;
            res.status(statusCode).json({ success: false, message: error.message });
        }
    };
}

// Default export an instance pre-wired with the default AuthService
import authServiceInstance from '../services/AuthService';

export default new AuthController(authServiceInstance);
