import { Worker, Job } from 'bullmq';
import { PlateResultJob, PLATE_RESULT_QUEUE } from '@restaurant/shared-types';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { SseManager } from '../../interfaces/http/SseManager';

function parseRedisUrl(url: string): {
  host: string;
  port: number;
  password?: string;
  tls?: object;
} {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379', 10),
    ...(parsed.password ? { password: parsed.password } : {}),
    ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
  };
}

const PLATE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const TIMEOUT_CHECK_INTERVAL_MS = 30_000; // check every 30s

export class PlateResultWorker {
  private readonly worker: Worker;
  private readonly orderRepo: IOrderRepository;
  private readonly sseManager: SseManager;
  private readonly timeoutInterval: ReturnType<typeof setInterval>;

  constructor(redisUrl: string, orderRepo: IOrderRepository, sseManager: SseManager) {
    this.orderRepo = orderRepo;
    this.sseManager = sseManager;

    this.worker = new Worker(
      PLATE_RESULT_QUEUE,
      (job) => this.process(job as Job<PlateResultJob>),
      { connection: parseRedisUrl(redisUrl), concurrency: 1 },
    );

    this.worker.on('failed', (job, err) => {
      console.error(`[kitchen] PlateResultWorker job ${job?.id} failed:`, err);
    });

    this.timeoutInterval = setInterval(() => {
      this.resolveTimedOutPlates().catch((err) => {
        console.error('[kitchen] Timeout watcher error:', err);
      });
    }, TIMEOUT_CHECK_INTERVAL_MS);
  }

  private async resolveTimedOutPlates(): Promise<void> {
    const cutoff = new Date(Date.now() - PLATE_TIMEOUT_MS);
    const orders = await this.orderRepo.findAll();

    for (const order of orders) {
      if (order.status === 'COMPLETED' || order.status === 'FAILED') continue;

      let timedOut = false;
      for (const plate of order.plates) {
        if (plate.status === 'IN_PROGRESS' && plate.createdAt < cutoff) {
          console.warn(`[kitchen] Plate ${plate.id} timed out — marking FAILED`);
          const failed = await this.orderRepo.updatePlateStatus(plate.id, 'FAILED', new Date());
          this.sseManager.broadcast('plate_updated', failed);
          timedOut = true;
        }
      }

      if (!timedOut) continue;

      // Re-fetch to check whether all plates are now terminal
      const updated = await this.orderRepo.findById(order.id);
      if (!updated) continue;

      const allTerminal = updated.plates.every(
        (p) => p.status === 'COMPLETED' || p.status === 'FAILED',
      );
      if (!allTerminal) continue;

      const anyCompleted = updated.plates.some((p) => p.status === 'COMPLETED');
      const finalStatus = anyCompleted ? 'COMPLETED' : 'FAILED';
      const completedOrder = await this.orderRepo.updateStatus(order.id, finalStatus, new Date());
      this.sseManager.broadcast('order_updated', { ...completedOrder, plates: updated.plates });
    }
  }

  private async process(job: Job<PlateResultJob>): Promise<void> {
    const { plateId, orderId, success, message } = job.data;

    const newStatus = success ? 'COMPLETED' : 'FAILED';
    const updatedPlate = await this.orderRepo.updatePlateStatus(plateId, newStatus, new Date());
    this.sseManager.broadcast('plate_updated', updatedPlate);

    const order = await this.orderRepo.findById(orderId);
    if (!order) return;

    const allTerminal = order.plates.every(
      (p) => p.status === 'COMPLETED' || p.status === 'FAILED',
    );
    if (!allTerminal) return;

    const anyCompleted = order.plates.some((p) => p.status === 'COMPLETED');
    const finalStatus = anyCompleted ? 'COMPLETED' : 'FAILED';
    const completedOrder = await this.orderRepo.updateStatus(orderId, finalStatus, new Date());
    this.sseManager.broadcast('order_updated', { ...completedOrder, plates: order.plates });

    if (message) {
      console.log(`[kitchen] Plate ${plateId} result: ${newStatus} — ${message}`);
    }
  }

  async close(): Promise<void> {
    clearInterval(this.timeoutInterval);
    await this.worker.close();
  }
}
