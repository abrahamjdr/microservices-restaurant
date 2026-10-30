import { FallbackAnalyzer } from '../infrastructure/ai/FallbackAnalyzer';

describe('FallbackAnalyzer', () => {
  const result = new FallbackAnalyzer().analyze({ rice: 0, lemon: 2, onion: 10 }, {});
  const by = (i: string) => result.analysis.find((a) => a.ingredient === i)!;

  it('refills critical and low stock, not good stock', () => {
    expect(by('rice')).toMatchObject({ status: 'critical', refillNow: true });
    expect(by('lemon')).toMatchObject({ status: 'low', refillNow: true, recommendedRefillQty: 8 });
    expect(by('onion')).toMatchObject({ status: 'good', refillNow: false });
  });
});
