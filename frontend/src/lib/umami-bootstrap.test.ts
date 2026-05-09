import { describe, expect, it, vi } from 'vitest';
import { trackUmamiEvent } from './umami-bootstrap';

describe('trackUmamiEvent', () => {
  it('forwards event payload to window.umami.track when available', () => {
    const track = vi.fn();
    window.umami = { track };

    trackUmamiEvent('ai_fallback_fired', { reason: 'llm-pipeline-error' });

    expect(track).toHaveBeenCalledWith('ai_fallback_fired', { reason: 'llm-pipeline-error' });
  });
});
