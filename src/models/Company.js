import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
    {
        owner: ObjectId,           // ref: 'User' — admin que creó la compañía
        name: String,              // Nombre de la empresa
        cif: String,               // CIF de la empresa
        address: {
            street: String,
            number: String,
            postal: String,
            city: String,
            province: String
        },
        logo: String,              // URL del logo (imagen subida con Multer)
        isFreelance: Boolean,      // true si es autónomo (1 sola persona)
        deleted: Boolean,          // Soft delete
        createdAt: Date,
        updatedAt: Date
    }
)

const Company = mongoose.model('Company', companySchema);

export default Company;