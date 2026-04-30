import { Router } from "express";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const router = Router();

const __dirname = import.meta.dirname;

const routeFiles = readdirSync(__dirname).filter(file => file.endsWith(".routes.js") || file.endsWith(".routes.ts"));

for (const file of routeFiles) {
    const routeName = file.replace(".routes.ts", "");
    const routeModule = await import(join(__dirname, file));
    router.use(`/${routeName}`, routeModule.default);
    console.log(`Ruta cargada: /${routeName}`);
}

export default router;