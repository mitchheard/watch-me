export function Wordmark({
  size = 'md',
  showWord = true,
}: {
  size?: 'sm' | 'md' | 'lg';
  showWord?: boolean;
}) {
  const box = size === 'lg' ? 'h-16 w-16' : size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const play = size === 'lg' ? 'border-t-[10px] border-b-[10px] border-l-[16px]' : 'border-t-[6px] border-b-[6px] border-l-[10px]';
  const word = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-base' : 'text-lg';

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${box} rounded-2xl bg-accent flex items-center justify-center shrink-0`}
        aria-hidden
      >
        <span className={`${play} border-y-transparent border-l-accent-ink ml-0.5 inline-block`} />
      </div>
      {showWord ? (
        <span className={`${word} font-semibold tracking-tight text-ink`}>Watch Me</span>
      ) : null}
    </div>
  );
}
