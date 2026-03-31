const sanitizeObject = (value) => {
    if (Array.isArray(value)) {
        return value.map(sanitizeObject);
    }

    if (value && typeof value === "object") {
        const sanitized = {};

        for (const [key, nestedValue] of Object.entries(value)) {
            const cleanKey = key.replace(/^\$+/g, "").replace(/\./g, "");

            sanitized[cleanKey] = sanitizeObject(nestedValue);
        }

        return sanitized;
    }

    return value;
};

const mongoSanitizeMiddleware = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    if (req.params) {
        req.params = sanitizeObject(req.params);
    }

    if (req.query) {
        const sanitizedQuery = sanitizeObject(req.query);

        for (const key of Object.keys(req.query)) {
            delete req.query[key];
        }

        Object.assign(req.query, sanitizedQuery);
    }

    next();
};

export default mongoSanitizeMiddleware;