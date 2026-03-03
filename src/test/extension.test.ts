/**
 * Extension smoke tests
 *
 * Verifies that core VS Code extension primitives are accessible in the
 * test host.  Detailed behavioural tests live in src/test/suite/.
 *
 * These tests intentionally make no network calls.
 */
import * as assert from 'assert';
import * as vscode from 'vscode';
import { GitHubService } from '../githubService';
import { PromptLibraryProvider } from '../treeProvider';
import { EXT_DISPLAY_NAME } from '../constants';
import { createMockExtensionContext } from './helpers/mockContext';

suite('Smoke Tests', () => {
    vscode.window.showInformationMessage(`Running ${EXT_DISPLAY_NAME} test suite`);

    test('VS Code API is available in test host', () => {
        assert.ok(vscode.version, 'vscode.version must be a non-empty string');
        assert.ok(typeof vscode.window !== 'undefined');
        assert.ok(typeof vscode.commands !== 'undefined');
    });

    test('GitHubService can be instantiated', () => {
        assert.doesNotThrow(() => new GitHubService());
    });

    test('PromptLibraryProvider can be instantiated with a mock context', () => {
        const ctx = createMockExtensionContext();
        const service = new GitHubService();
        assert.doesNotThrow(() => new PromptLibraryProvider(service, ctx));
    });

    test('mock ExtensionContext globalState supports get/update round-trip', async () => {
        const ctx = createMockExtensionContext();
        await ctx.globalState.update('test-key', { value: 42 });
        const result = ctx.globalState.get<{ value: number }>('test-key');
        assert.deepStrictEqual(result, { value: 42 });
    });

    test('mock ExtensionContext workspaceState supports get/update round-trip', async () => {
        const ctx = createMockExtensionContext();
        await ctx.workspaceState.update('ws-key', [1, 2, 3]);
        const result = ctx.workspaceState.get<number[]>('ws-key');
        assert.deepStrictEqual(result, [1, 2, 3]);
    });
});
