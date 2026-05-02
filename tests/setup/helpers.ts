/// <reference types="jest" />

import request from "supertest";
import type { Express } from "express";

export const registerUser = async (app: Express, email = "test.user@example.com", password = "Password123") => {
    return request(app).post("/api/user/register").send({ email, password });
};

export const registerAndValidateUser = async (app: Express, email = "validated.user@example.com", password = "Password123") => {
    const registerResponse = await registerUser(app, email, password);

    expect(registerResponse.status).toBe(201);

    const accessToken = registerResponse.body.access_token;
    const refreshToken = registerResponse.body.refresh_token;
    const verificationCode = registerResponse.body.verificationCode;

    const validationResponse = await request(app).put("/api/user/validation").set("Authorization", `Bearer ${accessToken}`).send({ code: verificationCode });

    expect(validationResponse.status).toBe(200);

    return { email, password, accessToken, refreshToken, verificationCode, user: validationResponse.body.user };
};

export const createReadyUser = async (app: Express, email = "ready.user@example.com", password = "Password123") => {
    const userData = await registerAndValidateUser(app, email, password);

    const dataResponse = await request(app).put("/api/user/register").set("Authorization", `Bearer ${userData.accessToken}`).send({
        name: "Juan",
        lastName: "Rodríguez Córdoba",
        nif: "12345678Z",
        address: {
            street: "Calle Mayor",
            number: "12",
            postal: "28013",
            city: "Madrid",
            province: "Madrid"
        }
    });

    expect(dataResponse.status).toBe(200);

    return { ...userData, user: dataResponse.body.user };
};

export const createUserWithCompany = async (app: Express, email = "company.user@example.com", companyOverrides: Record<string, unknown> = {}) => {
    const userData = await createReadyUser(app, email);

    const companyResponse = await request(app).patch("/api/user/company").set("Authorization", `Bearer ${userData.accessToken}`).send({
        isFreelance: false,
        name: "Test Company SL",
        cif: "B12345678",
        address: {
            street: "Calle Empresa",
            number: "10",
            postal: "28001",
            city: "Madrid",
            province: "Madrid"
        },
        ...companyOverrides
    });

    expect(companyResponse.status).toBe(201);

    return { ...userData, company: companyResponse.body.company };
};

export const createClient = async (app: Express, accessToken: string, overrides: Record<string, unknown> = {}) => {
    return request(app).post("/api/client").set("Authorization", `Bearer ${accessToken}`).send({
        name: "Cliente Test SL",
        cif: "B87654321",
        email: "cliente@test.com",
        phone: "600123123",
        address: {
            street: "Calle Cliente",
            number: "20",
            postal: "28020",
            city: "Madrid",
            province: "Madrid"
        },
        ...overrides
    });
};

export const createProject = async (app: Express, accessToken: string, clientId: string, overrides: Record<string, unknown> = {}) => {
    return request(app).post("/api/project").set("Authorization", `Bearer ${accessToken}`).send({
        client: clientId,
        name: "Proyecto Test",
        projectCode: "PR-001",
        email: "proyecto@test.com",
        notes: "Notas del proyecto",
        address: {
            street: "Calle Proyecto",
            number: "30",
            postal: "28030",
            city: "Madrid",
            province: "Madrid"
        },
        ...overrides
    });
};