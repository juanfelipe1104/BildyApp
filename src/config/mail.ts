import nodemailer from "nodemailer";
import env from "./env.js";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth:{
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD
    }
})

export const sendEmail = async (to_email: string, subject: string, html: string) => {
    const email = {
        from: env.EMAIL_USER,
        to: to_email,
        subject,
        html
    }
    await transporter.sendMail(email);
}

export default transporter;