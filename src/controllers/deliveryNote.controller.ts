import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import DeliveryNote from "../models/DeliveryNote.js";
import Project from "../models/Project.js";

export const createDeliveryNote = async (req: Request, res: Response) => {
    const company = req.user.company;
    const deliveryNoteData = req.body;
    const project = await Project.findOne({ _id: req.body.project, company, client: req.body.client });
    if (!project) {
        throw AppError.notFound("No hay un proyecto");
    }
    const deliveryNote = await DeliveryNote.create({
        company, ...deliveryNoteData
    });
    res.status(201).json({
        message: "Albaran creado",
        deliveryNote
    });
}

export const getDeliveryNotes = async (req: Request, res: Response) => {
    const { page, limit, skip, filters, sortOption } = req.queryData;
    const deliveryNotes = await DeliveryNote.find(filters).skip(skip).limit(limit).sort(sortOption);
    const totalItems = await DeliveryNote.countDocuments(filters);
    const totalPages = Math.ceil(totalItems / limit);
    res.json({
        totalPages,
        totalItems,
        currentPage: page,
        deliveryNotes
    });
}

export const getDeliveryNote = async (req: Request, res: Response) => {
    const deliveryNote = req.deliveryNote;
    await deliveryNote.populate(['company', 'client', 'project']);
    res.json({
        deliveryNote
    })
}