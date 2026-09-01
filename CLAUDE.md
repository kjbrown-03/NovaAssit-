# Nova Assist

Site Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · TypeScript. Contenu en français.

- `app/` — routes : `(site)` (accueil), `devis`, `espace-client`
- `components/` — composants partagés (`ui.tsx`, `site-header`, `site-footer`, …)
- `lib/content.ts` — textes et données de contenu
- `design/` — maquettes de référence (`*.dc.html`) et cahier des charges
- `Application mobile page d'accueil-handoff/` — handoff de la page d'accueil mobile

## Règle : tout travail frontend passe par les skills design

Avant d'écrire ou de modifier du JSX, du CSS ou un token de design — nouvelle page,
nouveau composant, restyling, correction visuelle — **charger les skills ci-dessous**.
Ne pas produire de UI « par défaut » sans les avoir consultés.

| Quand | Skill | Rôle |
|---|---|---|
| Toute tâche UI, en premier | `ui-ux-pro-max` | Base de données consultable : styles, palettes, pairings de polices, guidelines UX, charts, patterns par stack |
| Direction artistique, refus du templated | `frontend-design` | Parti pris esthétique, typographie, éviter le rendu « généré » |
| Choix typo / couleur / motion / fonds | `distinctive-frontend` | Approche à quatre vecteurs, extrêmes de graisse, systèmes de tokens |
| Critique, audit, polish, hardening | `impeccable` | Cycle de design complet ; `/impeccable audit`, `critique`, `polish`, `harden`, `layout`, `typeset`, `colorize`, `animate` |
| Implémentation Tailwind / shadcn | `ui-styling` | Composants shadcn/ui, Radix, utilitaires Tailwind |
| Tokens et specs de composants | `design-system` | Tokens à trois couches (primitive → sémantique → composant) |

Skills complémentaires déjà présents et toujours valables : `frontend-a11y`,
`react-patterns`, `react-performance`, `frontend-patterns`.

### Ordre de travail attendu

1. **Contexte** — lire `design/*.dc.html` et `lib/content.ts` avant de proposer une direction.
2. **Direction** — `ui-ux-pro-max` pour les données, `frontend-design` + `distinctive-frontend` pour le parti pris.
3. **Implémentation** — respecter les conventions existantes de `components/ui.tsx` et les tokens de `app/globals.css`. Pas de couleur ni d'espacement en dur si un token existe.
4. **Revue** — `impeccable` (audit / critique / polish) avant de considérer la tâche terminée.

### Recherche dans la base ui-ux-pro-max

```bash
python "$CLAUDE_PLUGIN_ROOT/.claude/skills/ui-ux-pro-max/scripts/search.py" "<requête>" --domain <style|color|typography|ux|chart|product|gsap>
```

Sur ce poste, `python` est Python 3.14 (`python3` n'est pas résolu — utiliser `python`).

## Contraintes machine

Disque `C:` quasi plein et réseau lent : voir la mémoire projet
`poste-windows-reseau-lent-disque-sature`. Éviter les installations npm inutiles,
lancer les commandes longues en arrière-plan.
