import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import crypto from 'node:crypto';

const JWT_SECRET = env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_DAYS = 7;

type TokenUser = {
    _id: {
        toString(): string;
    };
    role: string;
};

export type AccessTokenPayload = {
    _id: string;
    role: string;
};

export type VerifyTokenResult = { valid: true; expired: false; payload: AccessTokenPayload; } |
{ valid: false; expired: true; payload: null; } |
{ valid: false; expired: false; payload: null; };

export const generateAccessToken = (user: TokenUser): string => {
    const payload: AccessTokenPayload = {
        _id: user._id.toString(),
        role: user.role,
    };

    return jwt.sign(
        payload,
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES }
    );
};

export const generateRefreshToken = (): string => {
    return crypto.randomBytes(64).toString('hex');
};

export const getRefreshTokenExpiry = (): Date => {
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + REFRESH_TOKEN_DAYS);
    return expireDate;
};

export const verifyAccessToken = (token: string): VerifyTokenResult => {
    try {
        const payload = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
        return { valid: true, expired: false, payload };
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return { valid: false, expired: true, payload: null };
        }

        return { valid: false, expired: false, payload: null };
    }
};