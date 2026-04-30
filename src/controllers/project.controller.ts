import type { Request, Response } from "express";
import { AppError } from '../utils/AppError.js';
import Project, { type ProjectDocument } from "../models/Project.js";
import Client from "../models/Client.js";

export const createProject = async (req: Request, res: Response): Promise<void> => {
    const { client, name, projectCode, address, email, notes } = req.body;
    const user = req.user._id;
    const company = req.user.company;
    const clientExists = await Client.findOne({_id: client, company});
    if(!clientExists){
        throw AppError.notFound("No existe el cliente en la compañia");
    }
    const project = await Project.create({
        user, company, client, name, projectCode, address, email, notes
    });
    res.status(201).json({
        message: "Proyecto creado",
        project
    });
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
    const project = req.project;
    const projectData = req.body;
    project.set(projectData);
    await project.save();
    res.json({
        message: "Proyecto actualizado",
        project
    });
};

export const getProjects = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, skip, filters, sortOption } = req.queryData;
    const projects = await Project.find(filters).skip(skip).limit(limit).sort(sortOption);
    const totalItems = await Project.countDocuments(filters);
    const totalPages = Math.ceil(totalItems / limit);
    res.json({
        totalPages,
        totalItems,
        currentPage: page,
        projects
    });
};

export const getProject = async (req: Request, res: Response): Promise<void> => {
    const project = req.project;
    res.json({
        project
    })
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
    const { soft } = req.query;
    const projectId = req.project._id;
    const isActive = req.project.active;
    let project: ProjectDocument;
    if (isActive) {
        throw AppError.forbidden("No se pueden borrar proyectos activos");
    }
    if (soft === "true") {
        project = await Project.softDeleteById(projectId);
    }
    else {
        project = await Project.hardDelete(projectId);
    }
    res.json({
        message: "Proyecto borrado",
        project
    });
};

export const getArchivedProjects = async (req: Request, res: Response): Promise<void> => {
    const companyId = req.user.company;
    const archivedProjects = await Project.findDeleted({ company: companyId }) as ProjectDocument[];
    let message = "Proyectos archivados";
    if (archivedProjects.length === 0) {
        message = "No hay proyectos archivados"
    }
    res.json({
        message,
        archivedProjects
    })
}

export const restoreProject = async (req: Request, res: Response): Promise<void> => {
    const companyId = req.user.company;
    const projectId = String(req.params.id);
    const projects = await Project.findDeleted({ _id: projectId, company: companyId });
    if (projects.length === 0) {
        throw AppError.notFound("No hay proyecto archivado");
    }
    const restoredProject = await Project.restoreById(projectId) as ProjectDocument;
    res.json({
        message: "Proyecto restaurado",
        restoredProject
    })
}