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
});