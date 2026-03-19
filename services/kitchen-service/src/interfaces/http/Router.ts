import { IncomingMessage, ServerResponse } from 'http';
import { OrderController } from './OrderController';

export class Router {
  constructor(private readonly controller: OrderController) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = req.url ?? '/';
    const method = req.method ?? 'GET';

    // CORS preflight
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

      if (url === '/orders' && method === 'POST') {
        return this.controller.createOrder(req, res);
      }

      if (url === '/orders' && method === 'GET') {
        return this.controller.getOrders(req, res);
      }

      if (url === '/orders/stream' && method === 'GET') {
        return this.controller.streamOrders(req, res);
      }

      const orderMatch = url.match(/^\/orders\/([^/]+)$/);
      if (orderMatch && method === 'GET') {
        return this.controller.getOrder(req, res, orderMatch[1]);
      }

      if (url === '/recipes' && method === 'GET') {
        return this.controller.getRecipes(req, res);
      }

      // Internal endpoint for warehouse callback (not used but kept for extensibility)
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: message }));
    }
  }
}
