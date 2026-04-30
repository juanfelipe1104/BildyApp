import { z } from "zod";
import { addressSchema, objectId } from "./common.validator.js";

export const schemaProjectBody = z.object({
    body: z.object({
        client: objectId,
        name: z.string().optional(),
        projectCode: z.string(),
        email: z.email().optional(),
        notes: z.string().optional(),
        address: addressSchema.optional()
    })
});

export const schemaProjectUpdateBody = z.object({
    body: z.object({
        name: z.string().optional(),
        projectCode: z.string().optional(),
        email: z.email().optional(),
        notes: z.string().optional(),
        address: addressSchema.optional(),
        active: z.boolean().optional()
    })
});

export const schemaProjectQuery = z.object({
    query: z.object({
        client: objectId.optional(),
        name: z.string().optional(),
        projectCode: z.string().optional(),
        email: z.email().optional(),
        notes: z.string().optional(),
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        sort: z.string().optional()
    })
});