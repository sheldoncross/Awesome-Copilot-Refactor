import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    files: 'out/test/**/*.test.js',
    mocha: {
        ui: 'tdd',           // matches suite()/test() style used in all test files
        timeout: 10000,      // 10 s — generous for async VS Code API calls
        color: true,
        reporter: 'spec',    // verbose per-test output; switch to 'min' for CI
    },
    // A real (empty) workspace gives tests access to vscode.workspace.workspaceFolders
    workspaceFolder: './test-fixtures/workspace',
});
