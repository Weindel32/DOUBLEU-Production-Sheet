import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Double U – Production Sheet",
  description: "Gestionale schede di produzione Double U Handcrafted in Italy",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DUSP",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="h-full">
      <head>
        {/* Titolo e modalità app per la schermata Home arrivano da metadata.appleWebApp (sovrascritti in /m) */}
        <meta name="theme-color" content="#0E1B2C" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
