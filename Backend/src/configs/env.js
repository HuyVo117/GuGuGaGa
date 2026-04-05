export const env = {
	port: Number(process.env.PORT || 5000),
	nodeEnv: process.env.NODE_ENV || "development",
};

export const config = {
	jwtSecret: process.env.JWT_SECRET || "dev-secret",
};
