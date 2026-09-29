import { prisma } from "@/lib/prisma";

const CATEGORIA_PREFISSO: Record<string, string> = {
  "T-Shirt PRF": "TP", "T-Shirt WS": "TW", "T-Shirt COT": "TC",
  "Polo": "PO", "Hoodie": "HO", "Zip Hoodie": "ZH",
  "Sweatshirt": "SW", "Jacket": "JK", "Sweatpants": "SP",
  "Short": "SH", "Skirt": "SK", "Dress": "DR", "Altro": "AL",
};

/**
 * Codice scheda automatico: PREFISSO-AAMM-NNN. Il progressivo parte dal numero di schede
 * del mese e avanza finché non trova un codice libero (una scheda eliminata non crea doppioni).
 */
export async function generaCodice(categoria: string): Promise<string> {
  const now = new Date();
  const anno = String(now.getFullYear()).slice(-2);
  const mese = String(now.getMonth() + 1).padStart(2, "0");
  const prefisso = CATEGORIA_PREFISSO[categoria] || categoria.substring(0, 2).toUpperCase();
  const base = `${prefisso}-${anno}${mese}`;
  let n = (await prisma.scheda.count({ where: { codice: { startsWith: base } } })) + 1;
  for (;;) {
    const codice = `${base}-${String(n).padStart(3, "0")}`;
    if (!(await prisma.scheda.findUnique({ where: { codice }, select: { id: true } }))) return codice;
    n++;
  }
}
