"use client";
import { StockResult } from "@/types";

interface Props {
  results: StockResult[];
  lastUpdated: Date | null;
}

export default function StatsBar({ results, lastUpdated }: Props) {
  const gainers = results.filter((s) => s.daily_change_pct > 0).length;
  const losers = results.filter((s) => s.daily_change_pct <= 0).length;
  const aboveBothEma = results.filter((s) => s.above_ema8 && s.above_ema21).length;
  const nearBreakout = results.filter((s) => s.distance_to_resistance_pct < 5).length;

  if (results.length === 0) return null;

  const stats = [
    { label: "Bulunan", value: results.length, color: "text-accent-green" },
    { label: "Yükselen", value: gainers, color: "text-accent-green" },
    { label: "Düşen", value: losers, color: "text-accent-red" },
    { label: "EMA 8/21 Üstü", value: aboveBothEma, color: "text-accent-blue" },
    { label: "Kırılım Eşiği (<5%)", value: nearBreakout, color: "text-accent-yellow" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-bg-secondary border border-border rounded-lg mb-4 animate-fade-in">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-2">
          <span className={`font-mono font-bold text-lg ${s.color}`}>{s.value}</span>
          <span className="text-text-secondary text-xs">{s.label}</span>
        </div>
      ))}
      {lastUpdated && (
        <span className="ml-auto text-xs text-text-muted font-mono">
          {lastUpdated.toLocaleTimeString("tr-TR")}
        </span>
      )}
    </div>
  );
}
