import bcryptjs from 'bcryptjs';
import crypto from "crypto";

export const generateTemporaryPassword = (): string => {
	return crypto.randomBytes(9).toString("base64url").slice(0, 12);
};

export const encrypt = async (clearPassword: string): Promise<string> => {
	const hash = await bcryptjs.hash(clearPassword, 10);
	return hash;
};

export const compare = async (clearPassword: string, hashedPassword: string): Promise<boolean> => {
	const result = await bcryptjs.compare(clearPassword, hashedPassword);
	return result;
};