import request from "supertest";
import { createReadyUser, createUserWithCompany, createClient, createProject } from "./setup/helpers.js";
import { setupMocks } from "./setup/mocks.js";

setupMocks();

const { default: app } = await import("../src/app.js");

describe("Project", () => {
    it("debería crear un proyecto", async () => {
        const { accessToken } = await createUserWithCompany(app, "create.project@example.com");

        const clientResponse = await createClient(app, accessToken, { cif: "B10000001" });

        expect(clientResponse.status).toBe(201);

        const response = await createProject(app, accessToken, clientResponse.body.client._id);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("project");
        expect(response.body.project.client).toBe(clientResponse.body.client._id);
        expect(response.body.project.projectCode).toBe("PR-001");
        expect(response.body.project.active).toBe(true);
    });

    it("debería rechazar crear proyecto sin token", async () => {
        const response = await request(app).post("/api/project").send({
            client: "663a0e4f9a21b2d4c84fd123",
            name: "Proyecto sin token",
            projectCode: "PR-NO-TOKEN"
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar crear proyecto si el usuario no tiene compañía", async () => {
        const { accessToken } = await createReadyUser(app, "project.no.company@example.com");

        const response = await request(app).post("/api/project").set("Authorization", `Bearer ${accessToken}`).send({
            client: "663a0e4f9a21b2d4c84fd123",
            name: "Proyecto sin company",
            projectCode: "PR-NO-COMPANY"
        });

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar crear proyecto con body inválido", async () => {
        const { accessToken } = await createUserWithCompany(app, "invalid.project@example.com");

        const response = await request(app).post("/api/project").set("Authorization", `Bearer ${accessToken}`).send({
            client: "id-invalido",
            projectCode: ""
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar crear proyecto si el cliente no existe en la compañía", async () => {
        const { accessToken } = await createUserWithCompany(app, "project.client.missing@example.com");

        const response = await createProject(app, accessToken, "663a0e4f9a21b2d4c84fd123", { projectCode: "PR-MISSING-CLIENT" });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar crear proyecto con cliente de otra compañía", async () => {
        const userA = await createUserWithCompany(app, "project.company.a@example.com", { name: "Project Company A SL", cif: "B10000002" });

        const userB = await createUserWithCompany(app, "project.company.b@example.com", { name: "Project Company B SL", cif: "B10000003" });

        const clientA = await createClient(app, userA.accessToken, { cif: "B10000004" });

        expect(clientA.status).toBe(201);

        const response = await createProject(app, userB.accessToken, clientA.body.client._id, { projectCode: "PR-OTHER-COMPANY" });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar crear proyecto duplicado por projectCode en la misma compañía", async () => {
        const { accessToken } = await createUserWithCompany(app, "duplicate.project@example.com");

        const clientResponse = await createClient(app, accessToken, { cif: "B10000005" });

        expect(clientResponse.status).toBe(201);

        const firstProject = await createProject(app, accessToken, clientResponse.body.client._id, { projectCode: "PR-DUP" });

        expect(firstProject.status).toBe(201);

        const secondProject = await createProject(app, accessToken, clientResponse.body.client._id, { projectCode: "PR-DUP" });

        expect(secondProject.status).toBe(409);
        expect(secondProject.body).toHaveProperty("error", true);
    });

    it("debería obtener proyectos paginados", async () => {
        const { accessToken } = await createUserWithCompany(app, "get.projects@example.com");

        const clientResponse = await createClient(app, accessToken, { cif: "B10000006" });

        expect(clientResponse.status).toBe(201);

        await createProject(app, accessToken, clientResponse.body.client._id, { name: "Proyecto Uno", projectCode: "PR-GET-1" });

        await createProject(app, accessToken, clientResponse.body.client._id, { name: "Proyecto Dos", projectCode: "PR-GET-2" });

        const response = await request(app).get("/api/project").set("Authorization", `Bearer ${accessToken}`).query({ page: 1, limit: 10 });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("projects");
        expect(Array.isArray(response.body.projects)).toBe(true);
        expect(response.body.projects.length).toBe(2);
        expect(response.body).toHaveProperty("totalItems");
        expect(response.body).toHaveProperty("totalPages");
        expect(response.body).toHaveProperty("currentPage");
    });

    it("debería filtrar proyectos por búsqueda parcial", async () => {
        const { accessToken } = await createUserWithCompany(app, "filter.projects@example.com");

        const clientResponse = await createClient(app, accessToken, { cif: "B10000007" });

        expect(clientResponse.status).toBe(201);

        await createProject(app, accessToken, clientResponse.body.client._id, { name: "Reforma Local Centro", projectCode: "PR-FILTER-1" });

        await createProject(app, accessToken, clientResponse.body.client._id, { name: "Instalación Industrial", projectCode: "PR-FILTER-2" });

        const response = await request(app).get("/api/project").set("Authorization", `Bearer ${accessToken}`).query({ name: "reforma" });

        expect(response.status).toBe(200);
        expect(response.body.projects.length).toBe(1);
        expect(response.body.projects[0].name).toBe("Reforma Local Centro");
    });

    it("debería ordenar proyectos de forma descendente", async () => {
        const { accessToken } = await createUserWithCompany(app, "sort.projects@example.com");

        const clientResponse = await createClient(app, accessToken, { cif: "B10000008" });

        expect(clientResponse.status).toBe(201);

        await createProject(app, accessToken, clientResponse.body.client._id, { name: "AAA Proyecto", projectCode: "PR-SORT-1" });

        await createProject(app, accessToken, clientResponse.body.client._id, { name: "ZZZ Proyecto", projectCode: "PR-SORT-2" });

        const response = await request(app).get("/api/project").set("Authorization", `Bearer ${accessToken}`).query({ sort: "-name" });

        expect(response.status).toBe(200);
        expect(response.body.projects[0].name).toBe("ZZZ Proyecto");
    });

    it("debería rechazar query inválida en listado de proyectos", async () => {
        const { accessToken } = await createUserWithCompany(app, "invalid.query.project@example.com");

        const response = await request(app).get("/api/project").set("Authorization", `Bearer ${accessToken}`).query({ page: -1 });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería obtener un proyecto por ID", async () => {
        const { accessToken } = await createUserWithCompany(app, "get.project.by.id@example.com");

        const clientResponse = await createClient(app, accessToken, { cif: "B10000009" });

        expect(clientResponse.status).toBe(201);

        const projectResponse = await createProject(app, accessToken, clientResponse.body.client._id, { projectCode: "PR-BY-ID" });

        expect(projectResponse.status).toBe(201);

        const projectId = projectResponse.body.project._id;

        const response = await request(app).get(`/api/project/${projectId}`).set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("project");
        expect(response.body.project._id).toBe(projectId);
    });

    it("debería rechazar obtener proyecto con ObjectId inválido", async () => {
        const { accessToken } = await createUserWithCompany(app, "invalid.project.id@example.com");

        const response = await request(app).get("/api/project/id-invalido").set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería devolver 404 si el proyecto no pertenece a la compañía", async () => {
        const userA = await createUserWithCompany(app, "project.scope.a@example.com", { name: "Scope A SL", cif: "B10000010" });

        const userB = await createUserWithCompany(app, "project.scope.b@example.com", { name: "Scope B SL", cif: "B10000011" });

        const clientA = await createClient(app, userA.accessToken, { cif: "B10000012" });

        expect(clientA.status).toBe(201);

        const projectA = await createProject(app, userA.accessToken, clientA.body.client._id, { projectCode: "PR-SCOPE-A" });

        expect(projectA.status).toBe(201);

        const response = await request(app).get(`/api/project/${projectA.body.project._id}`).set("Authorization", `Bearer ${userB.accessToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería actualizar un proyecto", async () => {
        const { accessToken } = await createUserWithCompany(app, "update.project@example.com");

        const clientResponse = await createClient(app, accessToken, { cif: "B10000013" });

        expect(clientResponse.status).toBe(201);

        const projectResponse = await createProject(app, accessToken, clientResponse.body.client._id, { projectCode: "PR-UPDATE" });

        expect(projectResponse.status).toBe(201);

        const projectId = projectResponse.body.project._id;

        const response = await request(app).put(`/api/project/${projectId}`).set("Authorization", `Bearer ${accessToken}`).send({
            name: "Proyecto Actualizado",
            email: "actualizado@test.com",
            active: false
        });

        expect(response.status).toBe(200);
        expect(response.body.project.name).toBe("Proyecto Actualizado");
        expect(response.body.project.email).toBe("actualizado@test.com");
        expect(response.body.project.active).toBe(false);
    });

    it("debería rechazar actualizar un proyecto con body inválido", async () => {
        const { accessToken } = await createUserWithCompany(app, "update.invalid.project@example.com");

        const clientResponse = await createClient(app, accessToken, { cif: "B10000014" });

        const projectResponse = await createProject(app, accessToken, clientResponse.body.client._id, { projectCode: "PR-INVALID-UPDATE" });

        const projectId = projectResponse.body.project._id;

        const response = await request(app).put(`/api/project/${projectId}`).set("Authorization", `Bearer ${accessToken}`).send({
            email: "email-invalido",
            active: "no-es-boolean"
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar borrar un proyecto activo", async () => {
        const { accessToken } = await createUserWithCompany(app, "delete.active.project@example.com");

        const clientResponse = await createClient(app, accessToken, { cif: "B10000015" });

        const projectResponse = await createProject(app, accessToken, clientResponse.body.client._id, { projectCode: "PR-ACTIVE-DELETE" });

        expect(projectResponse.status).toBe(201);

        const response = await request(app).delete(`/api/project/${projectResponse.body.project._id}`).set("Authorization", `Bearer ${accessToken}`).query({ soft: "true" });

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería hacer soft delete de un proyecto inactivo", async () => {
        const { accessToken } = await createUserWithCompany(app, "soft.delete.project@example.com");

        const clientResponse = await createClient(app, accessToken, { cif: "B10000016" });

        const projectResponse = await createProject(app, accessToken, clientResponse.body.client._id, { projectCode: "PR-SOFT-DELETE" });

        const projectId = projectResponse.body.project._id;

        const updateResponse = await request(app).put(`/api/project/${projectId}`).set("Authorization", `Bearer ${accessToken}`).send({
            active: false
        });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.project.active).toBe(false);

        const deleteResponse = await request(app).delete(`/api/project/${projectId}`).set("Authorization", `Bearer ${accessToken}`).query({ soft: "true" });

        expect(deleteResponse.status).toBe(200);

        const getResponse = await request(app).get(`/api/project/${projectId}`).set("Authorization", `Bearer ${accessToken}`);

        expect(getResponse.status).toBe(404);
    });

    it("debería hacer hard delete de un proyecto inactivo", async () => {
        const { accessToken } = await createUserWithCompany(app, "hard.delete.project@example.com");

        const clientResponse = await createClient(app, accessToken, { cif: "B10000017" });

        const projectResponse = await createProject(app, accessToken, clientResponse.body.client._id, { projectCode: "PR-HARD-DELETE" });

        const projectId = projectResponse.body.project._id;

        await request(app).put(`/api/project/${projectId}`).set("Authorization", `Bearer ${accessToken}`).send({ active: false });

        const deleteResponse = await request(app).delete(`/api/project/${projectId}`).set("Authorization", `Bearer ${accessToken}`).query({ soft: "false" });

        expect(deleteResponse.status).toBe(200);

        const getResponse = await request(app).get(`/api/project/${projectId}`).set("Authorization", `Bearer ${accessToken}`);

        expect(getResponse.status).toBe(404);
    });

    it("debería rechazar borrar proyecto sin token", async () => {
        const response = await request(app).delete("/api/project/663a0f8a9a21b2d4c84fd456").query({ soft: "true" });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería listar proyectos archivados", async () => {
        const { accessToken } = await createUserWithCompany(app, "archived.projects@example.com");

        const clientResponse = await createClient(app, accessToken, { cif: "B10000018" });

        const projectResponse = await createProject(app, accessToken, clientResponse.body.client._id, { projectCode: "PR-ARCHIVED" });

        const projectId = projectResponse.body.project._id;

        await request(app).put(`/api/project/${projectId}`).set("Authorization", `Bearer ${accessToken}`).send({ active: false });

        const deleteResponse = await request(app).delete(`/api/project/${projectId}`).set("Authorization", `Bearer ${accessToken}`).query({ soft: "true" });

        expect(deleteResponse.status).toBe(200);

        const response = await request(app).get("/api/project/archived").set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("archivedProjects");
        expect(Array.isArray(response.body.archivedProjects)).toBe(true);
        expect(response.body.archivedProjects.length).toBe(1);
    });

    it("debería devolver lista vacía si no hay proyectos archivados", async () => {
        const { accessToken } = await createUserWithCompany(app, "archived.empty.projects@example.com");

        const response = await request(app).get("/api/project/archived").set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("No hay proyectos archivados");
        expect(response.body.archivedProjects).toEqual([]);
    });

    it("debería restaurar un proyecto archivado", async () => {
        const { accessToken } = await createUserWithCompany(app, "restore.project@example.com");

        const clientResponse = await createClient(app, accessToken, { cif: "B10000019" });

        const projectResponse = await createProject(app, accessToken, clientResponse.body.client._id, { projectCode: "PR-RESTORE" });

        const projectId = projectResponse.body.project._id;

        await request(app).put(`/api/project/${projectId}`).set("Authorization", `Bearer ${accessToken}`).send({ active: false });

        const deleteResponse = await request(app).delete(`/api/project/${projectId}`).set("Authorization", `Bearer ${accessToken}`).query({ soft: "true" });

        expect(deleteResponse.status).toBe(200);

        const restoreResponse = await request(app).patch(`/api/project/${projectId}/restore`).set("Authorization", `Bearer ${accessToken}`);

        expect(restoreResponse.status).toBe(200);
        expect(restoreResponse.body).toHaveProperty("restoredProject");

        const getResponse = await request(app).get(`/api/project/${projectId}`).set("Authorization", `Bearer ${accessToken}`);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body.project._id).toBe(projectId);
    });

    it("debería devolver 404 al restaurar un proyecto que no está archivado", async () => {
        const { accessToken } = await createUserWithCompany(app, "restore.missing.project@example.com");

        const nonExistingProjectId = "663a0f8a9a21b2d4c84fd456";

        const response = await request(app).patch(`/api/project/${nonExistingProjectId}/restore`).set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error", true);
    });
});