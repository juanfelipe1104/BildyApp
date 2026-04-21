import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

type GenericError = {
    code?: string | number;
    keyValue?: Record<string, unknown>;
    message?: string;
    stack?: string;
};

const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): Response => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: true,
            message: err.message,
            code: err.code,
            ...(err.details ? { details: err.details } : {}),
        });
    }

    if (err instanceof mongoose.Error.ValidationError) {
        const details = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));

        return res.status(400).json({
            error: true,
            message: 'Error de validación',
            code: 'VALIDATION_ERROR',
            details,
        });
    }

    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({
            error: true,
            message: `Valor inválido para '${err.path}'`,
            code: 'CAST_ERROR',
        });
    }

    if ((err as GenericError)?.code === 11000) {
        const field = Object.keys((err as GenericError).keyValue || {})[0];

        return res.status(409).json({
            error: true,
            message: `Ya existe un registro con ese '${field}'`,
            code: 'DUPLICATE_KEY',
        });
    }

    if (err instanceof ZodError) {
        const details = err.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));

        return res.status(400).json({
            error: true,
            message: 'Error de validación',
            code: 'VALIDATION_ERROR',
            details,
        });
    }

    if ((err as GenericError)?.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: true,
            message: 'Archivo muy grande',
            code: 'FILE_TOO_LARGE',
        });
    }

    if ((err as GenericError)?.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
            error: true,
            message: 'Demasiados archivos',
            code: 'TOO_MANY_FILES',
        });
    }

    const isProduction = process.env.NODE_ENV === 'production';

    return res.status(500).json({
        error: true,
        message: isProduction ? 'Error interno del servidor' : (err as GenericError)?.message || 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        ...(!isProduction && (err as GenericError)?.stack ? { stack: (err as GenericError).stack } : {}),
    });
};

export default errorHandler;