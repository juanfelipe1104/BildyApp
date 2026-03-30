import { verifyAccessToken } from "../utils/handleJWT.js";
import { AppError } from "../utils/AppError.js";
import User from "../models/User.js";

const extractBearerToken = (authorizationHeader) => {
    if (!authorizationHeader) {
        return null;
    }
    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return null;
    }

    return token;
};

export const validateUser = async (req, res, next) => {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
        throw AppError.unauthorized("Falta el token Bearer");
    }

    const result = verifyAccessToken(token);

    if (result.expired) {
        throw AppError.unauthorized("El access token ha expirado");
    }

    if (!result.valid) {
        throw AppError.unauthorized("Access token inválido");
    }

    const user = await User.findById(result.payload._id);

    if (!user) {
        throw AppError.unauthorized("El usuario del token no existe");
    }

    if (user.deleted) {
        throw AppError.unauthorized("El usuario está eliminado");
    }

    req.user = user;
    req.token = token;
    next();
};

export const validateCompany = async (req, res, next) => {
    const user = req.user;
    if (user.company) {
        return next();
    }
    return AppError.badRequest(`No company for user: ${user.email}`);
}