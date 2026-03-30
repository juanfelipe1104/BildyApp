import express from 'express';
import helmet from 'helmet';
import { join } from 'node:path';
import router from './routes/user.routes.js';
import errorHandler from './middleware/error-handler.js';

const app = express();

app.use(express.json());

app.use(helmet());

app.use('/uploads', express.static(join(import.meta.dirname, 'uploads')));

app.use('/api/user', router);

app.use(errorHandler);

export default app;