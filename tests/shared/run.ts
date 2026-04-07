import { execSync } from "node:child_process";

export function run(command: string, env: Record<string, string>) {
	execSync(command, { stdio: "inherit", env: { ...process.env, ...env } });
}
