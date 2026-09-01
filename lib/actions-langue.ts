"use server";

import { cookies } from "next/headers";

import { COOKIE_LANGUE, estLangue } from "@/i18n/config";

/** Un an : le choix de langue n'a pas de raison d'expirer plus tôt. */
const DUREE = 60 * 60 * 24 * 365;

export async function changerLangue(valeur: string) {
  if (!estLangue(valeur)) return;

  (await cookies()).set(COOKIE_LANGUE, valeur, {
    maxAge: DUREE,
    path: "/",
    sameSite: "lax",
  });
}
