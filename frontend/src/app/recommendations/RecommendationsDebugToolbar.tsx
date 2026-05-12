'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

/** REMOVE_ME: mirrors API when RECOMMENDATIONS_DEBUG=true */
export interface RecommendationsDebugPayload {
  llmUsed: string;
  systemPrompt: string | null;
  userPrompt: string | null;
  rawResponse: string | null;
  llmLatencyMs?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  phase?: string;
  error?: string;
  requestContext?: {
    clientHour: number | null;
    clientTimeZone: string | null;
    timeOfDayBucket: string;
  };
}

type ModalKind = 'prompt' | 'response' | null;

interface RecommendationsDebugToolbarProps {
  debug?: RecommendationsDebugPayload | null;
}

export function RecommendationsDebugToolbar({ debug }: RecommendationsDebugToolbarProps) {
  const [modal, setModal] = useState<ModalKind>(null);

  if (!debug) {
    return (
      <div className="rounded-lg border border-dashed border-amber-400/90 bg-amber-50/60 px-3 py-2.5 text-left text-xs text-amber-950">
        <span className="rounded bg-amber-200/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
          Dev strip
        </span>
        <p className="mt-2 leading-relaxed">
          No debug payload yet. Set server env{' '}
          <code className="rounded bg-amber-100 px-1 font-mono text-[11px]">RECOMMENDATIONS_DEBUG=true</code>, restart,
          then load recommendations again for LLM labels, system/user prompts, and raw response.
        </p>
      </div>
    );
  }

  const title =
    modal === 'prompt' ? 'Recommendation prompt (dev)' : modal === 'response' ? 'Raw LLM response (dev)' : '';

  const promptPanel =
    modal === 'prompt' ? (
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            system (Anthropic top-level)
          </h3>
          <pre className="max-h-[min(35vh,18rem)] overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-slate-900 p-3 text-xs leading-relaxed text-slate-100 sm:p-4">
            {debug.systemPrompt ?? '(empty)'}
          </pre>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            user message
          </h3>
          <pre className="max-h-[min(35vh,18rem)] overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-slate-900 p-3 text-xs leading-relaxed text-slate-100 sm:p-4">
            {debug.userPrompt ?? '(empty)'}
          </pre>
        </div>
      </div>
    ) : null;

  const responseBody = modal === 'response' ? debug.rawResponse ?? '(empty)' : '';
  const hasLatency = debug.llmLatencyMs != null;
  const hasUsage =
    debug.inputTokens != null || debug.outputTokens != null || debug.totalTokens != null;

  return (
    <>
      <div className="rounded-lg border border-amber-400/80 bg-amber-50 px-3 py-3 text-left text-sm text-amber-950 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded bg-amber-200/80 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
            Dev only · remove later
          </span>
          {debug.phase && (
            <span className="font-mono text-xs text-amber-800/90">phase: {debug.phase}</span>
          )}
        </div>
        <p className="mt-2 font-mono text-xs sm:text-sm">
          <span className="font-sans font-medium text-amber-950">LLM: </span>
          {debug.llmUsed}
        </p>
        {debug.requestContext && (
          <p className="mt-1 font-mono text-xs text-amber-900/90">
            <span className="font-sans font-medium text-amber-950">Time: </span>
            bucket {debug.requestContext.timeOfDayBucket}
            {debug.requestContext.clientHour != null ? ` · hour ${debug.requestContext.clientHour}` : ''}
            {debug.requestContext.clientTimeZone ? ` · ${debug.requestContext.clientTimeZone}` : ''}
          </p>
        )}
        {(hasLatency || hasUsage) && (
          <p className="mt-1 font-mono text-xs sm:text-sm text-amber-900/90">
            {hasLatency ? (
              <>
                <span className="font-sans font-medium text-amber-950">Latency: </span>
                {debug.llmLatencyMs}ms
              </>
            ) : null}
            {hasLatency && hasUsage ? ' · ' : ''}
            {hasUsage ? (
              <>
                <span className="font-sans font-medium text-amber-950">Tokens: </span>
                in {debug.inputTokens ?? '?'} / out {debug.outputTokens ?? '?'} / total {debug.totalTokens ?? '?'}
              </>
            ) : null}
          </p>
        )}
        {debug.error && (
          <p className="mt-2 rounded border border-red-200 bg-red-50/90 px-2 py-1.5 font-mono text-xs text-red-900">
            {debug.error}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setModal('prompt')}
            className="rounded-md border border-amber-700/30 bg-white px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100/80"
          >
            View full prompt...
          </button>
          <button
            type="button"
            onClick={() => setModal('response')}
            className="rounded-md border border-amber-700/30 bg-white px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100/80"
          >
            View raw response...
          </button>
        </div>
      </div>

      <Transition appear show={modal !== null} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setModal(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto p-4">
            <div className="flex min-h-full items-center justify-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl rounded-xl bg-white p-4 shadow-xl ring-1 ring-black/5 sm:p-6">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <Dialog.Title className="text-base font-semibold text-gray-900">{title}</Dialog.Title>
                    <button
                      type="button"
                      onClick={() => setModal(null)}
                      className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                      aria-label="Close"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  {modal === 'prompt' ? (
                    promptPanel
                  ) : (
                    <pre className="max-h-[min(70vh,32rem)] overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
                      {responseBody}
                    </pre>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
