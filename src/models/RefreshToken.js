import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
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
        timestamps: true
    }
);

refreshTokenSchema.methods.isActive = function () {
    return !this.revokedAt && this.expiresAt > new Date();
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export default RefreshToken;