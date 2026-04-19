import mongoose, { type HydratedDocument, type Model, type Types } from 'mongoose';
import softDeletePlugin, { type SoftDeleteFields, type SoftDeleteMethods, type SoftDeleteStatics } from '../plugins/softDelete.plugin.js';

export interface CompanyAddress {
    street: string;
    number: string;
    postal: string;
    city: string;
    province: string;
}

export interface ICompany extends SoftDeleteFields {
    owner: Types.ObjectId;
    name: string;
    cif: string;
    address: CompanyAddress;
    logo?: string;
    isFreelance: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type CompanyDocument = HydratedDocument<ICompany, SoftDeleteMethods>;
export type CompanyModel = Model<ICompany, {}, SoftDeleteMethods> & SoftDeleteStatics;

const companySchema = new mongoose.Schema<ICompany, CompanyModel, SoftDeleteMethods>(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: {
            type: String,
            required: [true, 'El nombre es requerido']
        },
        cif: {
            type: String,
            required: [true, 'El CIF es requerido'],
            unique: true
        },
        address: {
            street: {
                type: String,
                default: ''
            },
            number: {
                type: String,
                default: ''
            },
            postal: {
                type: String,
                default: ''
            },
            city: {
                type: String,
                default: ''
            },
            province: {
                type: String,
                default: ''
            }
        },
        logo: {
            type: String,
        },
        isFreelance: {
            type: Boolean,
            required: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

companySchema.plugin(softDeletePlugin);

const Company = mongoose.model<ICompany, CompanyModel>('Company', companySchema);

export default Company;