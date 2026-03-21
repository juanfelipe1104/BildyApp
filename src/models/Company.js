import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
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
            required: [true, "El logo es requerido"]
        },
        isFreelance: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

const Company = mongoose.model('Company', companySchema);

export default Company;