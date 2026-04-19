import type { Request, Response, NextFunction, RequestHandler } from 'express';

type SanitizableValue = string | number | boolean | null | undefined | SanitizableObject | SanitizableValue[];

type SanitizableObject = {
    [key: string]: SanitizableValue;
};

const sanitizeObject = (value: SanitizableValue): SanitizableValue => {
    if (Array.isArray(value)) {
        return value.map(sanitizeObject);
    }

    if (value && typeof value === 'object') {
        const sanitized: SanitizableObject = {};

        for (const [key, nestedValue] of Object.entries(value)) {
            const cleanKey = key.replace(/^\$+/g, '').replace(/\./g, '');
            sanitized[cleanKey] = sanitizeObject(nestedValue as SanitizableValue);
        }

        return sanitized;
    }

    return value;
};

const mongoSanitizeMiddleware: RequestHandler = (req: Request, _res: Response, next: NextFunction): void => {
    if (req.body) {
        req.body = sanitizeObject(req.body as SanitizableValue);
    }

    if (req.params) {
        Object.assign(req.params, sanitizeObject(req.params as SanitizableValue));
    }

    if (req.query) {
        const sanitizedQuery = sanitizeObject(req.query as SanitizableValue);

        for (const key of Object.keys(req.query)) {
            delete req.query[key];
        }

        Object.assign(req.query, sanitizedQuery);
    }

    next();
};

export default mongoSanitizeMiddleware;