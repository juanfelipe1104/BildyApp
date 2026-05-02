import { jest } from "@jest/globals";

export const sendEmailMock = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

export const uploadLogoMock = jest.fn().mockResolvedValue({ secure_url: "https://res.cloudinary.com/test/logo.png" } as never);

export const uploadSignatureMock = jest.fn().mockResolvedValue({ secure_url: "https://res.cloudinary.com/test/signature.png" } as never);

export const uploadPDFMock = jest.fn().mockResolvedValue({ secure_url: "https://res.cloudinary.com/test/albaran.pdf" } as never);

export const setupMocks = () => {
    jest.unstable_mockModule("../../src/config/mail.js", () => ({
        sendEmail: sendEmailMock
    }));

    jest.unstable_mockModule("../../src/services/cloudinary.service.js", () => ({
        uploadLogo: uploadLogoMock,
        uploadDeliveryNoteSignature: uploadSignatureMock,
        uploadDeliveryNotePdf: uploadPDFMock,
        default: {
            uploadLogo: uploadLogoMock,
        }
    }));
}