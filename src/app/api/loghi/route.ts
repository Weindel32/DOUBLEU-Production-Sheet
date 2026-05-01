import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const loghi = await prisma.logo.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(loghi);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const logo = await prisma.logo.create({
    data: { nome: body.nome, file: body.file, tipo: body.tipo },
  });
  return NextResponse.json(logo, { status: 201 });
}
