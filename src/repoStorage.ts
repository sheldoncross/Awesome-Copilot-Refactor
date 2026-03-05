import * as vscode from 'vscode';
import { RepoSource } from './types';
import { getLogger } from './logger';
import { STORAGE_SOURCES_KEY, CFG_REPOSITORIES } from './constants';

const STORAGE_KEY = STORAGE_SOURCES_KEY;
const CONFIG_KEY = CFG_REPOSITORIES;
const DEFAULT_SOURCES: RepoSource[] = [
  { owner: 'github', repo: 'awesome-copilot', label: 'Awesome Copilot' }
];

export class RepoStorage {
  /**
   * Get repository sources from VS Code settings first, then fallback to global state
   */
  static getSources(context: vscode.ExtensionContext): RepoSource[] {
    const config = vscode.workspace.getConfiguration();
    const inspection = config.inspect<RepoSource[]>(CONFIG_KEY);

    // Prioritize user-set configuration (global or workspace)
    const userSetConfig = inspection?.globalValue ?? inspection?.workspaceValue;
    if (userSetConfig && Array.isArray(userSetConfig) && userSetConfig.length > 0) {
      context.globalState.update(STORAGE_KEY, userSetConfig);
      return userSetConfig;
    }

    // Fallback to global state (for older versions)
    const raw = context.globalState.get<RepoSource[]>(STORAGE_KEY);
    if (raw && Array.isArray(raw) && raw.length > 0) {
      // Sync global state to config for forward-compatibility
      this.syncToConfig(raw);
      return raw;
    }

    // Use defaults and sync to both locations
    const defaults = this.getDefaultSources();
    this.syncToConfig(defaults);
    context.globalState.update(STORAGE_KEY, defaults);
    return defaults;
  }

  /**
   * Set repository sources in both global state and VS Code settings
   */
  static async setSources(context: vscode.ExtensionContext, sources: RepoSource[]): Promise<void> {
    // Update global state
    await context.globalState.update(STORAGE_KEY, sources);
    
    // Update VS Code settings
    await this.syncToConfig(sources);
  }

  /**
   * Get default repository sources
   */
  static getDefaultSources(): RepoSource[] {
    return [...DEFAULT_SOURCES];
  }

  /**
   * Sync repository sources to VS Code settings
   */
  private static async syncToConfig(sources: RepoSource[]): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration();
      await config.update(CONFIG_KEY, sources, vscode.ConfigurationTarget.Global);
    } catch (error) {
      getLogger().warn('Failed to sync repository sources to settings:', error);
    }
  }

  /**
   * Listen for configuration changes and sync back to global state
   */
  static onConfigurationChanged(context: vscode.ExtensionContext, callback?: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(async (event) => {
      if (event.affectsConfiguration(CONFIG_KEY)) {
        const config = vscode.workspace.getConfiguration();
        const configSources = config.get<RepoSource[]>(CONFIG_KEY);
        
        if (configSources && Array.isArray(configSources)) {
          // Sync from config to global state
          await context.globalState.update(STORAGE_KEY, configSources);
          
          // Notify callback if provided
          if (callback) {
            callback();
          }
        }
      }
    });
  }

  /**
   * Initialize repository sources from settings on startup
   */
  static async initializeFromSettings(context: vscode.ExtensionContext): Promise<void> {
    const sources = this.getSources(context);
    getLogger().info('Initialized repository sources:', sources.map(s => `${s.owner}/${s.repo}`).join(', '));
  }
}
