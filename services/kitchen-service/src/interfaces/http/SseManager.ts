import { ServerResponse } from 'http';

export class SseManager {
  private clients = new Set<ServerResponse>();

  addClient(res: ServerResponse): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(':ok\n\n');
    this.clients.add(res);

    res.on('close', () => {
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
