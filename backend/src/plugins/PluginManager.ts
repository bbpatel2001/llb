import { IPlugin, PluginHooks } from './PluginInterface';

/**
 * Plugin Manager - Manages plugin lifecycle and execution
 */
export class PluginManager {
  private static instance: PluginManager;
  private plugins: Map<string, IPlugin> = new Map();
  private hooks: Map<keyof PluginHooks, Array<(data: any) => Promise<any>>> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  /**
   * Register a plugin
   */
  async register(plugin: IPlugin): Promise<void> {
    const name = plugin.config.name;

    if (this.plugins.has(name)) {
      throw new Error(`Plugin "${name}" is already registered`);
    }

    await plugin.initialize();
    this.plugins.set(name, plugin);

    // Register hooks if plugin defines them
    if (plugin.hooks) {
      this.registerHooks(name, plugin.hooks);
    }

    console.log(`[PluginManager] Registered plugin: ${name} v${plugin.config.version}`);
  }

  /**
   * Unregister a plugin
   */
  async unregister(name: string): Promise<void> {
    const plugin = this.plugins.get(name);

    if (!plugin) {
      throw new Error(`Plugin "${name}" not found`);
    }

    await plugin.deactivate();
    this.plugins.delete(name);

    // Remove hooks
    this.removeHooks(name);

    console.log(`[PluginManager] Unregistered plugin: ${name}`);
  }

  /**
   * Get a plugin
   */
  getPlugin(name: string): IPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): IPlugin[] {
    return this.getAllPlugins().filter((p) => p.config.enabled);
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);

    if (!plugin) {
      throw new Error(`Plugin "${name}" not found`);
    }

    await plugin.activate();
    console.log(`[PluginManager] Enabled plugin: ${name}`);
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);

    if (!plugin) {
      throw new Error(`Plugin "${name}" not found`);
    }

    await plugin.deactivate();
    console.log(`[PluginManager] Disabled plugin: ${name}`);
  }

  /**
   * Register hooks from a plugin
   */
  private registerHooks(pluginName: string, hooks: PluginHooks): void {
    Object.entries(hooks).forEach(([hookName, hookFn]) => {
      const key = hookName as keyof PluginHooks;

      if (!this.hooks.has(key)) {
        this.hooks.set(key, []);
      }

      const hookList = this.hooks.get(key)!;
      hookList.push(hookFn.bind(hooks));

      console.log(`[PluginManager] Registered hook: ${pluginName}.${hookName}`);
    });
  }

  /**
   * Remove hooks from a plugin
   */
  private removeHooks(pluginName: string): void {
    this.hooks.forEach((hookList, hookName) => {
      const index = hookList.findIndex((h) => h.name.includes(pluginName));
      if (index > -1) {
        hookList.splice(index, 1);
        console.log(`[PluginManager] Removed hook: ${pluginName}.${hookName}`);
      }
    });
  }

  /**
   * Execute a hook
   */
  async executeHook(hookName: keyof PluginHooks, data: any): Promise<any> {
    const hookList = this.hooks.get(hookName) || [];

    let result = data;

    for (const hook of hookList) {
      try {
        result = await hook(result);
      } catch (error) {
        console.error(`[PluginManager] Error executing hook ${hookName}:`, error);
      }
    }

    return result;
  }

  /**
   * Execute plugin action
   */
  async executePluginAction(
    pluginName: string,
    action: string,
    data: any
  ): Promise<any> {
    const plugin = this.plugins.get(pluginName);

    if (!plugin) {
      throw new Error(`Plugin "${pluginName}" not found`);
    }

    if (!plugin.config.enabled) {
      throw new Error(`Plugin "${pluginName}" is disabled`);
    }

    return plugin.execute(action, data);
  }

  /**
   * Get plugin statistics
   */
  getStats(): any {
    return {
      total: this.plugins.size,
      enabled: this.getEnabledPlugins().length,
      plugins: Array.from(this.plugins.values()).map((p) => ({
        name: p.config.name,
        version: p.config.version,
        enabled: p.config.enabled,
        description: p.config.description,
      })),
    };
  }
}

export default PluginManager.getInstance();
