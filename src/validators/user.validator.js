import { z } from "zod";

export const schemaMailBody = z.object({
    body: z.object({
        email: z.email("Formato de correo incorrecto").trim().toLowerCase(),
        password: z.string().min(8, "La contraseña debe contener minimo 8 caracteres").max(16, "La contraseña puede contener maximo 16 caracteres")
    })
})

export const schemaUserBody = z.object({
    body: z.object({
        name: z.string().trim().min(1, "El nombre es obligatorio"),
        lastName: z.string().trim().min(1, "El apellido es obligatorio"),
        nif: z.string().trim().min(1, "El NIF es obligatorio"),
        address: z.object({
            street: z.string(),
            number: z.string(),
            postal: z.string(),
            city: z.string(),
            province: z.string()
        }).optional()
    })
})

export const schemaCodeBody = z.object({
    body: z.object({
        code: z.string().regex(/^\d{6}$/, "El código debe ser de 6 dígitos")
    })
})

export const schemaCompanyBody = z.object({
    body: z.object({
        name: z.string().trim().min(1, "El nombre es obligatorio"),
        cif: z.string().trim().min(1, "El CIF es obligatorio"),
        address: z.object({
            street: z.string(),
            number: z.string(),
            postal: z.string(),
            city: z.string(),
            province: z.string()
        }),
        isFreelance: z.boolean()
    })
})

export const schemaRefreshTokenBody = z.object({
    body: z.object({
        refreshToken: z.string().min(1, "refreshToken es obligatorio")
    })
});

export const schemaSoftDelete = z.object({
    query: z.object({
        soft: z.enum(["true", "false"])
    })
})

export const schemaPasswordBody = z.object({
    body: z.object({
        currentPassword: z.string().min(8),
        newPassword: z.string().min(8),
    }).refine((data) => data.currentPassword !== data.newPassword, {
        message: "La nueva contraseña debe ser diferente de la actual",
        path: ["newPassword"]
    }
    )
})