import { z } from "zod";

const nifRegex = /^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z])$/;
const cifRegex = /^[A-Z][0-9]{7}[0-9A-Z]$/;
const postalRegex = /^(0[1-9]|[1-4][0-9]|5[0-2])[0-9]{3}$/;
const verifyEmailCodeRegex = /^\d{6}$/;

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
        address: z.object({
            street: z.string().trim(),
            number: z.string().trim(),
            postal: z.string().trim().regex(postalRegex, "El codigo postal debe ser de 5 digitos"),
            city: z.string().trim(),
            province: z.string().trim()
        }).optional()
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
            address: z.object({
                street: z.string().trim(),
                number: z.string().trim(),
                postal: z.string().trim().regex(postalRegex, "El codigo postal debe ser de 5 digitos"),
                city: z.string().trim(),
                province: z.string().trim()
            })
        })
    ])
});

export const schemaRefreshTokenBody = z.object({
    body: z.object({
        refreshToken: z.string().min(1, "refreshToken es obligatorio")
    })
});

export const schemaSoftDelete = z.object({
    query: z.object({
        soft: z.enum(["true", "false"])
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