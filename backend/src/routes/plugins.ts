import { Router, Request, Response } from 'express';
import PluginManager from '../plugins/PluginManager';

const router = Router();

/**
 * Get all plugins
 * GET /api/plugins
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const plugins = PluginManager.getAllPlugins();
    const stats = PluginManager.getStats();

    res.json({
      stats,
      plugins: plugins.map((p) => ({
        name: p.config.name,
        version: p.config.version,
        description: p.config.description,
        author: p.config.author,
        enabled: p.config.enabled,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Get plugin by name
 * GET /api/plugins/:name
 */
router.get('/:name', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name } = req.params;
    const plugin = PluginManager.getPlugin(name);

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    return res.json({
      ...plugin.config,
      metadata: plugin.getMetadata(),
    });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Enable a plugin
 * POST /api/plugins/:name/enable
 */
router.post('/:name/enable', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name } = req.params;

    await PluginManager.enablePlugin(name);

    return res.json({
      success: true,
      message: `Plugin "${name}" enabled`,
    });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * Disable a plugin
 * POST /api/plugins/:name/disable
 */
router.post('/:name/disable', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name } = req.params;

    await PluginManager.disablePlugin(name);

    return res.json({
      success: true,
      message: `Plugin "${name}" disabled`,
    });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * Execute plugin action
 * POST /api/plugins/:name/execute
 */
router.post('/:name/execute', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name } = req.params;
    const { action, data } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'action is required' });
    }

    const result = await PluginManager.executePluginAction(name, action, data);

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * Get plugin statistics
 * GET /api/plugins/stats/overview
 */
router.get('/stats/overview', async (_req: Request, res: Response) => {
  try {
    const stats = PluginManager.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
