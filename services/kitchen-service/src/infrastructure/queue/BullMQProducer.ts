import { Queue } from 'bullmq';
import { PlateReservationJob, PLATE_RESERVE_QUEUE } from '@restaurant/shared-types';
import { IQueueProducerPort } from '../../application/ports/IQueueProducerPort';

function parseRedisUrl(url: string): { host: string; port: number; password?: string } {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379', 10),
    ...(parsed.password ? { password: parsed.password } : {}),
  };
}

export class BullMQProducer implements IQueueProducerPort {
  private readonly queue: Queue;

  constructor(redisUrl: string) {
    this.queue = new Queue(PLATE_RESERVE_QUEUE, {
      connection: parseRedisUrl(redisUrl),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    });
  }

  async publishPlateReservation(job: PlateReservationJob): Promise<void> {
    await this.queue.add('reserve', job, {
      jobId: `plate-${job.plateId}`,
      delay: 1000, // mínimo 1s en cola para visibilidad en el dashboard
    });
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
