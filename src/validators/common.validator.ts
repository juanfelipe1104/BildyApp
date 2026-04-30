import { z } from "zod";

export const nifRegex = /^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z])$/;
export const cifRegex = /^[A-Z][0-9]{7}[0-9A-Z]$/;
export const postalRegex = /^(0[1-9]|[1-4][0-9]|5[0-2])[0-9]{3}$/;
export const verifyEmailCodeRegex = /^\d{6}$/;
export const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const objectId = z.string().regex(objectIdRegex, "ObjectId inválido");

export const schemaObjectId = z.object({
    params: z.object({
        id: objectId
    })
});

export const addressSchema = z.object({
    street: z.string().trim(),
    number: z.string().trim(),
    postal: z.string().trim().regex(postalRegex, "El codigo postal debe ser de 5 digitos"),
    city: z.string().trim(),
    province: z.string().trim()
});

export const schemaSoftDelete = z.object({
    query: z.object({
        soft: z.enum(["true", "false"]).default("true")
    })
});