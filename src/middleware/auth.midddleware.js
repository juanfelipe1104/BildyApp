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

    if (result.expired || !result.valid) {
        throw AppError.unauthorized("El access token es invalido");
    }

    const user = await User.findById(result.payload._id);

    if (!user || user.deleted) {
        throw AppError.unauthorized("El usuario del token no existe");
    }

    req.user = user;
    req.token = token;
    next();
};

export const validateUserStatus = (...allowedStatus) => async (req, res, next) => {
    let user = req.user;
    if (!user) {
        const { email } = req.body;
        user = await User.findOne({ email: email });
        if (!user) {
            throw AppError.unauthorized("Error de credenciales");
        }
    }

    if (!allowedStatus.includes(user.status)) {
        if (user.status === "verified") {
            throw AppError.conflict("El usuario ya está verificado")
        }
        else {
            throw AppError.unauthorized("El usuario no se ha verificado");
        }
    }

    next();
}