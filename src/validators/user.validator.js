import { z } from "zod";

export const schemaMailBody = z.object({
    body: z.object({
        email: z.string().regex(/\w+@\w+.\w+/, 'formato de correo incorrecto').transform(value => value.toLowerCase()),
        password: z.string().min(8, "La contraseña debe contener minimo 8 caracteres").max(16, "La contraseña puede contener maximo 16 caracteres")
    })
})

export const schemaUserBody = z.object({
    body: z.object({
        name: z.string(),
        lastName: z.string(),
        nif: z.string(),
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
        code: z.string().length(6, "El codigo debe ser de 6 digitos")
    })
})