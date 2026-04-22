import { z } from "zod";
import { nifRegex, cifRegex, postalRegex, verifyEmailCodeRegex, addressSchema } from "./common.validator.js";

export const schemaMailBody = z.object({
    body: z.object({
        email: z.email("Formato de correo incorrecto").trim().toLowerCase(),
        password: z.string().min(8, "La contraseña debe contener minimo 8 caracteres").max(16, "La contraseña puede contener maximo 16 caracteres")
    })
});

export const schemaUserBody = z.object({
    body: z.object({
        name: z.string().trim().min(1, "El nombre es obligatorio"),
        lastName: z.string().trim().min(1, "El apellido es obligatorio"),
        nif: z.string().trim().toUpperCase().regex(nifRegex, "El NIE/DNI no tiene un formato valido"),
        address: addressSchema.optional()
    })
});

export const schemaCodeBody = z.object({
    body: z.object({
        code: z.string().regex(verifyEmailCodeRegex, "El código debe ser de 6 dígitos")
    })
});

export const schemaCompanyBody = z.object({
    body: z.discriminatedUnion("isFreelance", [
        z.object({
            isFreelance: z.literal(true)
        }),
        z.object({
            isFreelance: z.literal(false),
            name: z.string().trim().min(1, "El nombre es obligatorio"),
            cif: z.string().trim().toUpperCase().regex(cifRegex, "El CIF no tiene un formato valido"),
            address: addressSchema
        })
    ])
});

export const schemaRefreshTokenBody = z.object({
    body: z.object({
        refreshToken: z.string().min(1, "refreshToken es obligatorio")
    })
});

export const schemaPasswordBody = z.object({
    body: z.object({
        currentPassword: z.string().min(8),
        newPassword: z.string().min(8),
    }).refine((data) => data.currentPassword !== data.newPassword, {
        message: "La nueva contraseña debe ser diferente de la actual",
        path: ["newPassword"]
    }
    )
});