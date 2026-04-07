import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

const validate = (schema) => async (req, res, next) => {
    try {
        const parsed = await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params
        });

        if(parsed.body){
            req.body = parsed.body;
        }

        if(parsed.query){
            Object.assign(req.query, parsed.query);
        }

        if(parsed.params){
            req.params = parsed.params;
        }

        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = error.issues.map(err => ({
                campo: err.path.join('.'),
                mensaje: err.message
            }));

            throw AppError.validation('Error de validación', errors);
        }
        next(error);
    }
};

export default validate;