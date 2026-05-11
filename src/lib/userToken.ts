import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "node:process";
import { argon2id, hash, verify } from "argon2";
import { PASSWORD_SECRET } from "$env/static/private";

const KEY = env.AES_KEY;
export const tokenUtils = {
	enc: function encrypt(text: string) {
		const iv = randomBytes(12); // GCM standard 12 bytes

		const cipher = createCipheriv(
			"aes-256-gcm",
			KEY ? Buffer.from(KEY) : randomBytes(32),
			iv,
		);

		const encrypted = Buffer.concat([
			cipher.update(text, "utf8"),
			cipher.final(),
		]);

		const tag = cipher.getAuthTag();
		const token = Buffer.from(
			`${iv.toString("hex")}::${encrypted.toString("hex")}::${tag.toString("hex")}`,
			"utf8",
		).toString("base64");

		return token;
	},
	dec: function decrypt(token: string) {
		const raw = Buffer.from(token, "base64").toString("utf8");
		const paylod = raw.split("::");
		const iv = Buffer.from(paylod[0], "hex");
		const encrypted = Buffer.from(paylod[1], "hex");
		const tag = Buffer.from(paylod[2], "hex");

		const decipher = createDecipheriv(
			"aes-256-gcm",
			KEY ? Buffer.from(KEY) : randomBytes(32),
			iv,
		);
		decipher.setAuthTag(tag);

		const decrypted = Buffer.concat([
			decipher.update(encrypted),
			decipher.final(),
		]);

		return decrypted.toString("utf8");
	},
};

const SECRET = Buffer.from(PASSWORD_SECRET);

export async function generateUserToken() {
	const code = randomBytes(16).toString("hex");
	const codeHash = await hash(code, {
		memoryCost: 32 * 1024,
		parallelism: 2,
		secret: SECRET,
		type: argon2id,
	});
	return {
		code: codeHash,
		userToken: (userId: string) =>
			Buffer.from(`${userId}::${code}`, "utf8").toString("base64url"),
	};
}

export function verifyUserToken(userToken: string) {
	const raw = Buffer.from(userToken, "base64url").toString("utf8");
	const parse = raw.split("::");
	const userId = parse[0];
	const token = parse[1];

	return {
		data: {
			userId,
		},
		verify: async (tokenDB: string) =>
			verify(tokenDB, token, {
				secret: SECRET,
			}),
	};
}
