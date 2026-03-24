import { InventoryAnalysisResult, InventoryAnalysisItem } from './AIAnalysisClient';
import { ConsumptionRate } from './ConsumptionTracker';

const CRITICAL_THRESHOLD = 0; // qty === 0 → crítico
const LOW_THRESHOLD = 3; // qty <= 3  → bajo
const REFILL_TARGET = 10; // comprar hasta llegar a 10 unidades

/**
 * Analizador de inventario basado en reglas simples.
 * Se usa como fallback cuando el servicio de IA (OpenAI/Lambda) no está disponible.
 * Garantiza que el sistema siempre pueda detectar stock crítico y solicitar reabastecimiento,
 * incluso sin conexión a OpenAI.
 */
export class FallbackAnalyzer {
  analyze(
    inventory: Record<string, number>,
    consumptionRates: Record<string, ConsumptionRate>,
  ): InventoryAnalysisResult {
    const analysis: InventoryAnalysisItem[] = [];
    const critical: string[] = [];
    const low: string[] = [];

    for (const [ingredient, qty] of Object.entries(inventory)) {
      const rate = consumptionRates[ingredient]?.unitsPerHour ?? 0;

      let status: InventoryAnalysisItem['status'];
      let refillNow: boolean;
      let recommendedRefillQty: number;
      let estimatedMinutesRemaining: number | null = null;

      if (rate > 0) {
        estimatedMinutesRemaining = Math.round((qty / rate) * 60);
      }

      if (qty <= CRITICAL_THRESHOLD) {
        status = 'critical';
        refillNow = true;
        recommendedRefillQty = REFILL_TARGET;
        critical.push(ingredient);
      } else if (qty <= LOW_THRESHOLD) {
        status = 'low';
        refillNow = false;
        recommendedRefillQty = REFILL_TARGET - qty;
        low.push(ingredient);
      } else {
        status = 'good';
        refillNow = false;
        recommendedRefillQty = 0;
      }

      analysis.push({
        ingredient,
        status,
        currentStock: qty,
        consumptionRatePerHour: rate,
        estimatedMinutesRemaining,
        recommendedRefillQty,
        refillNow,
        insight: this.buildInsight(ingredient, qty, status, rate),
      });
    }

    return {
      summary: this.buildSummary(critical, low),
      analysis,
      analyzedAt: new Date().toISOString(),
    };
  }

  private buildInsight(ingredient: string, qty: number, status: string, rate: number): string {
    if (status === 'critical') return `${ingredient} agotado — compra urgente requerida.`;
    if (status === 'low')
      return `${ingredient} casi agotado (${qty} unidades, tasa ${rate.toFixed(1)}/h).`;
    return `${ingredient} con stock suficiente (${qty} unidades).`;
  }

  private buildSummary(critical: string[], low: string[]): string {
    const parts: string[] = ['[Análisis local — IA no disponible]'];
    if (critical.length > 0) {
      parts.push(`Agotados: ${critical.join(', ')}.`);
    }
    if (low.length > 0) {
      parts.push(`Stock bajo: ${low.join(', ')}.`);
    }
    if (critical.length === 0 && low.length === 0) {
      parts.push('Todo el inventario en niveles aceptables.');
    }
    return parts.join(' ');
  }
}
