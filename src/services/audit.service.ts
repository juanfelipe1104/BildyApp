import type { AuditAction, Prisma } from "@prisma/client";
import prisma from "../config/prisma.js";
import env from "../config/env.js";

type CreateAuditLogInput = {
    action: AuditAction;
    entity: string;
    entityId: string;
    companyId: string;
    userId?: string;
    metadata: Prisma.InputJsonValue;
};

export const createAuditLog = async ({ action, entity, entityId, companyId, userId, metadata = {} }: CreateAuditLogInput): Promise<void> => {
    if (env.NODE_ENV === "test") {
        return;
    }
    try {
        await prisma.auditLog.create({
            data: { action, entity, entityId, companyId, userId, metadata }
        });
    } catch (error) {
        console.error("Error creando audit log:", error);
    }
};