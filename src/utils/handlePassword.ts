import bcryptjs from 'bcryptjs';

export const encrypt = async (clearPassword: string): Promise<string> => {
	const hash = await bcryptjs.hash(clearPassword, 10);
	return hash;
};

export const compare = async (clearPassword: string, hashedPassword: string): Promise<boolean> => {
	const result = await bcryptjs.compare(clearPassword, hashedPassword);
	return result;
};