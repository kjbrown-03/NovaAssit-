import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  MAX_ACCUEIL,
  type Notification,
  type NouveauTemoignage,
  type StatutTemoignage,
  type Temoignage,
} from "./types";

/**
 * Dépôt des témoignages.
 *
 * ⚠️ IMPLÉMENTATION DE TRAVAIL — les données vivent dans des fichiers JSON sous
 * `.data/`. C'est suffisant pour développer et pour une mise en ligne sur un
 * serveur persistant, mais **pas** sur un hébergement sans disque durable
 * (Vercel, Netlify) : chaque déploiement repartirait de zéro, et deux instances
 * ne verraient pas les mêmes données.
 *
 * Le paquet `server-only` n'est pas installé ici, mais l'import de `node:fs`
 * suffit à faire échouer toute tentative d'utiliser ce module côté client.
 *
 * Ce fichier est la seule couture à remplacer pour brancher une vraie base.
 * Les six fonctions exportées ci-dessous sont le contrat ; ni les actions
 * serveur, ni les pages, ni les composants ne touchent au stockage directement.
 *
 * Pour passer à Postgres (Neon ou Supabase) :
 *   1. créer la table `temoignages` avec les colonnes du type `Temoignage`,
 *   2. réécrire ces fonctions en requêtes SQL,
 *   3. rien d'autre à changer dans le reste du code.
 */

const DOSSIER = path.join(process.cwd(), ".data");
const FICHIER_TEMOIGNAGES = path.join(DOSSIER, "temoignages.json");
const FICHIER_NOTIFICATIONS = path.join(DOSSIER, "notifications.json");

async function lire<T>(fichier: string): Promise<T[]> {
  try {
    return JSON.parse(await readFile(fichier, "utf8")) as T[];
  } catch (erreur) {
    /* Premier démarrage : le fichier n'existe pas encore. Toute autre erreur
       — JSON corrompu, droits insuffisants — doit remonter. */
    if ((erreur as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw erreur;
  }
}

async function ecrire<T>(fichier: string, donnees: T[]): Promise<void> {
  await mkdir(DOSSIER, { recursive: true });
  await writeFile(fichier, JSON.stringify(donnees, null, 2), "utf8");
}

/* ------------------------------------------------------------- témoignages */

export async function listerTous(): Promise<Temoignage[]> {
  const tous = await lire<Temoignage>(FICHIER_TEMOIGNAGES);
  return tous.sort((a, b) => b.soumisLe.localeCompare(a.soumisLe));
}

export async function listerParStatut(statut: StatutTemoignage): Promise<Temoignage[]> {
  return (await listerTous()).filter((t) => t.statut === statut);
}

export async function listerParCompte(compte: string): Promise<Temoignage[]> {
  return (await listerTous()).filter((t) => t.auteurCompte === compte);
}

/**
 * Les témoignages affichés à l'accueil : validés uniquement, les plus
 * anciennement validés d'abord, et jamais plus de `MAX_ACCUEIL`.
 *
 * Le plafond est appliqué ici, à la lecture, et non à la validation : un
 * témoignage validé au-delà du cinquième reste publié et reprend sa place dès
 * qu'un autre est dépublié.
 */
export async function listerPourAccueil(): Promise<Temoignage[]> {
  const valides = (await listerTous()).filter((t) => t.statut === "valide");
  valides.sort((a, b) => (a.traiteLe ?? a.soumisLe).localeCompare(b.traiteLe ?? b.soumisLe));
  return valides.slice(0, MAX_ACCUEIL);
}

/** Combien de témoignages occupent déjà une place à l'accueil. */
export async function compterValides(): Promise<number> {
  return (await listerParStatut("valide")).length;
}

export async function ajouter(entree: NouveauTemoignage): Promise<Temoignage> {
  const temoignage: Temoignage = {
    ...entree,
    id: randomUUID(),
    statut: "attente",
    soumisLe: new Date().toISOString(),
  };

  const tous = await lire<Temoignage>(FICHIER_TEMOIGNAGES);
  tous.push(temoignage);
  await ecrire(FICHIER_TEMOIGNAGES, tous);

  return temoignage;
}

export async function changerStatut(
  id: string,
  statut: StatutTemoignage,
  motifRefus?: string,
): Promise<Temoignage | null> {
  const tous = await lire<Temoignage>(FICHIER_TEMOIGNAGES);
  const cible = tous.find((t) => t.id === id);
  if (!cible) return null;

  cible.statut = statut;
  cible.traiteLe = new Date().toISOString();
  cible.motifRefus = statut === "refuse" ? motifRefus : undefined;

  await ecrire(FICHIER_TEMOIGNAGES, tous);
  return cible;
}

/* ----------------------------------------------------------- notifications */

export async function ajouterNotification(
  temoignageId: string,
  message: string,
): Promise<Notification> {
  const notification: Notification = {
    id: randomUUID(),
    temoignageId,
    message,
    creeLe: new Date().toISOString(),
  };

  const toutes = await lire<Notification>(FICHIER_NOTIFICATIONS);
  toutes.push(notification);
  await ecrire(FICHIER_NOTIFICATIONS, toutes);

  return notification;
}

export async function listerNotifications(): Promise<Notification[]> {
  const toutes = await lire<Notification>(FICHIER_NOTIFICATIONS);
  return toutes.sort((a, b) => b.creeLe.localeCompare(a.creeLe));
}

export async function marquerNotificationsLues(): Promise<void> {
  const toutes = await lire<Notification>(FICHIER_NOTIFICATIONS);
  const maintenant = new Date().toISOString();
  for (const notification of toutes) notification.lueLe ??= maintenant;
  await ecrire(FICHIER_NOTIFICATIONS, toutes);
}
