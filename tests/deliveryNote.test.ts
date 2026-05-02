import request from "supertest";
import { createReadyUser, createUserWithCompany, createClient, createProject, createProjectScenario, createMaterialDeliveryNote, createHoursDeliveryNote } from "./setup/helpers.js";
import { setupMocks, uploadSignatureMock, uploadPDFMock } from "./setup/mocks.js";

setupMocks();

const { default: app } = await import("../src/app.js");

const validPngBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=", "base64");

describe("DeliveryNote", () => {
    it("debería crear un albarán de material", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "create.material.delivery@example.com");

        const response = await createMaterialDeliveryNote(app, accessToken, client._id, project._id);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("deliveryNote");
        expect(response.body.deliveryNote.format).toBe("material");
        expect(response.body.deliveryNote.material).toBe("Cemento");
        expect(response.body.deliveryNote.quantity).toBe(10);
        expect(response.body.deliveryNote.unit).toBe("sacos");
        expect(response.body.deliveryNote.signed).toBe(false);
    });

    it("debería crear un albarán de horas con hours", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "create.hours.delivery@example.com");

        const response = await createHoursDeliveryNote(app, accessToken, client._id, project._id);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("deliveryNote");
        expect(response.body.deliveryNote.format).toBe("hours");
        expect(response.body.deliveryNote.hours).toBe(8);
        expect(response.body.deliveryNote.signed).toBe(false);
    });

    it("debería crear un albarán de horas con workers", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "create.workers.delivery@example.com");

        const response = await createHoursDeliveryNote(app, accessToken, client._id, project._id, {
            hours: undefined,
            workers: [
                { name: "Juan", hours: 4 },
                { name: "Pedro", hours: 3 }
            ]
        }
        );

        expect(response.status).toBe(201);
        expect(response.body.deliveryNote.format).toBe("hours");
        expect(response.body.deliveryNote.workers.length).toBe(2);
        expect(response.body.deliveryNote.workers[0].name).toBe("Juan");
    });

    it("debería rechazar crear albarán sin token", async () => {
        const response = await request(app).post("/api/deliverynote").send({
            client: "663a0e4f9a21b2d4c84fd123",
            project: "663a0f8a9a21b2d4c84fd456",
            format: "material",
            workDate: "2026-04-30",
            material: "Cemento",
            quantity: 10,
            unit: "sacos"
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar crear albarán si el usuario no tiene compañía", async () => {
        const { accessToken } = await createReadyUser(app, "delivery.no.company@example.com");

        const response = await request(app)
            .post("/api/deliverynote")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                client: "663a0e4f9a21b2d4c84fd123",
                project: "663a0f8a9a21b2d4c84fd456",
                format: "material",
                workDate: "2026-04-30",
                material: "Cemento",
                quantity: 10,
                unit: "sacos"
            });

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar albarán de material incompleto", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "invalid.material.delivery@example.com");

        const response = await request(app).post("/api/deliverynote").set("Authorization", `Bearer ${accessToken}`).send({
            client: client._id,
            project: project._id,
            format: "material",
            workDate: "2026-04-30",
            material: "Cemento"
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar albarán de horas sin hours ni workers", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "invalid.hours.delivery@example.com");

        const response = await request(app).post("/api/deliverynote").set("Authorization", `Bearer ${accessToken}`).send({
            client: client._id,
            project: project._id,
            format: "hours",
            workDate: "2026-04-30"
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar crear albarán si el proyecto no corresponde al cliente", async () => {
        const { accessToken } = await createUserWithCompany(app, "delivery.project.client.mismatch@example.com");

        const clientA = await createClient(app, accessToken, { cif: "B20000002" });

        const clientB = await createClient(app, accessToken, { cif: "B20000003" });

        expect(clientA.status).toBe(201);
        expect(clientB.status).toBe(201);

        const projectA = await createProject(app, accessToken, clientA.body.client._id, { projectCode: "PR-MISMATCH" });

        expect(projectA.status).toBe(201);

        const response = await createMaterialDeliveryNote(app, accessToken, clientB.body.client._id, projectA.body.project._id);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería obtener albaranes paginados", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "get.deliverynotes@example.com");

        await createMaterialDeliveryNote(app, accessToken, client._id, project._id, { description: "Material uno" });

        await createHoursDeliveryNote(app, accessToken, client._id, project._id, { description: "Horas dos" });

        const response = await request(app).get("/api/deliverynote").set("Authorization", `Bearer ${accessToken}`).query({
            page: 1,
            limit: 10
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("deliveryNotes");
        expect(Array.isArray(response.body.deliveryNotes)).toBe(true);
        expect(response.body.deliveryNotes.length).toBe(2);
        expect(response.body).toHaveProperty("totalItems");
        expect(response.body).toHaveProperty("totalPages");
        expect(response.body).toHaveProperty("currentPage");
    });

    it("debería filtrar albaranes por formato", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "filter.format.delivery@example.com");

        await createMaterialDeliveryNote(app, accessToken, client._id, project._id);
        await createHoursDeliveryNote(app, accessToken, client._id, project._id);

        const response = await request(app).get("/api/deliverynote").set("Authorization", `Bearer ${accessToken}`).query({ format: "material" });

        expect(response.status).toBe(200);
        expect(response.body.deliveryNotes.length).toBe(1);
        expect(response.body.deliveryNotes[0].format).toBe("material");
    });

    it("debería filtrar albaranes por rango de fechas", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "filter.date.delivery@example.com");

        await createMaterialDeliveryNote(app, accessToken, client._id, project._id, {
            workDate: "2026-04-10",
            description: "Dentro del rango"
        });

        await createMaterialDeliveryNote(app, accessToken, client._id, project._id, {
            workDate: "2026-05-10",
            description: "Fuera del rango",
            material: "Arena"
        });

        const response = await request(app).get("/api/deliverynote").set("Authorization", `Bearer ${accessToken}`).query({
            from: "2026-04-01",
            to: "2026-04-30"
        });

        expect(response.status).toBe(200);
        expect(response.body.deliveryNotes.length).toBe(1);
        expect(response.body.deliveryNotes[0].description).toBe("Dentro del rango");
    });

    it("debería ordenar albaranes por workDate descendente", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "sort.delivery@example.com");

        await createMaterialDeliveryNote(app, accessToken, client._id, project._id, {
            workDate: "2026-04-10",
            description: "Antiguo"
        });

        await createMaterialDeliveryNote(app, accessToken, client._id, project._id, {
            workDate: "2026-05-10",
            description: "Nuevo",
            material: "Arena"
        });

        const response = await request(app).get("/api/deliverynote").set("Authorization", `Bearer ${accessToken}`).query({
            sort: "-workDate"
        });

        expect(response.status).toBe(200);
        expect(response.body.deliveryNotes[0].description).toBe("Nuevo");
    });

    it("debería rechazar query inválida en listado de albaranes", async () => {
        const { accessToken } = await createProjectScenario(app, "invalid.query.delivery@example.com");

        const response = await request(app).get("/api/deliverynote").set("Authorization", `Bearer ${accessToken}`).query({
            page: -1
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería obtener un albarán por ID", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "get.delivery.by.id@example.com");

        const deliveryResponse = await createMaterialDeliveryNote(app, accessToken, client._id, project._id);

        expect(deliveryResponse.status).toBe(201);

        const deliveryNoteId = deliveryResponse.body.deliveryNote._id;

        const response = await request(app).get(`/api/deliverynote/${deliveryNoteId}`).set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("deliveryNote");
        expect(response.body.deliveryNote._id).toBe(deliveryNoteId);
    });

    it("debería rechazar obtener albarán con ObjectId inválido", async () => {
        const { accessToken } = await createProjectScenario(app, "invalid.delivery.id@example.com");

        const response = await request(app).get("/api/deliverynote/id-invalido").set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería devolver 404 si el albarán no pertenece a la compañía", async () => {
        const userA = await createProjectScenario(app, "delivery.scope.a@example.com", { name: "Delivery Scope A SL", cif: "B21000001" });

        const userB = await createProjectScenario(app, "delivery.scope.b@example.com", { name: "Delivery Scope B SL", cif: "B21000002" });

        const deliveryA = await createMaterialDeliveryNote(app, userA.accessToken, userA.client._id, userA.project._id);

        expect(deliveryA.status).toBe(201);

        const response = await request(app).get(`/api/deliverynote/${deliveryA.body.deliveryNote._id}`).set("Authorization", `Bearer ${userB.accessToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería generar PDF de un albarán no firmado", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "pdf.delivery@example.com");

        const deliveryResponse = await createMaterialDeliveryNote(app, accessToken, client._id, project._id);

        expect(deliveryResponse.status).toBe(201);

        const response = await request(app).get(`/api/deliverynote/pdf/${deliveryResponse.body.deliveryNote._id}`).set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("application/pdf");
    });

    it("debería firmar un albarán", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "sign.delivery@example.com");

        const deliveryResponse = await createMaterialDeliveryNote(app, accessToken, client._id, project._id);

        expect(deliveryResponse.status).toBe(201);

        const response = await request(app).patch(`/api/deliverynote/${deliveryResponse.body.deliveryNote._id}/sign`).set("Authorization", `Bearer ${accessToken}`)
            .attach("signature", validPngBuffer, {
                filename: "signature.png",
                contentType: "image/png"
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("deliveryNote");
        expect(response.body.deliveryNote.signed).toBe(true);
        expect(response.body.deliveryNote.signatureUrl).toBe("https://res.cloudinary.com/test/signature.png");
        expect(response.body.deliveryNote.pdfUrl).toBe("https://res.cloudinary.com/test/albaran.pdf");

        expect(uploadSignatureMock).toHaveBeenCalled();
        expect(uploadPDFMock).toHaveBeenCalled();
    });

    it("debería rechazar firmar un albarán sin archivo", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "sign.no.file.delivery@example.com");

        const deliveryResponse = await createMaterialDeliveryNote(app, accessToken, client._id, project._id);

        const response = await request(app).patch(`/api/deliverynote/${deliveryResponse.body.deliveryNote._id}/sign`).set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar firmar dos veces el mismo albarán", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "sign.twice.delivery@example.com");

        const deliveryResponse = await createMaterialDeliveryNote(app, accessToken, client._id, project._id);

        const deliveryNoteId = deliveryResponse.body.deliveryNote._id;

        const firstSign = await request(app).patch(`/api/deliverynote/${deliveryNoteId}/sign`).set("Authorization", `Bearer ${accessToken}`)
            .attach("signature", validPngBuffer, {
                filename: "signature.png",
                contentType: "image/png"
            });

        expect(firstSign.status).toBe(200);

        const secondSign = await request(app).patch(`/api/deliverynote/${deliveryNoteId}/sign`).set("Authorization", `Bearer ${accessToken}`)
            .attach("signature", validPngBuffer, {
                filename: "signature.png",
                contentType: "image/png"
            });

        expect(secondSign.status).toBe(409);
        expect(secondSign.body).toHaveProperty("error", true);
    });

    it("debería rechazar firma con formato inválido", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "sign.invalid.file.delivery@example.com");

        const deliveryResponse = await createMaterialDeliveryNote(app, accessToken, client._id, project._id);

        const response = await request(app).patch(`/api/deliverynote/${deliveryResponse.body.deliveryNote._id}/sign`).set("Authorization", `Bearer ${accessToken}`)
            .attach("signature", Buffer.from("fake text"), {
                filename: "signature.txt",
                contentType: "text/plain"
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería hacer soft delete de un albarán no firmado", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "soft.delete.delivery@example.com");

        const deliveryResponse = await createMaterialDeliveryNote(app, accessToken, client._id, project._id);

        const deliveryNoteId = deliveryResponse.body.deliveryNote._id;

        const deleteResponse = await request(app).delete(`/api/deliverynote/${deliveryNoteId}`).set("Authorization", `Bearer ${accessToken}`)
            .query({ soft: "true" });

        expect(deleteResponse.status).toBe(200);

        const getResponse = await request(app).get(`/api/deliverynote/${deliveryNoteId}`).set("Authorization", `Bearer ${accessToken}`);

        expect(getResponse.status).toBe(404);
    });

    it("debería hacer hard delete de un albarán no firmado", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "hard.delete.delivery@example.com");

        const deliveryResponse = await createMaterialDeliveryNote(app, accessToken, client._id, project._id);

        const deliveryNoteId = deliveryResponse.body.deliveryNote._id;

        const deleteResponse = await request(app).delete(`/api/deliverynote/${deliveryNoteId}`).set("Authorization", `Bearer ${accessToken}`)
            .query({ soft: "false" });

        expect(deleteResponse.status).toBe(200);

        const getResponse = await request(app).get(`/api/deliverynote/${deliveryNoteId}`).set("Authorization", `Bearer ${accessToken}`);

        expect(getResponse.status).toBe(404);
    });

    it("debería rechazar borrar un albarán firmado", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "delete.signed.delivery@example.com");

        const deliveryResponse = await createMaterialDeliveryNote(app, accessToken, client._id, project._id);

        const deliveryNoteId = deliveryResponse.body.deliveryNote._id;

        const signResponse = await request(app).patch(`/api/deliverynote/${deliveryNoteId}/sign`).set("Authorization", `Bearer ${accessToken}`)
            .attach("signature", validPngBuffer, {
                filename: "signature.png",
                contentType: "image/png"
            });

        expect(signResponse.status).toBe(200);

        const deleteResponse = await request(app).delete(`/api/deliverynote/${deliveryNoteId}`).set("Authorization", `Bearer ${accessToken}`)
            .query({ soft: "true" });

        expect(deleteResponse.status).toBe(403);
        expect(deleteResponse.body).toHaveProperty("error", true);
    });

    it("debería rechazar borrar albarán sin token", async () => {
        const response = await request(app).delete("/api/deliverynote/663a10489a21b2d4c84fd789").query({ soft: "true" });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });
});