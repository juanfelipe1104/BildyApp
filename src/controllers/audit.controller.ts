import type { Request, Response } from "express";
import prisma from "../config/prisma.js";

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
    const companyId = req.user.company!.toString();

    const logs = await prisma.auditLog.findMany({
        where: {
            companyId
        },
        orderBy: {
            createdAt: "desc"
        },
        take: 50
    });

    res.status(200).json({
        logs
    });
};