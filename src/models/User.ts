import mongoose, { type HydratedDocument, type Model, type Types } from 'mongoose';
import softDeletePlugin, { type SoftDeleteFields, type SoftDeleteMethods, type SoftDeleteStatics } from '../plugins/softDelete.plugin.js';

export type UserRole = 'admin' | 'guest';
export type UserStatus = 'pending' | 'verified';

export interface UserAddress {
    street?: string;
    number?: string;
    postal?: string;
    city?: string;
    province?: string;
}

export interface IUser extends SoftDeleteFields {
    email: string;
    password: string;
    name?: string;
    lastName?: string;
    nif?: string;
    role: UserRole;
    status: UserStatus;
    verificationCode: string;
    verificationAttempts: number;
    company?: Types.ObjectId;
    address?: UserAddress;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserMethods extends SoftDeleteMethods {
    toJSON(): Record<string, unknown>;
}

export type UserDocument = HydratedDocument<IUser, UserMethods>;
export type UserModel = Model<IUser, {}, UserMethods> & SoftDeleteStatics;

const userSchema = new mongoose.Schema<IUser, UserModel, UserMethods>(
    {
        email: {
            type: String,
            required: [true, 'El email es requerido'],
            trim: true,
            lowercase: true,
            unique: true
        },
        password: {
            type: String,
            required: [true, 'La contraseña es requerida'],
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
                values: ['admin', 'guest'],
            },
            default: 'admin'
        },
        status: {
            type: String,
            enum: {
                values: ['pending', 'verified'],
            },
            default: 'pending'
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

userSchema.methods.toJSON = function (this: UserDocument): Record<string, unknown> {
    const user = this.toObject({ virtuals: true }) as Record<string, unknown>;
    delete user.password;
    delete user.verificationCode;
    delete user.verificationAttempts;
    return user;
};

userSchema.virtual('fullName').get(function (this: UserDocument): string {
    return `${this.name ?? ''} ${this.lastName ?? ''}`.trim();
});

userSchema.plugin(softDeletePlugin);

const User = mongoose.model<IUser, UserModel>('User', userSchema);

export default User;