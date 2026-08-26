export function PriceBadge({ amount }: { amount: string }) {
  return <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-100">{amount}</span>;
}
