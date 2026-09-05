/**
 * Sauvegarde des données Nova Assist.
 *
 * Exporte chaque table en JSON, plus la liste des comptes d'authentification.
 * Sert de filet là où Supabase n'en pose aucun : le plan gratuit ne fait
 * aucune sauvegarde automatique, et une table effacée l'est définitivement.
 *
 * Usage :
 *   npm run sauvegarde                  → ./sauvegardes/<horodatage>/
 *   node scripts/sauvegarde-donnees.mjs --sortie chemin/ailleurs
 *
 * Les identifiants sont lus dans l'environnement, à défaut dans .env.local.
 * La clé `service_role` est nécessaire : la sauvegarde doit voir toutes les
 * lignes, ce que les politiques RLS interdisent à tout autre rôle.
 *
 * ⚠️ Le résultat contient des données personnelles de clients. Le dossier
 * `sauvegardes/` est ignoré par Git pour cette raison : ne le commitez jamais.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const racine = process.cwd();
const exiger = createRequire(path.join(racine, "package.json"));
const { createClient } = exiger("@supabase/supabase-js");

/* Toutes les tables applicatives. Une table absente de cette liste ne serait
   pas sauvegardée : la compléter en même temps que chaque migration. */
const TABLES = [
  "profils",
  "demandes",
  "demandes_devis",
  "commandes",
  "factures",
  "documents",
  "articles",
  "temoignages",
  "notifications_admin",
  "evenements",
];

const PAGE = 1000;

function lireEnv() {
  const env = { ...process.env };
  const fichier = path.join(racine, ".env.local");

  if (fs.existsSync(fichier)) {
    for (const ligne of fs.readFileSync(fichier, "utf8").split(/\r?\n/)) {
      const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      /* L'environnement réel prime : en CI, les secrets sont déjà posés. */
      if (m && !env[m[1]]) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

function argument(nom) {
  const i = process.argv.indexOf(nom);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const env = lireEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const cle = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !cle) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont nécessaires.\n" +
      "En local elles viennent de .env.local ; en CI, des secrets du dépôt.",
  );
  process.exit(1);
}

const supabase = createClient(url, cle, { auth: { persistSession: false } });

const horodatage = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const sortie = path.resolve(argument("--sortie") ?? path.join(racine, "sauvegardes", horodatage));
fs.mkdirSync(sortie, { recursive: true });

/** Lit une table entière, par pages : `select()` plafonne à 1000 lignes. */
async function exporterTable(nom) {
  const lignes = [];

  for (let debut = 0; ; debut += PAGE) {
    const { data, error } = await supabase
      .from(nom)
      .select("*")
      .range(debut, debut + PAGE - 1);

    if (error) return { nom, ok: false, erreur: error.message, lignes: 0 };
    if (!data?.length) break;

    lignes.push(...data);
    if (data.length < PAGE) break;
  }

  fs.writeFileSync(
    path.join(sortie, `${nom}.json`),
    JSON.stringify(lignes, null, 2),
    "utf8",
  );
  return { nom, ok: true, lignes: lignes.length };
}

/**
 * Les comptes d'authentification.
 *
 * Ce que Supabase ne rend PAS : les mots de passe, même chiffrés. Une
 * restauration recrée donc les comptes, mais chaque client devra passer par
 * « mot de passe oublié ». C'est une limite du fournisseur, pas du script —
 * autant la connaître avant d'en avoir besoin.
 */
async function exporterComptes() {
  const comptes = [];

  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return { nom: "auth_users", ok: false, erreur: error.message, lignes: 0 };
    if (!data?.users?.length) break;

    comptes.push(
      ...data.users.map((u) => ({
        id: u.id,
        email: u.email,
        email_confirmed_at: u.email_confirmed_at,
        phone: u.phone,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        user_metadata: u.user_metadata,
      })),
    );
    if (data.users.length < 200) break;
  }

  fs.writeFileSync(
    path.join(sortie, "auth_users.json"),
    JSON.stringify(comptes, null, 2),
    "utf8",
  );
  return { nom: "auth_users", ok: true, lignes: comptes.length };
}

const resultats = [];
for (const table of TABLES) resultats.push(await exporterTable(table));
resultats.push(await exporterComptes());

const echecs = resultats.filter((r) => !r.ok);
const total = resultats.reduce((n, r) => n + r.lignes, 0);

fs.writeFileSync(
  path.join(sortie, "manifeste.json"),
  JSON.stringify(
    { horodatage: new Date().toISOString(), projet: url, total, resultats },
    null,
    2,
  ),
  "utf8",
);

console.log(`\nSauvegarde dans ${sortie}\n`);
for (const r of resultats) {
  console.log(
    r.ok
      ? `  ${String(r.lignes).padStart(6)}  ${r.nom}`
      : `  ECHEC          ${r.nom} — ${r.erreur}`,
  );
}
console.log(`\n  ${total} lignes au total`);

if (echecs.length > 0) {
  console.error(
    `\n${echecs.length} table(s) non sauvegardée(s). Une table absente de la base` +
      " n'est pas une erreur si sa migration n'a pas encore été jouée.",
  );
  /* Sortie en échec : en CI, mieux vaut une alerte qu'une sauvegarde trouée
     dont personne ne remarque le trou. */
  process.exit(1);
}
