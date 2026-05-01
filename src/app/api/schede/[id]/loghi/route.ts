import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const logoScheda = await prisma.logoScheda.create({
    data: { schedaId: id, logoId: body.logoId, posizione: body.posizione, tecnica: body.tecnica },
    include: { logo: true },
  });
  return NextResponse.json(logoScheda, { status: 201 });
}
