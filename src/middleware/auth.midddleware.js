import { verifyToken } from "./handleJWT.js";
import { ApiError } from "./error-handler.js";
import User from "../models/User.js";

export const validateUser = async (req, res, next) => {
    const token = req.headers.authorization.split(' ').pop();
    const userData = verifyToken(token);
    console.log(userData);
    if(userData){
        const user = await User.findById(userData._id);
        req.user = user;
        req.token = token;
        next();
    }
    return ApiError.badRequest("Wrong authorization token", token)
}