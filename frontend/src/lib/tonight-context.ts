/** Prompt chips for Tonight's pick (AVIDX-350). Inputs to the model, not client re-ranking. */

export const TONIGHT_TIME_OPTIONS = [
  { id: '45m', label: '45 minutes' },
  { id: '2h', label: 'about 2 hours' },
  { id: 'flex', label: 'no rush' },
] as const;

export const TONIGHT_WHO_OPTIONS = [
  { id: 'solo', label: 'just you' },
  { id: 'couple', label: 'two of you' },
  { id: 'group', label: 'the group' },
  { id: 'kids', label: 'with kids' },
] as const;

export const TONIGHT_ENERGY_OPTIONS = [
  { id: 'low', label: 'low energy' },
  { id: 'medium', label: 'whatever' },
  { id: 'high', label: 'wired' },
] as const;

export type TonightTimeId = (typeof TONIGHT_TIME_OPTIONS)[number]['id'];
export type TonightWhoId = (typeof TONIGHT_WHO_OPTIONS)[number]['id'];
export type TonightEnergyId = (typeof TONIGHT_ENERGY_OPTIONS)[number]['id'];

export type TonightContext = {
  time: TonightTimeId;
  who: TonightWhoId;
  energy: TonightEnergyId;
};

/** Free-user default and first-run Pro default. */
export const DEFAULT_TONIGHT_CONTEXT: TonightContext = {
  time: '2h',
  who: 'solo',
  energy: 'medium',
};

const TIME_IDS = new Set<string>(TONIGHT_TIME_OPTIONS.map((o) => o.id));
const WHO_IDS = new Set<string>(TONIGHT_WHO_OPTIONS.map((o) => o.id));
const ENERGY_IDS = new Set<string>(TONIGHT_ENERGY_OPTIONS.map((o) => o.id));

function optionLabel<T extends { id: string; label: string }>(
  options: readonly T[],
  id: string
): string {
  return options.find((o) => o.id === id)?.label ?? id;
}

export function parseTonightContext(raw: unknown): TonightContext | null {
  if (!raw || typeof raw !== 'object') return null;
  const rec = raw as Record<string, unknown>;
  const time = typeof rec.time === 'string' ? rec.time : '';
  const who = typeof rec.who === 'string' ? rec.who : '';
  const energy = typeof rec.energy === 'string' ? rec.energy : '';
  if (!TIME_IDS.has(time) || !WHO_IDS.has(who) || !ENERGY_IDS.has(energy)) return null;
  return { time: time as TonightTimeId, who: who as TonightWhoId, energy: energy as TonightEnergyId };
}

export function tonightContextEquals(a: TonightContext, b: TonightContext): boolean {
  return a.time === b.time && a.who === b.who && a.energy === b.energy;
}

export function whoIncludesKids(who: TonightWhoId): boolean {
  return who === 'kids';
}

export function formatTonightContextLine(context: TonightContext): string {
  return `Tonight · ${optionLabel(TONIGHT_TIME_OPTIONS, context.time)} · ${optionLabel(TONIGHT_WHO_OPTIONS, context.who)}`;
}

export function tonightContextPromptBlock(context: TonightContext): string {
  const time = optionLabel(TONIGHT_TIME_OPTIONS, context.time);
  const who = optionLabel(TONIGHT_WHO_OPTIONS, context.who);
  const energy = optionLabel(TONIGHT_ENERGY_OPTIONS, context.energy);
  const lines = [
    `Time available: ${time}.`,
    `Who's watching: ${who}.`,
    `Energy: ${energy}.`,
  ];
  if (whoIncludesKids(context.who)) {
    lines.push(
      'Kids are watching. Demote R-rated movies and TV-MA shows. Prefer G, PG, PG-13, TV-Y, TV-G, TV-PG, or TV-14. If you still pick a mature title, say so in the reason and that kids are present.'
    );
  }
  return lines.join('\n');
}
