import app from './app.js';
import env from './config/env.js';
import dbConnect from './config/db.js';

const startServer = async (): Promise<void> => {
    await dbConnect();
    app.listen(env.PORT, () => {
        console.log(`Servidor ejecutándose en http://localhost:${env.PORT}`);
        console.log(`Entorno: ${env.NODE_ENV}`);
    });
};

startServer().catch((error) => {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
});