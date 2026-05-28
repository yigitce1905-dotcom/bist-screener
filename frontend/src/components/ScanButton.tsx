"use client";
import { ScanStatus } from "@/types";
import clsx from "clsx";

interface Props {
  status: ScanStatus;
  scanned: number;
  total: number;
  found: number;
  onClick: () => void;
}

export default function ScanButton({ status, scanned, total, found, onClick }: Props) {
  const isScanning = status === "scanning";

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <button
        onClick={onClick}
        disabled={isScanning}
        className={clsx(
          "relative flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200",
          isScanning
            ? "bg-bg-hover text-text-secondary cursor-not-allowed"
            : "bg-accent-green text-bg-primary hover:bg-accent-greenDim active:scale-95 scan-pulse"
        )}
      >
        {isScanning ? (
          <>
            <span className="w-4 h-4 border-2 border-bg-primary/40 border-t-bg-primary rounded-full animate-spin" />
            Taranıyor...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Hisseleri Tara
          </>
        )}
      </button>

      {/* İlerleme */}
      {isScanning && (
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-36 h-1.5 bg-bg-hover rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-green rounded-full transition-all duration-300"
              style={{ width: total > 0 ? `${(scanned / total) * 100}%` : "0%" }}
            />
          </div>
          <span className="text-xs text-text-secondary font-mono">
            {scanned}/{total}
          </span>
        </div>
      )}

      {/* Sonuç özeti */}
      {status === "done" && (
        <span className="text-sm text-text-secondary animate-fade-in">
          <span className="text-accent-green font-semibold font-mono">{found}</span>
          {" "} hisse {" "}
          <span className="text-text-muted">/ {total} tarandı</span>
        </span>
      )}

      {status === "error" && (
        <span className="text-sm text-accent-red animate-fade-in">
          Backend bağlantısı kurulamadı — API sunucusunun çalıştığından emin olun.
        </span>
      )}
    </div>
  );
}
