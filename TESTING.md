# Testing Guide

This document covers the test strategy, structure, and developer workflow for the Prompt Library extension.

## Quick Start

```bash
# Install dependencies
npm install

# Compile and run all tests (headless VS Code)
npm test

# Compile only (no test run)
npm run compile-tests
```

## Test Stack

| Tool | Purpose |
|------|---------|
| [`@vscode/test-cli`](https://github.com/microsoft/vscode-test-cli) | Test runner — orchestrates headless VS Code |
| [`@vscode/test-electron`](https://github.com/microsoft/vscode-test-electron) | Downloads and manages the VS Code test binary |
| [Mocha](https://mochajs.org/) | Test framework (TDD `suite`/`test` API) |
| [Sinon](https://sinonjs.org/) | Stubs and spies — isolates network calls |
| Node `assert` | Built-in assertion library |

Tests run inside a real (headless) VS Code extension host. This means `vscode.*` APIs are fully available without mocking the VS Code module itself.

## Running Tests

### All tests

```bash
npm test
```

`pretest` automatically compiles TypeScript and runs lint before the test run.

### Watch mode (continuous recompile)

```bash
npm run watch-tests   # recompile on save — tests re-run manually
```

### Specific suite (Mocha grep)

Mocha's `--grep` flag filters by test/suite name substring:

```bash
# Run only the constants suite
npx vscode-test --mocha-opts '--grep "Constants"'

# Run only download-related tests
npx vscode-test --mocha-opts '--grep "DownloadTracker"'
```

### Debug in VS Code (F5)

1. Open the Run and Debug panel (`Ctrl+Shift+D` / `Cmd+Shift+D`)
2. Select **"Extension Tests"** from the dropdown
3. Press **F5**

The `compile-tests` pre-launch task runs automatically. Breakpoints in both test files and source files are hit in the extension host debugger.

## Test Structure

```
src/test/
├── helpers/
│   └── mockContext.ts          # Reusable VS Code API mocks
├── suite/                      # Unit / integration suites
│   ├── constants.test.ts       # src/constants.ts contract
│   ├── types.test.ts           # CopilotCategory enum, CATEGORY_LABELS, FOLDER_PATHS
│   ├── downloadTracker.test.ts # DownloadTracker business logic
│   ├── repoStorage.test.ts     # RepoStorage source priority logic
│   ├── githubService.test.ts   # GitHubService (all network calls stubbed)
│   ├── treeProvider.test.ts    # PromptLibraryProvider / PromptLibraryTreeItem
│   └── integration.test.ts    # constants.ts ↔ package.json consistency
└── extension.test.ts           # Smoke tests — basic instantiation
```

### Smoke tests (`extension.test.ts`)

Verify that the extension host is correctly wired:

- VS Code API (`vscode.version`, `vscode.window`, `vscode.commands`) is reachable
- `GitHubService` and `PromptLibraryProvider` can be constructed without error
- Mock `ExtensionContext` `globalState` / `workspaceState` round-trips work

### Unit suites (`suite/`)

Each suite targets a single source module and does **not** make live network calls.

| Suite | What it tests |
|-------|--------------|
| `constants` | Shape/format invariants: kebab-case IDs, camelCase view IDs, uniqueness of all `CMD_*` values |
| `types` | `CopilotCategory` enum values, `CATEGORY_LABELS` coverage, `FOLDER_PATHS` all start with `.github/` |
| `downloadTracker` | `isDownloaded`, `recordDownload`, `hasUpdate` (SHA + size fallback), `findItemsWithUpdates`, `removeDownload`, `clearAllDownloads` |
| `repoStorage` | Default source fallback, `getSources`/`setSources` round-trip via mock `globalState` |
| `githubService` | URL construction (public GitHub vs Enterprise), caching behaviour, `forceRefresh`, per-category isolation, HTTP 404 → `[]`, HTTP 500 → throw |
| `treeProvider` | `PromptLibraryTreeItem` `contextValue` and icons; `getChildren` at root / repo / category levels |
| `integration` | Runtime check that `constants.ts` values match `package.json`: `EXT_ID === pkg.name`, every `CMD_*` appears in `contributes.commands`, config keys use correct namespace, `viewsWelcome` targets correct view ID |

### Integration tests (`suite/integration.test.ts`)

These tests load `package.json` at runtime via `require()` and cross-reference it against the TypeScript constants. They act as a **drift detector**: if someone updates `package.json` without updating `constants.ts` (or vice versa), these tests fail loudly.

## Test Helpers

### `createMockExtensionContext()`

Returns a minimal `vscode.ExtensionContext` with in-memory `globalState` and `workspaceState` (`Memento` backed by `Map<string, unknown>`).

```typescript
import { createMockExtensionContext } from '../helpers/mockContext';

const ctx = createMockExtensionContext();
await ctx.globalState.update('my-key', { value: 1 });
assert.deepStrictEqual(ctx.globalState.get('my-key'), { value: 1 });
```

### `createMockMemento()`

Returns a standalone `vscode.Memento` — useful when you only need state storage without a full context.

### `createMockGitHubFile(overrides?)`

Returns a minimal GitHub Contents API file object. Pass `overrides` to customise individual fields:

```typescript
const f = createMockGitHubFile({ name: 'custom.md', sha: 'deadbeef' });
```

### Sinon stubs (network isolation)

`GitHubService` uses `axios.get` directly. Stub it at the module level in `setup`/`teardown`:

```typescript
import * as sinon from 'sinon';
import axios from 'axios';

let stub: sinon.SinonStub;

setup(() => {
    stub = sinon.stub(axios, 'get').resolves({ data: [] });
});

teardown(() => {
    sinon.restore();
});
```

To simulate an axios error (e.g. HTTP 404), attach a `.response` object so `axios.isAxiosError` recognises it:

```typescript
stub.rejects(
    Object.assign(new Error('Not Found'), {
        response: { status: 404, data: 'Not Found' },
        isAxiosError: true,
    })
);
```

## Writing New Tests

1. Create `src/test/suite/myModule.test.ts`
2. Use the TDD interface (`suite` / `test`) — the Mocha config sets `ui: 'tdd'`
3. Import helpers from `../helpers/mockContext` as needed
4. Stub any `axios.get` calls with Sinon; always call `sinon.restore()` in `teardown`
5. Run `npm run compile-tests && npm test` to verify

No configuration changes are needed — `.vscode-test.mjs` globs `out/test/**/*.test.js` automatically.

## CI

The `pretest` script (`compile-tests` → `compile` → `lint`) runs before every `npm test` invocation. In CI the same command is used:

```yaml
- run: npm test
```

The `workspaceFolder: './test-fixtures/workspace'` setting in `.vscode-test.mjs` provides a real (empty) workspace folder so tests that access `vscode.workspace.workspaceFolders` behave consistently.

To switch to minimal CI output, change `reporter: 'spec'` to `reporter: 'min'` in `.vscode-test.mjs`.
