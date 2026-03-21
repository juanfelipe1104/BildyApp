import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "El email es requerido"],
            trim: true,
            lowercase: true,
            unique: true
        },
        password: {
            type: String,
            required: [true, "La contraseña es requerida"],
            select: false
        },
        name: {
            type: String,
            required: [true, "El nombre es requerido"]
        },
        lastName: {
            type: String,
            required: [true, "El apellido es requerido"]
        },
        nif: {
            type: String,
            required: [true, "El NIF es requerido"],
            unique: true
        },
        role: {
            type: String,
            enum: {
                values: ["admin", "guest"]
            },
            default: "admin"
        },
        status: {
            type: String,
            enum: {
                values: ["pending", "verified"]
            },
            default: "pending",
            select: false
        },
        verificationCode: {
            type: String,
            select: false
        },
        verificationAttempts:{
            type: Number,
            default: 3,
            select: false
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true
        },
        address: {
            street: {
                type: String,
                default: ""
            },
            number: {
                type: String,
                default: ""
            },
            postal: {
                type: String,
                default: ""
            },
            city: {
                type: String,
                default: ""
            },
            province: {
                type: String,
                default: ""
            }
        }
    },
    {
        timestamps: true
    }
)

userSchema.index({status: 1})

const User = mongoose.model('User', userSchema);

export default User;