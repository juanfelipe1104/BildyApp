import express from 'express';
import helmet from 'helmet';
import mongoSanitizeMiddleware from './middleware/sanitize.middleware.js';
import limiter from './middleware/rate-limit.js';
import { join } from 'node:path';
import router from './routes/routes.js';
import errorHandler from './middleware/error-handler.js';
import morganBody from 'morgan-body';
import { loggerStream } from './utils/handleLogger.js';

const app = express();

app.use(express.json());

app.use(helmet());

app.use(mongoSanitizeMiddleware);

morganBody(app, {
    noColors: true,
    skip: (_req, res) => res.statusCode < 500,
    stream: loggerStream
});

app.use(limiter);

app.use('/uploads', express.static(join(import.meta.dirname, '../uploads')));

app.use('/api', router);

app.use(errorHandler);

export default app;