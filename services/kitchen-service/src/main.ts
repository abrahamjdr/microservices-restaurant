import http from 'http';
import { PrismaOrderRepository } from './infrastructure/database/PrismaOrderRepository';
import { BullMQProducer } from './infrastructure/queue/BullMQProducer';
import { PlateResultWorker } from './infrastructure/queue/PlateResultWorker';
import { RecipeSelector } from './domain/services/RecipeSelector';
import { SseManager } from './interfaces/http/SseManager';
import { CreateOrderUseCase } from './application/usecases/CreateOrderUseCase';
import { GetOrdersUseCase } from './application/usecases/GetOrdersUseCase';
import { OrderController } from './interfaces/http/OrderController';
import { Router } from './interfaces/http/Router';

const PORT = parseInt(process.env.PORT ?? '8001', 10);
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

async function main() {
  // Infrastructure
  const orderRepo = new PrismaOrderRepository();
  const recipeSelector = new RecipeSelector();
  const sseManager = new SseManager();
  const bullmqProducer = new BullMQProducer(REDIS_URL);
  const plateResultWorker = new PlateResultWorker(REDIS_URL, orderRepo, sseManager);

  // Use cases
  const createOrderUseCase = new CreateOrderUseCase(
    orderRepo,
    recipeSelector,
    bullmqProducer,
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

  const shutdown = async () => {
    console.log('[kitchen-service] Shutting down...');
    await bullmqProducer.close();
    await plateResultWorker.close();
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('[kitchen-service] Fatal error:', err);
  process.exit(1);
});
