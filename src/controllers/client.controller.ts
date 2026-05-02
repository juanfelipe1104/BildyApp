import type { Request, Response } from "express";
import Client, { type ClientDocument } from "../models/Client.js";
import { AppError } from '../utils/AppError.js';
import { emitToCompany } from "../sockets/socket.js";

export const createClient = async (req: Request, res: Response): Promise<void> => {
    const clientData = req.body;
    const user = req.user._id;
    const company = req.user.company;
    const client = await Client.create({
        user, company, ...clientData
    });
    emitToCompany(company!.toString(), "client:new", client);
    res.status(201).json({
        message: "Cliente creado",
        client
    });
};

export const updateClient = async (req: Request, res: Response): Promise<void> => {
    const client = req.client;
    const clientData = req.body;
    client.set(clientData);
    await client.save();
    res.json({
        message: "Cliente actualizado",
        client
    });
};

export const getClients = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, skip, filters, sortOption } = req.queryData;
    const clients = await Client.find(filters).skip(skip).limit(limit).sort(sortOption);
    const totalItems = await Client.countDocuments(filters);
    const totalPages = Math.ceil(totalItems / limit);
    res.json({
        totalPages,
        totalItems,
        currentPage: page,
        clients
    });
};

export const getClient = async (req: Request, res: Response): Promise<void> => {
    const client = req.client;
    res.json({
        client
    })
};

export const deleteClient = async (req: Request, res: Response): Promise<void> => {
    const { soft } = req.query;
    const clientId = req.client._id;
    let client: ClientDocument;
    if (soft === "true") {
        client = await Client.softDeleteById(clientId);
    }
    else {
        client = await Client.hardDelete(clientId);
    }
    res.json({
        message: "Cliente borrado",
        client
    });
};

export const getArchivedClients = async (req: Request, res: Response): Promise<void> => {
    const companyId = req.user.company;
    const archivedClients = await Client.findDeleted({ company: companyId }) as ClientDocument[];
    let message = "Clientes archivados";
    if (archivedClients.length === 0) {
        message = "No hay clientes archivados"
    }
    res.json({
        message,
        archivedClients
    })
}

export const restoreClient = async (req: Request, res: Response): Promise<void> => {
    const companyId = req.user.company;
    const clientId = String(req.params.id);
    const clients = await Client.findDeleted({ _id: clientId, company: companyId });
    if (clients.length === 0) {
        throw AppError.notFound("No hay cliente archivado");
    }
    const restoredClient = await Client.restoreById(clientId) as ClientDocument;
    res.json({
        message: "Cliente restaurado",
        restoredClient
    })
}