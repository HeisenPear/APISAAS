## Ce que fait cette PR

<!-- Description courte de la feature ou du fix -->

## Type de changement

- [ ] ✨ Feature
- [ ] 🐛 Fix
- [ ] 🔧 Refacto / perf
- [ ] 📊 Analytics / infra
- [ ] 🔒 Sécurité

## Checklist avant merge dans `develop`

- [ ] `npm run typecheck` → 0 erreur
- [ ] `npm run lint` → 0 erreur
- [ ] `npm run test` → tous les tests passent
- [ ] Testé sur le preview Vercel de la branche
- [ ] Pas de clé secrète commitée

## Checklist avant merge `develop` → `main` (prod)

- [ ] Testé sur staging (`develop.apigo.fr` ou preview Vercel)
- [ ] Migrations DB appliquées si nécessaire
- [ ] Variables d'env Vercel Production à jour
