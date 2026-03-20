export class AppError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
    }

    static badRequest(message, details) {
        return new ApiError(400, message, details);
    }

    static notFound(message = 'Recurso no encontrado') {
        return new ApiError(404, message);
    }

    static tooManyRequests(message = 'Agotado el numero de intentos'){
        return new ApiError(409, message);
    }

    static internal(message = 'Error interno del servidor') {
        return new ApiError(500, message);
    }
}