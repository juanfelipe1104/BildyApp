import { z } from "zod";

export const schemaUserBody = z.object({
    body: z.object({
        email: z.string().regex(/\w+@\w+.\w+/, 'formato de correo incorrecto').transform(value => value.toLowerCase()),
        password: z.string().min(8, "La contraseña debe contener minimo 8 caracteres").max(16, "La contraseña puede contener maximo 16 caracteres"),
        name: z.string(),
        lastName: z.string(),
        nif: z.string(),
        company: z.string(),
        address: z.object({
            street: z.string(),
            number: z.string(),
            postal: z.string(),
            city: z.string(),
            province: z.string()
        }).optional()
    })
})