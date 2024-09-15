import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import DailyNoteCasing from "./main";

export interface DailyNoteCasingSettings {
	/**
	 * the preferred casing to change the daily note to.
	 */
	casing: CasingOption;

	/**
	 * whether to show a notification upon auto-renaming the daily note.
	 */
	noticeOnRename: boolean;
}

export const kDefaultSettings: DailyNoteCasingSettings = {
	casing: "lowercase",
	noticeOnRename: false,
};

export type CasingOption = "lowercase" | "uppercase";

export function applyCasing(text: string, casing: CasingOption): string {
	switch (casing) {
		case "lowercase":
			return text.toLowerCase();
		case "uppercase":
			return text.toUpperCase();
		default:
			throw new Error("invalid casing");
	}
}

export class DailyNoteCasingSettingTab extends PluginSettingTab {
	plugin: DailyNoteCasing;

	constructor(app: App, plugin: DailyNoteCasing) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;
		containerEl.empty();

		this.addCasingSetting(containerEl);
		this.addNoticeOnRenameSetting(containerEl);
	}

	addCasingSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("casing")
			.setDesc("choose the casing for the daily note")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						lowercase: "lowercase",
						uppercase: "UPPERCASE",
					})
					.setValue(this.plugin.settings.casing)
					.onChange(async (value) => {
						if (value !== "lowercase" && value !== "uppercase") {
							console.error("invalid casing", value);
							new Notice("invalid casing");
							return;
						}

						this.plugin.settings.casing = value;
						await this.plugin.saveSettings();
					})
			);
	}

	addNoticeOnRenameSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("notify on rename")
			.setDesc(
				"enable this if you'd like to be notified when the casing is applied to a daily note"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.noticeOnRename)
					.onChange(async (value) => {
						this.plugin.settings.noticeOnRename = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
