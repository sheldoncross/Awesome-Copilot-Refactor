/**
 * Central branding and identifier constants — single source of truth.
 *
 * To rebrand this extension:
 *   1. Update the values in this file.
 *   2. Update the matching values in package.json (the manifest cannot import TypeScript).
 *      Inline comments note each corresponding package.json counterpart.
 */

/** kebab-case extension ID. Matches: package.json `name`, config section, and command prefix. */
export const EXT_ID = 'prompt-library';

/** Human-readable display name shown in the VS Code UI and log output. Matches: package.json `displayName`. */
export const EXT_DISPLAY_NAME = 'Prompt Library';

/** Activity bar view container ID (camelCase). Matches: package.json `viewsContainers.activitybar[].id`. */
export const VIEW_CONTAINER_ID = 'promptLibrary';

/** Tree explorer view ID. Matches: package.json `views.explorer[].id` and activation event. */
export const EXPLORER_VIEW_ID = 'promptLibraryExplorer';

/** HTTP User-Agent header sent with all GitHub API requests. */
export const HTTP_USER_AGENT = 'VSCode-PromptLibrary-Extension';

/** VS Code global state key for persisted repository sources. */
export const STORAGE_SOURCES_KEY = 'promptLibrary.sources';

/** VS Code workspace state key for persisted download records. */
export const STORAGE_DOWNLOADS_KEY = 'promptLibrary.downloads';

/**
 * Full dotted configuration key for the repositories list.
 * Used when calling `vscode.workspace.getConfiguration()` without a section prefix.
 * Matches: package.json `contributes.configuration.properties["prompt-library.repositories"]`.
 */
export const CFG_REPOSITORIES = `${EXT_ID}.repositories`;

// ─── Command identifiers ──────────────────────────────────────────────────────
// Each value must match the corresponding `command` entry in package.json.

export const CMD_REFRESH           = `${EXT_ID}.refresh`;
export const CMD_DOWNLOAD_ITEM     = `${EXT_ID}.downloadItem`;
export const CMD_PREVIEW_ITEM      = `${EXT_ID}.previewItem`;
export const CMD_MANAGE_SOURCES    = `${EXT_ID}.manageSources`;
export const CMD_REMOVE_REPO       = `${EXT_ID}.removeRepo`;
export const CMD_REFRESH_REPO      = `${EXT_ID}.refreshRepo`;
export const CMD_CONFIGURE_TOKEN   = `${EXT_ID}.configureEnterpriseToken`;
export const CMD_CLEAR_TOKEN       = `${EXT_ID}.clearEnterpriseToken`;
export const CMD_TOGGLE_TREE       = `${EXT_ID}.toggleTreeView`;
export const CMD_SHOW_TREE         = `${EXT_ID}.showTreeView`;
export const CMD_HIDE_TREE         = `${EXT_ID}.hideTreeView`;
export const CMD_SIGN_IN_GITHUB    = `${EXT_ID}.signInToGitHub`;
export const CMD_SIGN_OUT_GITHUB   = `${EXT_ID}.signOutFromGitHub`;
export const CMD_OPEN_REPO_BROWSER = `${EXT_ID}.openRepoInBrowser`;
