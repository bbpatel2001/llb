/**
 * Plugin Interface for LLB Platform
 * All plugins must implement this interface
 */

export interface PluginConfig {
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
}

export interface PluginHooks {
  onBeforeQuestionProcess?: (question: any) => Promise<any>;
  onAfterAnswerGenerate?: (answer: any) => Promise<any>;
  onBeforeFlashcardCreate?: (flashcard: any) => Promise<any>;
  onBeforeTimelineGenerate?: (timeline: any) => Promise<any>;
  onBeforeCaseLawCreate?: (caseLaw: any) => Promise<any>;
}

export interface IPlugin {
  config: PluginConfig;
  hooks?: PluginHooks;
  
  /**
   * Initialize the plugin
   */
  initialize(): Promise<void>;
  
  /**
   * Activate the plugin
   */
  activate(): Promise<void>;
  
  /**
   * Deactivate the plugin
   */
  deactivate(): Promise<void>;
  
  /**
   * Get plugin metadata
   */
  getMetadata(): PluginConfig;
  
  /**
   * Execute a custom action
   */
  execute(action: string, data: any): Promise<any>;
}

/**
 * Abstract base class for plugins
 */
export abstract class BasePlugin implements IPlugin {
  config: PluginConfig;
  hooks?: PluginHooks;

  constructor(config: PluginConfig) {
    this.config = {
      ...config,
      enabled: config.enabled || false,
    };
  }

  async initialize(): Promise<void> {
    console.log(`[Plugin] Initializing ${this.config.name} v${this.config.version}`);
  }

  async activate(): Promise<void> {
    this.config.enabled = true;
    console.log(`[Plugin] Activated ${this.config.name}`);
  }

  async deactivate(): Promise<void> {
    this.config.enabled = false;
    console.log(`[Plugin] Deactivated ${this.config.name}`);
  }

  getMetadata(): PluginConfig {
    return this.config;
  }

  abstract execute(action: string, data: any): Promise<any>;
}
