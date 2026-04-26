import type { Request, Response, NextFunction } from 'express';
import type { UserStatus } from '../models/User.js';
import { verifyAccessToken } from "../utils/handleJWT.js";
import { AppError } from "../utils/AppError.js";
import User from "../models/User.js";
import Client from '../models/Client.js';
import Project from '../models/Project.js';

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
        return next(AppError.unauthorized("Falta el token Bearer"));
    }

    const result = verifyAccessToken(token);

    if (result.expired || !result.valid) {
        return next(AppError.unauthorized("El access token es invalido"));
    }

    const user = await User.findById(result.payload._id);

    if (!user || user.deleted) {
        return next(AppError.unauthorized("El usuario del token no existe"));
    }

    req.user = user;
    next();
};

export const validateUserStatus = (...allowedStatus: UserStatus[]) => async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;

    if (!allowedStatus.includes(user.status)) {
        if (user.status === "verified") {
            return next(AppError.conflict("El usuario ya está verificado"))
        }
        else {
            return next(AppError.unauthorized("El usuario no se ha verificado"));
        }
    }

    next();
};

export const checkIfUserHasCompany = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;
    if (!user.company) {
        return next(AppError.forbidden("El usuario no tiene compañia"));
    }
    next();
};

export const checkIfClientInCompany = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const clientId = req.params;
    const companyId = req.user.company;
    const client = await Client.findOne({ _id: clientId, company: companyId });
    if (!client) {
        return next(AppError.notFound("El cliente no existe o no pertenece a la compañia"));
    }
    req.client = client;
    next();
};

export const checkIfProjectInCompany = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const projectId = req.params;
    const companyId = req.user.company;
    const project = await Project.findOne({ _id: projectId, company: companyId });
    if (!project) {
        return next(AppError.notFound("El proyecto no existe o no pertenece a la compañia"));
    }
    req.project = project;
    next();
}