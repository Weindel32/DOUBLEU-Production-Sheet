import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Solo le foto caricate dall'app (Vercel Blob) passano dall'ottimizzazione.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
    // Ogni foto ha un nome unico e non cambia: la versione ridotta si tiene 31 giorni, così non si rigenera.
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
