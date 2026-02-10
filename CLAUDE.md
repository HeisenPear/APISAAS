# CLAUDE.md — Apiculture 360°

## Projet

SaaS français de gestion apicole tout-en-un. Du rucher à la comptabilité.

## Stack — RÈGLE ABSOLUE

- **1 langage** : TypeScript (front + back + tests)
- **1 repo** : Nuxt 3 monorepo (Nitro pour l'API serverless)
- **1 déploiement** : Vercel (`git push` → auto-deploy)
- **ZÉRO Laravel, ZÉRO PHP, ZÉRO serveur dédié**

## Technos

- Nuxt 3 (Vue 3 + Nitro) — full-stack
- Supabase — PostgreSQL + Auth + Storage + Realtime
- Drizzle ORM — SQL-first, TypeScript strict
- Stripe SDK — abonnements
- Brevo — emails transactionnels
- Open-Meteo — météo gratuite
- Leaflet + OpenStreetMap — cartographie
- Apache ECharts — graphiques
- Capacitor — mobile natif (phase 3)

## Design

**"Warm Precision"** — style Apple.

- Couleur signature : Honey #F5A623
- Fonds : blanc cassé chaud #FAFAF8 (JAMAIS blanc pur)
- Sidebar : noir Apple #1C1C1E
- Typo : SF Pro (fallback système)
- Radius : 8-16px
- Animations fluides sur TOUT (250ms ease-out-expo)
- Voir section 3 de CLAUDE_CODE_PROMPT.md pour le détail complet

## Conventions

- TypeScript strict (zéro `any`, zéro `@ts-ignore`)
- Composants < 200 lignes
- Routes API < 50 lignes
- Validation Zod sur TOUS les inputs
- RLS Supabase sur TOUTES les tables
- Skeleton loaders sur tous les chargements
- Empty states sur toutes les listes vides
- Tailwind CSS uniquement (pas de CSS scopé)
- Commits conventionnels (feat: fix: docs: refactor: test:)

## Agents IA

| Agent                | Rôle                                         |
| -------------------- | -------------------------------------------- |
| @spec-orchestrator   | Coordination, specs, ADRs, quality gates     |
| @nitro-api-architect | Routes API Nitro, middlewares, intégrations  |
| @nuxt-frontend       | Pages, composants, design system, animations |
| @database-optimizer  | Schéma Drizzle, RLS, index, requêtes perf    |
| @test-engineer       | Tests Vitest + Playwright, coverage > 80%    |
| @security-auditor    | RLS, validation, OWASP, RGPD, rate-limit     |
| @code-reviewer       | Review, performance, documentation, deploy   |

## Specs complètes

**Lire CLAUDE_CODE_PROMPT.md** — contient TOUT : schéma DB, API, modules, design system, workflow.

## Scripts

```bash
npm run dev          # Dev server
npm run build        # Build production
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run test         # Vitest
npm run test:e2e     # Playwright
npm run db:push      # Push schema Drizzle → Supabase
npm run db:seed      # Seed données de démo
npm run db:studio    # Drizzle Studio (GUI DB)
```
