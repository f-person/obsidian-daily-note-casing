import { Notice, Plugin, TFile, moment } from "obsidian";
import {
	kDefaultSettings,
	DailyNoteCasingSettingTab,
	DailyNoteCasingSettings,
	applyCasing,
} from "./plugin_settings";
import { join } from "path";

export default class DailyNoteCasing extends Plugin {
	settings: DailyNoteCasingSettings;

	async onload() {
		await this.loadSettings();

		this.registerEvent(
			// TODO(f-person): this gets called once for each file when obsidian is open. we probably don't want that?
			this.app.vault.on("create", (abstractFile) => {
				if (abstractFile instanceof TFile) {
					this.handleFileCreated(abstractFile);
				}
			})
		);

		this.addSettingTab(new DailyNoteCasingSettingTab(this.app, this));
	}

	onunload() {}

	async handleFileCreated(file: TFile) {
		if (this.isFileDailyNote(file)) {
			console.log("daily note file created", file);
			await this.renameDailyNote(file);

			const casing = this.settings.casing;
			const casingInItsCaseLol = applyCasing(casing, casing);

			new Notice(
				`changed the casing of the daily note to ${casingInItsCaseLol}`
			);
		}
	}

	isFileDailyNote(file: TFile): boolean {
		const basename = file.basename;
		const dateFormat = this.settings.dailyNoteDateFormat;

		const isFileDailyNote = moment(basename, dateFormat, true).isValid();
		return isFileDailyNote;
	}

	async renameDailyNote(file: TFile) {
		// because obsidian doesn't let you rename a file to the same name,
		// and the check for this is case-insensitive, we move the file to
		// a temp path first to then rename it to the correct case.
		const basename = file.basename;
		const tempBasename = `temp-${basename}`;
		const tempFile = await this.changeFileBasename(file, tempBasename);

		if (!tempFile) {
			console.error("Temp file not found after rename", tempBasename);
			new Notice("Error renaming daily note to lowercase");
			return;
		}

		const casing = this.settings.casing;
		const basenameWithCasingApplied = applyCasing(basename, casing);

		await this.changeFileBasename(tempFile, basenameWithCasingApplied);
	}

	/**
	 *
	 * @returns the renamed file or null if something went wrong
	 */
	async changeFileBasename(
		file: TFile,
		newBasename: string
	): Promise<TFile | null> {
		const parentPath = file.parent?.path;

		// if we use "/" with a file in the root, it might not be found afterwards
		const parentPathPart =
			!parentPath || parentPath == "/" ? "" : parentPath;
		const newPath = join(parentPathPart, `${newBasename}.md`);

		await this.app.fileManager.renameFile(file, newPath);

		return this.app.vault.getFileByPath(newPath);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			kDefaultSettings,
			await this.loadData()
		);
		console.log(this.settings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
