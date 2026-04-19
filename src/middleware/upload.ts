import multer from "multer";
import fs from "node:fs";
import { join, extname } from "node:path";
import type { Request } from "express";
import type { FileFilterCallback } from "multer";
import { AppError } from "../utils/AppError.js";

const __dirname = import.meta.dirname;
const uploadDir = join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Migrado a Cloudinary (cambio de almacenamiento local a nube)
/*
const storage = multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        cb(null, uploadDir);
    },
    filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        const ext = extname(file.originalname).toLowerCase();
        const uniqueName = `logo-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, uniqueName);
    }
});
*/

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedMimes.includes(file.mimetype)) {
        return cb(AppError.badRequest("Solo se permiten imágenes jpg, png o webp"));
    }

    cb(null, true);
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
});

export default upload;