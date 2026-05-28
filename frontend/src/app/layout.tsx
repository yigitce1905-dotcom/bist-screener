import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BIST Screener — Teknik Analiz Paneli",
  description: "EMA boğa dizilimi ve düşen trend kırılımı tarama",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-bg-primary min-h-screen">{children}</body>
    </html>
  );
}
