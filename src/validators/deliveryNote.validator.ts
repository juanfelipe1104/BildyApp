import { z } from "zod";
import { objectId } from "./common.validator.js";

const baseDeliveryNoteBody = z.object({
    client: objectId,
    project: objectId,
    description: z.string().trim().optional(),
    workDate: z.coerce.date()
});

const materialDeliveryNoteBody = baseDeliveryNoteBody.extend({
    format: z.literal("material"),
    material: z.string().trim().min(1, "El material es obligatorio"),
    quantity: z.coerce.number().positive("La cantidad debe ser mayor que 0"),
    unit: z.string().trim().min(1, "La unidad es obligatoria")
});

const hoursDeliveryNoteBody = baseDeliveryNoteBody.extend({
    format: z.literal("hours"),
    hours: z.coerce.number().positive("Las horas deben ser mayores que 0").optional(),
    workers: z.array(
        z.object({
            name: z.string().trim().min(1, "El nombre del trabajador es obligatorio"),
            hours: z.coerce.number().positive("Las horas del trabajador deben ser mayores que 0")
        })
    ).min(1, "Debe haber al menos un trabajador").optional()
}).refine(data => data.hours !== undefined || data.workers !== undefined, {
    message: "Debes indicar hours o workers",
    path: ["hours"]
});

export const schemaDeliveryNoteBody = z.object({
    body: z.discriminatedUnion("format", [
        materialDeliveryNoteBody,
        hoursDeliveryNoteBody
    ])
});

export const schemaDeliveryNoteQuery = z.object({
    query: z.object({
        client: objectId.optional(),
        project: objectId.optional(),
        format: z.enum(["material", "hours"]).optional(),
        description: z.string().optional(),
        workDate: z.coerce.date().optional(),
        material: z.string().optional(),
        quantity: z.coerce.number().optional(),
        hours: z.coerce.number().optional(),
        page: z.coerce.number().optional(),
        limit: z.coerce.number().optional(),
        sort: z.string().optional()
    })
});