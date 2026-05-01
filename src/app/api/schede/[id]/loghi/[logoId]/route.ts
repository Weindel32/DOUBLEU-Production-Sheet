import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ logoId: string }> }) {
  const { logoId } = await params;
  const body = await req.json();
  const updated = await prisma.logoScheda.update({ where: { id: logoId }, data: body, include: { logo: true } });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ logoId: string }> }) {
  const { logoId } = await params;
  await prisma.logoScheda.delete({ where: { id: logoId } });
  return NextResponse.json({ ok: true });
}
