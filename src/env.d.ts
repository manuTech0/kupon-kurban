declare namespace NodeJS {
	interface ProcessEnv {
		DATABASE_URL: string;
		REDIS_URL: string;
		PASSWORD_SECRET: string;
		SESSIONS_DURATION: string;
		AES_KEY: string;
	}
}
