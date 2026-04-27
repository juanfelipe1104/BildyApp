import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import DeliveryNote from "../models/DeliveryNote.js";
import Project from "../models/Project.js";

export const createDeliveryNote = async (req: Request, res: Response) => {
    const user = req.user;
    const deliveryNoteData = req.body;
    const project = await Project.findOne({ company: user.company, client: req.body.client });
    if (!project) {
        throw AppError.notFound("No hay un proyecto");
    }
    const deliveryNote = await DeliveryNote.create({
        user: user._id, company: user.company, ...deliveryNoteData
    });
    res.status(201).json({
        message: "Albaran creado",
        deliveryNote
    });
}

