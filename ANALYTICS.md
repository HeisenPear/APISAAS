# APIGO — Analytics & Observabilité Produit

Système d'analytics basé sur **PostHog EU Cloud** (RGPD, données hébergées à Francfort).
Consentement opt-in requis. Aucune donnée avant accord explicite.

---

## Variables d'environnement requises

| Variable                   | Description                                      | Obligatoire |
| -------------------------- | ------------------------------------------------ | ----------- |
| `NUXT_PUBLIC_POSTHOG_KEY`  | Clé projet PostHog (phc\_…)                      | Oui         |
| `NUXT_PUBLIC_POSTHOG_HOST` | Host PostHog (défaut : https://eu.i.posthog.com) | Non         |
| `NUXT_BREVO_API_KEY`       | Clé Brevo pour l'email du rapport hebdo          | Non         |

---

## Architecture

| Fichier                                   | Rôle                                           |
| ----------------------------------------- | ---------------------------------------------- |
| `app/composables/useAnalyticsConsent.ts`  | État consentement RGPD (localStorage)          |
| `app/composables/useAnalytics.ts`         | Wrapper typé autour de PostHog                 |
| `app/components/AnalyticsConsent.vue`     | Bandeau cookies (opt-in / refus)               |
| `app/plugins/posthog-analytics.client.ts` | Init consentement + pageviews + DataBus bridge |
| `server/utils/posthog.ts`                 | Singleton posthog-node (events serveur)        |
| `server/api/cron/weekly-report.post.ts`   | Rapport hebdomadaire (lundi 7h UTC)            |

---

## Taxonomie des Events

### Acquisition

| Event              | Propriétés                                 | Déclenché par                    |
| ------------------ | ------------------------------------------ | -------------------------------- |
| `landing_viewed`   | —                                          | Autocapture `$pageview` (opt-in) |
| `pricing_viewed`   | —                                          | `$pageview` sur /tarifs          |
| `signup_completed` | `utm_source`, `utm_medium`, `utm_campaign` | `register.vue`                   |

### Activation

| Event                       | Propriétés                                                       | Déclenché par                         |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------- |
| `onboarding_step_completed` | `step`, `total_steps`                                            | `onboarding.vue` → nextStep()         |
| `onboarding_completed`      | `profil_apicole`, `plan_selected`, `modules_actifs`, `nb_ruches` | `onboarding.vue` → finishOnboarding() |
| `rucher_created`            | `commune`, `departement`, `environnement`                        | `ruchers/nouveau.vue` + DataBus       |
| `ruche_created`             | —                                                                | DataBus `ruche:created`               |
| `intervention_created`      | —                                                                | DataBus `intervention:created`        |

### Rétention & Engagement

| Event             | Propriétés | Déclenché par                  |
| ----------------- | ---------- | ------------------------------ |
| `user_logged_in`  | `method`   | `useAuth.login()`              |
| `user_logged_out` | —          | `useAuth.logout()`             |
| `recolte_created` | —          | DataBus `recolte:created`      |
| `vente_created`   | —          | DataBus `vente:created`        |
| `achat_created`   | —          | DataBus `achat:created`        |
| `stock_created`   | —          | DataBus `stock:created`        |
| `client_created`  | —          | DataBus `client:created`       |
| `hausse_created`  | —          | DataBus `hausse:created`       |
| `bl_created`      | —          | DataBus `bl:created`           |
| `reine_created`   | —          | DataBus `reine:created`        |
| `membre_invited`  | `role`     | DataBus `membre:invited` + API |

### Revenu (serveur, fiable)

| Event                   | Propriétés                         | Déclenché par                                       |
| ----------------------- | ---------------------------------- | --------------------------------------------------- |
| `trial_started`         | `plan`, `cycle`, `is_trial: true`  | `stripe/webhook.post.ts` checkout.session.completed |
| `subscription_started`  | `plan`, `cycle`, `is_trial: false` | `stripe/webhook.post.ts` checkout.session.completed |
| `subscription_canceled` | `source`, `anciennete_jours`       | `stripe/webhook.post.ts` subscription.deleted       |
| `checkout_started`      | `plan`                             | `stripe/checkout.post.ts`                           |

---

## Person Properties (identify au login/signup)

| Propriété             | Type           | Source                                         |
| --------------------- | -------------- | ---------------------------------------------- |
| `plan`                | string         | `profils.plan`                                 |
| `trial_active`        | boolean        | `profils.trialActive`                          |
| `onboarding_complete` | boolean        | `profils.onboardingComplete`                   |
| `nb_ruches`           | number         | Déclaré à l'onboarding                         |
| `date_inscription`    | string         | `profils.createdAt`                            |
| `departement`         | string         | 2 premiers chiffres du code postal             |
| `platform`            | 'pwa' \| 'web' | Détecté client-side (display-mode: standalone) |
| `is_pwa_installed`    | boolean        | Idem                                           |

## Group Properties (`exploitation`)

| Propriété    | Type   | Source                        |
| ------------ | ------ | ----------------------------- |
| `plan`       | string | Plan actuel de l'exploitation |
| `nb_membres` | number | Membres de l'équipe           |
| `mrr`        | number | MRR Stripe                    |
| `nb_ruches`  | number | Total ruches actives          |

---

## Dashboards PostHog

| Dashboard              | URL                                                                                         | Description                                       |
| ---------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| APIGO — Analytics      | [eu.posthog.com/…/dashboard/724885](https://eu.posthog.com/project/193691/dashboard/724885) | Vue principale — 9 insights                       |
| North Star             | Créé via MCP                                                                                | Interventions/semaine, DAU/WAU/MAU, stickiness    |
| Funnel Acquisition     | Créé via MCP                                                                                | landing → signup → onboarding → 1ère intervention |
| Rétention & Engagement | Créé via MCP                                                                                | Rétention J1/J7/J30, feature adoption, offline    |
| Revenu                 | Créé via MCP                                                                                | Trial→payant, MRR, churn, motifs                  |
| Qualité Produit        | Créé via MCP                                                                                | Erreurs, slow requests, replays                   |

---

## Cohortes PostHog

| Cohorte                            | ID     | Description                                 |
| ---------------------------------- | ------ | ------------------------------------------- |
| Apiculteurs actifs — 30j           | 146614 | ≥1 intervention dans les 30 derniers jours  |
| Trial activé — pas encore converti | 146615 | trial_started mais pas subscription_started |
| Power users — 5+ interventions/30j | 146616 | ≥5 interventions en 30 jours                |

---

## Alertes PostHog

Les alertes sont configurées sur le dashboard et envoient un **email** à antoine.martin200262@gmail.com.

| Alerte              | Condition               | Insight surveillé       |
| ------------------- | ----------------------- | ----------------------- |
| 🚨 Anomalie signups | Détection z-score (14j) | New signups over time   |
| ⚠️ DAU en chute     | Détection z-score (21j) | DAU utilisateurs actifs |

---

## Rapport Hebdomadaire Automatique

**Cron** : chaque lundi à 7h UTC → `/api/cron/weekly-report`

**Contenu** :

- Total utilisateurs + nouveaux inscrits de la semaine (variation vs S-1)
- Utilisateurs actifs (dernière activité < 7j)
- Payants + en trial
- Interventions créées (variation vs S-1)
- Ventes + récoltes

**Canaux** :

1. **Push notification** (PWA) — toujours si abonnement actif
2. **Email Brevo** — si `NUXT_BREVO_API_KEY` configuré

---

## RGPD

- Consentement **opt-in** obligatoire (bandeau `AnalyticsConsent.vue`)
- Choix persisté en localStorage (`apigo_analytics_consent`)
- IP anonymisée (`ip: false` dans la config PostHog)
- Session replay : `maskAllInputs: true` + `maskTextSelector: '*'`
- Replay désactivé jusqu'au consentement
- PostHog listé dans la politique de confidentialité
- Données hébergées en UE (Frankfurt)
