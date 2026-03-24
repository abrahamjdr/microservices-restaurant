interface ConsumptionEvent {
  ingredient: string;
  quantity: number;
  timestamp: number;
}

export interface ConsumptionRate {
  unitsPerHour: number;
  sampleCount: number;
}

export class ConsumptionTracker {
  private events: ConsumptionEvent[] = [];
  private readonly windowMs = 60 * 60 * 1000; // 60 minutes

  record(ingredient: string, quantity: number): void {
    this.events.push({ ingredient, quantity, timestamp: Date.now() });
    this.prune();
  }

  getRates(): Record<string, ConsumptionRate> {
    this.prune();
    const now = Date.now();
    const byIngredient = new Map<string, ConsumptionEvent[]>();

    for (const event of this.events) {
      const list = byIngredient.get(event.ingredient) ?? [];
      list.push(event);
      byIngredient.set(event.ingredient, list);
    }

    const rates: Record<string, ConsumptionRate> = {};
    for (const [ingredient, events] of byIngredient) {
      const totalConsumed = events.reduce((sum, e) => sum + e.quantity, 0);
      const oldest = events[0].timestamp;
      const windowHours = Math.max((now - oldest) / (1000 * 60 * 60), 10 / 60); // min 10 minutos para evitar tasas irreales en ráfagas cortas
      rates[ingredient] = {
        unitsPerHour: totalConsumed / windowHours,
        sampleCount: events.length,
      };
    }

    return rates;
  }

  reset(): void {
    this.events = [];
  }

  private prune(): void {
    const cutoff = Date.now() - this.windowMs;
    this.events = this.events.filter((e) => e.timestamp >= cutoff);
  }
}
