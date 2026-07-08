import { mkdirSync } from "node:fs";
import { FIXTURES } from "./fixtures";
import { INFRA_ENV } from "./infra";
import { run } from "./run";

async function waitForUrl(url: string, attempts = 36, delayMs = 5000) {
	for (let i = 0; i < attempts; i += 1) {
		const ready = await fetch(url).then(
			(response) => response.ok,
			() => false,
		);
		if (ready) {
			return;
		}

		if (i < attempts - 1) {
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}

	throw new Error(`Service did not become ready: ${url}`);
}

export default async function globalSetup() {
	mkdirSync(`${INFRA_ENV.VOLUME_PATH}/media`, { recursive: true });
	mkdirSync(`${INFRA_ENV.VOLUME_PATH}/static`, { recursive: true });

	run("docker compose up --build -d postgres rabbitmq app vite", INFRA_ENV);

	await waitForUrl(
		`http://localhost:${INFRA_ENV.VITE_PORT}/static/@vite/client`,
	);
	await waitForUrl(`http://localhost:${INFRA_ENV.APP_PORT}`);

	run(
		"docker compose exec -T app /opt/venv/bin/python manage.py flush --no-input",
		INFRA_ENV,
	);
	run(
		`docker compose exec -T app /opt/venv/bin/python manage.py loaddata ${FIXTURES.join(" ")}`,
		INFRA_ENV,
	);
	run("docker compose exec -T app mkdir -p /media/icons", INFRA_ENV);
	run(
		"docker compose exec -T app cp -R /app/media.template/icons/. /media/icons/",
		INFRA_ENV,
	);
}
