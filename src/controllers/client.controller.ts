import type { Request, Response } from "express";
import Client, { ClientDocument } from "../models/Client.js";
import { AppError } from '../utils/AppError.js';

export const createClient = async (req: Request, res: Response): Promise<void> => {
    const { name, cif, email, phone, address } = req.body;
    const userId = req.user._id;
    const companyId = req.user.company;
    const alreadyClient = await Client.find({ company: companyId, cif: cif });
    if (alreadyClient) {
        throw AppError.conflict();
    }
    const client = await Client.create({
        user: userId,
        company: companyId,
        name, cif, email, phone, address
    });
    res.status(201).json({
        message: "Cliente creado",
        client
    });
}

export const updateClient = async (req: Request, res: Response): Promise<void> => {
    const client = req.client;
    const clientData = req.body;
    client.set(clientData);
    await client.save();
    res.json({
        message: "Cliente actualizado",
        client
    });
}

export const getClients = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, skip, filters, sortOption } = req.queryData;
    const clients = await Client.find(filters).skip(skip).limit(limit).sort(sortOption);
    const totalItems = await Client.countDocuments(filters);
    const totalPages = Math.ceil(totalItems / limit);
    res.status(200).json({
        totalPages,
        totalItems,
        currentPage: page,
        clients
    });
}

export const getClient = async (req: Request, res: Response): Promise<void> => {
    const client = req.client;
    res.json({
        client
    })
}

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