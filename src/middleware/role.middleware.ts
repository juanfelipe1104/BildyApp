import type { Request, Response, NextFunction } from 'express';
import { AppError } from "../utils/AppError.js";

export const authorizeRoles = (...allowedRoles: string[]) => async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!allowedRoles.includes(req.user.role)) {
        return next(AppError.forbidden("El usuario no tiene permisos para realizar esta accion"));
    }
    next();
};