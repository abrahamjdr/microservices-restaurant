export interface InventoryAnalysisContext {
  inventory: Record<string, number>;
  consumptionRates: Record<string, { unitsPerHour: number; sampleCount: number }>;
}

export class InventoryAnalysisPromptBuilder {
  build(ctx: InventoryAnalysisContext): string {
    const inventoryLines = Object.entries(ctx.inventory)
      .map(([ing, qty]) => {
        const rate = ctx.consumptionRates[ing];
        const rateStr =
          rate && rate.sampleCount >= 2
            ? `${rate.unitsPerHour.toFixed(1)} unidades/hora`
            : 'tasa desconocida';
        const minutesLeft =
          rate && rate.unitsPerHour > 0 ? Math.round((qty / rate.unitsPerHour) * 60) : null;
        const timeStr = minutesLeft !== null ? `~${minutesLeft} min restantes` : 'tasa desconocida';
        return `  - ${ing}: ${qty} unidades | consumo: ${rateStr} | ${timeStr}`;
      })
      .join('\n');

    return `Eres un sistema de monitoreo de inventario para una cocina de restaurante. Analiza el inventario actual y las tendencias de consumo para prevenir escasez de ingredientes. Responde SIEMPRE en español.

Inventario actual y tasas de consumo:
${inventoryLines}

Reglas para clasificar el estado:
- "critical": menos de 5 minutos de stock restante O cantidad es 0
- "low": 5 a 20 minutos de stock restante
- "good": más de 20 minutos restantes O tasa desconocida pero stock > 3
- "unknown": sin datos de consumo y stock entre 0 y 3 unidades

Para recommendedRefillQty: sugiere entre 1 y 5 unidades según la tasa (mayor tasa = más unidades).
Para refillNow: true SOLO si el estado es "critical". Nunca true para "low", "good" o "unknown".

Responde ÚNICAMENTE con JSON válido (sin markdown, sin texto extra):
{
  "summary": "Una oración resumiendo el estado general del inventario y cualquier acción urgente.",
  "analysis": [
    {
      "ingredient": "tomato",
      "status": "critical",
      "currentStock": 1,
      "consumptionRatePerHour": 18.0,
      "estimatedMinutesRemaining": 3,
      "recommendedRefillQty": 3,
      "refillNow": true,
      "insight": "Demanda muy alta, casi agotado"
    }
  ]
}

Incluye TODOS los ingredientes del inventario. Ordénalos por urgencia (críticos primero).`;
  }
}
