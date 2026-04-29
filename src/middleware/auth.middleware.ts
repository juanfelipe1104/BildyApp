import type { Request, Response, NextFunction } from 'express';
import type { Model, Document } from 'mongoose';
import type { UserStatus } from '../models/User.js';
import { verifyAccessToken } from "../utils/handleJWT.js";
import { AppError } from "../utils/AppError.js";
import User from "../models/User.js";
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import DeliveryNote from '../models/DeliveryNote.js';

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
            return next(AppError.unauthorized("El usuario no tiene permisos"));
        }
    }

    next();
};

export const userHasCompany = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;
    if (!user.company) {
        return next(AppError.forbidden("El usuario no tiene compañia"));
    }
    next();
};

type RequestKey = 'client' | 'project' | 'deliveryNote';

const resourceInCompany = (model: Model<any>, requestKey: RequestKey, errorMessage: string) => async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const companyId = req.user.company;

    const resource = await model.findOne({ _id: id, company: companyId });

    if (!resource) {
        return next(AppError.notFound(errorMessage));
    }

    (req as any)[requestKey] = resource;

    next();
};


export const clientInCompany = resourceInCompany(Client, 'client', "El cliente no existe o no pertenece a la compañia");

export const projectInCompany = resourceInCompany(Project, 'project', "El proyecto no existe o no pertenece a la compañia");

export const deliveryNoteInCompany = resourceInCompany(DeliveryNote, 'deliveryNote', "El albaran no existe o no pertenece a la compañia");
