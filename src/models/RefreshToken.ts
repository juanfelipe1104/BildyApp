import mongoose, { type HydratedDocument, type Model, type Types } from 'mongoose';

export interface IRefreshToken {
    token: string;
    user: Types.ObjectId;
    expiresAt: Date;
    createdByIp?: string;
    revokedAt?: Date;
    revokedByIp?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface RefreshTokenMethods {
    isActive(): boolean;
}

type RefreshTokenDocument = HydratedDocument<IRefreshToken, RefreshTokenMethods>;
type RefreshTokenModel = Model<IRefreshToken, {}, RefreshTokenMethods>;

const refreshTokenSchema = new mongoose.Schema<IRefreshToken, RefreshTokenModel, RefreshTokenMethods>({
    token: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        expires: 0
    },
    createdByIp: {
        type: String
    },
    revokedAt: {
        type: Date
    },
    revokedByIp: {
        type: String
    }
},
    {
        timestamps: true,
        versionKey: false
    }
);

refreshTokenSchema.methods.isActive = function (this: RefreshTokenDocument): boolean {
    return !this.revokedAt && this.expiresAt > new Date();
};

const RefreshToken = mongoose.model<IRefreshToken, RefreshTokenModel>('RefreshToken', refreshTokenSchema);

export default RefreshToken;