/**
 * Tests for src/downloadTracker.ts
 *
 * Covers the core business logic: recording downloads, detecting updates,
 * and managing the download manifest stored in VS Code workspace state.
 *
 * Uses an in-memory mock context — no real VS Code storage is touched.
 */
import * as assert from 'assert';
import * as vscode from 'vscode';
import { DownloadTracker } from '../../downloadTracker';
import { CopilotCategory } from '../../types';
import { STORAGE_DOWNLOADS_KEY } from '../../constants';
import { createMockExtensionContext, createMockGitHubFile } from '../helpers/mockContext';

/** Builds a minimal CopilotItem for tests. */
function makeItem(overrides: Record<string, unknown> = {}) {
    const file = createMockGitHubFile(overrides.file as Record<string, unknown> ?? {});
    return {
        id: 'test-item-1',
        name: 'test-file.md',
        category: CopilotCategory.Instructions,
        file,
        repo: { owner: 'github', repo: 'awesome-copilot' },
        ...overrides,
    };
}

suite('DownloadTracker — storage key', () => {
    test('uses the canonical STORAGE_DOWNLOADS_KEY constant', () => {
        // This ensures the storage key survives future renames:
        // the constant and the tracker must agree.
        const ctx = createMockExtensionContext();
        const tracker = new DownloadTracker(ctx);

        // Record something, then inspect workspace state directly
        const item = makeItem() as Parameters<typeof tracker.recordDownload>[0];
        return tracker.recordDownload(item, 'content').then(() => {
            const raw = ctx.workspaceState.get<Record<string, unknown>>(STORAGE_DOWNLOADS_KEY);
            assert.ok(raw, 'Tracker must use STORAGE_DOWNLOADS_KEY for workspace state');
            assert.ok(Object.keys(raw).length > 0);
        });
    });
});

suite('DownloadTracker — isDownloaded()', () => {
    let tracker: DownloadTracker;
    let ctx: vscode.ExtensionContext;

    setup(() => {
        ctx = createMockExtensionContext();
        tracker = new DownloadTracker(ctx);
    });

    test('returns false for an item that has never been downloaded', () => {
        assert.strictEqual(tracker.isDownloaded('nonexistent-id'), false);
    });

    test('returns true after recordDownload() is called for that item', async () => {
        const item = makeItem() as Parameters<typeof tracker.recordDownload>[0];
        await tracker.recordDownload(item, 'file content');
        assert.strictEqual(tracker.isDownloaded(item.id), true);
    });
});

suite('DownloadTracker — recordDownload()', () => {
    let tracker: DownloadTracker;
    let ctx: vscode.ExtensionContext;

    setup(() => {
        ctx = createMockExtensionContext();
        tracker = new DownloadTracker(ctx);
    });

    test('stores item metadata after recording', async () => {
        const item = makeItem() as Parameters<typeof tracker.recordDownload>[0];
        await tracker.recordDownload(item, 'hello world');

        const metadata = tracker.getDownloadMetadata(item.id);
        assert.ok(metadata, 'metadata must exist after recording');
        assert.strictEqual(metadata!.itemId, item.id);
        assert.strictEqual(metadata!.itemName, item.name);
        assert.strictEqual(metadata!.repoOwner, 'github');
        assert.strictEqual(metadata!.repoName, 'awesome-copilot');
    });

    test('computes a SHA-256 hash when content is provided', async () => {
        const item = makeItem() as Parameters<typeof tracker.recordDownload>[0];
        await tracker.recordDownload(item, 'specific content');

        const metadata = tracker.getDownloadMetadata(item.id);
        assert.ok(metadata!.sha, 'SHA must be set when content is provided');
        // SHA-256 hex is 64 chars
        assert.strictEqual(metadata!.sha.length, 64);
    });

    test('falls back to file.sha when no content is provided', async () => {
        const item = makeItem({ file: createMockGitHubFile({ sha: 'known-sha-xyz' }) }) as Parameters<typeof tracker.recordDownload>[0];
        await tracker.recordDownload(item); // no content arg

        const metadata = tracker.getDownloadMetadata(item.id);
        assert.strictEqual(metadata!.sha, 'known-sha-xyz');
    });

    test('stores a downloadTimestamp in milliseconds', async () => {
        const before = Date.now();
        const item = makeItem() as Parameters<typeof tracker.recordDownload>[0];
        await tracker.recordDownload(item, 'content');
        const after = Date.now();

        const metadata = tracker.getDownloadMetadata(item.id);
        assert.ok(metadata!.downloadTimestamp >= before);
        assert.ok(metadata!.downloadTimestamp <= after);
    });

    test('overwrites existing metadata when the same item is re-downloaded', async () => {
        const item = makeItem() as Parameters<typeof tracker.recordDownload>[0];
        await tracker.recordDownload(item, 'version one');
        const firstSha = tracker.getDownloadMetadata(item.id)!.sha;

        await tracker.recordDownload(item, 'version two');
        const secondSha = tracker.getDownloadMetadata(item.id)!.sha;

        assert.notStrictEqual(firstSha, secondSha, 'SHA must update after re-download');
    });
});

suite('DownloadTracker — hasUpdate()', () => {
    let tracker: DownloadTracker;
    let ctx: vscode.ExtensionContext;

    setup(() => {
        ctx = createMockExtensionContext();
        tracker = new DownloadTracker(ctx);
    });

    test('returns false for an item that was never downloaded', () => {
        const item = makeItem() as Parameters<typeof tracker.recordDownload>[0];
        assert.strictEqual(tracker.hasUpdate(item), false);
    });

    test('returns false when SHA matches the recorded download', async () => {
        const item = makeItem() as Parameters<typeof tracker.recordDownload>[0];
        // Record with the same content so SHA is derived from it
        await tracker.recordDownload(item, 'stable content');

        // Fake a remote file with the same SHA as the recorded hash
        const metadata = tracker.getDownloadMetadata(item.id)!;
        const sameShaCopy = makeItem({
            file: createMockGitHubFile({ sha: metadata.sha, size: item.file.size })
        }) as Parameters<typeof tracker.recordDownload>[0];

        assert.strictEqual(tracker.hasUpdate(sameShaCopy), false);
    });

    test('returns true when remote SHA differs from recorded SHA', async () => {
        const item = makeItem() as Parameters<typeof tracker.recordDownload>[0];
        await tracker.recordDownload(item, 'original content');

        const updated = makeItem({
            file: createMockGitHubFile({ sha: 'completely-different-sha', size: item.file.size })
        }) as Parameters<typeof tracker.recordDownload>[0];

        assert.strictEqual(tracker.hasUpdate(updated), true);
    });

    test('returns true when size differs (SHA fallback path)', async () => {
        // Record with no content so sha comes from file.sha
        const item = makeItem({ file: createMockGitHubFile({ sha: '', size: 100 }) }) as Parameters<typeof tracker.recordDownload>[0];
        await tracker.recordDownload(item);

        // Simulate remote file growing in size with no SHA info
        const bigger = makeItem({
            file: createMockGitHubFile({ sha: '', size: 200 })
        }) as Parameters<typeof tracker.recordDownload>[0];

        assert.strictEqual(tracker.hasUpdate(bigger), true);
    });
});

suite('DownloadTracker — findItemsWithUpdates()', () => {
    let tracker: DownloadTracker;
    let ctx: vscode.ExtensionContext;

    setup(() => {
        ctx = createMockExtensionContext();
        tracker = new DownloadTracker(ctx);
    });

    test('returns empty array when nothing has been downloaded', () => {
        const item = makeItem() as Parameters<typeof tracker.recordDownload>[0];
        assert.deepStrictEqual(tracker.findItemsWithUpdates([item]), []);
    });

    test('returns only the items that have updates', async () => {
        const item1 = makeItem({ id: 'item-1', file: createMockGitHubFile({ sha: 'sha-a', size: 100 }) }) as Parameters<typeof tracker.recordDownload>[0];
        const item2 = makeItem({ id: 'item-2', file: createMockGitHubFile({ sha: 'sha-b', size: 200 }) }) as Parameters<typeof tracker.recordDownload>[0];

        // Download item1 with known SHA
        await tracker.recordDownload(item1);

        // Now "remote" item1 has a new SHA, item2 was never downloaded
        const remoteItem1 = makeItem({ id: 'item-1', file: createMockGitHubFile({ sha: 'sha-CHANGED', size: 100 }) }) as Parameters<typeof tracker.recordDownload>[0];
        const remoteItem2 = makeItem({ id: 'item-2', file: createMockGitHubFile({ sha: 'sha-b', size: 200 }) }) as Parameters<typeof tracker.recordDownload>[0];

        const updates = tracker.findItemsWithUpdates([remoteItem1, remoteItem2]);
        assert.strictEqual(updates.length, 1);
        assert.strictEqual(updates[0].id, 'item-1');
    });
});

suite('DownloadTracker — removeDownload()', () => {
    let tracker: DownloadTracker;
    let ctx: vscode.ExtensionContext;

    setup(() => {
        ctx = createMockExtensionContext();
        tracker = new DownloadTracker(ctx);
    });

    test('removes a recorded download so isDownloaded returns false', async () => {
        const item = makeItem() as Parameters<typeof tracker.recordDownload>[0];
        await tracker.recordDownload(item, 'content');
        assert.strictEqual(tracker.isDownloaded(item.id), true);

        await tracker.removeDownload(item.id);
        assert.strictEqual(tracker.isDownloaded(item.id), false);
    });
});

suite('DownloadTracker — clearAllDownloads()', () => {
    let tracker: DownloadTracker;
    let ctx: vscode.ExtensionContext;

    setup(() => {
        ctx = createMockExtensionContext();
        tracker = new DownloadTracker(ctx);
    });

    test('removes all download records', async () => {
        const item1 = makeItem({ id: 'clear-1' }) as Parameters<typeof tracker.recordDownload>[0];
        const item2 = makeItem({ id: 'clear-2' }) as Parameters<typeof tracker.recordDownload>[0];

        await tracker.recordDownload(item1, 'a');
        await tracker.recordDownload(item2, 'b');
        assert.strictEqual(Object.keys(tracker.getDownloads()).length, 2);

        await tracker.clearAllDownloads();
        assert.deepStrictEqual(tracker.getDownloads(), {});
    });
});
