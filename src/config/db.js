import mongoose from 'mongoose';

import env from './env.js';

const dbConnect = async () => {
    const DB_URI = env.DB_URI;
    try {
        await mongoose.connect(DB_URI);
        console.log('Conectado a MongoDB');
    } catch (error) {
        console.error('Error conectando a MongoDB:', error.message);
        process.exit(1);
    }
};

// Eventos de conexión
mongoose.connection.on('disconnected', () => {
    console.warn('Desconectado de MongoDB');
});

// Cerrar conexión al terminar la app
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
    process.exit(0);
});

export default dbConnect;