import RefreshToken from "../models/RefreshToken.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import { AppError } from "../utils/AppError.js";
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from "../utils/handleJWT.js";
import { compare, encrypt } from "../utils/handlePassword.js";

const generateRandomCode = () => Math.floor(100000 + (Math.random() * 900000)).toString()

export const registerUser = async (req, res) => {
    const newUser = req.body;
    newUser.password = await encrypt(newUser.password);
    newUser.verificationCode = generateRandomCode();
    const user = await User.create(newUser);
    const token = generateAccessToken(user);
    const refreshToken = await RefreshToken(generateRefreshToken(), user._id, getRefreshTokenExpiry());
    res.status(201).json({
        message: "Usuario creado",
        user: user,
        verificationCode: newUser.verificationCode,
        access_token: token,
        refresh_token: refreshToken
    });
}

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
        })
    }
    else if (user.verificationAttempts > 0) {
        throw AppError.badRequest("Codigo incorrecto", `Quedan ${user.verificationAttempts} intentos`);
    }
    else {
        await User.deleteOne({ _id: id });
        throw AppError.tooManyRequests("Demasiados intentos. Vuelve a registrar el usuario");
    }
}

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email }).select('+password');
    if (await compare(password, user.password)) {
        const token = generateAccessToken(user);
        const refreshToken = await RefreshToken(generateRefreshToken(), user._id, getRefreshTokenExpiry());
        res.json({
            message: "Login exitoso",
            user: user,
            access_token: token,
            refresh_token: refreshToken
        });
    }
    else {
        throw AppError.unauthorized();
    }
}

export const registerDataUser = async (req, res) => {
    const id = req.user._id;
    const data = req.body;
    const user = await User.findByIdAndUpdate(id, data, { new: true });
    res.json({
        message: "Usuario actualizado",
        user: user
    })
}

export const registerCompany = async (req, res) => {
    const companyData = req.body;
    const userData = req.user;
    const company = await Company.findOne({ cif: companyData.cif });
    if (company) {
        const user = await User.findByIdAndUpdate(userData._id, { company: company._id, role: "guest" }, { new: true });
        res.json({
            message: "Usuario añadido a la compañia",
            user: user,
            company: company
        })
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
        })
    }
}

export const getUser = async (req, res) => {
    const id = req.user._id;
    const user = await User.findById(id).populate('company')
    res.json(user);
}

export const deleteUser = async (req, res) => {
    const {soft} = req.query;
    const id = req.user._id;
    let user;
    if(soft === "true"){
        user = await User.softDeleteById(id);
    }
    else{
        user = await User.hardDelete(id);
    }
    res.json({
        message: "Usuario borrado",
        user: user
    })
}

export const changePassword = async (req, res) => {
    const {currentPassword, newPassword} = req.body;
    const id = req.user._id;
    const user = await User.findById(id).select('+password');
    if(await compare(currentPassword, user.password)){
        const encryptedPassword = await encrypt(newPassword);
        const user = await User.findByIdAndUpdate(id, {password: encryptedPassword}, {new: true});
        res.json({
            message: "Cambio de contraseña exitoso",
            user: user
        })
    }
    else{
        throw AppError.unauthorized("Contraseña incorrecta");
    }
}