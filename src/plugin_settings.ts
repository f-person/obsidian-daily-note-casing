import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import DailyNoteCasing from "./main";

export interface DailyNoteCasingSettings {
	dailyNoteDateFormat: string;
	casing: CasingOption;
}

export const kDefaultSettings: DailyNoteCasingSettings = {
	dailyNoteDateFormat: "MMM D YYYY, ddd",
	casing: "lowercase",
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

		this.addDailyNoteDateFormatSetting(containerEl);
		this.addCasingSetting(containerEl);
	}

	addDailyNoteDateFormatSetting(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName("daily note date format")
			.then((component) => {
				const settings = this.plugin.settings;

				// TODO(f-person): consider changing the syntax description. mention daily notes stuff.
				component.setDesc(
					createFragment((fragment) => {
						fragment.appendText(
							"This is the format used in the time ruler. Use 'H' for 24 hours; use 'h' for 12 hours. Your current syntax looks like this: "
						);
						component.addMomentFormat((momentFormat) =>
							momentFormat
								.setValue(settings.dailyNoteDateFormat)
								.setSampleEl(fragment.createSpan())
								.onChange((value: string) => {
									settings.dailyNoteDateFormat = value;
									this.plugin.saveSettings();
								})
						);
						fragment.append(
							createEl("br"),
							createEl(
								"a",
								{
									text: "format reference",
									href: "https://momentjs.com/docs/#/displaying/format/",
								},
								(a) => {
									a.setAttr("target", "_blank");
								}
							)
						);
					})
				);
			});
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
}
