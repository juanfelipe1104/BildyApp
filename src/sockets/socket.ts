import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import env from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/handleJWT.js";

let io: Server | null = null;

const getCompanyRoom = (companyId: string): string => {
    return `company:${companyId}`;
};

export const initSocket = (httpServer: HttpServer): Server => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
        }
    });

    const notificationsNamespace = io.of("/notifications");

    notificationsNamespace.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(AppError.unauthorized("Falta el token"));
        }

        const result = verifyAccessToken(token);

        if (result.expired || !result.valid) {
            return next(AppError.unauthorized("El access token es invalido"));
        }

        const user = await User.findById(result.payload._id);

        if (!user) {
            return next(AppError.unauthorized("El usuario del token no existe"));
        }

        if (user.status !== "verified") {
            return next(AppError.unauthorized("El usuario no esta verificado"));
        }

        if (!user.company) {
            return next(AppError.forbidden("El usuario no tiene compañia"));
        }

        socket.data.user = user;
        socket.data.company = user.company.toString();

        next();
    });

    notificationsNamespace.on("connection", socket => {
        const companyId = socket.data.company;
        const room = getCompanyRoom(companyId);

        socket.join(room);

        socket.emit("notifications:connected", {
            message: "Conectado al namespace de notificaciones",
            room
        });

        socket.on("disconnect", () => {
            console.log(`Socket desconectado: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = (): Server => {
    if (!io) {
        throw AppError.badRequest("Socket.IO no ha sido inicializado");
    }

    return io;
};

export const emitToCompany = (companyId: string, event: string, info: unknown): void => {
    if (!io) {
        return;
    }
    io.of("/notifications").to(getCompanyRoom(companyId)).emit(event, info);
};

export const closeSocket = async (): Promise<void> => {
    if (!io) {
        return;
    }
    await io.close();
    io = null;
};