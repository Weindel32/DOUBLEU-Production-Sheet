import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Double U – Production Sheet",
  description: "Gestionale schede di produzione Double U Handcrafted in Italy",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
