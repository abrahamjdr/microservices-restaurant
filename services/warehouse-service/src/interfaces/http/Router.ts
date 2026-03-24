import { IncomingMessage, ServerResponse } from 'http';
import { WarehouseController } from './WarehouseController';

export class Router {
  constructor(private readonly controller: WarehouseController) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = req.url ?? '/';
    const method = req.method ?? 'GET';

    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      if (url === '/health' && method === 'GET') {
        return this.controller.health(req, res);
      }

      if (url === '/inventory' && method === 'GET') {
        return this.controller.getInventory(req, res);
      }

      if (url === '/inventory/reset' && method === 'POST') {
        return this.controller.resetInventory(req, res);
      }

      if (url === '/inventory/analysis' && method === 'GET') {
        return this.controller.getAnalysis(req, res);
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: message }));
    }
  }
}
