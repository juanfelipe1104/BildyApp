import mongoose, { type HydratedDocument, type Model, type Types } from 'mongoose';
import softDeletePlugin, { type SoftDeleteFields, type SoftDeleteMethods, type SoftDeleteStatics } from '../plugins/softDelete.plugin.js';
import type { UserDocument } from './User.js';
import type { CompanyDocument } from './Company.js';
import type { ClientDocument } from './Client.js';
import type { ProjectDocument } from './Project.js';

type FormatType = 'material' | 'hours';
type Worker = {
    name: string,
    hour: Number
}

export interface IDeliveryNoteSign extends SoftDeleteFields {
    signed: boolean,
    signedAt: Date,
    signatureUrl: string,
    pdfUrl: string
}

export interface IDeliveryNote extends IDeliveryNoteSign {
    user: Types.ObjectId,
    company: Types.ObjectId,
    client: Types.ObjectId,
    project: Types.ObjectId,
    format: FormatType,
    description: string,
    workDate: Date,
    material: string,
    quantity: Number,
    hours: Number,
    workers: Worker[],
    createdAt: Date,
    updatedAt: Date
}

export type PopulatedDeliveryNote = DeliveryNoteDocument & {
    user: UserDocument;
    company: CompanyDocument;
    client: ClientDocument;
    project: ProjectDocument;
};

export type DeliveryNoteDocument = HydratedDocument<IDeliveryNote, SoftDeleteMethods>;
export type DeliveryNoteModel = Model<IDeliveryNote, {}, SoftDeleteMethods> & SoftDeleteStatics;

const deliveryNoteSchema = new mongoose.Schema<IDeliveryNote, DeliveryNoteModel, SoftDeleteMethods>(
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
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true
        },
        format: {
            type: String,
            enum: ['materials', 'hours'],
            required: true
        },
        description: {
            type: String
        },
        workDate: {
            type: Date
        },
        material: {
            type: String
        },
        quantity: {
            type: Number
        },
        hours: {
            type: Number
        },
        workers: [{
            name: {
                type: String
            },
            hour: {
                type: Number
            }
        }],
        signed: {
            type: Boolean,
            default: false
        },
        signedAt: {
            type: Date
        },
        signatureUrl: {
            type: String
        },
        pdfUrl: {
            type: String
        }
    }, {
    timestamps: true,
    versionKey: false
}
)

deliveryNoteSchema.plugin(softDeletePlugin);

const DeliveryNote = mongoose.model<IDeliveryNote, DeliveryNoteModel>('DeliveryNote', deliveryNoteSchema);

export default DeliveryNote;