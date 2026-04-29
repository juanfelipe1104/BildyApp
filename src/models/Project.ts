import mongoose, { type HydratedDocument, type Model, type Types } from 'mongoose';
import softDeletePlugin, { type SoftDeleteFields, type SoftDeleteMethods, type SoftDeleteStatics } from '../plugins/softDelete.plugin.js';
import type { Address } from './User.js';

export interface IProject extends SoftDeleteFields {
    user: Types.ObjectId,
    company: Types.ObjectId,
    client: Types.ObjectId,
    name: string,
    projectCode: string,
    address: Address,
    email: string,
    notes: string,
    active: boolean,
    createdAt: Date,
    updatedAt: Date
}

export type ProjectDocument = HydratedDocument<IProject, SoftDeleteMethods>;
export type ProjectModel = Model<IProject, {}, SoftDeleteMethods> & SoftDeleteStatics;

const projectSchema = new mongoose.Schema<IProject, ProjectModel, SoftDeleteMethods>(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: true
        },
        name: {
            type: String
        },
        projectCode: {
            type: String,
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
        email: {
            type: String
        },
        notes: {
            type: String
        },
        active: {
            type: Boolean,
            default: true
        }
    }, {
    timestamps: true,
    versionKey: false
}
)

projectSchema.plugin(softDeletePlugin);

const Project = mongoose.model<IProject, ProjectModel>('Project', projectSchema);

export default Project;