import type { Request, Response, NextFunction, RequestHandler } from 'express';

const buildQuery = (filterFields: string[], sortFields: string[]): RequestHandler => async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sort = req.query.sort?.toString();
    const skip = (page - 1) * limit;
    const filters: Record<string, any> = {}
    filters["user"] = req.user._id;
    filters["company"] = req.user.company;
    for (const [key, value] of Object.entries(req.query)) {
        if (filterFields.includes(key)) {
            filters[key] = value;
        }
    }
    let sortOption: Record<string, 1> = { createdAt: 1 };
    if (sort && sortFields.includes(sort)) {
        sortOption = { [sort]: 1 };
    }
    const builtQuery = { page, limit, skip, filters, sortOption };
    req.queryData = builtQuery;
    next();
}

const clientFilterFields = ['name', 'cif', 'email', 'phone', 'user', 'company'];
const clientSortFields = ['name', 'cif', 'email', 'phone', 'createdAt', 'updatedAt'];

export const buildQueryClient = buildQuery(clientFilterFields, clientSortFields);

const projectFilterFields = ['name', 'projectCode', 'email', 'notes', 'user', 'company', 'client'];
const projectSortFields = ['name', 'cif', 'email', 'phone', 'createdAt', 'updatedAt'];

export const buildQueryProject = buildQuery(projectFilterFields, projectSortFields);

export default buildQuery;