import express from 'express';
import helmet from 'helmet';
import router from './routes/user.routes.js';
import errorHandler from './middleware/error-handler.js';

const app = express();

app.use(express.json());

app.use(helmet());

app.use('/api/user', router);

app.use(errorHandler);

export default app;