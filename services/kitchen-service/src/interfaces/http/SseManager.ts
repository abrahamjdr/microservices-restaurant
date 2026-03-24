import { ServerResponse } from 'http';

export class SseManager {
  private clients = new Set<ServerResponse>();

  addClient(res: ServerResponse): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
    });
    res.write(':ok\n\n');
    this.clients.add(res);

    // Heartbeat every 25s to prevent proxy/Render from closing idle SSE connections
    const heartbeat = setInterval(() => {
      try {
        res.write(':ping\n\n');
      } catch {
        clearInterval(heartbeat);
        this.clients.delete(res);
      }
    }, 25000);

    res.on('close', () => {
      clearInterval(heartbeat);
      this.clients.delete(res);
    });
  }

  broadcast(event: string, data: unknown): void {
    const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const deadClients: ServerResponse[] = [];

    this.clients.forEach((res) => {
      try {
        res.write(msg);
      } catch {
        deadClients.push(res);
      }
    });

    deadClients.forEach((res) => this.clients.delete(res));
  }

  getClientCount(): number {
    return this.clients.size;
  }
}
