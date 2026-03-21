import jwt from 'jsonwebtoken';
import env from '../config/env.js'

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN || '1h';


export const tokenSign = (user) => {
    const sign = jwt.sign(
        {
            _id: user._id,
            role: user.role
        },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN
        }
    );
    return sign;
};

export const verifyToken = (tokenJwt) => {
    try {
        return jwt.verify(tokenJwt, JWT_SECRET);
    } catch (err) {
        console.log('Error verificando token:', err.message);
        return null;
    }
};