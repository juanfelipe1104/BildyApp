import type { Request, Response, NextFunction, RequestHandler } from 'express';

const buildQuery = (filterFields: string[], sortFields: string[], regexFields: string[] = ["name", "cif", "email", "phone", "notes", "description", "material", "projectCode"]): RequestHandler => async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sort = req.query.sort?.toString();
    const skip = (page - 1) * limit;
    const filters: Record<string, any> = {
        user: req.user._id,
        company: req.user.company
    };
    for (const [key, value] of Object.entries(req.query)) {
        if (filterFields.includes(key)) {
            if (regexFields.includes(key)) {
                filters[key] = { $regex: value, $options: "i" };
            } else {
                filters[key] = value;
            }
        }
    }

    const from = req.query.from;
    const to = req.query.to;
    if (from || to) {
        const workDateFilter: Record<string, Date> = {};
        if (from) {
            workDateFilter.$gte = new Date(from.toString());
        }
        if (to) {
            const toDate = new Date(to.toString());
            toDate.setHours(23, 59, 59, 999);
            workDateFilter.$lte = toDate;
        }
        filters.workDate = workDateFilter;
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: 1 };
    if (sort) {
        const direction = sort.startsWith("-") ? -1 : 1;
        const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
        if (sortFields.includes(sortField)) {
            sortOption = { [sortField]: direction };
        }
    }

    const builtQuery = { page, limit, skip, filters, sortOption };
    req.queryData = builtQuery;
    next();
}

const clientFilterFields = ['name', 'cif', 'email', 'phone'];
const clientSortFields = ['name', 'cif', 'email', 'phone', 'createdAt', 'updatedAt'];

export const buildQueryClient = buildQuery(clientFilterFields, clientSortFields);

const projectFilterFields = ['name', 'projectCode', 'email', 'notes', 'client'];
const projectSortFields = ['name', 'projectCode', 'email', 'createdAt', 'updatedAt'];

export const buildQueryProject = buildQuery(projectFilterFields, projectSortFields);

const deliveryNoteFilterFields = ['format', 'description', 'workDate', 'material', 'quantity', 'hours', 'signed', 'client', 'project'];
const deliveryNoteSortFields = ['format', 'workDate', 'material', 'quantity', 'hours', 'createdAt', 'updatedAt'];

export const buildQueryDeliveryNote = buildQuery(deliveryNoteFilterFields, deliveryNoteSortFields);

export default buildQuery;