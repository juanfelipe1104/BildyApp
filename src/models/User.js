import mongoose from "mongoose";
import softDeletePlugin from "../plugins/softDelete.plugin.js";

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
            type: String
        },
        lastName: {
            type: String
        },
        nif: {
            type: String
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
            required: true
        },
        verificationAttempts: {
            type: Number,
            default: 3
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company'
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
            }
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

userSchema.index({ company: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

userSchema.methods.toJSON = function () {
    const user = this.toObject({ virtuals: true });
    delete user.password;
    delete user.verificationCode;
    delete user.verificationAttempts;
    return user;
};

userSchema.virtual('fullName').get(function () {
    return `${this.name ?? ''} ${this.lastName ?? ''}`.trim();
});

userSchema.plugin(softDeletePlugin);

const User = mongoose.model('User', userSchema);

export default User;