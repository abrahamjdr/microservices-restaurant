import { Worker, Queue, Job } from 'bullmq';
import {
  PlateReservationJob,
  PLATE_RESERVE_QUEUE,
  PLATE_RESULT_QUEUE,
} from '@restaurant/shared-types';
import { ReserveIngredientsUseCase } from '../../application/usecases/ReserveIngredientsUseCase';
import { ConsumptionTracker } from '../ai/ConsumptionTracker';
import { AIAnalysisClient } from '../ai/AIAnalysisClient';
import { AnalysisCache } from '../ai/AnalysisCache';
import { FallbackAnalyzer } from '../ai/FallbackAnalyzer';
import { RefillIngredientUseCase } from '../../application/usecases/RefillIngredientUseCase';
import { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';

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

export interface AIServices {
  consumptionTracker: ConsumptionTracker;
  aiClient: AIAnalysisClient;
  analysisCache: AnalysisCache;
  refillUseCase: RefillIngredientUseCase;
  inventoryRepo: IInventoryRepository;
}

export class PlateReservationWorker {
  private readonly worker: Worker;
  private readonly resultQueue: Queue;

  constructor(
    redisUrl: string,
    reserveUseCase: ReserveIngredientsUseCase,
    private readonly aiServices?: AIServices,
  ) {
    const connection = parseRedisUrl(redisUrl);

    this.resultQueue = new Queue(PLATE_RESULT_QUEUE, {
      connection,
      defaultJobOptions: {
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    });

    this.worker = new Worker(
      PLATE_RESERVE_QUEUE,
      (job) => this.process(job as Job<PlateReservationJob>, reserveUseCase),
      { connection, concurrency: 5 },
    );

    this.worker.on('failed', (job, err) => {
      console.error(`[warehouse] PlateReservationWorker job ${job?.id} failed:`, err);
    });
  }

  private async process(
    job: Job<PlateReservationJob>,
    reserveUseCase: ReserveIngredientsUseCase,
  ): Promise<void> {
    const { plateId, orderId, ingredients } = job.data;

    // Determine if this is the last allowed attempt (0-indexed)
    const maxAttempts = job.opts.attempts ?? 1;
    const isLastAttempt = job.attemptsMade >= maxAttempts - 1;

    let success = false;
    let message: string | undefined;

    try {
      const result = await reserveUseCase.execute(ingredients);
      success = result.success;
      message = result.message;

      if (success && this.aiServices) {
        for (const { ingredient, quantity } of ingredients) {
          this.aiServices.consumptionTracker.record(ingredient, quantity);
        }
      }
    } catch (err) {
      success = false;
      message = err instanceof Error ? err.message : 'Unknown error';
    }

    // Always trigger AI analysis so critical stock is detected and refilled
    // before the next retry attempt arrives
    if (this.aiServices) {
      this.triggerAIAnalysis().catch(() => {});
    }

    if (!success) {
      if (!isLastAttempt) {
        // Throw so BullMQ retries with exponential backoff.
        // The AI-triggered refill above will land before the next attempt.
        throw new Error(message ?? 'Ingredient reservation failed — retrying');
      }
      // Final attempt also failed: emit FAILED result so the plate is resolved.
      console.warn(
        `[warehouse] Plate ${plateId} failed after ${maxAttempts} attempt(s): ${message}`,
      );
    }

    await this.resultQueue.add(
      'result',
      { plateId, orderId, success, message },
      { jobId: `plate-result-${plateId}` },
    );
  }

  private async triggerAIAnalysis(): Promise<void> {
    if (!this.aiServices) return;
    const { consumptionTracker, aiClient, analysisCache, refillUseCase, inventoryRepo } =
      this.aiServices;

    const inventoryItems = await inventoryRepo.findAll();
    const inventory: Record<string, number> = {};
    for (const item of inventoryItems) {
      inventory[item.ingredient] = item.quantity;
    }

    const consumptionRates = consumptionTracker.getRates();

    // Intentar análisis con IA; si falla o retorna null, usar analizador de fallback local
    let result = await aiClient.analyze(inventory, consumptionRates);
    if (!result) {
      console.warn('[warehouse] AI service no disponible — usando análisis de fallback local');
      result = new FallbackAnalyzer().analyze(inventory, consumptionRates);
    }

    analysisCache.set(result);
    console.log(`[warehouse] Análisis: ${result.summary}`);

    // Solo comprar ingredientes marcados como críticos (refillNow=true)
    for (const item of result.analysis) {
      if (item.refillNow) {
        const qty = Math.max(1, item.recommendedRefillQty);
        console.log(`[warehouse] Reabastecimiento: ${item.ingredient} x${qty}`);
        for (let i = 0; i < qty; i++) {
          await refillUseCase.execute(item.ingredient).catch(() => {});
        }
      }
    }
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.resultQueue.close();
  }
}
