import type { Request, Response, NextFunction } from 'express';
import type { UserStatus } from '../models/User.js';
import { verifyAccessToken } from "../utils/handleJWT.js";
import { AppError } from "../utils/AppError.js";
import User from "../models/User.js";
import Client from '../models/Client.js';

const extractBearerToken = (authorizationHeader?: string): string | null => {
    if (!authorizationHeader) {
        return null;
    }
    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return null;
    }

    return token;
};

export const validateUser = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
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
    next();
};

export const validateUserStatus = (...allowedStatus: UserStatus[]) => async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    if (!allowedStatus.includes(user.status)) {
        if (user.status === "verified") {
            throw AppError.conflict("El usuario ya está verificado")
        }
        else {
            throw AppError.unauthorized("El usuario no se ha verificado");
        }
    }

    next();
};

export const checkIfUserHasCompany = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;
    if(!user.company){
        throw AppError.forbidden("El usuario no tiene compañia");
    }
    next();
};

export const checkIfClientInCompany = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const clientId = req.params;
    const userId = req.user._id;
    const client = await Client.findOne({ _id: clientId, user: userId });
    if (!client) {
        throw AppError.notFound("El cliente no existe o no pertenece a la compañia");
    }
    req.client = client;
    next();
};