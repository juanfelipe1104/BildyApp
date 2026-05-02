/// <reference types="jest" />

import { jest } from "@jest/globals";
import request from "supertest";

const sendEmailMock = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

jest.unstable_mockModule("../src/config/mail.js", () => ({
    sendEmail: sendEmailMock
}));

const { default: app } = await import("../src/app.js");

const registerUser = async (email = "juan@example.com", password = "Password123") => {
    return request(app).post("/api/user/register").send({ email, password });
};

const validateUser = async (accessToken: string, code: string) => {
    return request(app).put("/api/user/validation").set("Authorization", `Bearer ${accessToken}`).send({ code });
}

const registerAndValidateUser = async (email = "login@example.com") => {
    const registerResponse = await registerUser(email);

    const accessToken = registerResponse.body.access_token;
    const refreshToken = registerResponse.body.refresh_token;
    const verificationCode = registerResponse.body.verificationCode;

    const validationResponse = await request(app).put("/api/user/validation").set("Authorization", `Bearer ${accessToken}`).send({ code: verificationCode });

    expect(validationResponse.status).toBe(200);

    return {
        email,
        password: "Password123",
        accessToken,
        refreshToken,
        verificationCode,
        user: validationResponse.body.user
    };
};

describe("User / Auth", () => {
    beforeEach(() => {
        sendEmailMock.mockClear();
    });

    it("debería registrar un usuario", async () => {
        const response = await registerUser();

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("user");
        expect(response.body).toHaveProperty("access_token");
        expect(response.body).toHaveProperty("refresh_token");

        expect(response.body.user.email).toBe("juan@example.com");
        expect(response.body.user.password).toBeUndefined();

        expect(sendEmailMock).toHaveBeenCalledTimes(1);
        expect(sendEmailMock).toHaveBeenCalledWith(
            "juan@example.com",
            "Codigo de verificacion",
            expect.stringContaining("Tu código es:")
        );
    });

    it("debería validar el email de un usuario registrado", async () => {
        const registerResponse = await registerUser("validacion@example.com");

        expect(registerResponse.status).toBe(201);

        const accessToken = registerResponse.body.access_token;
        const verificationCode = registerResponse.body.verificationCode;

        const response = await validateUser(accessToken, verificationCode);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("user");
        expect(response.body.user.email).toBe("validacion@example.com");
        expect(response.body.user.status).toBe("verified");
    });

    it("debería rechazar un código de validación incorrecto", async () => {
        const registerResponse = await registerUser("codigo.incorrecto@example.com");

        expect(registerResponse.status).toBe(201);

        const accessToken = registerResponse.body.access_token;

        const response = await validateUser(accessToken, "000000");

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar la validación sin token", async () => {
        const response = await registerUser("", "000000");

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería iniciar sesión con un usuario verificado", async () => {
        const { email, password } = await registerAndValidateUser("login@example.com");

        const response = await request(app).post("/api/user/login").send({ email, password });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("user");
        expect(response.body).toHaveProperty("access_token");
        expect(response.body).toHaveProperty("refresh_token");

        expect(response.body.user.email).toBe(email);
        expect(response.body.user.password).toBeUndefined();
    });

    it("debería rechazar login con contraseña incorrecta", async () => {
        const { email } = await registerAndValidateUser("wrong.password@example.com");

        const response = await request(app).post("/api/user/login").send({ email, password: "WrongPassword123" });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar login de usuario no verificado", async () => {
        const email = "pending.login@example.com";

        await registerUser(email);

        const response = await request(app).post("/api/user/login").send({ email, password: "Password123" });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar login de usuario inexistente", async () => {
        const response = await request(app).post("/api/user/login").send({ email: "noexiste@example.com", password: "Password123" });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería refrescar la sesión con un refresh token válido", async () => {
        const { accessToken, refreshToken } = await registerAndValidateUser("refresh@example.com");

        const response = await request(app).post("/api/user/refresh").send({ refreshToken });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("access_token");
        expect(response.body).toHaveProperty("refresh_token");

        expect(response.body.refresh_token).not.toBe(refreshToken);
    });

    it("debería rechazar un refresh token inválido", async () => {
        const response = await request(app).post("/api/user/refresh").send({ refreshToken: "refresh-token-invalido" });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar refresh sin refreshToken", async () => {
        const response = await request(app).post("/api/user/refresh").send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería revocar el refresh token después de usarlo", async () => {
        const { refreshToken } = await registerAndValidateUser("refresh.revoked@example.com");

        const firstRefreshResponse = await request(app).post("/api/user/refresh").send({ refreshToken });

        expect(firstRefreshResponse.status).toBe(200);

        const secondRefreshResponse = await request(app).post("/api/user/refresh").send({ refreshToken });

        expect(secondRefreshResponse.status).toBe(401);
        expect(secondRefreshResponse.body).toHaveProperty("error", true);
    });

    it("debería cerrar sesión y revocar los refresh tokens activos", async () => {
        const { accessToken, refreshToken } = await registerAndValidateUser("logout@example.com");

        const logoutResponse = await request(app).post("/api/user/logout").set("Authorization", `Bearer ${accessToken}`);

        expect(logoutResponse.status).toBe(200);
        expect(logoutResponse.body).toHaveProperty("message");

        const refreshResponse = await request(app).post("/api/user/refresh").send({ refreshToken });

        expect(refreshResponse.status).toBe(401);
        expect(refreshResponse.body).toHaveProperty("error", true);
    });

    it("debería rechazar logout con token inválido", async () => {
        const response = await request(app).post("/api/user/logout").set("Authorization", "Bearer token-invalido");

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });
});