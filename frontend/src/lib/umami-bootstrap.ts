/**
 * Umami (AVIDX-85): script URL and website ID are fixed at build time — not read from env
 * so they are always available on Render.
 */
export const UMAMI_SCRIPT_SRC =
  "https://umami-avidx.onrender.com/script.js" as const;

export const UMAMI_WEBSITE_ID =
  "10c0dd15-f7d3-4b30-bea5-58c317c49cc2" as const;

/** Custom events from AVIDX-85 and AVIDX-253 only. */
export type UmamiTicketEvent =
  | "item_added_to_watchlist"
  | "item_marked_watched"
  | "ai_recommendation_requested"
  | "ai_fallback_fired"
  | "search_performed"
  | "watchlist_viewed";

declare global {
  interface Window {
    umami?: { track: (eventName: string, eventData?: Record<string, unknown>) => void };
  }
}

export function trackUmamiEvent(
  event: UmamiTicketEvent,
  eventData?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  window.umami?.track(event, eventData);
}
