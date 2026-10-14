import { NextRequest, NextResponse } from "next/server";
import { collegaCliente } from "@/lib/clientiOrderApp";

/** Collega un cliente dell'Order App: lo crea qui la prima volta, poi riusa sempre lo stesso. */
export async function POST(req: NextRequest) {
  const { orderAppId } = await req.json();
  if (!orderAppId) return NextResponse.json({ error: "Cliente mancante" }, { status: 400 });
  const cliente = await collegaCliente(orderAppId);
  if (!cliente) return NextResponse.json({ error: "Cliente non trovato nell'Order App" }, { status: 404 });
  return NextResponse.json(cliente);
}
