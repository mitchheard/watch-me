import { describe, expect, it } from 'vitest';
import {
  recommendationsLoadingBarPercent,
  recommendationsLoadingIsIndeterminate,
  recommendationsLoadingShowPercentLabel,
} from './recommendations-loading-ui';

describe('recommendationsLoadingBarPercent', () => {
  it('matches staged 0–75% then caps at 90% for stage 4', () => {
    expect(recommendationsLoadingBarPercent(0)).toBe(0);
    expect(recommendationsLoadingBarPercent(1)).toBe(25);
    expect(recommendationsLoadingBarPercent(2)).toBe(50);
    expect(recommendationsLoadingBarPercent(3)).toBe(75);
    expect(recommendationsLoadingBarPercent(4)).toBe(90);
  });

  it('never exceeds 90% for higher stages', () => {
    expect(recommendationsLoadingBarPercent(99)).toBe(90);
  });
});

describe('recommendationsLoadingIsIndeterminate', () => {
  it('is false before the cap stage', () => {
    expect(recommendationsLoadingIsIndeterminate(0)).toBe(false);
    expect(recommendationsLoadingIsIndeterminate(3)).toBe(false);
  });

  it('is true at and after stage 4', () => {
    expect(recommendationsLoadingIsIndeterminate(4)).toBe(true);
    expect(recommendationsLoadingIsIndeterminate(5)).toBe(true);
  });
});

describe('recommendationsLoadingShowPercentLabel', () => {
  it('hides percentage in indeterminate state', () => {
    expect(recommendationsLoadingShowPercentLabel(3)).toBe(true);
    expect(recommendationsLoadingShowPercentLabel(4)).toBe(false);
  });
});
