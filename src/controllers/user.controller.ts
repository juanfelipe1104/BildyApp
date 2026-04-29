import type { Request, Response } from 'express';
import type { UserDocument } from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { AppError } from '../utils/AppError.js';
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from '../utils/handleJWT.js';
import { compare, encrypt } from '../utils/handlePassword.js';
import notificationService from '../services/notification.service.js';
import cloudinaryService from '../services/cloudinary.service.js';
import { sendEmail } from '../config/mail.js';

const generateRandomCode = (): string => Math.floor(100000 + (Math.random() * 900000)).toString();

const createSession = async (user: Pick<UserDocument, '_id' | 'role'>) => {
    const accessToken = generateAccessToken(user);
    const refreshToken = await RefreshToken.create({
        token: generateRefreshToken(),
        user: user._id,
        expiresAt: getRefreshTokenExpiry()
    });

    return {
        access_token: accessToken,
        refresh_token: refreshToken.token
    };
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email: email });
    if (existingUser?.status === "verified") {
        throw AppError.conflict("Ya existe un usuario verificado con ese email");
    }

    const encryptedPassword = await encrypt(password);
    const verificationCode = generateRandomCode();
    let user: UserDocument;

    if (existingUser?.status === "pending") {
        existingUser.password = encryptedPassword;
        existingUser.verificationCode = verificationCode;
        existingUser.verificationAttempts = 3;
        user = await existingUser.save();
    }
    else {
        user = await User.create({
            email: email,
            password: encryptedPassword,
            verificationCode: verificationCode
        });
    }

    const { access_token, refresh_token } = await createSession(user);
    notificationService.registerUser({
        userId: user._id.toString(),
        email: user.email
    });
    await sendEmail(user.email, 'Codigo de verificacion', `<h2>Verificación de cuenta</h2><p>Tu código es:</p><h1>${verificationCode}</h1>`);
    res.status(201).json({
        message: "Usuario creado",
        user,
        verificationCode,
        access_token,
        refresh_token
    });
};

export const validateEmail = async (req: Request, res: Response): Promise<void> => {
    const { code } = req.body;
    const user = req.user;
    if (user.verificationCode === code) {
        user.status = "verified";
        await user.save();
        notificationService.verifyUser({
            userId: user._id.toString(),
            email: user.email
        });
        res.json({
            message: "Usuario verificado",
            user
        });
    }
    else if (user.verificationAttempts > 0) {
        user.verificationAttempts -= 1;
        await user.save();
        throw AppError.badRequest(`Codigo incorrecto. Quedan ${user.verificationAttempts} intentos`);
    }
    else {
        throw AppError.tooManyRequests("Demasiados intentos. Vuelve a registrar el usuario");
    }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email }).select('+password');
    if (!user) {
        throw AppError.unauthorized("Credenciales incorrectas");
    }

    if (user.status !== "verified") {
        throw AppError.unauthorized("El usuario no se ha verificado");
    }

    if (await compare(password, user.password)) {
        const { access_token, refresh_token } = await createSession(user);
        res.json({
            message: "Login exitoso",
            user,
            access_token,
            refresh_token
        });
    }
    else {
        throw AppError.unauthorized("Credenciales incorrectas");
    }
};

export const registerDataUser = async (req: Request, res: Response): Promise<void> => {
    const user = req.user;
    const userData = req.body;
    user.set(userData);
    await user.save();
    res.json({
        message: "Usuario actualizado",
        user
    });
};

export const registerCompany = async (req: Request, res: Response): Promise<void> => {
    const companyData = req.body;
    const user = req.user;
    if (user.company) {
        throw AppError.conflict("El usuario ya pertenece a una compañía");
    }

    const company = await Company.findOne({ cif: companyData.cif });
    if (company) {
        user.company = company._id;
        user.role = "guest";
        await user.save();
        res.json({
            message: "Usuario añadido a la compañia",
            user,
            company
        });
    }
    else {
        companyData.owner = user._id;
        if (companyData.isFreelance) {
            companyData.name = user.name;
            companyData.cif = user.nif;
            companyData.address = user.address;
        }
        const company = await Company.create(companyData);
        user.company = company._id;
        await user.save();
        res.status(201).json({
            message: "Compañia creada",
            user,
            company
        });
    }
};

export const uploadLogo = async (req: Request, res: Response): Promise<void> => {
    const user = req.user;

    if (!req.file) {
        throw AppError.badRequest("No se ha enviado ningun archivo");
    }

    const company = await Company.findById(user.company);

    if (!company) {
        throw AppError.notFound("Compañía no encontrada");
    }

    const result = await cloudinaryService.uploadLogo(req.file.buffer, company._id.toString());
    const newLogoUrl = result.secure_url;
    company.logo = newLogoUrl;
    await company.save();

    res.json({
        message: "Logo actualizado",
        company
    });
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
    const user = await req.user.populate('company');
    res.json({
        user
    });
};

export const refreshSession = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    const storedToken = await RefreshToken.findOne({ token: refreshToken }).populate("user");

    if (!storedToken || !storedToken.isActive() || !storedToken.user) {
        throw AppError.unauthorized("Refresh token inválido o expirado");
    }

    storedToken.revokedAt = new Date();
    await storedToken.save();

    const user = storedToken.user as unknown as UserDocument;

    const { access_token, refresh_token } = await createSession(user);

    res.json({
        message: "Nuevo access token generado",
        access_token,
        refresh_token
    });
};

export const logoutUser = async (req: Request, res: Response): Promise<void> => {
    const id = req.user._id;
    await RefreshToken.updateMany({ user: id, revokedAt: null }, { revokedAt: new Date() });

    res.json({
        message: "Logout de todas las sesiones activas"
    });
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const { soft } = req.query;
    const id = req.user._id;
    let user: UserDocument;
    if (soft === "true") {
        user = await User.softDeleteById(id);
    }
    else {
        user = await User.hardDelete(id);
    }

    await RefreshToken.updateMany({ user: id, revokedAt: null }, { revokedAt: new Date() });

    notificationService.deleteUser({
        userId: id.toString(),
        soft: soft === "true"
    })
    res.json({
        message: "Usuario borrado",
        user
    });
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = req.body;
    const id = req.user._id;
    const user = await User.findById(id).select('+password');
    if (!user) {
        throw AppError.unauthorized("Credenciales incorrectas");
    }
    if (await compare(currentPassword, user.password)) {
        const encryptedPassword = await encrypt(newPassword);
        user.password = encryptedPassword;
        await user.save();
        res.json({
            message: "Cambio de contraseña exitoso",
            user
        });
    }
    else {
        throw AppError.unauthorized("Contraseña incorrecta");
    }
};

export const inviteUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const inviter = req.user;

    if (!inviter.company) {
        throw AppError.badRequest("El usuario administrador no tiene compañía asociada");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw AppError.conflict("Ya existe el usuario");
    }

    const encryptedPassword = await encrypt(password);
    const verificationCode = generateRandomCode();

    const invitedUser = await User.create({
        email,
        password: encryptedPassword,
        verificationCode,
        role: "guest",
        company: inviter.company
    });

    const { access_token, refresh_token } = await createSession(invitedUser);

    notificationService.inviteUser({
        invitedUserId: invitedUser._id.toString(),
        invitedEmail: invitedUser.email,
        companyId: inviter.company.toString(),
        invitedBy: inviter._id.toString()
    });

    res.status(201).json({
        message: "Usuario invitado correctamente. Datos invitado: ",
        user: invitedUser,
        verificationCode,
        access_token,
        refresh_token
    });
};