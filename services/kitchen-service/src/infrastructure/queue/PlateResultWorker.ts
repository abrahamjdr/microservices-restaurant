import { Worker, Job } from 'bullmq';
import { PlateResultJob, PLATE_RESULT_QUEUE } from '@restaurant/shared-types';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { SseManager } from '../../interfaces/http/SseManager';

function parseRedisUrl(url: string): { host: string; port: number; password?: string } {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379', 10),
    ...(parsed.password ? { password: parsed.password } : {}),
  };
}

export class PlateResultWorker {
  private readonly worker: Worker;
  private readonly orderRepo: IOrderRepository;
  private readonly sseManager: SseManager;

  constructor(redisUrl: string, orderRepo: IOrderRepository, sseManager: SseManager) {
    this.orderRepo = orderRepo;
    this.sseManager = sseManager;

    this.worker = new Worker(
      PLATE_RESULT_QUEUE,
      (job) => this.process(job as Job<PlateResultJob>),
      { connection: parseRedisUrl(redisUrl), concurrency: 10 },
    );

    this.worker.on('failed', (job, err) => {
      console.error(`[kitchen] PlateResultWorker job ${job?.id} failed:`, err);
    });
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
    await this.worker.close();
  }
}
