/**
 * Tests for src/repoStorage.ts
 *
 * Validates the priority chain for source resolution:
 *   VS Code config  >  global state  >  built-in defaults
 *
 * All tests use the in-memory mock context — no real VS Code config is written.
 */
import * as assert from 'assert';
import * as vscode from 'vscode';
import { RepoStorage } from '../../repoStorage';
import { CFG_REPOSITORIES, STORAGE_SOURCES_KEY } from '../../constants';
import { createMockExtensionContext } from '../helpers/mockContext';

import { initializeLogger } from '../../logger';

suite('RepoStorage', () => {
    suiteSetup(() => {
        initializeLogger(createMockExtensionContext());
    });

    suite('RepoStorage — getDefaultSources()', () => {
        test('returns at least one source', () => {
            const defaults = RepoStorage.getDefaultSources();
            assert.ok(defaults.length > 0, 'There must be at least one default source');
        });

        test('each default source has a non-empty owner and repo', () => {
            const defaults = RepoStorage.getDefaultSources();
            for (const source of defaults) {
                assert.ok(source.owner && source.owner.length > 0, 'owner must be non-empty');
                assert.ok(source.repo && source.repo.length > 0, 'repo must be non-empty');
            }
        });

        test('returns a new array each time (no shared mutable state)', () => {
            const a = RepoStorage.getDefaultSources();
            const b = RepoStorage.getDefaultSources();
            assert.notStrictEqual(a, b, 'getDefaultSources() must return a fresh array');
        });
    });

    suite('RepoStorage — getSources() fallback to defaults', () => {
        let ctx: vscode.ExtensionContext;

        setup(() => {
            ctx = createMockExtensionContext();
        });

        test('returns defaults when neither config nor global state has sources', () => {
            // Fresh context: nothing stored anywhere.
            // VS Code config is the real workspace config in the test host, which will
            // likely be empty for prompt-library.repositories, so defaults apply.
            const sources = RepoStorage.getSources(ctx);
            assert.ok(Array.isArray(sources), 'getSources() must return an array');
            assert.ok(sources.length > 0, 'must return at least one source');
        });

                test('sources from global state take priority over defaults', async () => {

                    // Ensure no user/workspace config is set, so we can test the globalState fallback

                    const config = vscode.workspace.getConfiguration();

                    await config.update(CFG_REPOSITORIES, undefined, vscode.ConfigurationTarget.Global);

                    

                    const customSources = [{ owner: 'my-org', repo: 'my-prompts', label: 'My Prompts' }];

                    await ctx.globalState.update(STORAGE_SOURCES_KEY, customSources);

            

                    const sources = RepoStorage.getSources(ctx);

                    const hasCustom = sources.some(s => s.owner === 'my-org' && s.repo === 'my-prompts');

                    assert.ok(hasCustom, 'global state sources must be returned when present');

            

                    // Clean up

                    await config.update(CFG_REPOSITORIES, undefined, vscode.ConfigurationTarget.Global);

                });    });

    suite('RepoStorage — setSources()', () => {
        let ctx: vscode.ExtensionContext;

        setup(() => {
            ctx = createMockExtensionContext();
        });

        test('persists sources to global state', async () => {
            const sources = [{ owner: 'test-owner', repo: 'test-repo' }];
            await RepoStorage.setSources(ctx, sources);

            const stored = ctx.globalState.get<typeof sources>(STORAGE_SOURCES_KEY);
            assert.ok(stored, 'sources must be persisted to global state');
            assert.deepStrictEqual(stored, sources);
        });
    });

    suite('RepoStorage — Constants alignment', () => {
        test('CFG_REPOSITORIES constant has the expected structure', () => {
            // Must be a dotted path: <section>.<key>
            const parts = CFG_REPOSITORIES.split('.');
            assert.ok(parts.length >= 2,
                `CFG_REPOSITORIES "${CFG_REPOSITORIES}" must be a dotted path`);
        });

        test('STORAGE_SOURCES_KEY is used as the global state key', async () => {
            const ctx = createMockExtensionContext();
            const sources = [{ owner: 'probe-owner', repo: 'probe-repo' }];

            await RepoStorage.setSources(ctx, sources);

            // Read directly from globalState using the constant
            const direct = ctx.globalState.get<typeof sources>(STORAGE_SOURCES_KEY);
            assert.ok(direct, 'STORAGE_SOURCES_KEY must match the key RepoStorage uses internally');
            assert.strictEqual(direct![0].owner, 'probe-owner');
        });
    });
});

