import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: String,             // Único (index: unique), validado con Zod
        password: String,          // Cifrada con bcrypt
        name: String,              // Nombre
        lastName: String,          // Apellidos
        nif: String,               // Documento de identidad
        role: 'admin' | 'guest',            // Por defecto: 'admin'
        status: 'pending' | 'verified',     // Estado de verificación del email (index)
        verificationCode: String,  // Código aleatorio de 6 dígitos
        verificationAttempts: Number, // Intentos restantes (máximo 3)
        company: ObjectId,
        code: Number,
        numberOfTries: Number,
        address: {
            street: String,
            number: String,
            postal: String,
            city: String,
            province: String
        },
        deleted: Boolean,          // Soft delete
        createdAt: Date,
        updatedAt: Date
    }
    // Virtual (no se almacena, se calcula):
    // fullName → name + ' ' + lastName
)

const User = mongoose.model('User', userSchema);

export default User;