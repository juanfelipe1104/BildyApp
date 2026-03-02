import app from './app.js';
import env from './config/env.js';
import dbConnect from './config/db.js';

dbConnect();

app.listen(env.PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${env.PORT}`);
    console.log(`Entorno: ${env.NODE_ENV}`);
});