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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className="h-full">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DUSP" />
        <meta name="theme-color" content="#1d4ed8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
