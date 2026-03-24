import http from 'http';
import { PrismaInventoryRepository } from './infrastructure/database/PrismaInventoryRepository';
import { MarketAxiosAdapter } from './infrastructure/adapters/MarketAxiosAdapter';
import { InitializeInventoryUseCase } from './application/usecases/InitializeInventoryUseCase';
import { ReserveIngredientsUseCase } from './application/usecases/ReserveIngredientsUseCase';
import { GetInventoryUseCase } from './application/usecases/GetInventoryUseCase';
import { RefillIngredientUseCase } from './application/usecases/RefillIngredientUseCase';
import { ResetInventoryUseCase } from './application/usecases/ResetInventoryUseCase';
import { PlateReservationWorker } from './infrastructure/queue/PlateReservationWorker';
import { ConsumptionTracker } from './infrastructure/ai/ConsumptionTracker';
import { AIAnalysisClient } from './infrastructure/ai/AIAnalysisClient';
import { AnalysisCache } from './infrastructure/ai/AnalysisCache';
import { WarehouseController } from './interfaces/http/WarehouseController';
import { Router } from './interfaces/http/Router';

const PORT = parseInt(process.env.PORT ?? '8002', 10);
const MARKET_URL = process.env.MARKET_SERVICE_URL ?? 'http://localhost:8003';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:8004';
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

async function main() {
  const inventoryRepo = new PrismaInventoryRepository();
  const marketAdapter = new MarketAxiosAdapter(MARKET_URL);

  const initUseCase = new InitializeInventoryUseCase(inventoryRepo);
  await initUseCase.execute();

  const reserveUseCase = new ReserveIngredientsUseCase(inventoryRepo, marketAdapter);
  const getInventoryUseCase = new GetInventoryUseCase(inventoryRepo);
  const refillIngredientUseCase = new RefillIngredientUseCase(inventoryRepo, marketAdapter);

  const consumptionTracker = new ConsumptionTracker();
  const aiClient = new AIAnalysisClient(AI_SERVICE_URL);
  const analysisCache = new AnalysisCache();

  const resetInventoryUseCase = new ResetInventoryUseCase(inventoryRepo, consumptionTracker, analysisCache);

  const plateReservationWorker = new PlateReservationWorker(REDIS_URL, reserveUseCase, {
    consumptionTracker,
    aiClient,
    analysisCache,
    refillUseCase: refillIngredientUseCase,
    inventoryRepo,
  });

  const controller = new WarehouseController(getInventoryUseCase, resetInventoryUseCase, analysisCache);
  const router = new Router(controller);

  const server = http.createServer((req, res) => router.handle(req, res));
  server.listen(PORT, () => {
    console.log(`[warehouse-service] Listening on port ${PORT}`);
  });

  const shutdown = async () => {
    console.log('[warehouse-service] Shutting down...');
    await plateReservationWorker.close();
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('[warehouse-service] Fatal error:', err);
  process.exit(1);
});
