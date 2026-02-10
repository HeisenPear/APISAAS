# Changelog

Toutes les modifications notables du projet sont documentées dans ce fichier.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [0.1.0] - 2026-02-09

### Ajouté

- **Initialisation projet** : Nuxt 3 avec TypeScript strict
- **Configuration** : nuxt.config.ts, tsconfig.json, drizzle.config.ts, app.config.ts
- **Base de données** : Schéma Drizzle complet (10 tables, 8 enums), seeds de démo, scripts RLS
- **Server utils** : auth.ts (requireAuth), db.ts (Drizzle), supabase.ts (admin client), errors.ts, validators.ts
- **Middleware** : headers sécurité, rate limiting
- **Design system** : CSS "Warm Precision" Apple-style (variables, typographie, animations, transitions)
- **Layouts** : default (sidebar + header), auth (centré), terrain (simplifié mobile)
- **Composants UI** : AppSidebar, AppHeader, AppCommandPalette, KpiCard, DataTable, EmptyState, LoadingSkeleton, PageHeader, StatsGrid, ConfirmDialog
- **Types** : models.ts (InferSelectModel), api.ts (ApiResponse, Pagination), enums.ts
- **Testing** : Vitest + Playwright configurés, test smoke E2E, test unitaire errors
- **CI/CD** : GitHub Actions pipeline (lint, typecheck, test, build)
- **Déploiement** : vercel.json (région CDG1, cron jobs)
- **Qualité** : ESLint + Prettier + Husky + lint-staged
- **Documentation** : ADR-001, CHANGELOG, historique de travail
