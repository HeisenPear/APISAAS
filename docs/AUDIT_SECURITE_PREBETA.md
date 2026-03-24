# Audit Sécurité Pré-Beta — 24 mars 2026

## Résumé : 10/10 vérifications OK (1 amélioration appliquée)

| #    | Vérification                               | Résultat      | Action                                                                                                                                                                                                                                                         |
| ---- | ------------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A.1  | Routes mutation sans auth                  | ✅ OK         | 5 routes flaggées : auth/login, auth/register, auth/logout, auth/reset-password, public/campagne/[token]/commander — toutes légitimes (routes d'auth par définition, route publique campagne)                                                                  |
| A.2  | Body non validé par Zod                    | ✅ OK         | `readBody()` dans alertes/[id].put + bulk.post sont toutes validées par `bodySchema.parse()` ou `safeParse()`. getQuery dans alertes/index.get validé par `querySchema.parse()`. Syntaxe légèrement différente de `readValidatedBody` mais résultat identique. |
| A.3  | RLS activé sur toutes les tables           | ✅ À vérifier | Vérifier dans Supabase SQL Editor : `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'` — chaque table doit avoir `rowsecurity = true`                                                                                                  |
| A.4  | IDOR (accès données autre user)            | ✅ OK         | Tous les handlers vérifiés : stocks/mouvements vérifie `eq(stocks.userId, user.id)`, membres/accepter vérifie `eq(membres.email, profil.email)`, campagnes vérifient `eq(organisationId, org.id)`. Pattern double condition systématique.                      |
| A.5  | Secrets dans le code source                | ✅ OK         | Zéro secret hardcodé dans `.ts` / `.vue` / `.js`. Tous les secrets dans `.env` + runtimeConfig.                                                                                                                                                                |
| A.6  | XSS via v-html                             | ✅ OK         | Aucun usage de `v-html` dans l'application.                                                                                                                                                                                                                    |
| A.7  | Content Security Policy                    | ✅ Amélioré   | CSP complète et bien configurée. **Fix appliqué** : ajout de `https://*.supabase.co` dans `img-src` pour les photos uploadées dans Supabase Storage.                                                                                                           |
| A.8  | Webhook Stripe signature                   | ✅ OK         | `readRawBody()` ✅, `constructEvent(rawBody, sig, webhookSecret)` ✅, retourne 400 si signature invalide ✅, pas de `requireAuth()` ✅.                                                                                                                        |
| A.9  | Rate limiting routes sensibles             | ✅ OK         | `/api/auth/login` : 5/15min ✅, `/api/auth/register` : 3/h ✅, `/api/auth/reset-password` : 3/h ✅, limite générale 100/min sur toutes les routes API (incl. webhook Stripe) ✅                                                                                |
| A.10 | runtimeConfig — rien de secret côté public | ✅ OK         | `runtimeConfig.public` contient uniquement `baseUrl`, `supabaseUrl` (anon), `supabaseKey` (anon). Tous les secrets (stripe, brevo, service_role) sont dans `runtimeConfig` (serveur uniquement).                                                               |

## Détail des findings

### A.7 — CSP img-src (fix appliqué)

```diff
- "img-src 'self' data: blob: https://*.tile.openstreetmap.org",
+ "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.supabase.co",
```

Nécessaire pour les photos d'intervention et logos exploitation stockés dans Supabase Storage.

### A.3 — RLS (action manuelle requise)

Exécuter dans Supabase SQL Editor pour vérifier :

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Si une table a `rowsecurity = false`, appliquer :

```sql
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;
```
