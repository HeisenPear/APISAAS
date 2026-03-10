# Audit Cybersecurite — Apiculture 360°

**Date** : 9 mars 2026
**Scope** : API routes (104), middleware, configuration, frontend
**Methodologie** : OWASP Top 10 2021, adapte Nuxt 3 + Supabase + Vercel

---

## Resume

- Tests effectues : 15
- ✅ Passes : 13
- ⚠️ Avertissements : 1 (CSP unsafe-eval)
- ❌ Echoues : 1 (ILIKE injection — CORRIGE)

---

## Detail par axe

### A.1 — Auth & Sessions

| Test                             | Resultat | Action                                              |
| -------------------------------- | -------- | --------------------------------------------------- |
| Rate limit login (5/15min)       | ✅ PASS  | En place                                            |
| Rate limit register (3/h)        | ✅ PASS  | En place                                            |
| Rate limit reset-password (3/h)  | ✅ PASS  | Ajoute Session 14                                   |
| Routes mutation sans requireAuth | ✅ PASS  | 44/44 protegees, 5 exceptions legit (auth, webhook) |

### A.2 — Injection SQL & ORM Safety

| Test                           | Resultat   | Action                                      |
| ------------------------------ | ---------- | ------------------------------------------- |
| SQL injection via query params | ✅ PASS    | Drizzle ORM parametrise                     |
| SQL injection via body         | ✅ PASS    | Zod valide uuid()                           |
| ILIKE injection (search)       | ✅ CORRIGE | 10 routes corrigees avec escapeIlike()      |
| Raw SQL audit                  | ✅ PASS    | Tous les sql`` utilisent des params Drizzle |

### A.3 — Row Level Security (RLS)

| Test                     | Resultat | Action                          |
| ------------------------ | -------- | ------------------------------- |
| RLS active toutes tables | ✅ PASS  | 13 tables protegees             |
| Policies existantes      | ✅ PASS  | user_id = auth.uid() sur toutes |
| Cross-user access (IDOR) | ✅ PASS  | Ownership verifie app + RLS DB  |

### A.4 — XSS

| Test                     | Resultat      | Action                              |
| ------------------------ | ------------- | ----------------------------------- |
| v-html avec donnees user | ✅ PASS       | Aucun v-html dans le projet         |
| innerHTML / eval         | ✅ PASS       | Aucun usage trouve                  |
| CSP headers              | ⚠️ ACCEPTABLE | unsafe-eval requis pour Vue/ECharts |

### A.5 — CSRF

| Test                       | Resultat | Action                       |
| -------------------------- | -------- | ---------------------------- |
| Bearer token (pas cookies) | ✅ PASS  | Supabase Auth JWT            |
| Webhook Stripe signature   | ✅ PASS  | Verifie dans webhook.post.ts |

### A.6 — Validation inputs

| Test                      | Resultat | Action                               |
| ------------------------- | -------- | ------------------------------------ |
| readBody sans Zod         | ✅ PASS  | Tous utilisent readValidatedBody     |
| getQuery sans Zod         | ✅ PASS  | Tous utilisent getValidatedQuery     |
| Params UUID valides       | ✅ PASS  | uuidSchema.parse() sur tous les [id] |
| File upload (magic bytes) | ✅ PASS  | JPEG/PNG/WEBP valides par octets     |

### A.7 — Secrets & configuration

| Test                 | Resultat | Action                              |
| -------------------- | -------- | ----------------------------------- |
| Secrets hardcodes    | ✅ PASS  | Aucun dans le code source           |
| runtimeConfig.public | ✅ PASS  | Seuls URL + anon key exposes        |
| .gitignore           | ✅ PASS  | .env, node_modules, .output ignores |

### A.8 — RGPD

| Test                         | Resultat | Action                        |
| ---------------------------- | -------- | ----------------------------- |
| Droit a l'effacement         | ✅ PASS  | CASCADE DELETE sur FK user_id |
| Politique de confidentialite | ✅ CREE  | /politique-confidentialite    |
| CGU                          | ✅ CREE  | /cgu                          |

### A.9 — Rate limiting & DoS

| Test                         | Resultat | Action                      |
| ---------------------------- | -------- | --------------------------- |
| Rate limit general (100/min) | ✅ PASS  | middleware 03               |
| Payload size limit           | ✅ PASS  | X-Content-Length-Limit: 1mb |
| Pagination abuse             | ✅ PASS  | Zod .max(100) sur limit     |

---

## Corrections appliquees — Session 14

1. **ILIKE injection** — 10 routes corrigees avec `escapeIlike()` :
   - stocks/index.get.ts, ruches/index.get.ts, ruchers/index.get.ts
   - production/recoltes.get.ts, production/lots.get.ts, production/lots/[numero].get.ts
   - interventions/index.get.ts, clients/index.get.ts
   - finances/ventes.get.ts, finances/achats.get.ts

2. **CSP renforcee** — Ajout Stripe (script-src, frame-src, connect-src), blob: img-src, api-adresse.data.gouv.fr

3. **Rate limit reset-password** — 3 req/h ajoute

4. **HSTS renforce** — max-age=63072000 + preload

5. **Pages legales** — politique-confidentialite.vue + cgu.vue crees

---

## Posture de securite : 🟢 BONNE (apres corrections)
