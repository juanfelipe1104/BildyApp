export class AppError extends Error {
    statusCode: number;
    code: string | null;
    isOperational: boolean;
    details?: unknown;

    constructor(message: string, statusCode: number = 500, code: string | null = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message = 'Solicitud inválida', code = 'BAD_REQUEST'): AppError {
        return new AppError(message, 400, code);
    }

    static unauthorized(message = 'No autorizado', code = 'UNAUTHORIZED'): AppError {
        return new AppError(message, 401, code);
    }

    static forbidden(message = 'Acceso prohibido', code = 'FORBIDDEN'): AppError {
        return new AppError(message, 403, code);
    }

    static notFound(resource = 'Recurso', code = 'NOT_FOUND'): AppError {
        return new AppError(`${resource} no encontrado`, 404, code);
    }

    static conflict(message = 'Conflicto con recurso existente', code = 'CONFLICT'): AppError {
        return new AppError(message, 409, code);
    }

    static validation(message = 'Error de validación', details: unknown[] = []): AppError {
        const error = new AppError(message, 400, 'VALIDATION_ERROR');
        error.details = details;
        return error;
    }

    static tooManyRequests(message = 'Demasiadas peticiones', code = 'RATE_LIMIT'): AppError {
        return new AppError(message, 429, code);
    }

    static internal(message = 'Error interno del servidor', code = 'INTERNAL_ERROR'): AppError {
        return new AppError(message, 500, code);
    }
}