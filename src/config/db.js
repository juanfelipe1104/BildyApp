import mongoose from 'mongoose';

import env from './env.js';

const dbConnect = async () => {
    const DB_URI = env.DB_URI;
    const DB_NAME = env.DB_NAME;
    try {
        await mongoose.connect(DB_URI, {
            dbName: DB_NAME
        });
        console.log('Conectado a MongoDB');
    } catch (error) {
        console.error('Error conectando a MongoDB:', error.message);
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