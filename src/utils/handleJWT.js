import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import crypto from 'node:crypto';

const JWT_SECRET = env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_DAYS = 7;

export const generateAccessToken = (user) => {
    const sign = jwt.sign(
        {
            _id: user._id,
            role: user.role
        },
        JWT_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRES
        }
    );
    return sign;
};

export const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
};

export const getRefreshTokenExpiry = () => {
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + REFRESH_TOKEN_DAYS);
    return expireDate;
};

export const verifyToken = (tokenJwt) => {
    try {
        return jwt.verify(tokenJwt, JWT_SECRET);
    } catch (err) {
        console.log('Error verificando token:', err.message);
        return null;
    }
};