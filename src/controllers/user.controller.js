import RefreshToken from "../models/RefreshToken.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import { AppError } from "../utils/AppError.js";
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from "../utils/handleJWT.js";
import { compare, encrypt } from "../utils/handlePassword.js";

const generateRandomCode = () => Math.floor(100000 + (Math.random() * 900000)).toString();

const createSession = async (user) => {
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

export const registerUser = async (req, res) => {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email: email });
    if (existingUser?.status === "verified") {
        throw AppError.conflict("Ya existe un usuario verificado con ese email");
    }

    const encryptedPassword = await encrypt(password);
    const verificationCode = generateRandomCode();
    let user;

    if (existingUser?.status === "pending") {
        existingUser.password = encryptedPassword;
        existingUser.verificationCode = verificationCode;
        existingUser.verificationAttempts = 3;
        existingUser.deleted = false;
        user = await existingUser.save();
    }
    else {
        user = await User.create({
            email: email,
            password: encryptedPassword,
            verificationCode: verificationCode
        });
    }

    const {access_token, refresh_token} = await createSession();
    res.status(201).json({
        message: "Usuario creado",
        user: user,
        verificationCode: verificationCode,
        access_token: access_token,
        refresh_token: refresh_token
    });
};

export const validateEmail = async (req, res) => {
    const { code } = req.body;
    const id = req.user._id;
    const user = await User.findByIdAndUpdate(id, { $inc: { verificationAttempts: -1 } }, { new: true }).select('+verificationCode');
    if (user.status === "verified") {
        throw AppError.badRequest("Email ya autenticado");
    }
    if (user.verificationCode === code) {
        const user = await User.findByIdAndUpdate(id, { status: "verified" }, { new: true });
        res.json({
            message: "Usuario verificado",
            user: user
        });
    }
    else if (user.verificationAttempts >= 0) {
        throw AppError.badRequest("Codigo incorrecto", `Quedan ${user.verificationAttempts} intentos`);
    }
    else {
        throw AppError.tooManyRequests("Demasiados intentos. Vuelve a registrar el usuario");
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email }).select('+password');
    if (!user) {
        throw AppError.unauthorized("Credenciales incorrectas");
    }

    if (await compare(password, user.password)) {
        const {access_token, refresh_token} = await createSession();
        res.json({
            message: "Login exitoso",
            user: user,
            access_token: access_token,
            refresh_token: refresh_token
        });
    }
    else {
        throw AppError.unauthorized();
    }
};

export const registerDataUser = async (req, res) => {
    const id = req.user._id;
    const data = req.body;
    const user = await User.findByIdAndUpdate(id, data, { new: true });
    res.json({
        message: "Usuario actualizado",
        user: user
    });
};

export const registerCompany = async (req, res) => {
    const companyData = req.body;
    const userData = req.user;

    if (userData.company) {
        throw AppError.conflict("El usuario ya pertenece a una compañía");
    }

    const company = await Company.findOne({ cif: companyData.cif });
    if (company) {
        const user = await User.findByIdAndUpdate(userData._id, { company: company._id, role: "guest" }, { new: true });
        res.json({
            message: "Usuario añadido a la compañia",
            user: user,
            company: company
        });
    }
    else {
        companyData.owner = userData._id;
        if (companyData.isFreelance) {
            companyData.name = userData.name;
            companyData.cif = userData.nif;
            companyData.address = userData.address;
        }
        const company = await Company.create(companyData);
        const user = await User.findByIdAndUpdate(userData._id, { company: company._id });
        res.status(201).json({
            message: "Compañia creada",
            user: user,
            company: company
        });
    }
};

export const uploadLogo = async (req, res) => {
    const userId = req.user._id;

    if (!req.file) {
        throw AppError.badRequest("No se ha enviado ningun archivo");
    }

    const user = await User.findById(userId);

    if (!user?.company) {
        throw AppError.badRequest("El usuario no tiene ninguna compañía asociada");
    }

    const logoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const company = await Company.findByIdAndUpdate(user.company, { logo: logoUrl }, { new: true });

    res.json({
        message: "Logo actualizado",
        company: company
    });
};

export const getUser = async (req, res) => {
    const id = req.user._id;
    const user = await User.findById(id).populate('company');
    res.json(user);
};

export const refreshSession = async (req, res) => {
    const { refreshToken } = req.body;

    const storedToken = await RefreshToken.findOne({ token: refreshToken }).populate("user");

    if (!storedToken || !storedToken.isActive() || !storedToken.user) {
        throw AppError.unauthorized("Refresh token inválido o expirado");
    }

    storedToken.revokedAt = new Date();
    await storedToken.save();

    const {access_token, refresh_token} = await createSession();

    res.json({
        message: "Nuevo access token generado",
        access_token: access_token,
        refresh_token: refresh_token
    });
};

export const logoutUser = async (req, res) => {
    const id = req.user._id;
    await RefreshToken.updateMany({user: id, revokedAt: null}, {revokedAt: new Date()});

    res.json({
        message: "Logout de todas las sesiones activas"
    });
};

export const deleteUser = async (req, res) => {
    const { soft } = req.query;
    const id = req.user._id;
    let user;
    if (soft === "true") {
        user = await User.softDeleteById(id);
    }
    else {
        user = await User.hardDelete(id);
    }
    res.json({
        message: "Usuario borrado",
        user: user
    });
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const id = req.user._id;
    const user = await User.findById(id).select('+password');
    if (!user) {
        throw AppError.unauthorized("Credenciales incorrectas");
    }
    if (await compare(currentPassword, user.password)) {
        const encryptedPassword = await encrypt(newPassword);
        const user = await User.findByIdAndUpdate(id, { password: encryptedPassword }, { new: true });
        res.json({
            message: "Cambio de contraseña exitoso",
            user: user
        });
    }
    else {
        throw AppError.unauthorized("Contraseña incorrecta");
    }
};