# 🐝 Apiculture 360° (APIGO)

> Logiciel de gestion apicole tout-en-un — du rucher à la comptabilité.

## Stack

- **Frontend** : Nuxt 3 (Vue 3) + Nuxt UI v3 — Design "Warm Precision" Apple-style
- **Backend** : Nitro (serverless) + Drizzle ORM — TypeScript strict
- **Base de données** : Supabase (PostgreSQL 16)
- **Auth** : Supabase Auth
- **Paiements** : Stripe
- **Déploiement** : Vercel (serverless, région Paris)
- **Mobile** : Capacitor (iOS + Android)

## Développement

```bash
# Installer les dépendances
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env

# Lancer le serveur de développement
npm run dev
```

## Scripts

| Commande            | Description               |
| ------------------- | ------------------------- |
| `npm run dev`       | Serveur de développement  |
| `npm run build`     | Build production          |
| `npm run lint`      | Lint ESLint               |
| `npm run typecheck` | Vérification TypeScript   |
| `npm run test`      | Tests unitaires (Vitest)  |
| `npm run test:e2e`  | Tests E2E (Playwright)    |
| `npm run db:push`   | Push schéma vers Supabase |
| `npm run db:seed`   | Seed données de démo      |
| `npm run db:studio` | Interface Drizzle Studio  |

## Base de données

```bash
# Pousser le schéma Drizzle vers Supabase
npm run db:push

# Première installation (migration complète)
# Exécuter server/database/schema-complet.sql dans Supabase SQL Editor
```

## Architecture

```
app/              # Frontend Nuxt 3
├── pages/        # Routes
├── components/   # Composants Vue
├── composables/  # Logique réutilisable
├── stores/       # Pinia stores
├── layouts/      # Layouts (default, auth, terrain)
└── types/        # Types TypeScript

server/           # Backend Nitro
├── api/          # Routes API
├── middleware/    # Auth, sécurité, rate-limit, abonnements
├── utils/        # Clients (DB, Supabase, Stripe, Brevo…)
└── database/     # Schéma Drizzle + schema-complet.sql + seed

tests/            # Tests
├── unit/         # Vitest
└── e2e/          # Playwright
```

## Production

- **URL** : https://apigo.fr
- **Vercel** : auto-deploy sur push `main`
- **Supabase** : projet EU (Francfort)

## Licence

Propriétaire — Antoine Martin
