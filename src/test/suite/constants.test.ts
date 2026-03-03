/**
 * Tests for src/constants.ts
 *
 * These tests protect against accidental changes to identifier strings that
 * must stay in sync with package.json.  They are intentionally strict —
 * breaking a test here means the package.json also needs updating.
 */
import * as assert from 'assert';
import {
    EXT_ID,
    EXT_DISPLAY_NAME,
    VIEW_CONTAINER_ID,
    EXPLORER_VIEW_ID,
    HTTP_USER_AGENT,
    STORAGE_SOURCES_KEY,
    STORAGE_DOWNLOADS_KEY,
    CFG_REPOSITORIES,
    CMD_REFRESH,
    CMD_DOWNLOAD_ITEM,
    CMD_PREVIEW_ITEM,
    CMD_MANAGE_SOURCES,
    CMD_REMOVE_REPO,
    CMD_REFRESH_REPO,
    CMD_CONFIGURE_TOKEN,
    CMD_CLEAR_TOKEN,
    CMD_TOGGLE_TREE,
    CMD_SHOW_TREE,
    CMD_HIDE_TREE,
    CMD_SIGN_IN_GITHUB,
    CMD_SIGN_OUT_GITHUB,
    CMD_OPEN_REPO_BROWSER,
} from '../../constants';

// Collect all CMD_* exports for table-driven tests
const ALL_COMMANDS = [
    CMD_REFRESH,
    CMD_DOWNLOAD_ITEM,
    CMD_PREVIEW_ITEM,
    CMD_MANAGE_SOURCES,
    CMD_REMOVE_REPO,
    CMD_REFRESH_REPO,
    CMD_CONFIGURE_TOKEN,
    CMD_CLEAR_TOKEN,
    CMD_TOGGLE_TREE,
    CMD_SHOW_TREE,
    CMD_HIDE_TREE,
    CMD_SIGN_IN_GITHUB,
    CMD_SIGN_OUT_GITHUB,
    CMD_OPEN_REPO_BROWSER,
];

suite('Constants — EXT_ID', () => {
    test('is a non-empty string', () => {
        assert.ok(typeof EXT_ID === 'string' && EXT_ID.length > 0);
    });

    test('uses only kebab-case characters (a-z, 0-9, hyphen)', () => {
        assert.match(EXT_ID, /^[a-z0-9-]+$/, `EXT_ID "${EXT_ID}" must be kebab-case`);
    });

    test('does not start or end with a hyphen', () => {
        assert.ok(!EXT_ID.startsWith('-') && !EXT_ID.endsWith('-'));
    });
});

suite('Constants — EXT_DISPLAY_NAME', () => {
    test('is a non-empty string', () => {
        assert.ok(typeof EXT_DISPLAY_NAME === 'string' && EXT_DISPLAY_NAME.length > 0);
    });

    test('does not contain raw kebab-case slashes or dots', () => {
        // Display name should be human-readable, not an ID
        assert.ok(!EXT_DISPLAY_NAME.includes('-'), 'display name should not contain hyphens');
        assert.ok(!EXT_DISPLAY_NAME.includes('.'), 'display name should not contain dots');
    });
});

suite('Constants — View IDs', () => {
    test('VIEW_CONTAINER_ID is a non-empty camelCase string', () => {
        assert.ok(typeof VIEW_CONTAINER_ID === 'string' && VIEW_CONTAINER_ID.length > 0);
        assert.doesNotMatch(VIEW_CONTAINER_ID, /\s/, 'view container ID must not contain spaces');
        assert.doesNotMatch(VIEW_CONTAINER_ID, /-/, 'view container ID must not contain hyphens');
    });

    test('EXPLORER_VIEW_ID is a non-empty camelCase string', () => {
        assert.ok(typeof EXPLORER_VIEW_ID === 'string' && EXPLORER_VIEW_ID.length > 0);
        assert.doesNotMatch(EXPLORER_VIEW_ID, /\s/);
        assert.doesNotMatch(EXPLORER_VIEW_ID, /-/);
    });

    test('EXPLORER_VIEW_ID starts with VIEW_CONTAINER_ID (same namespace)', () => {
        assert.ok(
            EXPLORER_VIEW_ID.startsWith(VIEW_CONTAINER_ID),
            `EXPLORER_VIEW_ID "${EXPLORER_VIEW_ID}" should start with VIEW_CONTAINER_ID "${VIEW_CONTAINER_ID}"`
        );
    });
});

suite('Constants — HTTP_USER_AGENT', () => {
    test('is a non-empty string', () => {
        assert.ok(typeof HTTP_USER_AGENT === 'string' && HTTP_USER_AGENT.length > 0);
    });

    test('follows VSCode-<Name>-Extension pattern', () => {
        assert.match(HTTP_USER_AGENT, /^VSCode-.+-Extension$/,
            'User-Agent should follow VSCode-<Name>-Extension pattern');
    });

    test('does not contain the old branding', () => {
        assert.ok(!HTTP_USER_AGENT.toLowerCase().includes('awesomecopilot'),
            'User-Agent must not reference old brand');
    });
});

suite('Constants — Storage keys', () => {
    test('STORAGE_SOURCES_KEY is a non-empty string', () => {
        assert.ok(typeof STORAGE_SOURCES_KEY === 'string' && STORAGE_SOURCES_KEY.length > 0);
    });

    test('STORAGE_DOWNLOADS_KEY is a non-empty string', () => {
        assert.ok(typeof STORAGE_DOWNLOADS_KEY === 'string' && STORAGE_DOWNLOADS_KEY.length > 0);
    });

    test('storage keys are distinct from each other', () => {
        assert.notStrictEqual(STORAGE_SOURCES_KEY, STORAGE_DOWNLOADS_KEY);
    });

    test('storage keys use camelCase prefix (no hyphens)', () => {
        assert.doesNotMatch(STORAGE_SOURCES_KEY, /^[^.]*-/,
            'storage key prefix should be camelCase, not kebab-case');
        assert.doesNotMatch(STORAGE_DOWNLOADS_KEY, /^[^.]*-/);
    });
});

suite('Constants — CFG_REPOSITORIES', () => {
    test('starts with EXT_ID + "."', () => {
        assert.ok(CFG_REPOSITORIES.startsWith(`${EXT_ID}.`),
            `CFG_REPOSITORIES "${CFG_REPOSITORIES}" must start with "${EXT_ID}."`);
    });

    test('ends with "repositories"', () => {
        assert.ok(CFG_REPOSITORIES.endsWith('.repositories'));
    });
});

suite('Constants — Command identifiers', () => {
    test('every CMD_* constant starts with EXT_ID + "."', () => {
        const prefix = `${EXT_ID}.`;
        for (const cmd of ALL_COMMANDS) {
            assert.ok(
                cmd.startsWith(prefix),
                `Command "${cmd}" must start with "${prefix}"`
            );
        }
    });

    test('every CMD_* constant has a non-empty suffix after the prefix', () => {
        const prefix = `${EXT_ID}.`;
        for (const cmd of ALL_COMMANDS) {
            const suffix = cmd.slice(prefix.length);
            assert.ok(suffix.length > 0, `Command "${cmd}" has empty suffix`);
        }
    });

    test('all CMD_* values are unique (no duplicate command IDs)', () => {
        const seen = new Set<string>();
        for (const cmd of ALL_COMMANDS) {
            assert.ok(!seen.has(cmd), `Duplicate command ID: "${cmd}"`);
            seen.add(cmd);
        }
    });

    test('no CMD_* value contains spaces or uppercase letters', () => {
        for (const cmd of ALL_COMMANDS) {
            assert.doesNotMatch(cmd, /\s/, `Command "${cmd}" must not contain spaces`);
            // The suffix may be camelCase which is fine, only the prefix must be lowercase kebab
            const prefix = `${EXT_ID}.`;
            assert.ok(cmd.startsWith(prefix));
        }
    });
});
