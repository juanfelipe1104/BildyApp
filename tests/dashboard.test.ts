import request from "supertest";
import { registerUser, createProjectScenario, createMaterialDeliveryNote, createHoursDeliveryNote, createClient, createProject, createReadyUser } from "./setup/helpers.js";
import { uploadSignatureMock, uploadPDFMock, setupMocks } from "./setup/mocks.js";

setupMocks();

const { default: app } = await import("../src/app.js");

const validPngBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=", "base64");

describe("Dashboard", () => {
    it("debería obtener estadísticas agregadas de la compañía", async () => {
        const { accessToken, client, project } = await createProjectScenario(app, "dashboard@example.com", {
            name: "Dashboard Company SL",
            cif: "B30000001"
        }
        );

        const secondClientResponse = await createClient(app, accessToken, {
            name: "Segundo Cliente SL",
            cif: "B30000002",
            email: "segundo.dashboard@test.com"
        });

        expect(secondClientResponse.status).toBe(201);

        const secondProjectResponse = await createProject(app, accessToken, secondClientResponse.body.client._id, {
            name: "Segundo Proyecto",
            projectCode: "PR-DASH-2"
        }
        );

        expect(secondProjectResponse.status).toBe(201);

        const updateSecondProjectResponse = await request(app).put(`/api/project/${secondProjectResponse.body.project._id}`).set("Authorization", `Bearer ${accessToken}`)
            .send({
                active: false
            });

        expect(updateSecondProjectResponse.status).toBe(200);
        expect(updateSecondProjectResponse.body.project.active).toBe(false);

        expect(secondProjectResponse.status).toBe(201);

        const materialDeliveryNote = await createMaterialDeliveryNote(app, accessToken, client._id, project._id, {
            workDate: "2026-04-10",
            material: "Cemento",
            quantity: 10,
            unit: "sacos"
        }
        );

        expect(materialDeliveryNote.status).toBe(201);

        const hoursDeliveryNote = await createHoursDeliveryNote(app, accessToken, client._id, project._id, {
            workDate: "2026-04-15",
            hours: 8
        }
        );

        expect(hoursDeliveryNote.status).toBe(201);

        const workersDeliveryNote = await createHoursDeliveryNote(app, accessToken, secondClientResponse.body.client._id, secondProjectResponse.body.project._id, {
            workDate: "2026-05-10",
            hours: undefined,
            workers: [
                {
                    name: "Juan",
                    hours: 4
                },
                {
                    name: "Pedro",
                    hours: 3
                }
            ]
        }
        );

        expect(workersDeliveryNote.status).toBe(201);

        const response = await request(app).get("/api/dashboard").set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);

        expect(response.body).toHaveProperty("summary");
        expect(response.body).toHaveProperty("deliveryNotesByMonth");
        expect(response.body).toHaveProperty("hoursByProject");
        expect(response.body).toHaveProperty("materialsByClient");
        expect(response.body).toHaveProperty("projectsByStatus");

        expect(response.body.summary.clients).toBe(2);
        expect(response.body.summary.projects).toBe(2);
        expect(response.body.summary.deliveryNotes).toBe(3);
        expect(response.body.summary.signedDeliveryNotes).toBe(0);
        expect(response.body.summary.pendingDeliveryNotes).toBe(3);

        expect(response.body.projectsByStatus.active).toBe(1);
        expect(response.body.projectsByStatus.inactive).toBe(1);

        expect(response.body.deliveryNotesByMonth).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    month: "2026-04",
                    total: 2
                }),
                expect.objectContaining({
                    month: "2026-05",
                    total: 1
                })
            ])
        );

        expect(response.body.hoursByProject).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    project: project.name,
                    totalHours: 8
                }),
                expect.objectContaining({
                    project: "Segundo Proyecto",
                    totalHours: 7
                })
            ])
        );

        expect(response.body.materialsByClient).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    client: client.name,
                    material: "Cemento",
                    unit: "sacos",
                    totalQuantity: 10
                })
            ])
        );
    });

    it("debería contabilizar albaranes firmados y pendientes", async () => {
        uploadSignatureMock.mockClear();
        uploadPDFMock.mockClear();

        const { accessToken, client, project } = await createProjectScenario(app, "dashboard.signed@example.com", {
            name: "Dashboard Signed SL",
            cif: "B30000003"
        }
        );

        const signedDeliveryNote = await createMaterialDeliveryNote(app, accessToken, client._id, project._id, {
            material: "Ladrillos",
            quantity: 50,
            unit: "unidades"
        }
        );

        expect(signedDeliveryNote.status).toBe(201);

        const pendingDeliveryNote = await createHoursDeliveryNote(app, accessToken, client._id, project._id, { hours: 5 });

        expect(pendingDeliveryNote.status).toBe(201);

        const signResponse = await request(app).patch(`/api/deliverynote/${signedDeliveryNote.body.deliveryNote._id}/sign`).set("Authorization", `Bearer ${accessToken}`)
            .attach("signature", validPngBuffer, {
                filename: "signature.png",
                contentType: "image/png"
            });

        expect(signResponse.status).toBe(200);

        const response = await request(app).get("/api/dashboard").set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.summary.deliveryNotes).toBe(2);
        expect(response.body.summary.signedDeliveryNotes).toBe(1);
        expect(response.body.summary.pendingDeliveryNotes).toBe(1);
    });

    it("debería rechazar obtener dashboard sin token", async () => {
        const response = await request(app).get("/api/dashboard");

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar obtener dashboard si el usuario no está verificado", async () => {
        const registerResponse = await registerUser(app, "dashboard.pending@example.com");

        expect(registerResponse.status).toBe(201);

        const response = await request(app).get("/api/dashboard").set("Authorization", `Bearer ${registerResponse.body.access_token}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar obtener dashboard si el usuario no tiene compañía", async () => {
        const { accessToken } = await createReadyUser(app, "dashboard.no.company@example.com");

        const response = await request(app).get("/api/dashboard").set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("error", true);
    });
});