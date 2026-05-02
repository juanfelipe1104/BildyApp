import { jest } from "@jest/globals";
import request from "supertest";
import { createReadyUser, createUserWithCompany, createClient } from "./helpers.js";
import { sendEmailMock } from "./mocks.js";

jest.unstable_mockModule("../src/config/mail.js", () => ({
    sendEmail: sendEmailMock
}));

const { default: app } = await import("../src/app.js");

describe("Client", () => {
    it("debería crear un cliente", async () => {
        const { accessToken } = await createUserWithCompany(app, "create.client@example.com");

        const response = await createClient(app, accessToken);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("client");
        expect(response.body.client.cif).toBe("B87654321");
        expect(response.body.client.email).toBe("cliente@test.com");
        expect(response.body.client.password).toBeUndefined();
    });

    it("debería rechazar crear cliente sin token", async () => {
        const response = await request(app).post("/api/client").send({
            name: "Cliente Sin Token SL",
            cif: "B11111111"
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar crear cliente si el usuario no tiene compañía", async () => {
        const { accessToken } = await createReadyUser(app, "client.no.company@example.com");

        const response = await createClient(app, accessToken, { cif: "B22222222" });

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar crear cliente con body inválido", async () => {
        const { accessToken } = await createUserWithCompany(app, "invalid.client@example.com");

        const response = await request(app).post("/api/client").set("Authorization", `Bearer ${accessToken}`).send({
            cif: "cif-invalido",
            email: "email-invalido"
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar crear cliente duplicado por CIF en la misma compañía", async () => {
        const { accessToken } = await createUserWithCompany(app, "duplicate.client@example.com");

        const firstResponse = await createClient(app, accessToken, { cif: "B33333333" });

        expect(firstResponse.status).toBe(201);

        const secondResponse = await createClient(app, accessToken, {
            cif: "B33333333",
            email: "otro@test.com"
        });

        expect(secondResponse.status).toBe(409);
        expect(secondResponse.body).toHaveProperty("error", true);
    });

    it("debería obtener clientes paginados", async () => {
        const { accessToken } = await createUserWithCompany(app, "get.clients@example.com");

        await createClient(app, accessToken, {
            name: "Cliente Uno SL",
            cif: "B44444441",
            email: "uno@test.com"
        });

        await createClient(app, accessToken, {
            name: "Cliente Dos SL",
            cif: "B44444442",
            email: "dos@test.com"
        });

        const response = await request(app).get("/api/client").set("Authorization", `Bearer ${accessToken}`).query({
            page: 1,
            limit: 10
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("clients");
        expect(Array.isArray(response.body.clients)).toBe(true);
        expect(response.body.clients.length).toBe(2);
        expect(response.body).toHaveProperty("totalItems");
        expect(response.body).toHaveProperty("totalPages");
        expect(response.body).toHaveProperty("currentPage");
    });

    it("debería filtrar clientes por búsqueda parcial", async () => {
        const { accessToken } = await createUserWithCompany(app, "filter.clients@example.com");

        await createClient(app, accessToken, {
            name: "García Construcciones",
            cif: "B55555551",
            email: "garcia@test.com"
        });

        await createClient(app, accessToken, {
            name: "López Reformas",
            cif: "B55555552",
            email: "lopez@test.com"
        });

        const response = await request(app).get("/api/client").set("Authorization", `Bearer ${accessToken}`).query({
            name: "garcía"
        });

        expect(response.status).toBe(200);
        expect(response.body.clients.length).toBe(1);
        expect(response.body.clients[0].name).toBe("García Construcciones");
    });

    it("debería ordenar clientes de forma descendente", async () => {
        const { accessToken } = await createUserWithCompany(app, "sort.clients@example.com");

        await createClient(app, accessToken, {
            name: "AAA Cliente",
            cif: "B66666661"
        });

        await createClient(app, accessToken, {
            name: "ZZZ Cliente",
            cif: "B66666662"
        });

        const response = await request(app).get("/api/client").set("Authorization", `Bearer ${accessToken}`).query({
            sort: "-name"
        });

        expect(response.status).toBe(200);
        expect(response.body.clients[0].name).toBe("ZZZ Cliente");
    });

    it("debería rechazar query inválida en listado de clientes", async () => {
        const { accessToken } = await createUserWithCompany(app, "invalid.query.client@example.com");

        const response = await request(app).get("/api/client").set("Authorization", `Bearer ${accessToken}`).query({ page: -1 });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería obtener un cliente por ID", async () => {
        const { accessToken } = await createUserWithCompany(app, "get.client.by.id@example.com");

        const createResponse = await createClient(app, accessToken, { cif: "B77777771" });

        expect(createResponse.status).toBe(201);

        const clientId = createResponse.body.client._id;

        const response = await request(app).get(`/api/client/${clientId}`).set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("client");
        expect(response.body.client._id).toBe(clientId);
    });

    it("debería rechazar obtener cliente con ObjectId inválido", async () => {
        const { accessToken } = await createUserWithCompany(app, "invalid.client.id@example.com");

        const response = await request(app).get("/api/client/id-invalido").set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería devolver 404 si el cliente no pertenece a la compañía", async () => {
        const userA = await createUserWithCompany(app, "company.a.client@example.com", {
            name: "Company A SL",
            cif: "B11111111"
        });

        const userB = await createUserWithCompany(app, "company.b.client@example.com", {
            name: "Company B SL",
            cif: "B22222222"
        });

        const clientA = await createClient(app, userA.accessToken, {
            cif: "B88888881"
        });

        expect(clientA.status).toBe(201);

        const response = await request(app)
            .get(`/api/client/${clientA.body.client._id}`)
            .set("Authorization", `Bearer ${userB.accessToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería actualizar un cliente", async () => {
        const { accessToken } = await createUserWithCompany(app, "update.client@example.com");

        const createResponse = await createClient(app, accessToken, { cif: "B99999991" });

        expect(createResponse.status).toBe(201);

        const clientId = createResponse.body.client._id;

        const response = await request(app).put(`/api/client/${clientId}`).set("Authorization", `Bearer ${accessToken}`).send({ name: "Cliente Actualizado SL", email: "actualizado@test.com" });

        expect(response.status).toBe(200);
        expect(response.body.client.name).toBe("Cliente Actualizado SL");
        expect(response.body.client.email).toBe("actualizado@test.com");
    });

    it("debería rechazar actualizar un cliente con body inválido", async () => {
        const { accessToken } = await createUserWithCompany(app, "update.invalid.client@example.com");

        const createResponse = await createClient(app, accessToken, { cif: "B99999992" });

        const clientId = createResponse.body.client._id;

        const response = await request(app).put(`/api/client/${clientId}`).set("Authorization", `Bearer ${accessToken}`).send({
            cif: "cif-invalido",
            email: "email-invalido"
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería hacer soft delete de un cliente", async () => {
        const { accessToken } = await createUserWithCompany(app, "soft.delete.client@example.com");

        const createResponse = await createClient(app, accessToken, { cif: "B12121212" });

        const clientId = createResponse.body.client._id;

        const deleteResponse = await request(app).delete(`/api/client/${clientId}`).set("Authorization", `Bearer ${accessToken}`).query({ soft: "true" });

        expect(deleteResponse.status).toBe(200);

        const getResponse = await request(app).get(`/api/client/${clientId}`).set("Authorization", `Bearer ${accessToken}`);

        expect(getResponse.status).toBe(404);
    });

    it("debería hacer hard delete de un cliente", async () => {
        const { accessToken } = await createUserWithCompany(app, "hard.delete.client@example.com");

        const createResponse = await createClient(app, accessToken, { cif: "B13131313" });

        const clientId = createResponse.body.client._id;

        const deleteResponse = await request(app).delete(`/api/client/${clientId}`).set("Authorization", `Bearer ${accessToken}`).query({ soft: "false" });

        expect(deleteResponse.status).toBe(200);

        const getResponse = await request(app).get(`/api/client/${clientId}`).set("Authorization", `Bearer ${accessToken}`);

        expect(getResponse.status).toBe(404);
    });

    it("debería rechazar borrar cliente sin token", async () => {
        const response = await request(app).delete("/api/client/663a0e4f9a21b2d4c84fd123").query({ soft: "true" });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería listar clientes archivados", async () => {
        const { accessToken } = await createUserWithCompany(app, "archived.clients@example.com");

        const createResponse = await createClient(app, accessToken, { cif: "B14141414" });

        const clientId = createResponse.body.client._id;

        const deleteResponse = await request(app).delete(`/api/client/${clientId}`).set("Authorization", `Bearer ${accessToken}`).query({ soft: "true" });

        expect(deleteResponse.status).toBe(200);

        const response = await request(app).get("/api/client/archived").set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("archivedClients");
        expect(Array.isArray(response.body.archivedClients)).toBe(true);
        expect(response.body.archivedClients.length).toBe(1);
    });

    it("debería restaurar un cliente archivado", async () => {
        const { accessToken } = await createUserWithCompany(app, "restore.client@example.com");

        const createResponse = await createClient(app, accessToken, { cif: "B15151515" });

        const clientId = createResponse.body.client._id;

        const deleteResponse = await request(app).delete(`/api/client/${clientId}`).set("Authorization", `Bearer ${accessToken}`).query({ soft: "true" });

        expect(deleteResponse.status).toBe(200);

        const restoreResponse = await request(app).patch(`/api/client/${clientId}/restore`).set("Authorization", `Bearer ${accessToken}`);

        expect(restoreResponse.status).toBe(200);
        expect(restoreResponse.body).toHaveProperty("restoredClient");

        const getResponse = await request(app).get(`/api/client/${clientId}`).set("Authorization", `Bearer ${accessToken}`);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body.client._id).toBe(clientId);
    });
});