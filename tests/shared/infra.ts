export const INFRA_ENV: Record<string, string> = {
	COMPOSE_PROJECT_NAME:
		process.env.COMPOSE_PROJECT_NAME ||
		process.env.PLAYWRIGHT_COMPOSE_PROJECT_NAME ||
		"playwright",
	VOLUME_PATH:
		process.env.VOLUME_PATH ||
		process.env.PLAYWRIGHT_VOLUME_PATH ||
		"./volumes/playwright",
	USER_ID: process.env.USER_ID || "1000",
	GROUP_ID: process.env.GROUP_ID || "1000",
	APP_PORT: process.env.APP_PORT || process.env.PLAYWRIGHT_APP_PORT || "8001",
	VITE_PORT:
		process.env.VITE_PORT || process.env.PLAYWRIGHT_VITE_PORT || "5174",
	POSTGRES_PORT:
		process.env.POSTGRES_PORT || process.env.PLAYWRIGHT_POSTGRES_PORT || "5440",
	DEBUG_PORT:
		process.env.DEBUG_PORT || process.env.PLAYWRIGHT_DEBUG_PORT || "1081",
};
