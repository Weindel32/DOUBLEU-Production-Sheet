import type { Metadata } from "next";
import { percorsoSicuro } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Accesso – Double U Production Sheet" };

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const next = percorsoSicuro(typeof sp.next === "string" ? sp.next : null);
  return <LoginForm next={next} />;
}
