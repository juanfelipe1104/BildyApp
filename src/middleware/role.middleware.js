import { AppError } from "../utils/AppError.js";

export const authorizeRoles = (...allowedRoles) => async (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
        throw AppError.forbidden("El usuario no tiene permisos para realizar esta accion");
    }
    next();
};