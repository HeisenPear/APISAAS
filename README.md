# Apiculture 360°

SaaS français de gestion apicole tout-en-un. Du rucher à la comptabilité.

## Stack

- **Full-stack** : Nuxt 3 (Vue 3 + Nitro) — TypeScript strict
- **Base de données** : Supabase (PostgreSQL 16) + Drizzle ORM
- **Auth** : Supabase Auth
- **UI** : Nuxt UI v3 + Tailwind CSS — Design "Warm Precision" Apple-style
- **Paiements** : Stripe
- **Déploiement** : Vercel (serverless)

## Setup

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
├── middleware/    # Auth, sécurité, rate-limit
├── utils/        # Clients (DB, Supabase, Stripe, etc.)
└── database/     # Schéma Drizzle + migrations + seeds

tests/            # Tests
├── unit/         # Vitest
└── e2e/          # Playwright
```

## Licence

Propriétaire — La Jocondienne
