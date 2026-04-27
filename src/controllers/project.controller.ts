import type { Request, Response } from "express";
import { AppError } from '../utils/AppError.js';
import Project, { ProjectDocument } from "../models/Project.js";

export const createProject = async (req: Request, res: Response): Promise<void> => {
    const { client, name, projectCode, address, email, notes } = req.body;
    const userId = req.user._id;
    const companyId = req.user.company;
    const project = await Project.create({
        user: userId,
        company: companyId,
        client, name, projectCode, address, email, notes
    });
    res.status(201).json({
        message: "Cliente creado",
        project
    });
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
    const project = req.project;
    const projectData = req.body;
    project.set(projectData);
    await project.save();
    res.json({
        message: "Cliente actualizado",
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
        message: "Cliente borrado",
        project
    });
};

export const getArchivedProjects = async (req: Request, res: Response): Promise<void> => {
    const companyId = req.user.company;
    const archivedProjects = await Project.findDeleted({ company: companyId }) as ProjectDocument[];
    let message = "Proyectos archivados";
    if (!archivedProjects) {
        message = "No hay proyectos archivados"
    }
    res.json({
        message,
        archivedProjects
    })
}

export const restoreProject = async (req: Request, res: Response): Promise<void> => {
    const project = req.project;
    const projectId = project._id;
    const isDeleted = project.deleted;
    if (isDeleted) {
        throw AppError.notFound("No hay cliente archivado");
    }
    const restoredProject = await Project.restoreById(projectId) as ProjectDocument;
    res.json({
        message: "Cliente restaurado",
        restoredProject
    })
}