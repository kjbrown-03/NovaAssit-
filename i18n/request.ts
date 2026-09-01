import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { COOKIE_LANGUE, LANGUE_DEFAUT, estLangue } from "./config";

/**
 * La langue est portée par un cookie, pas par l'URL.
 *
 * Étape suivante prévue : passer aux segments `/fr` et `/en` en déplaçant les
 * routes sous `app/[locale]/`. Les appels de traduction et les fichiers de
 * `messages/` ne changeront pas — seule la façon de résoudre la langue ici.
 */
export default getRequestConfig(async () => {
  const demande = (await cookies()).get(COOKIE_LANGUE)?.value;
  const locale = estLangue(demande) ? demande : LANGUE_DEFAUT;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
