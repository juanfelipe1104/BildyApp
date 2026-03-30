import { verifyToken } from "../utils/handleJWT.js";
import { AppError } from "../utils/AppError.js";
import User from "../models/User.js";

export const validateUser = async (req, res, next) => {
    const token = req.headers.authorization.split(' ').pop();
    const userData = verifyToken(token);
    console.log(userData);
    if(userData){
        const user = await User.findById(userData._id);
        req.user = user;
        req.token = token;
        return next();
    }
    return AppError.badRequest(`Wrong authorization token: ${token}`);
}

export const validateCompany = async (req, res, next) => {
    const user = req.user;
    if(user.company){
        return next();
    }
    return AppError.badRequest(`No company for user: ${user.email}`);
}