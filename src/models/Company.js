import mongoose from "mongoose";
import softDeletePlugin from "../plugins/softDelete.plugin.js";

const companySchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: {
            type: String,
            required: [true, "El nombre es requerido"]
        },
        cif: {
            type: String,
            required: [true, "El CIF es requerido"],
            unique: true
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

const Company = mongoose.model('Company', companySchema);

export default Company;