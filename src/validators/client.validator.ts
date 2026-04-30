import { z } from "zod";
import { addressSchema, cifRegex } from "./common.validator.js";

export const schemaClientBody = z.object({
    body: z.object({
        name: z.string().optional(),
        cif: z.string().trim().toUpperCase().regex(cifRegex, "El CIF no tiene un formato valido").optional(),
        email: z.email().optional(),
        phone: z.string().optional(),
        address: addressSchema.optional()
    })
});

export const schemaClientQuery = z.object({
    query: z.object({
        name: z.string().optional(),
        cif: z.string().trim().toUpperCase().regex(cifRegex, "El CIF no tiene un formato valido").optional(),
        email: z.email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        page: z.coerce.number().optional(),
        limit: z.coerce.number().optional(),
        sort: z.string().optional()
    })
});