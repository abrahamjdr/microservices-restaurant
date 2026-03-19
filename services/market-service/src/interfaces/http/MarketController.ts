import { IncomingMessage, ServerResponse } from 'http';
import { BuyIngredientUseCase } from '../../application/usecases/BuyIngredientUseCase';
import { GetPurchasesUseCase } from '../../application/usecases/GetPurchasesUseCase';

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

export class MarketController {
  constructor(
    private readonly buyUseCase: BuyIngredientUseCase,
    private readonly getPurchasesUseCase: GetPurchasesUseCase,
  ) {}

  async buy(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const raw = await readBody(req);
      const { ingredient, quantity } = JSON.parse(raw) as {
        ingredient: string;
        quantity: number;
      };
      const result = await this.buyUseCase.execute(ingredient, quantity);
      sendJson(res, 200, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      sendJson(res, 500, { error: message });
    }
  }

  async getPurchases(_req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const purchases = await this.getPurchasesUseCase.execute();
      sendJson(res, 200, { purchases });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      sendJson(res, 500, { error: message });
    }
  }

  health(_req: IncomingMessage, res: ServerResponse): void {
    sendJson(res, 200, { status: 'ok', service: 'market-service' });
  }
}
