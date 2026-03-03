/**
 * Types and interfaces for the Prompt Library extension
 */


// Represents a file in a GitHub repo
export interface GitHubFile {
    name: string;
    path: string;
    download_url: string;
    size: number;
    type: 'file' | 'dir';
    sha?: string; // Git SHA hash from GitHub API
    repo?: RepoSource; // Optional: which repo this file comes from
    displayName?: string; // For handling duplicate filenames across repos
}


// Represents a GitHub repo source
export interface RepoSource {
    owner: string;
    repo: string;
    label?: string;
    baseUrl?: string; // For GitHub Enterprise: https://github.wdf.sap.corp
}

export interface CopilotItem {
    id: string;
    name: string;
    category: CopilotCategory;
    file: GitHubFile;
    content?: string;
    repo: RepoSource;
}

/**
 * Categories reflecting the upstream repository's top-level directory structure.
 * Each value is used verbatim as the GitHub API path segment when fetching content.
 * See: https://github.com/github/awesome-copilot
 */
export enum CopilotCategory {
    Instructions = 'instructions', // Coding standards and best practices
    Agents       = 'agents',       // AI personas and specializations
    Hooks        = 'hooks',        // Automated hooks for Copilot
    Workflows    = 'workflows',    // Agentic workflows for Git/GitHub
    Plugins      = 'plugins',      // Installable plugins bundled as directories
    Scripts      = 'scripts',      // Utility scripts for maintenance
    Skills       = 'skills',       // AI capabilities (directory-based bundles)
}


// Cache per repo+category
export interface CacheEntry {
    data: GitHubFile[];
    timestamp: number;
    category: CopilotCategory;
    repo: RepoSource;
}

export const CATEGORY_LABELS: Record<CopilotCategory, string> = {
    [CopilotCategory.Instructions]: 'Instructions',
    [CopilotCategory.Agents]:       'Agents',
    [CopilotCategory.Hooks]:        'Hooks',
    [CopilotCategory.Workflows]:    'Workflows',
    [CopilotCategory.Plugins]:      'Plugins',
    [CopilotCategory.Scripts]:      'Scripts',
    [CopilotCategory.Skills]:       'Skills',
};

/**
 * Local download destination for each category, relative to the workspace root.
 * Mirrors the upstream repository's top-level directory layout.
 */
export const FOLDER_PATHS: Record<CopilotCategory, string> = {
    [CopilotCategory.Instructions]: 'instructions',
    [CopilotCategory.Agents]:       'agents',
    [CopilotCategory.Hooks]:        'hooks',
    [CopilotCategory.Workflows]:    'workflows',
    [CopilotCategory.Plugins]:      'plugins',
    [CopilotCategory.Scripts]:      'scripts',
    [CopilotCategory.Skills]:       'skills',
};

/**
 * Categories whose GitHub API response contains directory entries rather than files.
 * Used by both GitHubService (to filter API results) and treeProvider (to render icons/descriptions).
 */
export const CATEGORY_SHOWS_DIRS = new Set<CopilotCategory>([
    CopilotCategory.Plugins,
    CopilotCategory.Skills,
]);
