/**
 * Tests for src/types.ts
 *
 * Validates that enum values, category labels, folder paths, and the
 * CATEGORY_SHOWS_DIRS set are stable and well-formed.
 *
 * These tests catch accidental typos in enum values that the GitHub API
 * depends on, and drift between the three parallel Record<CopilotCategory, …>
 * tables.
 */
import * as assert from 'assert';
import { CopilotCategory, CATEGORY_LABELS, CATEGORY_SHOWS_DIRS, FOLDER_PATHS } from '../../types';

// Derived at test runtime so the list stays in sync with the enum automatically.
const ALL_CATEGORIES: CopilotCategory[] = Object.values(CopilotCategory);

suite('CopilotCategory enum', () => {
    test('Instructions value is "instructions"', () => {
        assert.strictEqual(CopilotCategory.Instructions, 'instructions');
    });

    test('Agents value is "agents"', () => {
        assert.strictEqual(CopilotCategory.Agents, 'agents');
    });

    test('Hooks value is "hooks"', () => {
        assert.strictEqual(CopilotCategory.Hooks, 'hooks');
    });

    test('Workflows value is "workflows"', () => {
        assert.strictEqual(CopilotCategory.Workflows, 'workflows');
    });

    test('Plugins value is "plugins"', () => {
        assert.strictEqual(CopilotCategory.Plugins, 'plugins');
    });

    test('Scripts value is "scripts"', () => {
        assert.strictEqual(CopilotCategory.Scripts, 'scripts');
    });

    test('Skills value is "skills"', () => {
        assert.strictEqual(CopilotCategory.Skills, 'skills');
    });

    test('all values are lowercase (used as URL path segments)', () => {
        for (const cat of ALL_CATEGORIES) {
            assert.strictEqual(
                cat, cat.toLowerCase(),
                `Category "${cat}" must be lowercase — it is used as a GitHub API path segment`
            );
        }
    });

    test('no value contains spaces or special characters', () => {
        for (const cat of ALL_CATEGORIES) {
            assert.match(cat, /^[a-z]+$/, `Category "${cat}" must contain only lowercase letters`);
        }
    });

    test('has exactly 7 categories (Instructions, Agents, Hooks, Workflows, Plugins, Scripts, Skills)', () => {
        assert.strictEqual(ALL_CATEGORIES.length, 7);
    });
});

suite('CATEGORY_LABELS', () => {
    test('has an entry for every CopilotCategory value', () => {
        for (const cat of ALL_CATEGORIES) {
            assert.ok(
                cat in CATEGORY_LABELS,
                `CATEGORY_LABELS is missing entry for "${cat}"`
            );
        }
    });

    test('all labels are non-empty strings', () => {
        for (const cat of ALL_CATEGORIES) {
            const label = CATEGORY_LABELS[cat];
            assert.ok(typeof label === 'string' && label.length > 0,
                `Label for "${cat}" must be a non-empty string`);
        }
    });

    test('has no extra keys beyond the defined categories', () => {
        const defined = new Set<string>(ALL_CATEGORIES);
        for (const key of Object.keys(CATEGORY_LABELS)) {
            assert.ok(defined.has(key as CopilotCategory),
                `CATEGORY_LABELS has unexpected key "${key}"`);
        }
    });
});

suite('FOLDER_PATHS', () => {
    test('has an entry for every CopilotCategory value', () => {
        for (const cat of ALL_CATEGORIES) {
            assert.ok(
                cat in FOLDER_PATHS,
                `FOLDER_PATHS is missing entry for "${cat}"`
            );
        }
    });

    test('all paths are top-level directory names (no leading ".github/")', () => {
        for (const cat of ALL_CATEGORIES) {
            const folderPath = FOLDER_PATHS[cat];
            assert.ok(
                !folderPath.startsWith('.github/'),
                `Folder path for "${cat}" must not start with ".github/" — upstream now uses top-level dirs, got "${folderPath}"`
            );
        }
    });

    test('all paths match the category enum value (path === category)', () => {
        for (const cat of ALL_CATEGORIES) {
            assert.strictEqual(
                FOLDER_PATHS[cat], cat,
                `FOLDER_PATHS["${cat}"] should equal "${cat}" to mirror the upstream directory name`
            );
        }
    });

    test('all paths are non-empty strings with no spaces', () => {
        for (const cat of ALL_CATEGORIES) {
            const folderPath = FOLDER_PATHS[cat];
            assert.ok(typeof folderPath === 'string' && folderPath.length > 0);
            assert.doesNotMatch(folderPath, /\s/,
                `Folder path for "${cat}" must not contain spaces`);
        }
    });

    test('all paths are unique', () => {
        const paths = ALL_CATEGORIES.map(c => FOLDER_PATHS[c]);
        const unique = new Set(paths);
        assert.strictEqual(unique.size, paths.length,
            'Each category must have a unique folder path');
    });

    test('has no extra keys beyond the defined categories', () => {
        const defined = new Set<string>(ALL_CATEGORIES);
        for (const key of Object.keys(FOLDER_PATHS)) {
            assert.ok(defined.has(key as CopilotCategory),
                `FOLDER_PATHS has unexpected key "${key}"`);
        }
    });
});

suite('CATEGORY_SHOWS_DIRS', () => {
    test('is a Set', () => {
        assert.ok(CATEGORY_SHOWS_DIRS instanceof Set);
    });

    test('Skills is in the set (directory-based bundles)', () => {
        assert.ok(CATEGORY_SHOWS_DIRS.has(CopilotCategory.Skills));
    });

    test('Plugins is in the set (directory-based bundles)', () => {
        assert.ok(CATEGORY_SHOWS_DIRS.has(CopilotCategory.Plugins));
    });

    test('Instructions is NOT in the set (file-based)', () => {
        assert.ok(!CATEGORY_SHOWS_DIRS.has(CopilotCategory.Instructions));
    });

    test('Agents is NOT in the set (file-based)', () => {
        assert.ok(!CATEGORY_SHOWS_DIRS.has(CopilotCategory.Agents));
    });

    test('Hooks is NOT in the set (file-based)', () => {
        assert.ok(!CATEGORY_SHOWS_DIRS.has(CopilotCategory.Hooks));
    });

    test('Workflows is NOT in the set (file-based)', () => {
        assert.ok(!CATEGORY_SHOWS_DIRS.has(CopilotCategory.Workflows));
    });

    test('Scripts is NOT in the set (file-based)', () => {
        assert.ok(!CATEGORY_SHOWS_DIRS.has(CopilotCategory.Scripts));
    });

    test('every entry in the set is a valid CopilotCategory', () => {
        const valid = new Set<string>(ALL_CATEGORIES);
        for (const entry of CATEGORY_SHOWS_DIRS) {
            assert.ok(valid.has(entry),
                `CATEGORY_SHOWS_DIRS contains unknown value "${entry}"`);
        }
    });
});
