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
            default: "pending"
        },
        verificationCode: {
            type: String,
            select: false,
            required: true
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
                type: String
            },
            number: {
                type: String
            },
            postal: {
                type: String
            },
            city: {
                type: String
            },
            province: {
                type: String
            },
            default: {}
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform(doc, ret) {
                delete ret.password;
                delete ret.verificationCode;
                delete ret.verificationAttempts;
                return ret;
            }
        }
    }
)

userSchema.index({status: 1, role: 1, company: 1})

userSchema.virtual('fullName').get(() => this.name + ' ' + this.lastName)

const User = mongoose.model('User', userSchema);

export default User;