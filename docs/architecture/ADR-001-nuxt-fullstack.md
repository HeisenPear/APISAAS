# ADR-001 : Nuxt 3 Full-Stack (Zéro Laravel)

## Statut

Accepté — 9 février 2026

## Contexte

Le projet Apiculture 360° nécessite un backend API, un frontend SPA/SSR, une base de données, de l'authentification et un déploiement serverless. L'approche initiale envisageait Laravel + Nuxt (2 repos, 2 langages).

## Décision

**Stack monolithique Nuxt 3** : un seul repo, un seul langage (TypeScript), un seul déploiement (Vercel).

| Couche          | Choix                    | Justification                                          |
| --------------- | ------------------------ | ------------------------------------------------------ |
| Full-stack      | Nuxt 3 (Vue 3 + Nitro)   | SSR + SPA + API serverless dans 1 repo                 |
| Base de données | Supabase (PostgreSQL 16) | Auth + DB + Storage + Realtime, hébergement EU         |
| ORM             | Drizzle ORM              | SQL-first, léger, cold start rapide, TypeScript strict |
| Auth            | Supabase Auth            | Email/password, OAuth, magic links, gratuit            |
| Déploiement     | Vercel                   | Auto-deploy git push, CDN global, serverless           |
| Paiements       | Stripe SDK               | Abonnements récurrents, portail client                 |
| Emails          | Brevo                    | Français, RGPD, 300 emails/jour gratuit                |

## Conséquences

### Positives

- Un seul langage à maintenir (TypeScript everywhere)
- Types partagés entre front et back (Drizzle InferSelectModel)
- Déploiement simplifié (git push → Vercel)
- Cold start rapide (Nitro serverless vs PHP)
- Moins de complexité infrastructure

### Négatives

- Moins de maturité que Laravel pour les patterns backend complexes
- Communauté Nitro plus petite que Laravel
- Supabase impose certaines contraintes (RLS obligatoire, Auth intégrée)

## Alternatives rejetées

- **Laravel + Nuxt** : 2 repos, 2 langages, 2 serveurs, complexité DevOps
- **Next.js** : React, pas l'expertise de l'équipe
- **Remix** : Trop jeune, moins de modules
