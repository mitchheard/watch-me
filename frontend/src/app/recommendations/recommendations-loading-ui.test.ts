import { describe, expect, it } from 'vitest';
import {
  finalizingEllipsisSuffix,
  recommendationsLoadingBarPercent,
  recommendationsLoadingIsIndeterminate,
  recommendationsLoadingShowPercentLabel,
} from './recommendations-loading-ui';

describe('recommendationsLoadingBarPercent', () => {
  it('advances in equal fifths of 90% then caps at 90% for stage 4', () => {
    expect(recommendationsLoadingBarPercent(0)).toBe(0);
    expect(recommendationsLoadingBarPercent(1)).toBe(22.5);
    expect(recommendationsLoadingBarPercent(2)).toBe(45);
    expect(recommendationsLoadingBarPercent(3)).toBe(67.5);
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
  it('shows percentage during staged progress, then hides it on the 90% wait', () => {
    expect(recommendationsLoadingShowPercentLabel(3)).toBe(true);
    expect(recommendationsLoadingShowPercentLabel(4)).toBe(false);
  });
});

describe('finalizingEllipsisSuffix', () => {
  it('cycles two through four dots', () => {
    expect(finalizingEllipsisSuffix(0)).toBe('..');
    expect(finalizingEllipsisSuffix(1)).toBe('...');
    expect(finalizingEllipsisSuffix(2)).toBe('....');
    expect(finalizingEllipsisSuffix(3)).toBe('..');
  });
});
