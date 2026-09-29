import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Nessun file" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
  if (!allowed.includes(file.type) && !file.type.startsWith("image/"))
    return NextResponse.json({ error: "Formato non supportato" }, { status: 400 });

  if (file.size > 10 * 1024 * 1024)
    return NextResponse.json({ error: "File troppo grande (max 10MB)" }, { status: 400 });

  if (!process.env.BLOB_READ_WRITE_TOKEN)
    return NextResponse.json(
      { error: "Storage immagini non configurato (BLOB_READ_WRITE_TOKEN mancante su Vercel)" },
      { status: 500 }
    );

  try {
    const blob = await put(`schede/${Date.now()}-${file.name}`, file, {
      access: "public",
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Errore upload immagine:", error);
    const dettaglio = error instanceof Error ? error.message : "errore sconosciuto";
    return NextResponse.json({ error: `Upload fallito: ${dettaglio}` }, { status: 500 });
  }
}
