/**
 * Integration tests — constants.ts vs. package.json consistency
 *
 * These tests are the guardrail for future maintainers: they verify that
 * the compile-time constants in constants.ts exactly match the runtime
 * declarations in package.json.  A failure here means one of the two
 * files was updated without updating the other.
 *
 * No VS Code extension activation is required — these are structural checks.
 */
import * as assert from 'assert';
import * as path from 'path';
import {
    EXT_ID,
    EXPLORER_VIEW_ID,
    VIEW_CONTAINER_ID,
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
    CFG_REPOSITORIES,
} from '../../constants';

// Load package.json from the repo root at test runtime.
// __dirname is out/test/suite at runtime; three levels up is the repo root.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PKG = require(path.join(__dirname, '..', '..', '..', 'package.json')) as {
    name: string;
    displayName: string;
    activationEvents: string[];
    contributes: {
        viewsContainers: { activitybar: Array<{ id: string; title: string }> };
        views: { explorer: Array<{ id: string; name: string }> };
        commands: Array<{ command: string; title: string }>;
        configuration: { properties: Record<string, unknown> };
        viewsWelcome: Array<{ view: string; when: string }>;
        menus: Record<string, Array<{ command?: string; when?: string }>>;
    };
};

const PKG_COMMANDS = new Set(PKG.contributes.commands.map((c) => c.command));
const PKG_CONFIG_KEYS = new Set(Object.keys(PKG.contributes.configuration.properties));

const ALL_CMD_CONSTANTS = [
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

suite('Integration — package.json ↔ constants.ts consistency', () => {

    // ── Extension identity ────────────────────────────────────────────────

    test('EXT_ID matches package.json "name"', () => {
        assert.strictEqual(EXT_ID, PKG.name,
            `EXT_ID="${EXT_ID}" must equal package.json name="${PKG.name}"`);
    });

    // ── Activation ───────────────────────────────────────────────────────

    test('EXPLORER_VIEW_ID matches the onView activation event', () => {
        const expected = `onView:${EXPLORER_VIEW_ID}`;
        assert.ok(
            PKG.activationEvents.includes(expected),
            `package.json activationEvents must include "${expected}"\nActual: ${JSON.stringify(PKG.activationEvents)}`
        );
    });

    // ── View container ────────────────────────────────────────────────────

    test('VIEW_CONTAINER_ID matches the activitybar viewsContainer id', () => {
        const ids = PKG.contributes.viewsContainers.activitybar.map((c) => c.id);
        assert.ok(ids.includes(VIEW_CONTAINER_ID),
            `VIEW_CONTAINER_ID="${VIEW_CONTAINER_ID}" not found in activitybar containers: ${ids}`);
    });

    // ── Explorer view ─────────────────────────────────────────────────────

    test('EXPLORER_VIEW_ID matches the explorer view id', () => {
        const ids = PKG.contributes.views.explorer.map((v) => v.id);
        assert.ok(ids.includes(EXPLORER_VIEW_ID),
            `EXPLORER_VIEW_ID="${EXPLORER_VIEW_ID}" not found in explorer views: ${ids}`);
    });

    // ── Commands: constants → package.json ───────────────────────────────

    test('every CMD_* constant has a matching entry in package.json "commands"', () => {
        const missing: string[] = [];
        for (const cmd of ALL_CMD_CONSTANTS) {
            if (!PKG_COMMANDS.has(cmd)) {
                missing.push(cmd);
            }
        }
        assert.strictEqual(missing.length, 0,
            `These CMD_* constants are missing from package.json "commands":\n  ${missing.join('\n  ')}`);
    });

    // ── Commands: package.json → constants ───────────────────────────────

    test('every package.json command that matches EXT_ID has a CMD_* constant', () => {
        const prefix = `${EXT_ID}.`;
        const constantSet = new Set(ALL_CMD_CONSTANTS);
        const orphaned: string[] = [];

        for (const cmd of PKG_COMMANDS) {
            if (cmd.startsWith(prefix) && !constantSet.has(cmd)) {
                orphaned.push(cmd);
            }
        }
        assert.strictEqual(orphaned.length, 0,
            `These package.json commands have no CMD_* constant in constants.ts:\n  ${orphaned.join('\n  ')}`);
    });

    // ── Configuration ─────────────────────────────────────────────────────

    test('CFG_REPOSITORIES key exists in package.json configuration properties', () => {
        assert.ok(
            PKG_CONFIG_KEYS.has(CFG_REPOSITORIES),
            `CFG_REPOSITORIES="${CFG_REPOSITORIES}" not found in package.json configuration properties`
        );
    });

    test('all package.json config keys use EXT_ID as the section prefix', () => {
        const prefix = `${EXT_ID}.`;
        const badKeys: string[] = [];
        for (const key of PKG_CONFIG_KEYS) {
            if (!key.startsWith(prefix)) {
                badKeys.push(key);
            }
        }
        assert.strictEqual(badKeys.length, 0,
            `These config keys do not use EXT_ID prefix "${prefix}":\n  ${badKeys.join('\n  ')}`);
    });

    // ── Menu when-clauses ─────────────────────────────────────────────────

    test('all view/title menu when-clauses reference EXPLORER_VIEW_ID', () => {
        for (const entry of PKG.contributes.menus['view/title'] ?? []) {
            if (entry.when) {
                assert.ok(
                    entry.when.includes(EXPLORER_VIEW_ID),
                    `Menu when-clause "${entry.when}" must reference EXPLORER_VIEW_ID="${EXPLORER_VIEW_ID}"`
                );
            }
        }
    });

    test('all view/item/context menu when-clauses reference EXPLORER_VIEW_ID', () => {
        for (const entry of PKG.contributes.menus['view/item/context'] ?? []) {
            if (entry.when) {
                assert.ok(
                    entry.when.includes(EXPLORER_VIEW_ID),
                    `Menu when-clause "${entry.when}" must reference EXPLORER_VIEW_ID="${EXPLORER_VIEW_ID}"`
                );
            }
        }
    });

    // ── viewsWelcome ──────────────────────────────────────────────────────

    test('viewsWelcome entries reference EXPLORER_VIEW_ID', () => {
        for (const entry of PKG.contributes.viewsWelcome ?? []) {
            assert.strictEqual(entry.view, EXPLORER_VIEW_ID,
                `viewsWelcome entry targets view "${entry.view}" but EXPLORER_VIEW_ID is "${EXPLORER_VIEW_ID}"`);
        }
    });

    test('viewsWelcome when-clause references EXT_ID config section', () => {
        for (const entry of PKG.contributes.viewsWelcome ?? []) {
            assert.ok(
                entry.when.startsWith(`config.${EXT_ID}.`),
                `viewsWelcome when="${entry.when}" must start with "config.${EXT_ID}."`
            );
        }
    });
});
