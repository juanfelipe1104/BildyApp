import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";

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