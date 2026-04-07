import { INFRA_ENV } from "./infra";
import { run } from "./run";

export default function globalTeardown() {
	run("docker compose down -v", INFRA_ENV);
}
