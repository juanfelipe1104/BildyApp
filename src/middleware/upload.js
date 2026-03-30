import multer from "multer";
import fs from "node:fs";
import { join, extname } from "node:path";
import { AppError } from "../utils/AppError.js";

const __dirname = import.meta.dirname;
const uploadDir = join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const uniqueName = `logo-${Date.now()}${ext}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedMimes.includes(file.mimetype)) {
        return cb(AppError.badRequest("Solo se permiten imágenes jpg, png o webp"));
    }

    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
});

export default upload;