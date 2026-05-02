import type { Request, Response } from "express";
import mongoose from "mongoose";

export const getHealth = (_req: Request, res: Response): void => {
    const dbConnected = mongoose.connection.readyState === 1;

    res.status(dbConnected ? 200 : 503).json({
        status: dbConnected ? "ok" : "error",
        db: dbConnected ? "connected" : "disconnected",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
};