// Lista del comparador (RF07): hasta tres fichas, guardada en una cookie
// para que funcione también sin cuenta (decisión D18).
import "server-only";
import { cookies } from "next/headers";

export const MAX_COMPARAR = 3;
const COOKIE = "ventanilla_comparar";

export async function leerComparador(): Promise<string[]> {
  const v = (await cookies()).get(COOKIE)?.value ?? "";
  return v.split(",").filter(Boolean).slice(0, MAX_COMPARAR);
}

export async function escribirComparador(ids: string[]) {
  (await cookies()).set(COOKIE, ids.slice(0, MAX_COMPARAR).join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
