import app from './app.js';
import env from './config/env.js';
import dbConnect from './config/db.js';
import { createServer } from 'http';
import { closeSocket, initSocket } from './sockets/socket.js';
import mongoose from 'mongoose';

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

    httpServer.close(async error => {
        if (error) {
            console.error("Error cerrando servidor HTTP:", error);
            process.exit(1);
        }

        try {
            await closeSocket();
            console.log('Conexión a Socket cerrada');
            await mongoose.connection.close();
            console.log('Conexión a MongoDB cerrada');

            console.log("Servidor cerrado correctamente");
            process.exit(0);
        } catch (shutdownError) {
            console.error("Error durante graceful shutdown:", shutdownError);
            process.exit(1);
        }
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