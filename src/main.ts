import { Notice, Plugin, TFile, moment } from "obsidian";
import {
	kDefaultSettings,
	DailyNoteCasingSettingTab,
	DailyNoteCasingSettings,
	applyCasing,
} from "./plugin_settings";
import { join } from "path";
import { reportPluginError } from "./utils";

export default class DailyNoteCasing extends Plugin {
	settings: DailyNoteCasingSettings;

	async onload() {
		await this.loadSettings();

		this.registerEvent(
			// TODO(f-person): this gets called once for each file when obsidian is open. we probably don't want that?
			// as this will override any already existing files without an explicit action from the user, which is meh
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
		const dateFormat = this.settings.dailyNoteDateFormat;
		const didSetDateFormat = dateFormat.trim().length > 0;
		if (!didSetDateFormat) {
			// the plugin shouldn't do anything unless the date format setting is set
			return;
		}

		const isDailyNoteFile = moment(
			file.basename,
			dateFormat,
			true
		).isValid();

		if (isDailyNoteFile) {
			console.log("daily note file created", file);
			const casing = this.settings.casing;

			const renamedFile = await this.applyCasingToBasename(file);
			if (!renamedFile) {
				return;
			}

			const casingInItsCaseLol = applyCasing(casing, casing);

			const shouldNotifyAboutRename = this.settings.noticeOnRename;
			if (shouldNotifyAboutRename) {
				const renamedBasename = renamedFile.basename;
				new Notice(
					`your daily note is now in ${casingInItsCaseLol}: ${renamedBasename}`
				);
			}
		}
	}

	async applyCasingToBasename(file: TFile): Promise<TFile | null> {
		// because obsidian doesn't let you rename a file to the same name,
		// and the check for this is case-insensitive, we move the file to
		// a temp path first to then rename it to the correct case.
		const basename = file.basename;
		const tempBasename = `temp-${basename}`;
		const tempFile = await this.changeFileBasename(file, tempBasename);

		if (!tempFile) {
			reportPluginError(
				`error renaming daily note to a temporary name: file ${tempBasename} not found`
			);

			return null;
		}

		const casing = this.settings.casing;
		const basenameWithCasingApplied = applyCasing(basename, casing);

		const renamedFile = await this.changeFileBasename(
			tempFile,
			basenameWithCasingApplied
		);
		if (!renamedFile) {
			reportPluginError(
				`error applying ${casing} to ${basename}: ${basenameWithCasingApplied} not found`
			);
		}

		return renamedFile;
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
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
