import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { tokenSign } from "../utils/handleJWT.js";
import { encrypt } from "../utils/handlePassword.js";

const generateRandomCode = () => Math.floor(100000 + (Math.random() * 900000)).toString()

export const registerUser = async (req, res) => {
    const newUser = req.body;
    newUser.password = await encrypt(newUser.password);
    newUser.verificationCode = generateRandomCode();
    const user = await User.create(newUser);
    const token = tokenSign(user);
    res.status(201).json({
        message: "Usuario creado",
        user: user,
        verificationCode: newUser.verificationCode,
        access_token: token
    })
}

export const getUser = async (req, res) => {
    const id = req.user._id;
    const user = await User.findById(id).populate()
    res.json(user);
}

export const validateEmail = async (req, res) => {
    const { code } = req.body;
    const id = req.user._id;
    const user = await User.findByIdAndUpdate(id, {$inc: {numberOfTries: -1}});
    if(user.code == code){
        res.json("")
    }
    else if(user.numberOfTries >= 0){
        AppError.badRequest("Codigo incorrecto", `Quedan ${user.numberOfTries} intentos`);
    }
    else{
        AppError.tooManyRequests();
    }
}