import express from 'express';
import helmet from 'helmet';
import mongoSanitizeMiddleware from './middleware/sanitize.middleware.js';
import limiter from './middleware/rate-limit.js';
import { join } from 'node:path';
import router from './routes/routes.js';
import errorHandler from './middleware/error-handler.js';
import morganBody from 'morgan-body';
import { loggerStream } from './utils/handleLogger.js';
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import env from './config/env.js';
import { getHealth } from './controllers/health.controller.js';

const app = express();

app.use(express.json());

app.use(helmet());

app.use(mongoSanitizeMiddleware);

if (env.NODE_ENV === "development") {
    morganBody(app, {
        noColors: true,
        skip: (_req, res) => res.statusCode < 500,
        stream: loggerStream
    });
}

if (env.NODE_ENV !== "test") {
    app.use(limiter);
}

app.use('/uploads', express.static(join(import.meta.dirname, '../uploads')));

app.get('/health', getHealth);

app.use('/api', router);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

export default app;