import { IncomingMessage, ServerResponse } from 'http';
import { CreateOrderUseCase } from '../../application/usecases/CreateOrderUseCase';
import { GetOrdersUseCase } from '../../application/usecases/GetOrdersUseCase';
import { SseManager } from './SseManager';
import { RecipeSelector } from '../../domain/services/RecipeSelector';

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrdersUseCase: GetOrdersUseCase,
    private readonly sseManager: SseManager,
    private readonly recipeSelector: RecipeSelector,
  ) {}

  async createOrder(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const raw = await readBody(req);
      const { quantity } = JSON.parse(raw) as { quantity: number };
      // Returns 202 Accepted — order is PENDING, processing continues async in background.
      // Clients track progress via SSE on GET /orders/stream.
      const order = await this.createOrderUseCase.execute(quantity);
      sendJson(res, 202, { order });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      sendJson(res, 400, { error: message });
    }
  }

  async getOrders(_req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const orders = await this.getOrdersUseCase.getAll();
      sendJson(res, 200, { orders });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      sendJson(res, 500, { error: message });
    }
  }

  async getOrder(req: IncomingMessage, res: ServerResponse, id: string): Promise<void> {
    try {
      const order = await this.getOrdersUseCase.getById(id);
      if (!order) {
        sendJson(res, 404, { error: 'Order not found' });
        return;
      }
      sendJson(res, 200, { order });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      sendJson(res, 500, { error: message });
    }
  }

  streamOrders(_req: IncomingMessage, res: ServerResponse): void {
    this.sseManager.addClient(res);
  }

  getRecipes(_req: IncomingMessage, res: ServerResponse): void {
    const recipes = this.recipeSelector.getAll();
    sendJson(res, 200, { recipes });
  }

  health(_req: IncomingMessage, res: ServerResponse): void {
    sendJson(res, 200, { status: 'ok', service: 'kitchen-service' });
  }
}
