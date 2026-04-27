import type { ClientDocument } from '../models/Client.ts';
import { DeliveryNoteDocument } from '../models/DeliveryNote.ts';
import { ProjectDocument } from '../models/Project.ts';
import type { UserDocument } from '../models/User.js';

declare global {
    namespace Express {
        interface Request {
            user: UserDocument;
            queryData: {
                page: number;
                limit: number;
                skip: number;
                filters: Record<string, string>;
                sortOption: Record<string, 1>;

            };
            client: ClientDocument;
            project: ProjectDocument;
            deliveryNote: DeliveryNoteDocument;
        }
    }
}

export { };