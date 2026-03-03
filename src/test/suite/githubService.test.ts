/**
 * Tests for src/githubService.ts
 *
 * Network calls are eliminated by stubbing axios.get with sinon.
 * Tests cover: caching behaviour, URL construction, 404 handling,
 * cache invalidation, and enterprise vs. public GitHub URLs.
 */
import * as assert from 'assert';
import * as sinon from 'sinon';
import axios from 'axios';
import { GitHubService } from '../../githubService';
import { CopilotCategory } from '../../types';
import { createMockGitHubFile } from '../helpers/mockContext';

const PUBLIC_REPO = { owner: 'github', repo: 'awesome-copilot' };
const ENTERPRISE_REPO = {
    owner: 'my-org',
    repo: 'my-prompts',
    baseUrl: 'https://github.example.corp',
};

/** Builds a minimal GitHubFile-like response item. */
function mockFileResponse(overrides: Record<string, unknown> = {}) {
    return { ...createMockGitHubFile(overrides), type: 'file' };
}

/** Wraps a value in a resolved axios-style response. */
function axiosOk(data: unknown) {
    return Promise.resolve({ data, status: 200, headers: {} });
}

/** Returns a rejected promise with the shape axios uses for HTTP errors. */
function axiosErr(status: number) {
    const err = Object.assign(new Error(`Request failed with status code ${status}`), {
        response: { status, data: {} },
    });
    return Promise.reject(err);
}

suite('GitHubService — instantiation', () => {
    test('creates an instance without throwing', () => {
        assert.doesNotThrow(() => new GitHubService());
    });
});

suite('GitHubService — getCacheStatus()', () => {
    let service: GitHubService;

    setup(() => { service = new GitHubService(); });

    test('returns "Cache empty" when nothing has been fetched', () => {
        assert.strictEqual(service.getCacheStatus(), 'Cache empty');
    });
});

suite('GitHubService — clearCache()', () => {
    let service: GitHubService;
    let stub: sinon.SinonStub;

    setup(() => {
        service = new GitHubService();
        stub = sinon.stub(axios, 'get').callsFake(() => axiosOk([mockFileResponse()]));
    });

    teardown(() => sinon.restore());

    test('resets getCacheStatus() back to "Cache empty"', async () => {
        await service.getFilesByRepo(PUBLIC_REPO, CopilotCategory.Prompts);
        assert.notStrictEqual(service.getCacheStatus(), 'Cache empty');

        service.clearCache();
        assert.strictEqual(service.getCacheStatus(), 'Cache empty');
    });
});

suite('GitHubService — clearRepoCache()', () => {
    let service: GitHubService;
    let stub: sinon.SinonStub;

    setup(() => {
        service = new GitHubService();
        stub = sinon.stub(axios, 'get').callsFake(() => axiosOk([mockFileResponse()]));
    });

    teardown(() => sinon.restore());

    test('removes cache entries only for the specified repository', async () => {
        const repoA = { owner: 'org-a', repo: 'repo-a' };
        const repoB = { owner: 'org-b', repo: 'repo-b' };

        await service.getFilesByRepo(repoA, CopilotCategory.Prompts);
        await service.getFilesByRepo(repoB, CopilotCategory.Prompts);

        const callsBefore = stub.callCount;
        service.clearRepoCache(repoA);

        // repoA must be refetched (cache cleared)
        await service.getFilesByRepo(repoA, CopilotCategory.Prompts);
        // repoB must come from cache (no extra call)
        await service.getFilesByRepo(repoB, CopilotCategory.Prompts);

        assert.strictEqual(stub.callCount, callsBefore + 1,
            'Only repoA should trigger a network call after clearRepoCache(repoA)');
    });
});

suite('GitHubService — getFilesByRepo() caching', () => {
    let service: GitHubService;
    let stub: sinon.SinonStub;

    setup(() => {
        service = new GitHubService();
        stub = sinon.stub(axios, 'get').callsFake(() => axiosOk([mockFileResponse()]));
    });

    teardown(() => sinon.restore());

    test('makes exactly one HTTP request on first call', async () => {
        await service.getFilesByRepo(PUBLIC_REPO, CopilotCategory.Prompts);
        assert.strictEqual(stub.callCount, 1);
    });

    test('returns cached data on second call without a network request', async () => {
        await service.getFilesByRepo(PUBLIC_REPO, CopilotCategory.Prompts);
        await service.getFilesByRepo(PUBLIC_REPO, CopilotCategory.Prompts);
        assert.strictEqual(stub.callCount, 1, 'Second call must be served from cache');
    });

    test('bypasses cache when forceRefresh is true', async () => {
        await service.getFilesByRepo(PUBLIC_REPO, CopilotCategory.Prompts);
        await service.getFilesByRepo(PUBLIC_REPO, CopilotCategory.Prompts, true);
        assert.strictEqual(stub.callCount, 2, 'forceRefresh must bypass the cache');
    });

    test('different categories are cached independently', async () => {
        await service.getFilesByRepo(PUBLIC_REPO, CopilotCategory.Prompts);
        await service.getFilesByRepo(PUBLIC_REPO, CopilotCategory.Instructions);
        assert.strictEqual(stub.callCount, 2, 'Each category must have its own cache entry');
    });

    test('returns file objects from the response', async () => {
        const file = mockFileResponse({ name: 'my-prompt.md', size: 512 });
        stub.callsFake(() => axiosOk([file]));

        const files = await service.getFilesByRepo(PUBLIC_REPO, CopilotCategory.Prompts);
        assert.strictEqual(files.length, 1);
        assert.strictEqual(files[0].name, 'my-prompt.md');
    });
});

suite('GitHubService — getFilesByRepo() URL construction', () => {
    let service: GitHubService;
    let stub: sinon.SinonStub;

    setup(() => {
        service = new GitHubService();
        stub = sinon.stub(axios, 'get').callsFake(() => axiosOk([mockFileResponse()]));
    });

    teardown(() => sinon.restore());

    test('calls the public GitHub API URL for a standard repo', async () => {
        await service.getFilesByRepo(PUBLIC_REPO, CopilotCategory.Prompts);
        const calledUrl: string = stub.firstCall.args[0];
        assert.ok(calledUrl.startsWith('https://api.github.com/'),
            `Expected public API URL, got: ${calledUrl}`);
        assert.ok(calledUrl.includes('/github/awesome-copilot/contents/prompts'));
    });

    test('calls the enterprise /api/v3 URL when baseUrl is provided', async () => {
        await service.getFilesByRepo(ENTERPRISE_REPO, CopilotCategory.Instructions);
        const calledUrl: string = stub.firstCall.args[0];
        assert.ok(calledUrl.startsWith('https://github.example.corp/api/v3/'),
            `Expected enterprise URL, got: ${calledUrl}`);
        assert.ok(calledUrl.includes('/my-org/my-prompts/contents/instructions'));
    });

    test('category value is used verbatim as the path segment', async () => {
        for (const cat of [CopilotCategory.ChatModes, CopilotCategory.Agents, CopilotCategory.Skills]) {
            stub.resetHistory();
            stub.callsFake(() => axiosOk([]));
            await service.getFilesByRepo(PUBLIC_REPO, cat, true);
            const url: string = stub.firstCall.args[0];
            assert.ok(url.endsWith(`/contents/${cat}`),
                `URL must end with /contents/${cat}, got: ${url}`);
        }
    });
});

suite('GitHubService — getFilesByRepo() error handling', () => {
    let service: GitHubService;
    let stub: sinon.SinonStub;

    setup(() => {
        service = new GitHubService();
        stub = sinon.stub(axios, 'get');
    });

    teardown(() => sinon.restore());

    test('returns empty array on 404 (folder does not exist in repo)', async () => {
        stub.callsFake(() => axiosErr(404));
        const files = await service.getFilesByRepo(PUBLIC_REPO, CopilotCategory.ChatModes);
        assert.deepStrictEqual(files, [],
            '404 must produce an empty array, not throw');
    });

    test('throws for non-404 errors (e.g. 500)', async () => {
        stub.callsFake(() => axiosErr(500));
        await assert.rejects(
            () => service.getFilesByRepo(PUBLIC_REPO, CopilotCategory.Prompts),
            /500|Failed to load/,
            '500-level errors must be re-thrown'
        );
    });
});

suite('GitHubService — Skills category filtering', () => {
    let service: GitHubService;
    let stub: sinon.SinonStub;

    setup(() => {
        service = new GitHubService();
        stub = sinon.stub(axios, 'get');
    });

    teardown(() => sinon.restore());

    test('returns only directory entries for Skills', async () => {
        stub.callsFake(() => axiosOk([
            { ...mockFileResponse(), type: 'file' },
            { ...mockFileResponse({ name: 'my-skill' }), type: 'dir' },
        ]));

        const results = await service.getFilesByRepo(PUBLIC_REPO, CopilotCategory.Skills);
        assert.strictEqual(results.length, 1, 'Skills must return only directories');
        assert.strictEqual(results[0].type, 'dir');
    });

    test('returns only file entries for non-Skills categories', async () => {
        stub.callsFake(() => axiosOk([
            { ...mockFileResponse(), type: 'file' },
            { ...mockFileResponse({ name: 'a-folder' }), type: 'dir' },
        ]));

        const results = await service.getFilesByRepo(PUBLIC_REPO, CopilotCategory.Prompts);
        assert.strictEqual(results.length, 1, 'Non-Skills categories must return only files');
        assert.strictEqual(results[0].type, 'file');
    });
});
