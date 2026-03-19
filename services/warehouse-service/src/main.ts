import http from 'http';
import { PrismaInventoryRepository } from './infrastructure/database/PrismaInventoryRepository';
import { MarketAxiosAdapter } from './infrastructure/adapters/MarketAxiosAdapter';
import { InitializeInventoryUseCase } from './application/usecases/InitializeInventoryUseCase';
import { ReserveIngredientsUseCase } from './application/usecases/ReserveIngredientsUseCase';
import { GetInventoryUseCase } from './application/usecases/GetInventoryUseCase';
import { WarehouseController } from './interfaces/http/WarehouseController';
import { Router } from './interfaces/http/Router';

const PORT = parseInt(process.env.PORT ?? '8002', 10);
const MARKET_URL = process.env.MARKET_SERVICE_URL ?? 'http://localhost:8003';

async function main() {
  const inventoryRepo = new PrismaInventoryRepository();
  const marketAdapter = new MarketAxiosAdapter(MARKET_URL);

  // Initialize inventory on startup
  const initUseCase = new InitializeInventoryUseCase(inventoryRepo);
  await initUseCase.execute();

  const reserveUseCase = new ReserveIngredientsUseCase(inventoryRepo, marketAdapter);
  const getInventoryUseCase = new GetInventoryUseCase(inventoryRepo);

  const controller = new WarehouseController(reserveUseCase, getInventoryUseCase);
  const router = new Router(controller);

  const server = http.createServer((req, res) => router.handle(req, res));
  server.listen(PORT, () => {
    console.log(`[warehouse-service] Listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('[warehouse-service] Fatal error:', err);
  process.exit(1);
});
