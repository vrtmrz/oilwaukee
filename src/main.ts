import { Editor, MarkdownView, Notice, Plugin, type MarkdownFileInfo, type TFile } from 'obsidian';
import { DEFAULT_SETTINGS, OilwaukeeSettings } from "./settings";

// Remember to rename these classes and interfaces!

export default class OilwaukeePlugin extends Plugin {
	settings: OilwaukeeSettings = DEFAULT_SETTINGS;

	async commandTagsToFrontmatter() {
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!markdownView) {
			new Notice('No active Markdown view found.');
			return;
		}
		const file = markdownView.file;
		if (!file) {
			new Notice('No file associated with the active Markdown view.');
			return;
		}
		const cache = this.app.metadataCache.getFileCache(file);
		if (!cache) {
			new Notice('No metadata cache found for the file.');
			return;
		}
		const frontMatterTags = cache.frontmatter?.tags as string[] || [];
		const tags = cache.tags?.map(tag => tag.tag) || [];
		const newTags = tags.filter(tag => !frontMatterTags.includes(tag));
		await this.tagsToFrontmatter(file, newTags);
	}
	async tagsToFrontmatter(file: TFile, newTags: string[]) {
		await this.app.fileManager.processFrontMatter(file, (frontMatter: Record<string, unknown> | undefined) => {
			if (!frontMatter || typeof frontMatter !== 'object') {
				frontMatter = {};
			}
			const tagsInFrontMatter = frontMatter["tags"] as string[] || [];
			frontMatter["tags"] = Array.from(new Set([...tagsInFrontMatter, ...newTags]));
		});
	}
	async onload() {
		await this.loadSettings();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'tags-to-frontmatter',
			name: 'Tags to the frontmatter',
			callback: async () => {
				await this.commandTagsToFrontmatter();
			}
		});

		this.addCommand({
			name: "Move tags from the first line to the frontmatter",
			id: "first-line-tags-to-frontmatter",
			editorCallback: async (editor: Editor, view: MarkdownView | MarkdownFileInfo) => {
				const file = view.file;
				if (!file) {
					new Notice('No file associated with the active Markdown view.');
					return;
				}
				const cache = this.app.metadataCache.getFileCache(file);
				if (!cache) {
					new Notice('No metadata cache found for the file.');
					return;
				}
				const firstLineNumber = (cache.frontmatterPosition?.end?.line ?? -1) + 1;
				const firstLine = editor.getLine(firstLineNumber);
				const tagsAll = cache.tags?.map(tag => tag.tag) || [];

				const newTags = tagsAll.filter(tag => firstLine.includes(tag));
				if (newTags.length === 0) {
					new Notice('No tags found in the first line.');
					return;
				}
				// Move the tags to the frontmatter

				await this.tagsToFrontmatter(file, newTags);
				// Remove the first line from the editor
				const newFirstLine = firstLine.split(' ').filter(word => !newTags.includes(word)).join(' ');
				if (newFirstLine.trim() === '') {
					editor.setLine(firstLineNumber, '');
				} else {
					editor.setLine(firstLineNumber, newFirstLine);
				}
				new Notice('Tags from the first line moved to frontmatter.');
			}
		})
		this.addCommand({
			id: "selected-tags-to-frontmatter",
			name: "Tags from selected text to the frontmatter",
			editorCallback: async (editor: Editor, view: MarkdownView | MarkdownFileInfo) => {
				const file = view.file;
				if (!file) {
					new Notice('No file associated with the active Markdown view.');
					return;
				}
				const cache = this.app.metadataCache.getFileCache(file);
				if (!cache) {
					new Notice('No metadata cache found for the file.');
					return;
				}
				const tags = cache.tags?.map(tag => tag.tag) || [];
				const selectedText = editor.getSelection();
				const selectedTags = tags.filter(tag => selectedText.includes(tag));
				if (selectedTags.length === 0) {
					new Notice('No tags found in the selected text.');
					return;
				}
				await this.tagsToFrontmatter(file, selectedTags);
				// Remove the selected tags from the editor
				const newText = selectedText.split(' ').filter(word => !selectedTags.includes(word)).join(' ');
				editor.replaceSelection(newText);
				new Notice('Selected tags moved to frontmatter.');
			}
		});
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<OilwaukeeSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		let { contentEl } = this;
// 		contentEl.setText('Woah!');
// 	}

// 	onClose() {
// 		const { contentEl } = this;
// 		contentEl.empty();
// 	}
// }
