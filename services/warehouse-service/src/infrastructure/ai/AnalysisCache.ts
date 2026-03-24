import { InventoryAnalysis } from '../../domain/entities/InventoryAnalysis';

export class AnalysisCache {
  private latest: InventoryAnalysis | null = null;

  set(analysis: InventoryAnalysis): void {
    this.latest = analysis;
  }

  get(): InventoryAnalysis | null {
    return this.latest;
  }

  clear(): void {
    this.latest = null;
  }
}
