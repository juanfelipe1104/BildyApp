import rateLimit from "express-rate-limit";

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        error: true,
        message: "Demasiadas peticiones, inténtalo más tarde"
    },
    standardHeaders: true,
    legacyHeaders: false
});

export default limiter;