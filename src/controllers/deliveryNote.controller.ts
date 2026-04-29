import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import DeliveryNote, { PopulatedDeliveryNote } from "../models/DeliveryNote.js";
import Project from "../models/Project.js";
import pdfService from "../services/pdf.service.js";

export const createDeliveryNote = async (req: Request, res: Response) => {
    const user = req.user._id;
    const company = req.user.company;
    const deliveryNoteData = req.body;
    const project = await Project.findOne({ _id: req.body.project, company, client: req.body.client });
    if (!project) {
        throw AppError.notFound("No hay un proyecto");
    }
    const deliveryNote = await DeliveryNote.create({
        user, company, ...deliveryNoteData
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
    await deliveryNote.populate(['user', 'company', 'client', 'project']);
    res.json({
        deliveryNote
    })
}

export const getPDF = async (req: Request, res: Response) => {
    const deliveryNote = await req.deliveryNote.populate(['user', 'company', 'client', 'project']) as PopulatedDeliveryNote;
    if (deliveryNote.signed) {
        return res.redirect(deliveryNote.pdfUrl);
    }
    const pdf = await pdfService.generateDeliveryNotePDF({ deliveryNote, signatureBuffer: undefined });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="albaran-${deliveryNote._id}.pdf"`);
    res.send(pdf);
}