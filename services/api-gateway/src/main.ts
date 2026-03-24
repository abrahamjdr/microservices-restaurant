import http from 'http';
import { Router } from './interfaces/http/Router';

const PORT = parseInt(process.env.PORT ?? '8000', 10);

const services = {
  kitchen: process.env.KITCHEN_SERVICE_URL ?? 'http://localhost:8001',
  warehouse: process.env.WAREHOUSE_SERVICE_URL ?? 'http://localhost:8002',
  market: process.env.MARKET_SERVICE_URL ?? 'http://localhost:8003',
};

const router = new Router(services);
const server = http.createServer((req, res) => router.handle(req, res));

server.listen(PORT, () => {
  console.log(`[api-gateway] Listening on port ${PORT}`);
  console.log('[api-gateway] Service map:', services);
});
