import * as vscode from 'vscode';

let lastShown = 0;
let statusItem: vscode.StatusBarItem | undefined;

export function activate(context: vscode.ExtensionContext) {
	// Optional status bar (we keep it handy if you later want status-bar style)
	statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000);
	statusItem.tooltip = 'Cool Down Bro';

	const onChange = vscode.workspace.onDidChangeTextDocument((e) => {
		const cfg = vscode.workspace.getConfiguration('copyPasteDeveloper');

		// Only react for the active editor’s document
		const active = vscode.window.activeTextEditor?.document;
		if (!active || active.uri.toString() !== e.document.uri.toString()) return;

		// --- Heuristic: treat as paste when >= minWords AND >= minLines were inserted ---
		const minWords = cfg.get<number>('minWords') ?? 50;  // default: 50 words
		const minLines = cfg.get<number>('minLines') ?? 2;   // default: 2 lines

		let totalWords = 0;
		let totalLines = 0;

		for (const change of e.contentChanges) {
			const t = change.text;
			if (!t) continue;

			// Count words (split on whitespace, filter out empties)
			const words = t.trim().split(/\s+/).filter(Boolean).length;
			totalWords += words;

			// Count lines added by this change (at least 1 if any text)
			totalLines += Math.max(1, t.split(/\r?\n/).length);
		}

		if (totalWords < minWords || totalLines < minLines) return;

		// --- Cooldown so it doesn’t spam ---
		const cooldownMs = (cfg.get<number>('cooldownSeconds') ?? 12) * 1000;
		const now = Date.now();
		if (now - lastShown < cooldownMs) return;
		lastShown = now;

		const message =
			cfg.get<string>('message') ?? '😅 Cool down bro, use less ChatGPT… hehehe';

		// Show as notification (simple & visible)
		vscode.window.showInformationMessage(message);

		// If you ever want a brief status-bar flash instead, swap with:
		// statusItem!.text = message;
		// statusItem!.show();
		// setTimeout(() => statusItem?.hide(), 4000);
	});

	context.subscriptions.push(onChange, statusItem!);
}

export function deactivate() {
	statusItem?.dispose();
}
