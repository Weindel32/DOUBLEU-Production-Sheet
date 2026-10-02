// Compressione e caricamento delle foto, condivisi da scheda, materiali e scontrini dei campioni.

// Le foto da iPad/iPhone sono grandi (HEIC, 4-10MB) e Vercel rifiuta body > ~4.5MB:
// ridimensiono e converto in JPEG lato client prima dell'upload.
const MAX_DIM = 2400;
const SOGLIA_BYTES = 3 * 1024 * 1024;

export async function preparaImmagine(file: File): Promise<File> {
  const leggero = file.size <= SOGLIA_BYTES && ["image/jpeg", "image/png", "image/webp"].includes(file.type);
  if (leggero) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scala = Math.min(1, MAX_DIM / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scala);
    canvas.height = Math.round(bmp.height * scala);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close?.();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob) return file;
    const nome = (file.name || "foto").replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nome, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** Comprime (se serve) e carica una foto; restituisce l'URL pubblico o lancia un errore leggibile. */
export async function caricaImmagine(originale: File): Promise<string> {
  const file = await preparaImmagine(originale);
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (res.ok) return (await res.json()).url as string;
  if (res.status === 413) throw new Error("File troppo grande");
  const body = await res.json().catch(() => null);
  throw new Error(body?.error || `Caricamento non riuscito (errore ${res.status})`);
}

/** Foto in JPEG leggibile da ogni browser (anche HEIC), lato lungo al massimo MAX_DIM: è la base del ritaglio. */
export async function urlPerRitaglio(sorgente: Blob): Promise<string> {
  try {
    const bmp = await createImageBitmap(sorgente);
    const scala = Math.min(1, MAX_DIM / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scala);
    canvas.height = Math.round(bmp.height * scala);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close?.();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    return URL.createObjectURL(blob ?? sorgente);
  } catch {
    return URL.createObjectURL(sorgente);
  }
}

const MAX_RITAGLIO = 1600;

/** Ritaglia l'immagine caricata; l'area è in percentuale (0-100), come la restituisce il ritaglio. */
export async function ritaglia(img: HTMLImageElement, area: { x: number; y: number; width: number; height: number }): Promise<File> {
  const sx = (area.x / 100) * img.naturalWidth;
  const sy = (area.y / 100) * img.naturalHeight;
  const sw = Math.max(1, (area.width / 100) * img.naturalWidth);
  const sh = Math.max(1, (area.height / 100) * img.naturalHeight);
  const scala = Math.min(1, MAX_RITAGLIO / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scala);
  canvas.height = Math.round(sh * scala);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Ritaglio non riuscito");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
  if (!blob) throw new Error("Ritaglio non riuscito");
  return new File([blob], "foto.jpg", { type: "image/jpeg" });
}
