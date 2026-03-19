import http from 'http';
import { PrismaOrderRepository } from './infrastructure/database/PrismaOrderRepository';
import { WarehouseAxiosAdapter } from './infrastructure/adapters/WarehouseAxiosAdapter';
import { RecipeSelector } from './domain/services/RecipeSelector';
import { SseManager } from './interfaces/http/SseManager';
import { CreateOrderUseCase } from './application/usecases/CreateOrderUseCase';
import { GetOrdersUseCase } from './application/usecases/GetOrdersUseCase';
import { OrderController } from './interfaces/http/OrderController';
import { Router } from './interfaces/http/Router';

const PORT = parseInt(process.env.PORT ?? '8001', 10);
const WAREHOUSE_URL = process.env.WAREHOUSE_SERVICE_URL ?? 'http://localhost:8002';

async function main() {
  // Infrastructure
  const orderRepo = new PrismaOrderRepository();
  const warehouseAdapter = new WarehouseAxiosAdapter(WAREHOUSE_URL);
  const recipeSelector = new RecipeSelector();
  const sseManager = new SseManager();

  // Use cases
  const createOrderUseCase = new CreateOrderUseCase(
    orderRepo,
    recipeSelector,
    warehouseAdapter,
    sseManager,
  );
  const getOrdersUseCase = new GetOrdersUseCase(orderRepo);

  // Controller + Router
  const controller = new OrderController(
    createOrderUseCase,
    getOrdersUseCase,
    sseManager,
    recipeSelector,
  );
  const router = new Router(controller);

  const server = http.createServer((req, res) => router.handle(req, res));
  server.listen(PORT, () => {
    console.log(`[kitchen-service] Listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('[kitchen-service] Fatal error:', err);
  process.exit(1);
});
