import mongoose, { type HydratedDocument, type Model, type Types } from 'mongoose';
import softDeletePlugin, { type SoftDeleteFields, type SoftDeleteMethods, type SoftDeleteStatics } from '../plugins/softDelete.plugin.js';
import type { Address } from './User.js';

export interface IClient extends SoftDeleteFields {
    company: Types.ObjectId,
    name: String,
    cif: String,
    email: String,
    phone: String,
    address: Address,
    createdAt: Date,
    updatedAt: Date
}

export type ClientDocument = HydratedDocument<IClient, SoftDeleteMethods>;
export type ClientModel = Model<IClient, {}, SoftDeleteMethods> & SoftDeleteStatics;

const clientSchema = new mongoose.Schema<IClient, ClientModel, SoftDeleteMethods>(
    {
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true
        },
        name: {
            type: String
        },
        cif: {
            type: String
        },
        email: {
            type: String
        },
        phone: {
            type: String
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
    }, {
    timestamps: true,
    versionKey: false
}
)

clientSchema.index({ cif: 1 });

clientSchema.plugin(softDeletePlugin);

const Client = mongoose.model<IClient, ClientModel>('Client', clientSchema);

export default Client;