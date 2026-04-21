import mongoose from 'mongoose';
import env from './env.js';

const dbConnect = async (): Promise<void> => {
    const DB_URI = env.DB_URI;
    const DB_NAME = env.DB_NAME;
    try {
        await mongoose.connect(DB_URI, {
            dbName: DB_NAME
        });
        console.log('Conectado a MongoDB');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error conectando a MongoDB:', errorMessage);
        process.exit(1);
    }
};

mongoose.connection.on('disconnected', () => {
    console.warn('Desconectado de MongoDB');
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
    process.exit(0);
});

export default dbConnect;