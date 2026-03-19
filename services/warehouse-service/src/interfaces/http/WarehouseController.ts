import { IncomingMessage, ServerResponse } from 'http';
import { ReserveIngredientsUseCase } from '../../application/usecases/ReserveIngredientsUseCase';
import { GetInventoryUseCase } from '../../application/usecases/GetInventoryUseCase';

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

export class WarehouseController {
  constructor(
    private readonly reserveUseCase: ReserveIngredientsUseCase,
    private readonly getInventoryUseCase: GetInventoryUseCase,
  ) {}

  async reserveIngredients(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const raw = await readBody(req);
      const body = JSON.parse(raw) as {
        recipeId: number;
        recipeName: string;
        ingredients: Array<{ ingredient: string; quantity: number }>;
      };
      const result = await this.reserveUseCase.execute(body.ingredients);
      sendJson(res, result.success ? 200 : 409, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      sendJson(res, 500, { error: message });
    }
  }

  async getInventory(_req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const inventory = await this.getInventoryUseCase.execute();
      sendJson(res, 200, { inventory });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      sendJson(res, 500, { error: message });
    }
  }

  health(_req: IncomingMessage, res: ServerResponse): void {
    sendJson(res, 200, { status: 'ok', service: 'warehouse-service' });
  }
}
