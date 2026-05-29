"use client";
import { ScanStatus } from "@/types";
import clsx from "clsx";

export type ScanVersion = "v1" | "v2";

interface Props {
  status: ScanStatus;
  scanned: number;
  total: number;
  found: number;
  activeVersion: ScanVersion | null;
  onScan: (version: ScanVersion) => void;
}

export default function ScanButton({
  status, scanned, total, found, activeVersion, onScan,
}: Props) {
  const isScanning = status === "scanning";

  const buttons: Array<{ v: ScanVersion; label: string; sub: string; color: string }> = [
    { v: "v1", label: "Hisseleri Tara — V1", sub: "Kırılım Avı (boğa dizilimi)",  color: "green" },
    { v: "v2", label: "Hisseleri Tara — V2", sub: "Pullback Avı (EMA 8 altı)",   color: "blue" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-3 flex-wrap">
        {buttons.map((b) => {
          const isActive = activeVersion === b.v;
          const colorClasses = b.color === "green"
            ? "bg-accent-green text-bg-primary hover:bg-accent-greenDim"
            : "bg-sky-500 text-bg-primary hover:bg-sky-400";
          return (
            <button
              key={b.v}
              onClick={() => onScan(b.v)}
              disabled={isScanning}
              className={clsx(
                "relative flex flex-col items-start px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 min-w-[220px]",
                isScanning
                  ? "bg-bg-hover text-text-secondary cursor-not-allowed"
                  : `${colorClasses} active:scale-95`,
                isActive && !isScanning && "ring-2 ring-white/30"
              )}
            >
              {isScanning && isActive ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                  Taranıyor — {b.v.toUpperCase()}…
                </span>
              ) : (
                <>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {b.label}
                  </span>
                  <span className="text-[11px] font-normal opacity-80 ml-6">{b.sub}</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 flex-wrap min-h-[24px]">
        {isScanning && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-36 h-1.5 bg-bg-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-green rounded-full transition-all duration-300"
                style={{ width: total > 0 ? `${(scanned / total) * 100}%` : "0%" }}
              />
            </div>
            <span className="text-xs text-text-secondary font-mono">{scanned}/{total}</span>
          </div>
        )}

        {status === "done" && activeVersion && (
          <span className="text-sm text-text-secondary animate-fade-in">
            <span className={clsx(
              "font-semibold font-mono uppercase mr-1.5 px-1.5 py-0.5 rounded text-xs",
              activeVersion === "v1" ? "bg-accent-green/20 text-accent-green" : "bg-sky-500/20 text-sky-400"
            )}>
              {activeVersion}
            </span>
            <span className="text-accent-green font-semibold font-mono">{found}</span>
            {" "}hisse{" "}
            <span className="text-text-muted">/ {total} tarandı</span>
          </span>
        )}

        {status === "error" && (
          <span className="text-sm text-accent-red animate-fade-in">
            Backend bağlantısı kurulamadı — API sunucusu uyanıyor olabilir, ~30 sn sonra tekrar dene.
          </span>
        )}
      </div>
    </div>
  );
}
