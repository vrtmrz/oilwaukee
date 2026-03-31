import {App, PluginSettingTab, Setting} from "obsidian";
import OilwaukeePlugin from "./main";

export interface OilwaukeeSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: OilwaukeeSettings = {
	mySetting: 'default'
}

export class OilwaukeeSettingTab extends PluginSettingTab {
	plugin: OilwaukeePlugin;

	constructor(app: App, plugin: OilwaukeePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Settings #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
