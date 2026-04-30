import PDFDocument from 'pdfkit';
import type { PopulatedDeliveryNote } from '../models/DeliveryNote.js';
import type { Address } from '../models/User.js';

type GenerateDeliveryNotePDFOptions = {
    deliveryNote: PopulatedDeliveryNote;
    signatureBuffer?: Buffer;
};

const formatDate = (date?: Date): string => {
    if (!date) {
        return '-';
    }

    return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
};

const formatAddress = (address?: Address): string => {
    if (!address) {
        return '-';
    }

    return [address.street, address.number, address.postal, address.city, address.province].filter(Boolean).join(', ') || '-';
};

const addSectionTitle = (doc: PDFKit.PDFDocument, title: string): void => {
    doc.moveDown().fontSize(14).font('Helvetica-Bold').text(title).moveDown(0.5);

    doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke().moveDown(0.5);
};

const addField = (doc: PDFKit.PDFDocument, label: string, value?: string | number | null): void => {
    doc.fontSize(10).font('Helvetica-Bold').text(`${label}: `, { continued: true }).font('Helvetica').text(value?.toString() || '-');
};

class PDFService {
    async generateDeliveryNotePDF({ deliveryNote, signatureBuffer }: GenerateDeliveryNotePDFOptions): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 45 });

            const chunks: Buffer[] = [];

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.fontSize(20).font('Helvetica-Bold').text('Albarán de trabajo', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).font('Helvetica').text(`Fecha de emisión: ${formatDate(new Date())}`, { align: 'right' });

            addSectionTitle(doc, 'Datos de la empresa');
            addField(doc, 'Empresa', deliveryNote.company.name);
            addField(doc, 'CIF', deliveryNote.company.cif);
            addField(doc, 'Dirección', formatAddress(deliveryNote.company.address));

            addSectionTitle(doc, 'Datos del usuario');
            addField(doc, 'Nombre', `${deliveryNote.user.name ?? ''} ${deliveryNote.user.lastName ?? ''}`.trim());
            addField(doc, 'Email', deliveryNote.user.email);
            addField(doc, 'NIF', deliveryNote.user.nif);

            addSectionTitle(doc, 'Datos del cliente');
            addField(doc, 'Cliente', deliveryNote.client.name?.toString());
            addField(doc, 'CIF', deliveryNote.client.cif?.toString());
            addField(doc, 'Email', deliveryNote.client.email?.toString());
            addField(doc, 'Teléfono', deliveryNote.client.phone?.toString());
            addField(doc, 'Dirección', formatAddress(deliveryNote.client.address));

            addSectionTitle(doc, 'Datos del proyecto');
            addField(doc, 'Proyecto', deliveryNote.project.name);
            addField(doc, 'Código', deliveryNote.project.projectCode);
            addField(doc, 'Email', deliveryNote.project.email);
            addField(doc, 'Dirección', formatAddress(deliveryNote.project.address));
            addField(doc, 'Notas', deliveryNote.project.notes);

            addSectionTitle(doc, 'Datos del albarán');
            addField(doc, 'Fecha de trabajo', formatDate(deliveryNote.workDate));
            addField(doc, 'Formato', deliveryNote.format === 'hours' ? 'Horas' : 'Materiales');
            addField(doc, 'Descripción', deliveryNote.description);
            if (deliveryNote.format === 'hours') {
                addField(doc, 'Horas totales', deliveryNote.hours?.toString());
                if (deliveryNote.workers?.length) {
                    doc.moveDown();
                    doc.font('Helvetica-Bold').text('Trabajadores:');
                    doc.moveDown(0.5);
                    deliveryNote.workers.forEach((worker, index) => {
                        doc.font('Helvetica').fontSize(10).text(`${index + 1}. ${worker.name || '-'} - ${worker.hours?.toString() ?? '-'} horas`);
                    });
                }
            }
            else {
                addField(doc, 'Material', deliveryNote.material);
                addField(doc, 'Unidad', deliveryNote.unit?.toString());
                addField(doc, 'Cantidad', deliveryNote.quantity?.toString());
            }

            addSectionTitle(doc, 'Firma');
            if (deliveryNote.signed) {
                addField(doc, 'Estado', 'Firmado');
                addField(doc, 'Fecha de firma', formatDate(deliveryNote.signedAt));
                if (signatureBuffer) {
                    doc.moveDown();
                    doc.font('Helvetica-Bold').text('Firma del cliente:');
                    doc.moveDown(0.5);
                    doc.image(signatureBuffer, { fit: [220, 100] });
                }
            }
            else {
                addField(doc, 'Estado', 'Pendiente de firma');
                doc.moveDown(2);
                doc.moveTo(45, doc.y).lineTo(250, doc.y).stroke();
                doc.fontSize(10).font('Helvetica').text('Firma del cliente');
            }

            doc.fontSize(8).font('Helvetica').text('Documento generado automáticamente.', 45, doc.page.height - 60, { align: 'center' });

            doc.end();
        });
    };
}

export default new PDFService();