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
})