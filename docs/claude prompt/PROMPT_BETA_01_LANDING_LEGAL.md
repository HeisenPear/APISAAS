# 🐝 APICULTURE 360° — PROMPT PRÉ-BETA 1/3 : Landing Page + Pages Légales

> **Priorité** : 🔴 BLOQUANT pour les tests
> **Estimation** : 2-3 jours
> **Pré-requis** : Sprint UX + Sprint Plans intégrés

---

## POURQUOI C'EST BLOQUANT

Aujourd'hui l'app n'a pas de porte d'entrée publique. L'URL `apisaas-360.vercel.app` redirige vers `/login`. Un beta-testeur qui reçoit le lien n'a aucune idée de ce qu'est le produit. Il lui faut : une landing page qui explique la valeur, un lien pour s'inscrire, et les pages légales (obligatoires RGPD + CGI pour un service payant).

---

## 1. LANDING PAGE — `app/pages/index.vue`

### Réécriture complète

La page `index.vue` actuelle est une simple redirection. La remplacer par une vraie landing page marketing en SSR (SEO indexable).

### Structure de la page

```
[Header fixe] Logo + nav (Fonctionnalités | Tarifs | Connexion | Inscription)
    ↓
[Hero section] Titre accrocheur + sous-titre + 2 CTA (Essai gratuit | Découvrir)
    ↓
[Section problème] "63 000 apiculteurs en France, aucun outil complet"
    ↓
[Section fonctionnalités] 6 cards visuelles des modules principaux
    ↓
[Section comparaison] Tableau "Avant / Avec Apiculture 360°"
    ↓
[Section tarifs] Les 4 plans (composant réutilisable de /tarifs)
    ↓
[Section confiance] Conformité réglementaire (registre, TVA, RGPD)
    ↓
[CTA final] "Commencez gratuitement"
    ↓
[Footer] Liens légaux + contact + réseaux
```

### Contenu texte clé

**Hero :**

- Titre : "Gérez votre exploitation apicole, du rucher à la comptabilité"
- Sous-titre : "14 types d'interventions, suivi sanitaire, facturation conforme, analytics — tout dans une seule app."
- CTA 1 : "Essayer gratuitement" → `/register`
- CTA 2 : "Découvrir les fonctionnalités" → ancre `#fonctionnalites`

**6 fonctionnalités principales (cards) :**

| Icône                      | Titre                    | Description                                                                     |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------------- |
| `i-lucide-clipboard-check` | 14 types d'interventions | Contrôle, varroa, pesée, récolte, reine… Saisissez chaque visite en 30 secondes |
| `i-lucide-bar-chart-3`     | Analytics intelligents   | Score prédictif par colonie, rentabilité par ruche, suggestions saisonnières    |
| `i-lucide-wallet`          | Comptabilité conforme    | Facturation PDF, TVA multi-taux automatique, export FEC                         |
| `i-lucide-wifi-off`        | Mode hors-ligne          | Saisissez vos interventions au rucher, même sans réseau                         |
| `i-lucide-smartphone`      | App iOS & Android        | Application native pour le terrain, GPS haute précision, caméra                 |
| `i-lucide-users`           | Multi-utilisateurs       | Invitez vos associés, salariés, comptable avec des rôles dédiés                 |

**Section comparaison :**

|                           | Carnet papier | Excel  | Beekube | Apiculture 360°  |
| ------------------------- | :-----------: | :----: | :-----: | :--------------: |
| Suivi sanitaire structuré |      ❌       |   ❌   | Basique | ✅ 14 catégories |
| Facturation conforme      |      ❌       |   ❌   |   ❌    |        ✅        |
| Analytics rentabilité     |      ❌       | Manuel |   ❌    |  ✅ Automatique  |
| Mode hors-ligne           |      ✅       |   ❌   |   ❌    |        ✅        |
| Registre d'élevage PDF    |    Manuel     | Manuel |   ❌    |  ✅ Auto-généré  |

**Section conformité :**

- Registre d'élevage conforme arrêté du 5 juin 2000
- Facturation conforme art. L441-9 Code de commerce
- TVA conforme CGI (5,5% / 10% / 20% / 0%)
- Traçabilité lots Reg. CE 178/2002
- RGPD : données hébergées en France (Supabase EU)

### SEO

```typescript
// nuxt.config.ts — meta globales
app: {
  head: {
    title: 'Apiculture 360° — Logiciel de gestion apicole tout-en-un',
    meta: [
      { name: 'description', content: 'Gérez vos ruches, interventions, production et comptabilité dans un seul outil. Mode hors-ligne, facturation conforme, analytics intelligents. Essai gratuit.' },
      { name: 'keywords', content: 'logiciel apiculture, gestion rucher, suivi ruches, registre élevage apicole, facturation apiculteur, comptabilité apicole, SaaS apiculture' },
      { property: 'og:title', content: 'Apiculture 360° — Logiciel de gestion apicole' },
      { property: 'og:description', content: 'Du rucher à la comptabilité. 14 types d\'interventions, analytics, facturation conforme.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'fr_FR' },
    ],
  },
},

// Route rule : prerender la landing pour performance maximale + SEO
routeRules: {
  '/': { prerender: true },
}
```

```vue
<!-- app/pages/index.vue — useHead pour cette page -->
<script setup>
definePageMeta({ layout: false }); // Pas de sidebar

useHead({
  title: 'Apiculture 360° — Logiciel de gestion apicole tout-en-un',
  meta: [
    {
      name: 'description',
      content:
        'Gérez vos ruches, interventions, production et comptabilité. Essai gratuit 14 jours.',
    },
  ],
});

useSeoMeta({
  ogTitle: 'Apiculture 360° — Gestion apicole tout-en-un',
  ogDescription:
    "Du rucher à la comptabilité. 14 types d'interventions, analytics, facturation conforme.",
  ogImage: '/og-image.jpg', // À créer : 1200×630px
});
</script>
```

### Design Warm Precision

- Fond hero : gradient subtil `#FAFAF8` → `#F3F2EF`
- Accent : honey `#F5A623` sur les CTA et les highlights
- Typographie : SF Pro Display / Inter, titres 3xl-5xl, corps 15px
- Cards fonctionnalités : fond blanc, ombre chaude, radius 16px, icône honey
- Animations : apparition stagger au scroll (`IntersectionObserver` ou `@vueuse/motion`)
- Mobile-first, responsive 1 col → 2 col → 3 col

### Layout spécifique landing

```
definePageMeta({ layout: false });
```

La landing n'utilise PAS le layout `default.vue` (pas de sidebar). Elle a son propre header transparent + footer.

### Composants à créer

```
app/components/landing/
├── LandingHeader.vue      # Header transparent, CTA login/register
├── LandingHero.vue        # Hero section
├── LandingFeatures.vue    # 6 cards fonctionnalités
├── LandingComparison.vue  # Tableau comparaison
├── LandingPricing.vue     # Composant plans (réutilise la logique de /tarifs)
├── LandingCompliance.vue  # Section conformité réglementaire
├── LandingCta.vue         # CTA final
└── LandingFooter.vue      # Footer avec liens légaux
```

### Comportement auth

```typescript
// Si l'utilisateur est DÉJÀ connecté et va sur /
// → Rediriger vers /dashboard (pas de landing pour les users connectés)

const user = useSupabaseUser();
if (user.value) {
  navigateTo('/dashboard');
}
```

---

## 2. PAGES LÉGALES

### `app/pages/mentions-legales.vue`

Obligatoire pour tout site commercial français (loi n° 2004-575 du 21 juin 2004).

```
Contenu :
- Éditeur : La Jocondienne, [adresse], SIRET [à remplir], RCS [à remplir]
- Responsable publication : Antoine [nom], [email]
- Hébergeur : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA
- Base de données : Supabase (serveurs EU, Francfort)
- Contact : [email]
```

### `app/pages/politique-confidentialite.vue`

Obligatoire RGPD + requis pour les stores iOS/Android.

```
Structure :
1. Responsable de traitement (La Jocondienne, coordonnées DPO)
2. Données collectées (email, nom, prénom, adresse, NAPI, SIRET, géolocalisation ruchers)
3. Finalités (gestion du compte, fonctionnement du service, facturation, améliorations)
4. Base légale (exécution du contrat art. 6.1.b RGPD, consentement pour analytics)
5. Durée de conservation (compte actif + 3 ans après suppression, factures 10 ans)
6. Destinataires (Supabase, Stripe, Vercel, Brevo — pas de revente)
7. Transferts hors UE (Vercel US — clauses contractuelles types)
8. Droits (accès, rectification, effacement, portabilité, opposition — via email ou /parametres)
9. Cookies (aucun cookie tiers, uniquement session Supabase Auth)
10. Sécurité (chiffrement transit TLS, RLS PostgreSQL, mots de passe hashés bcrypt)
11. Contact DPO + réclamation CNIL
```

### `app/pages/cgu.vue`

Conditions Générales d'Utilisation — encadrent l'abonnement.

```
Structure :
1. Objet (accès au service SaaS Apiculture 360°)
2. Inscription (email valide, mot de passe, données véridiques)
3. Plans et tarifs (Découverte gratuit, Starter 9,99€, Pro 39,99€, Expert 79,99€)
4. Période d'essai (14 jours Pro, activable une fois, sans engagement)
5. Paiement (Stripe, prélèvement mensuel ou annuel, renouvellement auto)
6. Résiliation (à tout moment depuis Paramètres, effet fin de période)
7. Données utilisateur (propriété de l'utilisateur, export disponible, suppression sur demande)
8. Responsabilité (service "as is", pas de garantie de résultat, SLA best-effort)
9. Propriété intellectuelle (le logiciel appartient à La Jocondienne)
10. Modification des CGU (notification email 30j avant, acceptation tacite)
11. Droit applicable (droit français, tribunal compétent [ville])
12. Date d'entrée en vigueur
```

### Toutes les pages légales

- `definePageMeta({ layout: false })` — même layout que la landing (header/footer simple)
- Typographie lisible : `max-width: 768px`, `font-size: 15px`, `line-height: 1.7`
- Numérotation des articles
- Lien retour vers la landing en haut
- Dernier paragraphe : "Dernière mise à jour : [date]"

### `app/pages/tarifs.vue` — Rappel

Cette page existe déjà dans le Sprint Plans. Vérifier qu'elle est accessible depuis la landing (lien dans le header + section pricing qui pointe vers elle OU intégrée directement dans la landing).

---

## 3. FOOTER + NAVIGATION PUBLIQUE

### Liens à ajouter partout

**Landing footer :**

- Mentions légales → `/mentions-legales`
- Politique de confidentialité → `/politique-confidentialite`
- CGU → `/cgu`
- Tarifs → `/tarifs`
- Contact → `mailto:contact@apiculture360.com`

**Pages auth (login, register) :**

- Ajouter un mini-footer avec les 3 liens légaux

**App connectée (sidebar ou settings) :**

- Lien vers CGU + Politique dans la page Paramètres (section "Légal")

---

## 4. IMAGE OG + FAVICON

### Open Graph image : `public/og-image.jpg`

- Dimensions : 1200×630px
- Contenu : Logo Apiculture 360° + tagline + aperçu du dashboard (screenshot)
- Fond : honey gradient subtil
- Utilisé par les previews Facebook/Twitter/LinkedIn/WhatsApp quand le lien est partagé

### Favicon

Vérifier que `public/favicon.ico` existe et est un vrai favicon (pas le Nuxt default).

---

## CHECKLIST

- [ ] Réécrire `app/pages/index.vue` en landing page complète
- [ ] Créer 8 composants landing (`app/components/landing/`)
- [ ] Ajouter SEO meta + OG tags dans nuxt.config.ts
- [ ] Route rule prerender sur `/`
- [ ] Redirection `/` → `/dashboard` si connecté
- [ ] Créer `app/pages/mentions-legales.vue`
- [ ] Créer `app/pages/politique-confidentialite.vue`
- [ ] Créer `app/pages/cgu.vue`
- [ ] Ajouter footer avec liens légaux sur la landing
- [ ] Ajouter mini-footer sur les pages auth
- [ ] Ajouter section "Légal" dans Paramètres
- [ ] Créer `public/og-image.jpg` (1200×630)
- [ ] Vérifier favicon
- [ ] `npm run typecheck` → 0 erreurs
- [ ] `npm run build` → PASS
- [ ] Vérifier le prerender : `curl https://apisaas-360.vercel.app/` retourne du HTML complet (pas un shell SPA vide)
