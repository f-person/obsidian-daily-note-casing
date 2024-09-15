import { Notice } from "obsidian";

export function reportPluginError(message: string): void {
	const errorMessage = `[daily note casing]: ${message}`;

	console.error(message);
	new Notice(message);
}
