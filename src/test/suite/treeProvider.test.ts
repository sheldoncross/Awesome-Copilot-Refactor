/**
 * Tests for src/treeProvider.ts
 *
 * Focuses on tree item construction (contextValue, icons, description)
 * and the getChildren() contract for each level of the tree hierarchy.
 * GitHubService network calls are stubbed with sinon.
 */
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { PromptLibraryProvider, PromptLibraryTreeItem } from '../../treeProvider';
import { GitHubService } from '../../githubService';
import { CopilotCategory, CATEGORY_LABELS } from '../../types';
import { createMockExtensionContext, createMockGitHubFile } from '../helpers/mockContext';

const MOCK_REPO = { owner: 'test-owner', repo: 'test-repo', label: 'Test Repo' };

suite('PromptLibraryTreeItem — file item', () => {
    test('sets contextValue to "copilotFile"', () => {
        const file = createMockGitHubFile();
        const treeItem = new PromptLibraryTreeItem(
            'test.md',
            vscode.TreeItemCollapsibleState.None,
            'file',
            { id: '1', name: 'test.md', category: CopilotCategory.Instructions, file: file as any, repo: MOCK_REPO }
        );
        assert.strictEqual(treeItem.contextValue, 'copilotFile');
    });

    test('uses folder icon for Skills directory items', () => {
        const file = createMockGitHubFile({ type: 'dir' });
        const treeItem = new PromptLibraryTreeItem(
            'my-skill',
            vscode.TreeItemCollapsibleState.None,
            'file',
            { id: '2', name: 'my-skill', category: CopilotCategory.Skills, file: file as any, repo: MOCK_REPO }
        );
        assert.ok(
            treeItem.iconPath instanceof vscode.ThemeIcon &&
            (treeItem.iconPath as vscode.ThemeIcon).id === 'folder',
            'Skill bundle items must use the "folder" icon'
        );
    });

    test('uses folder icon for Plugins directory items', () => {
        const file = createMockGitHubFile({ type: 'dir' });
        const treeItem = new PromptLibraryTreeItem(
            'my-plugin',
            vscode.TreeItemCollapsibleState.None,
            'file',
            { id: '3', name: 'my-plugin', category: CopilotCategory.Plugins, file: file as any, repo: MOCK_REPO }
        );
        assert.ok(
            treeItem.iconPath instanceof vscode.ThemeIcon &&
            (treeItem.iconPath as vscode.ThemeIcon).id === 'folder',
            'Plugin bundle items must use the "folder" icon'
        );
    });

    test('bundle description includes category label for Skills', () => {
        const file = createMockGitHubFile({ type: 'dir' });
        const treeItem = new PromptLibraryTreeItem(
            'my-skill',
            vscode.TreeItemCollapsibleState.None,
            'file',
            { id: '10', name: 'my-skill', category: CopilotCategory.Skills, file: file as any, repo: MOCK_REPO }
        );
        assert.ok(
            typeof treeItem.description === 'string' && treeItem.description.includes('Skills'),
            `description "${treeItem.description}" must mention the category label`
        );
    });

    test('bundle description includes category label for Plugins', () => {
        const file = createMockGitHubFile({ type: 'dir' });
        const treeItem = new PromptLibraryTreeItem(
            'my-plugin',
            vscode.TreeItemCollapsibleState.None,
            'file',
            { id: '11', name: 'my-plugin', category: CopilotCategory.Plugins, file: file as any, repo: MOCK_REPO }
        );
        assert.ok(
            typeof treeItem.description === 'string' && treeItem.description.includes('Plugins'),
            `description "${treeItem.description}" must mention the category label`
        );
    });

    test('uses book icon for Instructions files', () => {
        const file = createMockGitHubFile();
        const treeItem = new PromptLibraryTreeItem(
            'style.md',
            vscode.TreeItemCollapsibleState.None,
            'file',
            { id: '4', name: 'style.md', category: CopilotCategory.Instructions, file: file as any, repo: MOCK_REPO }
        );
        assert.strictEqual((treeItem.iconPath as vscode.ThemeIcon).id, 'book');
    });

    test('uses robot icon for Agents files', () => {
        const file = createMockGitHubFile();
        const treeItem = new PromptLibraryTreeItem(
            'agent.md',
            vscode.TreeItemCollapsibleState.None,
            'file',
            { id: '5', name: 'agent.md', category: CopilotCategory.Agents, file: file as any, repo: MOCK_REPO }
        );
        assert.strictEqual((treeItem.iconPath as vscode.ThemeIcon).id, 'robot');
    });

    test('uses zap icon for Hooks files', () => {
        const file = createMockGitHubFile();
        const treeItem = new PromptLibraryTreeItem(
            'pre-push.sh',
            vscode.TreeItemCollapsibleState.None,
            'file',
            { id: '6', name: 'pre-push.sh', category: CopilotCategory.Hooks, file: file as any, repo: MOCK_REPO }
        );
        assert.strictEqual((treeItem.iconPath as vscode.ThemeIcon).id, 'zap');
    });

    test('uses git-merge icon for Workflows files', () => {
        const file = createMockGitHubFile();
        const treeItem = new PromptLibraryTreeItem(
            'review.yml',
            vscode.TreeItemCollapsibleState.None,
            'file',
            { id: '7', name: 'review.yml', category: CopilotCategory.Workflows, file: file as any, repo: MOCK_REPO }
        );
        assert.strictEqual((treeItem.iconPath as vscode.ThemeIcon).id, 'git-merge');
    });

    test('uses terminal icon for Scripts files', () => {
        const file = createMockGitHubFile();
        const treeItem = new PromptLibraryTreeItem(
            'setup.sh',
            vscode.TreeItemCollapsibleState.None,
            'file',
            { id: '8', name: 'setup.sh', category: CopilotCategory.Scripts, file: file as any, repo: MOCK_REPO }
        );
        assert.strictEqual((treeItem.iconPath as vscode.ThemeIcon).id, 'terminal');
    });

    test('uses tools icon for Skills files (non-dir items)', () => {
        const file = createMockGitHubFile(); // type: 'file'
        const treeItem = new PromptLibraryTreeItem(
            'readme.md',
            vscode.TreeItemCollapsibleState.None,
            'file',
            { id: '9', name: 'readme.md', category: CopilotCategory.Skills, file: file as any, repo: MOCK_REPO }
        );
        assert.strictEqual((treeItem.iconPath as vscode.ThemeIcon).id, 'tools');
    });

    test('description shows file size in KB for regular files', () => {
        const file = createMockGitHubFile({ size: 2048 }); // 2 KB
        const treeItem = new PromptLibraryTreeItem(
            'big.md',
            vscode.TreeItemCollapsibleState.None,
            'file',
            { id: '20', name: 'big.md', category: CopilotCategory.Instructions, file: file as any, repo: MOCK_REPO }
        );
        assert.ok(
            typeof treeItem.description === 'string' && treeItem.description.includes('KB'),
            `description "${treeItem.description}" must contain KB`
        );
    });
});

suite('PromptLibraryTreeItem — category item', () => {
    test('sets contextValue to "copilotCategory"', () => {
        const treeItem = new PromptLibraryTreeItem(
            'Instructions',
            vscode.TreeItemCollapsibleState.Collapsed,
            'category',
            undefined,
            CopilotCategory.Instructions,
            MOCK_REPO
        );
        assert.strictEqual(treeItem.contextValue, 'copilotCategory');
    });

    test('uses folder icon', () => {
        const treeItem = new PromptLibraryTreeItem(
            'Instructions',
            vscode.TreeItemCollapsibleState.Collapsed,
            'category'
        );
        const icon = treeItem.iconPath as vscode.ThemeIcon;
        assert.strictEqual(icon.id, 'folder');
    });
});

suite('PromptLibraryTreeItem — repo item', () => {
    test('sets contextValue to "copilotRepo"', () => {
        const treeItem = new PromptLibraryTreeItem(
            'Test Repo',
            vscode.TreeItemCollapsibleState.Expanded,
            'repo',
            undefined,
            undefined,
            MOCK_REPO
        );
        assert.strictEqual(treeItem.contextValue, 'copilotRepo');
    });

    test('sets description to "owner/repo"', () => {
        const treeItem = new PromptLibraryTreeItem(
            'Test Repo',
            vscode.TreeItemCollapsibleState.Expanded,
            'repo',
            undefined,
            undefined,
            MOCK_REPO
        );
        assert.strictEqual(treeItem.description, `${MOCK_REPO.owner}/${MOCK_REPO.repo}`);
    });

    test('uses repo icon', () => {
        const treeItem = new PromptLibraryTreeItem(
            'Test Repo',
            vscode.TreeItemCollapsibleState.Expanded,
            'repo',
            undefined,
            undefined,
            MOCK_REPO
        );
        assert.strictEqual((treeItem.iconPath as vscode.ThemeIcon).id, 'repo');
    });
});

suite('PromptLibraryProvider — getTreeItem()', () => {
    test('returns the element unchanged', () => {
        const ctx = createMockExtensionContext();
        const service = new GitHubService();
        const provider = new PromptLibraryProvider(service, ctx);

        const item = new PromptLibraryTreeItem(
            'Label',
            vscode.TreeItemCollapsibleState.None,
            'category'
        );
        assert.strictEqual(provider.getTreeItem(item), item);
    });
});

suite('PromptLibraryProvider — getChildren() root level', () => {
    let provider: PromptLibraryProvider;
    let ctx: vscode.ExtensionContext;

    setup(() => {
        ctx = createMockExtensionContext();
        const service = new GitHubService();
        provider = new PromptLibraryProvider(service, ctx);
    });

    test('returns an array of repo items when called with no element', async () => {
        const children = await provider.getChildren();
        assert.ok(Array.isArray(children));
        assert.ok(children.length > 0, 'Root must have at least one repository');
        for (const child of children) {
            assert.strictEqual(child.itemType, 'repo',
                'Root-level children must all be repo items');
        }
    });
});

suite('PromptLibraryProvider — getChildren() repo level', () => {
    let provider: PromptLibraryProvider;
    let ctx: vscode.ExtensionContext;

    setup(() => {
        ctx = createMockExtensionContext();
        const service = new GitHubService();
        provider = new PromptLibraryProvider(service, ctx);
    });

    test('returns exactly one category item per CopilotCategory', async () => {
        const repoItem = new PromptLibraryTreeItem(
            MOCK_REPO.label!,
            vscode.TreeItemCollapsibleState.Expanded,
            'repo',
            undefined,
            undefined,
            MOCK_REPO
        );

        const children = await provider.getChildren(repoItem);
        const expectedCount = Object.keys(CopilotCategory).length;
        assert.strictEqual(children.length, expectedCount,
            `Should return one category per CopilotCategory (${expectedCount})`);
    });

    test('category item labels match CATEGORY_LABELS', async () => {
        const repoItem = new PromptLibraryTreeItem(
            MOCK_REPO.label!,
            vscode.TreeItemCollapsibleState.Expanded,
            'repo',
            undefined,
            undefined,
            MOCK_REPO
        );

        const children = await provider.getChildren(repoItem);
        const childLabels = children.map(c => c.label as string);

        for (const label of Object.values(CATEGORY_LABELS)) {
            assert.ok(childLabels.includes(label),
                `Category label "${label}" must appear in repo children`);
        }
    });

    test('all category children have itemType "category"', async () => {
        const repoItem = new PromptLibraryTreeItem(
            MOCK_REPO.label!,
            vscode.TreeItemCollapsibleState.Expanded,
            'repo',
            undefined,
            undefined,
            MOCK_REPO
        );

        const children = await provider.getChildren(repoItem);
        for (const child of children) {
            assert.strictEqual(child.itemType, 'category');
        }
    });
});

suite('PromptLibraryProvider — getChildren() category level', () => {
    let provider: PromptLibraryProvider;
    let ctx: vscode.ExtensionContext;
    let stub: sinon.SinonStub;

    setup(() => {
        ctx = createMockExtensionContext();
        const service = new GitHubService();
        stub = sinon.stub(service, 'getFilesByRepo').resolves([
            { ...createMockGitHubFile(), type: 'file', repo: MOCK_REPO } as any,
            { ...createMockGitHubFile({ name: 'second.md' }), type: 'file', repo: MOCK_REPO } as any,
        ]);
        provider = new PromptLibraryProvider(service, ctx);
    });

    teardown(() => sinon.restore());

    test('returns file items fetched from GitHubService', async () => {
        const categoryItem = new PromptLibraryTreeItem(
            'Instructions',
            vscode.TreeItemCollapsibleState.Collapsed,
            'category',
            undefined,
            CopilotCategory.Instructions,
            MOCK_REPO
        );

        const children = await provider.getChildren(categoryItem);
        assert.ok(children.length > 0, 'Category must return file items');
        for (const child of children) {
            assert.strictEqual(child.itemType, 'file');
        }
    });

    test('calls getFilesByRepo with the correct repo and category', async () => {
        const categoryItem = new PromptLibraryTreeItem(
            'Instructions',
            vscode.TreeItemCollapsibleState.Collapsed,
            'category',
            undefined,
            CopilotCategory.Instructions,
            MOCK_REPO
        );

        await provider.getChildren(categoryItem);

        assert.ok(stub.calledOnce, 'getFilesByRepo must be called once');
        const [repoArg, catArg] = stub.firstCall.args;
        assert.deepStrictEqual(repoArg, MOCK_REPO);
        assert.strictEqual(catArg, CopilotCategory.Instructions);
    });
});
