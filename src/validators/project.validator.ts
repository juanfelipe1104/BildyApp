import { z } from "zod";
import { addressSchema, cifRegex } from "./common.validator.js";

export const schemaProjectBody = z.object({
    body: z.object({
        client: z.string().optional(),
        name: z.string().optional(),
        projectCode: z.string().optional(),
        email: z.email().optional(),
        notes: z.string().optional(),
        address: addressSchema.optional()
    })
});

export const schemaProjectQuery = z.object({
    query: z.object({
        client: z.string().optional(),
        name: z.string().optional(),
        projectCode: z.string().optional(),
        email: z.email().optional(),
        notes: z.string(),
        company: z.string(),
        page: z.coerce.number().optional(),
        limit: z.coerce.number().optional(),
        sort: z.string()
    })
});