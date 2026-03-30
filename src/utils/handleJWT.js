import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import crypto from 'node:crypto';

const JWT_SECRET = env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_DAYS = 7;

export const generateAccessToken = (user) => {
    return jwt.sign(
        {
            _id: user._id,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES }
    );
};

export const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
};

export const getRefreshTokenExpiry = () => {
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + REFRESH_TOKEN_DAYS);
    return expireDate;
};

export const verifyAccessToken = (token) => {
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        return { valid: true, expired: false, payload };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return { valid: false, expired: true, payload: null };
        }

        return { valid: false, expired: false, payload: null };
    }
};