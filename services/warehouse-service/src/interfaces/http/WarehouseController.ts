import { IncomingMessage, ServerResponse } from 'http';
import { GetInventoryUseCase } from '../../application/usecases/GetInventoryUseCase';
import { ResetInventoryUseCase } from '../../application/usecases/ResetInventoryUseCase';
import { AnalysisCache } from '../../infrastructure/ai/AnalysisCache';

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

export class WarehouseController {
  constructor(
    private readonly getInventoryUseCase: GetInventoryUseCase,
    private readonly resetInventoryUseCase: ResetInventoryUseCase,
    private readonly analysisCache: AnalysisCache,
  ) {}

  async getInventory(_req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const inventory = await this.getInventoryUseCase.execute();
      sendJson(res, 200, { inventory });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      sendJson(res, 500, { error: message });
    }
  }

  async resetInventory(_req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      await this.resetInventoryUseCase.execute();
      sendJson(res, 200, { reset: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal server error';
      sendJson(res, 500, { error: message });
    }
  }

  getAnalysis(_req: IncomingMessage, res: ServerResponse): void {
    const analysis = this.analysisCache.get();
    if (!analysis) {
      sendJson(res, 200, { analysis: null });
      return;
    }
    sendJson(res, 200, { analysis });
  }

  health(_req: IncomingMessage, res: ServerResponse): void {
    sendJson(res, 200, { status: 'ok', service: 'warehouse-service' });
  }
}
