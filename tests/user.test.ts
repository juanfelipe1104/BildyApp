/// <reference types="jest" />

import { jest } from "@jest/globals";
import request from "supertest";

const sendEmailMock = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

jest.unstable_mockModule("../src/config/mail.js", () => ({
    sendEmail: sendEmailMock
}));

const uploadLogoMock = jest.fn().mockResolvedValue({ secure_url: "https://res.cloudinary.com/test/logo.png" } as never);

const uploadSignatureMock = jest.fn().mockResolvedValue({ secure_url: "https://res.cloudinary.com/test/signature.png" } as never);

const uploadPDFMock = jest.fn().mockResolvedValue({ secure_url: "https://res.cloudinary.com/test/albaran.pdf" } as never);

jest.unstable_mockModule("../src/services/cloudinary.service.js", () => ({
    uploadLogo: uploadLogoMock,
    uploadDeliveryNoteSignature: uploadSignatureMock,
    uploadDeliveryNotePdf: uploadPDFMock,
    default: {
        uploadLogo: uploadLogoMock,
        uploadDeliveryNoteSignature: uploadSignatureMock,
        uploadDeliveryNotePdf: uploadPDFMock
    }
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

const createReadyUser = async (email = "ready.user@example.com") => {
    const userData = await registerAndValidateUser(email);

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

    return {
        ...userData,
        user: dataResponse.body.user
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

    it("debería obtener el usuario autenticado", async () => {
        const { accessToken, email } = await registerAndValidateUser("get.user@example.com");

        const response = await request(app).get("/api/user").set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("user");

        expect(response.body.user.email).toBe(email);
        expect(response.body.user.password).toBeUndefined();
        expect(response.body.user.status).toBe("verified");
    });

    it("debería rechazar obtener usuario sin token", async () => {
        const response = await request(app).get("/api/user");

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar obtener usuario si no está verificado", async () => {
        const registerResponse = await registerUser("pending.get.user@example.com");

        expect(registerResponse.status).toBe(201);

        const accessToken = registerResponse.body.access_token;

        const response = await request(app).get("/api/user").set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería completar los datos personales del usuario", async () => {
        const { accessToken, email } = await registerAndValidateUser("data.user@example.com");

        const response = await request(app).put("/api/user/register").set("Authorization", `Bearer ${accessToken}`).send({
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

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("user");

        expect(response.body.user.email).toBe(email);
        expect(response.body.user.name).toBe("Juan");
        expect(response.body.user.lastName).toBe("Rodríguez Córdoba");
        expect(response.body.user.nif).toBe("12345678Z");
        expect(response.body.user.address.city).toBe("Madrid");
    });

    it("debería rechazar completar datos personales sin token", async () => {
        const response = await request(app).put("/api/user/register").send({
            name: "Juan",
            lastName: "Rodríguez Córdoba",
            nif: "12345678Z"
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar completar datos personales si el usuario no está verificado", async () => {
        const registerResponse = await registerUser("pending.data.user@example.com");

        expect(registerResponse.status).toBe(201);

        const accessToken = registerResponse.body.access_token;

        const response = await request(app).put("/api/user/register").set("Authorization", `Bearer ${accessToken}`).send({
            name: "Juan",
            lastName: "Rodríguez Córdoba",
            nif: "12345678Z"
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar datos personales inválidos", async () => {
        const { accessToken } = await registerAndValidateUser("invalid.data.user@example.com");

        const response = await request(app).put("/api/user/register").set("Authorization", `Bearer ${accessToken}`).send({
            name: "",
            lastName: "",
            nif: "nif-invalido"
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });
});

describe("Company", () => {
    beforeEach(() => {
        uploadLogoMock.mockClear();
    });
    it("debería crear una compañía para el usuario autenticado", async () => {
        const { accessToken } = await createReadyUser("company@example.com");

        const response = await request(app).patch("/api/user/company").set("Authorization", `Bearer ${accessToken}`).send({
            isFreelance: false,
            name: "Bildy Construcciones SL",
            cif: "B12345678",
            address: {
                street: "Calle Empresa",
                number: "10",
                postal: "28001",
                city: "Madrid",
                province: "Madrid"
            }
        });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("company");
        expect(response.body).toHaveProperty("user");

        expect(response.body.company.name).toBe("Bildy Construcciones SL");
        expect(response.body.company.cif).toBe("B12345678");
        expect(response.body.company.isFreelance).toBe(false);

        expect(response.body.user.company).toBe(response.body.company._id);
    });

    it("debería crear una compañía freelance usando los datos del usuario", async () => {
        const { accessToken } = await createReadyUser("freelance@example.com");

        const response = await request(app).patch("/api/user/company").set("Authorization", `Bearer ${accessToken}`).send({ isFreelance: true });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("company");

        expect(response.body.company.isFreelance).toBe(true);
        expect(response.body.user.company).toBe(response.body.company._id);
    });

    it("debería rechazar crear compañía sin token", async () => {
        const response = await request(app).patch("/api/user/company").send({
            isFreelance: false,
            name: "Bildy Construcciones SL",
            cif: "B12345678",
            address: {
                street: "Calle Empresa",
                number: "10",
                postal: "28001",
                city: "Madrid",
                province: "Madrid"
            }
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar crear compañía si el usuario no está verificado", async () => {
        const registerResponse = await registerUser("pending.company@example.com");

        expect(registerResponse.status).toBe(201);

        const accessToken = registerResponse.body.access_token;

        const response = await request(app).patch("/api/user/company").set("Authorization", `Bearer ${accessToken}`).send({
            isFreelance: false,
            name: "Bildy Construcciones SL",
            cif: "B12345678",
            address: {
                street: "Calle Empresa",
                number: "10",
                postal: "28001",
                city: "Madrid",
                province: "Madrid"
            }
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar datos de compañía inválidos", async () => {
        const { accessToken } = await createReadyUser("invalid.company@example.com");

        const response = await request(app).patch("/api/user/company").set("Authorization", `Bearer ${accessToken}`).send({
            isFreelance: false,
            name: "",
            cif: "cif-invalido"
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar crear compañía si el usuario ya tiene una asociada", async () => {
        const { accessToken } = await createReadyUser("duplicated.company@example.com");

        const firstResponse = await request(app).patch("/api/user/company").set("Authorization", `Bearer ${accessToken}`).send({
            isFreelance: false,
            name: "Primera Empresa SL",
            cif: "B11111111",
            address: {
                street: "Calle Primera",
                number: "1",
                postal: "28001",
                city: "Madrid",
                province: "Madrid"
            }
        });

        expect(firstResponse.status).toBe(201);

        const secondResponse = await request(app).patch("/api/user/company").set("Authorization", `Bearer ${accessToken}`).send({
            isFreelance: false,
            name: "Segunda Empresa SL",
            cif: "B22222222",
            address: {
                street: "Calle Segunda",
                number: "2",
                postal: "28002",
                city: "Madrid",
                province: "Madrid"
            }
        });

        expect(secondResponse.status).toBe(409);
        expect(secondResponse.body).toHaveProperty("error", true);
    });

    it("debería subir el logo de la compañía", async () => {
        const { accessToken } = await createReadyUser("logo.company@example.com");

        const companyResponse = await request(app).patch("/api/user/company").set("Authorization", `Bearer ${accessToken}`).send({
            isFreelance: false,
            name: "Logo Empresa SL",
            cif: "B33333333",
            address: {
                street: "Calle Logo",
                number: "3",
                postal: "28003",
                city: "Madrid",
                province: "Madrid"
            }
        });

        expect(companyResponse.status).toBe(201);

        const response = await request(app).patch("/api/user/logo").set("Authorization", `Bearer ${accessToken}`).attach("logo", Buffer.from("fake image content"), {
            filename: "logo.png",
            contentType: "image/png"
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("company");
        expect(response.body.company.logo).toBe("https://res.cloudinary.com/test/logo.png");

        expect(uploadLogoMock).toHaveBeenCalledTimes(1);
    });

    it("debería rechazar subir logo sin archivo", async () => {
        const { accessToken } = await createReadyUser("logo.no.file@example.com");

        const companyResponse = await request(app).patch("/api/user/company").set("Authorization", `Bearer ${accessToken}`).send({
            isFreelance: false,
            name: "No File SL",
            cif: "B44444444",
            address: {
                street: "Calle No File",
                number: "4",
                postal: "28004",
                city: "Madrid",
                province: "Madrid"
            }
        });

        expect(companyResponse.status).toBe(201);

        const response = await request(app).patch("/api/user/logo").set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar subir logo si el usuario no tiene compañía", async () => {
        const { accessToken } = await createReadyUser("logo.no.company@example.com");

        const response = await request(app).patch("/api/user/logo").set("Authorization", `Bearer ${accessToken}`).attach("logo", Buffer.from("fake image content"), {
            filename: "logo.png",
            contentType: "image/png"
        });

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar subir logo sin token", async () => {
        const response = await request(app).patch("/api/user/logo").attach("logo", Buffer.from("fake image content"), {
            filename: "logo.png",
            contentType: "image/png"
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error", true);
    });

    it("debería rechazar un logo con formato inválido", async () => {
        const { accessToken } = await createReadyUser("logo.invalid.file@example.com");

        const companyResponse = await request(app).patch("/api/user/company").set("Authorization", `Bearer ${accessToken}`).send({
            isFreelance: false,
            name: "Invalid File SL",
            cif: "B55555555",
            address: {
                street: "Calle Invalid",
                number: "5",
                postal: "28005",
                city: "Madrid",
                province: "Madrid"
            }
        });

        expect(companyResponse.status).toBe(201);

        const response = await request(app).patch("/api/user/logo").set("Authorization", `Bearer ${accessToken}`).attach("logo", Buffer.from("fake text content"), {
            filename: "logo.txt",
            contentType: "text/plain"
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", true);
    });
});