import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("Disconnesso", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Double U Production Sheet"',
    },
  });
}
