import { z } from "zod";

export const schemaDeliveryNoteBody = z.object({
    body: z.object({
        client: z.string(),
        project: z.string().optional(),
        format: z.enum(["materials", "hours"]).optional(),
        description: z.string().optional(),
        workDate: z.coerce.date().optional(),
        material: z.string().optional(),
        quantity: z.number().optional(),
        unit: z.string().optional(),
        hours: z.number().optional(),
        workers: z.array(
            z.object({
                name: z.string().trim().min(1),
                hours: z.coerce.number().positive()
            })
        ).optional()
    })
});

export const schemaDeliveryNoteQuery = z.object({
    query: z.object({
        client: z.string().optional(),
        project: z.string().optional(),
        format: z.enum(["materials", "hours"]).optional(),
        description: z.string().optional(),
        workDate: z.coerce.date().optional(),
        material: z.string().optional(),
        quantity: z.coerce.number().optional(),
        hours: z.coerce.number().optional(),
        user: z.string().optional(),
        company: z.string().optional(),
        page: z.coerce.number().optional(),
        limit: z.coerce.number().optional(),
        sort: z.string().optional()
    })
});