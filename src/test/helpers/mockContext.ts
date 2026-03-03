/**
 * Lightweight VS Code ExtensionContext mock for use in unit tests.
 *
 * Only implements the fields actually used by this extension's source code.
 * Cast to `unknown as vscode.ExtensionContext` so TypeScript is satisfied
 * without maintaining an exhaustive stub of the full VS Code API surface.
 */
import * as vscode from 'vscode';

/** In-memory Memento that satisfies vscode.Memento for testing. */
export function createMockMemento(): vscode.Memento & { store: Map<string, unknown> } {
    const store = new Map<string, unknown>();
    return {
        store,
        get<T>(key: string, defaultValue?: T): T {
            return store.has(key) ? (store.get(key) as T) : (defaultValue as T);
        },
        update(key: string, value: unknown): Thenable<void> {
            if (value === undefined) {
                store.delete(key);
            } else {
                store.set(key, value);
            }
            return Promise.resolve();
        },
        keys(): readonly string[] {
            return [...store.keys()];
        },
    };
}

/**
 * Creates a minimal mock ExtensionContext.
 * Covers: subscriptions, globalState, workspaceState, extensionMode.
 */
export function createMockExtensionContext(): vscode.ExtensionContext {
    return {
        subscriptions: [],
        globalState: createMockMemento(),
        workspaceState: createMockMemento(),
        extensionUri: vscode.Uri.file('/mock/extension'),
        extensionPath: '/mock/extension',
        storageUri: vscode.Uri.file('/mock/storage'),
        globalStorageUri: vscode.Uri.file('/mock/global-storage'),
        logUri: vscode.Uri.file('/mock/logs'),
        extensionMode: vscode.ExtensionMode.Test,
        extension: {} as vscode.Extension<unknown>,
        // Cast the remainder — unused fields in tests
        secrets: {} as vscode.SecretStorage,
        environmentVariableCollection: {} as vscode.GlobalEnvironmentVariableCollection,
        asAbsolutePath: (p: string) => `/mock/extension/${p}`,
        storagePath: '/mock/storage',
        globalStoragePath: '/mock/global-storage',
        logPath: '/mock/logs',
        languageModelAccessInformation: {} as vscode.LanguageModelAccessInformation,
    } as unknown as vscode.ExtensionContext;
}

/** Builds a minimal CopilotItem-shaped object for use in download / tree tests. */
export function createMockGitHubFile(overrides: Record<string, unknown> = {}) {
    return {
        name: 'test-file.md',
        path: 'prompts/test-file.md',
        download_url: 'https://raw.githubusercontent.com/github/awesome-copilot/main/prompts/test-file.md',
        size: 1024,
        type: 'file' as const,
        sha: 'abc123def456',
        ...overrides,
    };
}
