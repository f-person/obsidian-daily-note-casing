import "obsidian";

declare module "obsidian" {
	interface App {
		internalPlugins: {
			getPluginById(id: "daily-notes"): {
				_loaded: boolean;
				instance: {
					options: {
						format: string;
					};
				};
			};
		};
	}
}
