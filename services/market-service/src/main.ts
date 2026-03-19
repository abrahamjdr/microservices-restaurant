import http from 'http';
import { PrismaPurchaseRepository } from './infrastructure/database/PrismaPurchaseRepository';
import { BuyIngredientUseCase } from './application/usecases/BuyIngredientUseCase';
import { GetPurchasesUseCase } from './application/usecases/GetPurchasesUseCase';
import { MarketController } from './interfaces/http/MarketController';
import { Router } from './interfaces/http/Router';

const PORT = parseInt(process.env.PORT ?? '8003', 10);
const FARMERS_MARKET_URL =
  process.env.FARMERS_MARKET_API_URL ?? 'https://recruitment.alegra.com/api/farmers-market/buy';

async function main() {
  const purchaseRepo = new PrismaPurchaseRepository();
  const buyUseCase = new BuyIngredientUseCase(purchaseRepo, FARMERS_MARKET_URL);
  const getPurchasesUseCase = new GetPurchasesUseCase(purchaseRepo);

  const controller = new MarketController(buyUseCase, getPurchasesUseCase);
  const router = new Router(controller);

  const server = http.createServer((req, res) => router.handle(req, res));
  server.listen(PORT, () => {
    console.log(`[market-service] Listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('[market-service] Fatal error:', err);
  process.exit(1);
});
