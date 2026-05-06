import type { Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import DeliveryNote, { type DeliveryNoteDocument, type PopulatedDeliveryNote } from "../models/DeliveryNote.js";
import Project from "../models/Project.js";
import pdfService from "../services/pdf.service.js";
import cloudinaryService from "../services/cloudinary.service.js";
import { emitToCompany } from "../sockets/socket.js";
import { createAuditLog } from "../services/audit.service.js";

export const createDeliveryNote = async (req: Request, res: Response) => {
    const user = req.user._id;
    const company = req.user.company;
    const deliveryNoteData = req.body;
    const project = await Project.findOne({ _id: deliveryNoteData.project, company, client: deliveryNoteData.client });
    if (!project) {
        throw AppError.notFound("No hay un proyecto");
    }
    const deliveryNote = await DeliveryNote.create({
        user, company, ...deliveryNoteData
    });
    emitToCompany(company!.toString(), "deliverynote:new", deliveryNote);
    await createAuditLog({
        action: "DELIVERYNOTE_CREATED",
        entity: "DeliveryNote",
        entityId: deliveryNote._id.toString(),
        companyId: company!.toString(),
        userId: user.toString(),
        metadata: {
            format: deliveryNote.format,
            client: deliveryNote.client.toString(),
            project: deliveryNote.project.toString(),
            workDate: deliveryNote.workDate
        }
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

export const signPDF = async (req: Request, res: Response) => {
    if (!req.file) {
        throw AppError.badRequest("No se ha enviado ningun archivo");
    }
    const deliveryNote = await req.deliveryNote.populate(['user', 'company', 'client', 'project']) as PopulatedDeliveryNote;
    const signature = req.file.buffer;
    if (deliveryNote.signed) {
        throw AppError.conflict("El albaran esta firmado");
    }

    const uploadedSignature = await cloudinaryService.uploadDeliveryNoteSignature(signature, deliveryNote.company.cif, deliveryNote._id.toString());
    deliveryNote.signed = true;
    deliveryNote.signedAt = new Date();
    deliveryNote.signatureUrl = uploadedSignature.secure_url;

    const pdf = await pdfService.generateDeliveryNotePDF({ deliveryNote, signatureBuffer: signature });
    const uploadedPDF = await cloudinaryService.uploadDeliveryNotePdf(pdf, deliveryNote.company._id.toString(), deliveryNote._id.toString());
    deliveryNote.pdfUrl = uploadedPDF.secure_url;

    await deliveryNote.save();
    emitToCompany(deliveryNote.company._id.toString(), "deliverynote:signed", deliveryNote);
    await createAuditLog({
        action: "DELIVERYNOTE_SIGNED",
        entity: "DeliveryNote",
        entityId: deliveryNote._id.toString(),
        companyId: deliveryNote.company._id.toString(),
        userId: req.user._id.toString(),
        metadata: {
            signatureUrl: deliveryNote.signatureUrl,
            pdfUrl: deliveryNote.pdfUrl
        }
    });
    res.json({
        deliveryNote
    });
}

export const deleteDeliveryNote = async (req: Request, res: Response) => {
    const deliveryNoteId = req.deliveryNote._id;
    const isSigned = req.deliveryNote.signed;
    const { soft } = req.query;
    if (isSigned) {
        throw AppError.forbidden("No se puede borrar albaran firmado");
    }
    let deliveryNote: DeliveryNoteDocument;
    if (soft === "true") {
        deliveryNote = await DeliveryNote.softDeleteById(deliveryNoteId);
    }
    else {
        deliveryNote = await DeliveryNote.hardDelete(deliveryNoteId);
    }
    res.json({
        message: "Albaran borrado",
        deliveryNote
    })
}