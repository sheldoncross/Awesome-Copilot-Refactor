/**
 * Tests for src/types.ts
 *
 * Validates that enum values, category labels, and folder paths are
 * stable and well-formed. These tests catch accidental typos in the
 * enum values that the GitHub API depends on.
 */
import * as assert from 'assert';
import { CopilotCategory, CATEGORY_LABELS, FOLDER_PATHS } from '../../types';

const ALL_CATEGORIES: CopilotCategory[] = [
    CopilotCategory.ChatModes,
    CopilotCategory.Instructions,
    CopilotCategory.Prompts,
    CopilotCategory.Agents,
    CopilotCategory.Skills,
];

suite('CopilotCategory enum', () => {
    test('ChatModes value is "chatmodes"', () => {
        assert.strictEqual(CopilotCategory.ChatModes, 'chatmodes');
    });

    test('Instructions value is "instructions"', () => {
        assert.strictEqual(CopilotCategory.Instructions, 'instructions');
    });

    test('Prompts value is "prompts"', () => {
        assert.strictEqual(CopilotCategory.Prompts, 'prompts');
    });

    test('Agents value is "agents"', () => {
        assert.strictEqual(CopilotCategory.Agents, 'agents');
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

    test('all paths start with ".github/"', () => {
        for (const cat of ALL_CATEGORIES) {
            const folderPath = FOLDER_PATHS[cat];
            assert.ok(
                folderPath.startsWith('.github/'),
                `Folder path for "${cat}" must start with ".github/" but got "${folderPath}"`
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
