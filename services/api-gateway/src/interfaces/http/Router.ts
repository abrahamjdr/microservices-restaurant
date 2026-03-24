import { IncomingMessage, ServerResponse } from 'http';
import axios from 'axios';
import http from 'http';
import https from 'https';

interface ServiceMap {
  kitchen: string;
  warehouse: string;
  market: string;
}

const ROUTE_MAP: Array<{
  method: string;
  pattern: RegExp;
  service: keyof ServiceMap;
  target: (match: RegExpMatchArray) => string;
}> = [
  // Kitchen routes
  { method: 'POST', pattern: /^\/api\/orders$/, service: 'kitchen', target: () => '/orders' },
  { method: 'GET', pattern: /^\/api\/orders$/, service: 'kitchen', target: () => '/orders' },
  {
    method: 'GET',
    pattern: /^\/api\/orders\/stream$/,
    service: 'kitchen',
    target: () => '/orders/stream',
  },
  {
    method: 'GET',
    pattern: /^\/api\/orders\/([^/]+)$/,
    service: 'kitchen',
    target: (m) => `/orders/${m[1]}`,
  },
  { method: 'GET', pattern: /^\/api\/recipes$/, service: 'kitchen', target: () => '/recipes' },
  // Warehouse routes
  {
    method: 'GET',
    pattern: /^\/api\/inventory$/,
    service: 'warehouse',
    target: () => '/inventory',
  },
  {
    method: 'POST',
    pattern: /^\/api\/inventory\/reset$/,
    service: 'warehouse',
    target: () => '/inventory/reset',
  },
  {
    method: 'GET',
    pattern: /^\/api\/inventory\/analysis$/,
    service: 'warehouse',
    target: () => '/inventory/analysis',
  },
  // Market routes
  {
    method: 'GET',
    pattern: /^\/api\/purchases$/,
    service: 'market',
    target: () => '/purchases',
  },
];

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export class Router {
  constructor(private readonly services: ServiceMap) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = req.url ?? '/';
    const method = req.method ?? 'GET';

    // CORS preflight
    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    // Health check
    if (url === '/health' && method === 'GET') {
      sendJson(res, 200, { status: 'ok', service: 'api-gateway' });
      return;
    }

    // Find matching route
    for (const route of ROUTE_MAP) {
      if (route.method !== method) continue;

      const match = url.match(route.pattern);
      if (!match) continue;

      const targetPath = route.target(match);
      const serviceUrl = this.services[route.service];

      // SSE proxy (stream)
      if (url === '/api/orders/stream') {
        return this.proxySse(req, res, `${serviceUrl}${targetPath}`);
      }

      return this.proxyRequest(req, res, method, `${serviceUrl}${targetPath}`);
    }

    sendJson(res, 404, { error: 'Route not found' });
  }

  private async proxyRequest(
    req: IncomingMessage,
    res: ServerResponse,
    method: string,
    targetUrl: string,
  ): Promise<void> {
    try {
      const body = method !== 'GET' ? await readBody(req) : undefined;

      const response = await axios.request({
        method,
        url: targetUrl,
        data: body,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
        validateStatus: () => true,
      });

      const responseBody = JSON.stringify(response.data);
      res.writeHead(response.status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Content-Length': Buffer.byteLength(responseBody),
      });
      res.end(responseBody);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upstream error';
      sendJson(res, 502, { error: message });
    }
  }

  private proxySse(req: IncomingMessage, res: ServerResponse, targetUrl: string): void {
    const url = new URL(targetUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const upstreamReq = client.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'GET',
        headers: { Accept: 'text/event-stream' },
      },
      (upstreamRes) => {
        upstreamRes.on('data', (chunk: Buffer) => res.write(chunk));
        upstreamRes.on('end', () => res.end());
      },
    );

    upstreamReq.on('error', () => {
      res.write('event: error\ndata: {"message":"SSE upstream disconnected"}\n\n');
      res.end();
    });

    req.on('close', () => upstreamReq.destroy());
    upstreamReq.end();
  }
}
