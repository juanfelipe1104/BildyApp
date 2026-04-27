import { z } from "zod";

export const schemaDeliveryNoteBody = z.object({
    body: z.object({
        client: z.string(),
        project: z.string().optional(),
        format: z.enum(["materials", "hours"]).optional(),
        description: z.string().optional(),
        workDate: z.coerce.date(),
        material: z.string().optional(),
        quantity: z.number().optional(),
        hours: z.number().optional(),
        workers: [{
            name: {
                type: String
            },
            hour: {
                type: Number
            }
        }]
    })
});

export const schemaDeliveryNoteQuery = z.object({
    query: z.object({
        client: z.string().optional(),
        project: z.string().optional(),
        format: z.enum(["materials", "hours"]).optional(),
        description: z.string().optional(),
        workDate: z.coerce.date(),
        material: z.string().optional(),
        quantity: z.coerce.number().optional(),
        hours: z.coerce.number().optional(),
        user: z.string(),
        company: z.string(),
        page: z.coerce.number().optional(),
        limit: z.coerce.number().optional(),
        sort: z.string()
    })
});