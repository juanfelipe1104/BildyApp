import app from './app.js';
import env from './config/env.js';
import dbConnect from './config/db.js';
import { createServer } from 'http';
import { closeSocket, initSocket } from './sockets/socket.js';

const httpServer = createServer(app);

const startServer = async (): Promise<void> => {
    await dbConnect();
    initSocket(httpServer);
    httpServer.listen(env.PORT, () => {
        console.log(`Servidor ejecutándose en http://localhost:${env.PORT}`);
        console.log(`Entorno: ${env.NODE_ENV}`);
    });
};

const closeServer = async (signal: string): Promise<void> => {
    console.log(`Recibida señal ${signal}. Cerrando servidor...`);

    httpServer.close(async () => {
        await closeSocket();
        process.exit(0);
    });
}

startServer().catch((error) => {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
});

process.on("SIGINT", () => {
    void closeServer("SIGINT");
});

process.on("SIGTERM", () => {
    void closeServer("SIGTERM");
});