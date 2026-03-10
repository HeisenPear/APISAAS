# 🐝 APICULTURE 360° — SPRINT UX & OPTIMISATION

> **Version** : 1.0 — Mars 2026
> **Priorité** : 🔴 CRITIQUE — À exécuter AVANT toute nouvelle feature
> **Objectif** : Rendre l'app fluide et intelligente — zéro refresh manuel, navigation contextuelle, pré-remplissage cross-module

---

## 📋 TABLE DES MATIÈRES

1. [Diagnostic — Les 5 problèmes structurels](#1-diagnostic--les-5-problèmes-structurels)
2. [AXE 1 — Invalidation de cache centralisée](#2-axe-1--invalidation-de-cache-centralisée)
3. [AXE 2 — Redirections intelligentes post-action](#3-axe-2--redirections-intelligentes-post-action)
4. [AXE 3 — Pré-remplissage cross-module](#4-axe-3--pré-remplissage-cross-module)
5. [AXE 4 — Optimistic updates](#5-axe-4--optimistic-updates)
6. [AXE 5 — Liens contextuels "Et ensuite ?"](#6-axe-5--liens-contextuels-et-ensuite-)
7. [AXE 6 — Consolidation bugs récurrents](#7-axe-6--consolidation-bugs-récurrents)
8. [AXE 7 — Performance perçue](#8-axe-7--performance-perçue)
9. [Conventions — Rappel](#9-conventions--rappel)
10. [Checklist d'implémentation](#10-checklist-dimplémentation)
11. [Matrice de tests](#11-matrice-de-tests)

---

## 1. DIAGNOSTIC — LES 5 PROBLÈMES STRUCTURELS

### Problème 1 — Cache stale après mutation (le pire)

Historique des occurrences :

- **Session 5** : `useFetch` key partagée entre pages → cache stale → création ruche en boucle infinie
- **Session 5** : `ComputedRef` comme key → `refresh()` cassé → "[object Object]" comme clé
- **Session 6** : Double refresh lent (composable + page), données stales en naviguant retour
- **Session 6** : Pages listes sans `onMounted(() => refresh())` → données jamais mises à jour
- **Session 15** : `useFetch` avec `lazy: true` → Nuxt sert le cache sans refetch

**Pattern actuel (cassé)** :

```
User crée intervention → $fetch POST → succès → navigateTo('/interventions')
→ Page liste lit le cache useFetch → ANCIENNES DONNÉES → user refresh F5 → OK
```

**Pattern cible** :

```
User crée intervention → $fetch POST → succès → émet événement 'intervention:created'
→ navigateTo('/interventions') → composable reçoit l'événement → refresh() auto → NOUVELLES DONNÉES
```

### Problème 2 — Modules déconnectés (silos)

| Action                          | Comportement actuel                                 | Comportement attendu                                        |
| ------------------------------- | --------------------------------------------------- | ----------------------------------------------------------- |
| Récolte via wizard intervention | Crée `recoltes` avec `quantite_kg = 0` → c'est tout | Toast "Récolte créée" + lien "Compléter la quantité →"      |
| Division crée 3 ruches          | Ruches créées silencieusement                       | Page confirmation avec liens vers les 3 ruches              |
| Traitement varroa               | Record dans `traitements_varroa` → rien côté stock  | Proposition de décrémenter le stock du produit              |
| Créer client                    | Retour liste clients                                | Proposition "Créer une vente pour ce client ?"              |
| Essaim mort                     | Statut ruche → `'morte'` → c'est tout               | Proposition "Nettoyer la ruche ?" + rappel déclaration GDSA |

### Problème 3 — Navigation redondante

Un apiculteur qui visite 30 ruches dans un rucher doit :

1. Aller sur la fiche rucher
2. Cliquer une ruche
3. Cliquer "Nouvelle intervention"
4. Re-sélectionner la ruche (étape 1 du wizard) ← **ABSURDE**
5. Remplir le formulaire
6. Retourner sur la fiche rucher
7. Cliquer la ruche suivante
8. Répéter 30 fois

**Cible** : Depuis la fiche ruche, "Nouvelle intervention" skip l'étape 1 et pré-remplit la ruche. Après la sauvegarde, retour sur la fiche ruche (pas la liste interventions).

### Problème 4 — Zéro feedback visuel sur les mutations

Quand l'utilisateur clique "Enregistrer" :

- Pas de loading state visible sur le bouton (`:loading` pas toujours branché)
- Pas de toast de succès systématique
- Pas d'animation de transition (l'élément apparaît juste dans la liste)

### Problème 5 — Patterns de bugs récurrents

| Bug pattern                                   |    Occurrences    | Cause racine                                             |
| --------------------------------------------- | :---------------: | -------------------------------------------------------- |
| `new Date()` dans `sql\`\``                   |    Session 14     | postgres.js ne sérialise pas les Date objects en raw SQL |
| `v-model.number` retourne `""` sur input vide |    Session 15     | Vue parseFloat échoue → retourne string vide             |
| Noms composants auto-importés mal devinés     |    Session 14     | Nuxt 4 déduplique le préfixe répertoire                  |
| `useFetch` cache stale                        | Sessions 5, 6, 15 | Pas d'invalidation après mutation                        |
| ECharts init avec container 0px               |  Sessions 6, 14   | Transition de page, DOM pas encore layouté               |

---

## 2. AXE 1 — INVALIDATION DE CACHE CENTRALISÉE

### Architecture : Event Bus réactif

Créer un système centralisé où :

1. Chaque mutation émet un événement typé
2. Chaque composable de liste s'abonne aux événements pertinents
3. Le refresh est automatique, sans code dans les pages

### `app/composables/useDataBus.ts`

```typescript
// Bus d'événements réactif pour invalidation de cache

type DataEvent =
  | 'rucher:created'
  | 'rucher:updated'
  | 'rucher:deleted'
  | 'ruche:created'
  | 'ruche:updated'
  | 'ruche:deleted'
  | 'intervention:created'
  | 'intervention:deleted'
  | 'recolte:created'
  | 'recolte:updated'
  | 'recolte:deleted'
  | 'stock:created'
  | 'stock:updated'
  | 'stock:deleted'
  | 'stock:mouvement'
  | 'client:created'
  | 'client:updated'
  | 'client:deleted'
  | 'vente:created'
  | 'vente:updated'
  | 'vente:deleted'
  | 'achat:created'
  | 'alerte:read'
  | 'alerte:deleted'
  | 'membre:invited'
  | 'membre:updated'
  | 'membre:removed';

// Payload optionnel avec l'ID de l'entité concernée
interface DataEventPayload {
  id?: string;
  parentId?: string; // ex: rucherId pour une ruche
  extra?: Record<string, unknown>;
}

const listeners = new Map<DataEvent, Set<(payload?: DataEventPayload) => void>>();

export function useDataBus() {
  function emit(event: DataEvent, payload?: DataEventPayload) {
    const handlers = listeners.get(event);
    if (handlers) {
      handlers.forEach((fn) => fn(payload));
    }
  }

  function on(event: DataEvent | DataEvent[], handler: (payload?: DataEventPayload) => void) {
    const events = Array.isArray(event) ? event : [event];
    events.forEach((e) => {
      if (!listeners.has(e)) listeners.set(e, new Set());
      listeners.get(e)!.add(handler);
    });

    // Cleanup automatique au unmount du composant
    if (getCurrentInstance()) {
      onUnmounted(() => {
        events.forEach((e) => listeners.get(e)?.delete(handler));
      });
    }

    // Retourne une fonction de cleanup manuelle
    return () => {
      events.forEach((e) => listeners.get(e)?.delete(handler));
    };
  }

  return { emit, on };
}
```

### Intégration dans les composables existants

#### Pattern AVANT (chaque composable) :

```typescript
// useRuchers.ts — AVANT
export function useRuchers() {
  const { data, refresh } = useFetch('/api/ruchers', {
    key: 'ruchers-list',
    dedupe: 'defer',
  });

  async function createRucher(body: CreateRucherPayload) {
    const result = await $fetch('/api/ruchers', { method: 'POST', body });
    // ❌ Pas de refresh → liste stale
    return result;
  }

  return { data, refresh, createRucher };
}
```

#### Pattern APRÈS :

```typescript
// useRuchers.ts — APRÈS
export function useRuchers() {
  const { emit, on } = useDataBus();

  const { data, refresh } = useFetch('/api/ruchers', {
    key: 'ruchers-list',
    dedupe: 'defer',
  });

  // Auto-refresh quand un rucher change
  on(
    ['rucher:created', 'rucher:updated', 'rucher:deleted', 'ruche:created', 'ruche:deleted'],
    () => {
      refresh();
    },
  );

  async function createRucher(body: CreateRucherPayload) {
    const result = await $fetch('/api/ruchers', { method: 'POST', body });
    emit('rucher:created', { id: result.data?.id });
    return result;
  }

  async function updateRucher(id: string, body: UpdateRucherPayload) {
    const result = await $fetch(`/api/ruchers/${id}`, { method: 'PUT', body });
    emit('rucher:updated', { id });
    return result;
  }

  async function deleteRucher(id: string) {
    await $fetch(`/api/ruchers/${id}`, { method: 'DELETE' });
    emit('rucher:deleted', { id });
  }

  return { data, refresh, createRucher, updateRucher, deleteRucher };
}
```

### Mapping événements → composables à rafraîchir

| Événement émis                    | Composables qui doivent refresh                           |
| --------------------------------- | --------------------------------------------------------- |
| `rucher:created/updated/deleted`  | useRuchers, useDashboard                                  |
| `ruche:created/updated/deleted`   | useRuches, useRuchers (compteur), useDashboard            |
| `intervention:created`            | useInterventions, useDashboard, useAlertes (side-effects) |
| `recolte:created/updated`         | useProduction, useDashboard                               |
| `stock:created/updated/mouvement` | useStocks                                                 |
| `client:created/updated/deleted`  | useClients                                                |
| `vente:created`                   | useFinances, useStocks (auto-déduction), useDashboard     |
| `achat:created`                   | useFinances, useStocks (auto-ajout)                       |
| `alerte:read/deleted`             | useAlertes, useDashboard (compteur badge header)          |

### Composables à modifier (11 fichiers)

```
app/composables/useRuchers.ts      → on(['rucher:*', 'ruche:*'])
app/composables/useRuches.ts       → on(['ruche:*'])
app/composables/useInterventions.ts → on(['intervention:*'])
app/composables/useProduction.ts   → on(['recolte:*'])
app/composables/useStocks.ts       → on(['stock:*', 'vente:created', 'achat:created'])
app/composables/useClients.ts      → on(['client:*'])
app/composables/useFinances.ts     → on(['vente:*', 'achat:*'])
app/composables/useAlertes.ts      → on(['alerte:*', 'intervention:created'])
app/composables/useDashboard.ts    → on(['ruche:*', 'intervention:*', 'recolte:*', 'vente:*'])
app/composables/useMembres.ts      → on(['membre:*'])
app/composables/useTemplatesIntervention.ts → (pas de mutation cross-module)
```

### Supprimer les `onMounted(() => refresh())` manuels

Après l'intégration du bus, **supprimer** tous les `onMounted(() => refresh())` dans les pages listes. Le bus s'en charge. Chercher et nettoyer :

```bash
grep -rn "onMounted.*refresh" app/pages/ --include="*.vue"
```

---

## 3. AXE 2 — REDIRECTIONS INTELLIGENTES POST-ACTION

### Composable `usePostAction.ts`

```typescript
// app/composables/usePostAction.ts

interface PostActionOptions {
  // Toast de succès
  toast: {
    title: string;
    description?: string;
  };
  // Redirection principale
  redirect?: string;
  // OU retour contextuel (d'où l'user venait)
  returnToOrigin?: boolean;
  // Lien d'action secondaire dans le toast
  followUp?: {
    label: string;
    to: string;
  };
}

export function usePostAction() {
  const router = useRouter();
  const route = useRoute();
  const { emit } = useDataBus();
  const notifications = useNotifications();

  function execute(event: DataEvent, payload: DataEventPayload, options: PostActionOptions) {
    // 1. Émettre l'événement bus
    emit(event, payload);

    // 2. Toast de succès
    if (options.followUp) {
      notifications.success(options.toast.title, {
        description: options.toast.description,
        actions: [
          {
            label: options.followUp.label,
            click: () => navigateTo(options.followUp!.to),
          },
        ],
      });
    } else {
      notifications.success(options.toast.title, {
        description: options.toast.description,
      });
    }

    // 3. Navigation
    if (options.returnToOrigin && route.query.from) {
      // Retour à la page d'origine (ex: fiche ruche)
      navigateTo(route.query.from as string);
    } else if (options.redirect) {
      navigateTo(options.redirect);
    }
    // Si ni l'un ni l'autre → rester sur la page actuelle
  }

  return { execute };
}
```

### Cas d'usage concrets

#### Création intervention depuis fiche ruche

```typescript
// app/pages/interventions/nouvelle.vue

const postAction = usePostAction();

async function onSubmit() {
  const result = await $fetch('/api/interventions/bulk', { method: 'POST', body: payload });

  postAction.execute(
    'intervention:created',
    { id: result.data.inspection.id },
    {
      toast: { title: 'Intervention enregistrée' },
      returnToOrigin: true, // Retour vers /ruches/[id] si on venait de là
      followUp: hasRecolte
        ? {
            label: 'Compléter la récolte →',
            to: `/production/recoltes/${result.data.results.recolte?.id}`,
          }
        : undefined,
    },
  );
}
```

#### Création ruche depuis fiche rucher

```typescript
// app/pages/ruchers/[id].vue — dans le handler de création ruche

postAction.execute(
  'ruche:created',
  { id: newRuche.id, parentId: rucherId },
  {
    toast: { title: `Ruche ${newRuche.numero} créée` },
    redirect: undefined, // Rester sur la page rucher (le bus rafraîchit la liste)
  },
);
```

#### Division crée 3 ruches

```typescript
// server/services/interventions/division.ts — retourne les IDs des ruches créées
// app/pages/interventions/nouvelle.vue — post-submit

if (result.data.results.division) {
  const ruchesCreees = result.data.results.division.ruchesCreees; // [{id, numero}]
  postAction.execute(
    'intervention:created',
    { id: result.data.inspection.id },
    {
      toast: {
        title: `Division effectuée — ${ruchesCreees.length} ruches créées`,
        description: ruchesCreees.map((r) => r.numero).join(', '),
      },
      returnToOrigin: true,
      followUp: {
        label: `Voir les ${ruchesCreees.length} nouvelles ruches →`,
        to: `/ruches?from=division&ids=${ruchesCreees.map((r) => r.id).join(',')}`,
      },
    },
  );
}
```

#### Essaim mort → Proposition actions suivantes

```typescript
// Après sanitaire type 'essaim_mort'
postAction.execute(
  'intervention:created',
  { id: result.data.inspection.id },
  {
    toast: {
      title: 'Mortalité enregistrée',
      description: 'La ruche a été marquée comme morte',
    },
    returnToOrigin: true,
    followUp: {
      label: 'Nettoyer cette ruche →',
      to: `/interventions/nouvelle?rucheId=${rucheId}&preselect=sanitaire`,
    },
  },
);
```

### Tableau des redirections cibles

| Action                     | Origine             | Destination             | Follow-up                        |
| -------------------------- | ------------------- | ----------------------- | -------------------------------- |
| Créer intervention         | Fiche ruche         | Retour fiche ruche      | "Compléter récolte →" si récolte |
| Créer intervention         | Liste interventions | Retour liste            | —                                |
| Créer intervention groupée | Page groupe         | Retour page groupe      | "Voir les résultats →"           |
| Créer ruche                | Fiche rucher        | Rester (bus refresh)    | —                                |
| Créer ruche                | Liste ruches        | Rester (bus refresh)    | —                                |
| Créer rucher               | Liste ruchers       | Fiche du nouveau rucher | —                                |
| Créer client               | Liste clients       | Fiche du nouveau client | "Créer une vente →"              |
| Créer vente                | Liste ventes        | Fiche facture           | "Voir la facture PDF →"          |
| Division                   | Fiche ruche         | Retour fiche ruche      | "Voir les X nouvelles ruches →"  |
| Essaim mort                | Fiche ruche         | Retour fiche ruche      | "Nettoyer la ruche →"            |
| Traitement varroa          | Fiche ruche         | Retour fiche ruche      | "Décrémenter le stock →"         |

---

## 4. AXE 3 — PRÉ-REMPLISSAGE CROSS-MODULE

### Mécanisme : Query params + détection dans les pages

Chaque formulaire de création doit lire les query params au montage et pré-remplir les champs correspondants.

### URLs de pré-remplissage

```
# Intervention avec ruche pré-sélectionnée (skip étape 1)
/interventions/nouvelle?rucheId=xxx

# Intervention avec ruche ET catégories pré-sélectionnées
/interventions/nouvelle?rucheId=xxx&preselect=controle,pesee

# Intervention groupée avec rucher pré-sélectionné (toutes ses ruches)
/interventions/groupe?rucherId=xxx

# Vente avec client pré-sélectionné
/finances/ventes?clientId=xxx&action=create

# Récolte avec ruche pré-sélectionnée
/production/recoltes?rucheId=xxx&action=create

# Ruche avec rucher pré-sélectionné
/ruches/nouveau?rucherId=xxx

# Paramètre générique "d'où je viens" pour le retour contextuel
?from=/ruches/[id]
```

### Implémentation dans `interventions/nouvelle.vue`

```typescript
// app/pages/interventions/nouvelle.vue

const route = useRoute();

// Pré-remplissage ruche
const preselectedRucheId = computed(() => route.query.rucheId as string | undefined);
const preselectedCategories = computed(
  () => (route.query.preselect as string)?.split(',').filter(Boolean) ?? [],
);

// Si rucheId est fourni → skip étape 1, aller directement à l'étape 2
const initialStep = ref(preselectedRucheId.value ? 2 : 1);

// Au montage, si rucheId fourni → le sélectionner
onMounted(() => {
  if (preselectedRucheId.value) {
    selectedRucheId.value = preselectedRucheId.value;
  }
  if (preselectedCategories.value.length) {
    selectedCategories.value = preselectedCategories.value;
  }
});
```

### Boutons d'action contextuels à modifier

#### Fiche ruche → "Nouvelle intervention"

```vue
<!-- app/pages/ruches/[id].vue — AVANT -->
<UButton to="/interventions/nouvelle" icon="i-lucide-plus" color="primary">
  Nouvelle intervention
</UButton>

<!-- APRÈS -->
<UButton
  :to="`/interventions/nouvelle?rucheId=${ruche.id}&from=/ruches/${ruche.id}`"
  icon="i-lucide-plus"
  color="primary"
>
  Nouvelle intervention
</UButton>
```

#### Fiche rucher → "Ajouter une ruche"

```vue
<!-- app/pages/ruchers/[id].vue — APRÈS -->
<UButton
  :to="`/ruches/nouveau?rucherId=${rucher.id}&from=/ruchers/${rucher.id}`"
  icon="i-lucide-plus"
  color="primary"
>
  Ajouter une ruche
</UButton>
```

#### Fiche client → "Créer une vente"

```vue
<!-- app/pages/clients/[id].vue — APRÈS -->
<UButton
  :to="`/finances/ventes?clientId=${client.id}&action=create&from=/clients/${client.id}`"
  icon="i-lucide-plus"
  variant="outline"
  color="neutral"
>
  Créer une vente
</UButton>
```

#### Dashboard → Quick Actions

```vue
<!-- QuickActions.vue — APRÈS (si dernier rucher connu) -->
<UButton :to="`/interventions/nouvelle?rucherId=${lastVisitedRucherId}`">
  Nouvelle intervention
</UButton>
```

### Pages à modifier pour lire les query params

| Page                         | Query params à lire            | Effet                                       |
| ---------------------------- | ------------------------------ | ------------------------------------------- |
| `interventions/nouvelle.vue` | `rucheId`, `preselect`, `from` | Skip étape 1 + pré-sélection catégories     |
| `interventions/groupe.vue`   | `rucherId`, `from`             | Pré-sélection toutes ruches du rucher       |
| `ruches/nouveau.vue`         | `rucherId`, `from`             | Pré-sélection rucher dans le formulaire     |
| `finances/ventes.vue`        | `clientId`, `action`, `from`   | Ouvrir modal vente avec client pré-rempli   |
| `production/recoltes.vue`    | `rucheId`, `action`, `from`    | Ouvrir modal récolte avec ruche pré-remplie |

---

## 5. AXE 4 — OPTIMISTIC UPDATES

### Principe

Pour les actions simples et réversibles, mettre à jour l'UI **avant** la réponse serveur. Si l'API échoue, rollback.

### Cas d'usage prioritaires

#### Marquer alerte comme lue

```typescript
// app/composables/useAlertes.ts

async function markRead(alerteId: string) {
  // 1. Optimistic : marquer comme lue immédiatement dans le state local
  const previousState = data.value?.data?.find((a) => a.id === alerteId);
  if (data.value?.data) {
    const alerte = data.value.data.find((a) => a.id === alerteId);
    if (alerte) alerte.lue = true;
  }

  try {
    // 2. Envoyer au serveur
    await $fetch(`/api/alertes/${alerteId}`, { method: 'PUT', body: { lue: true } });
    emit('alerte:read', { id: alerteId });
  } catch (e) {
    // 3. Rollback si erreur
    if (previousState && data.value?.data) {
      const alerte = data.value.data.find((a) => a.id === alerteId);
      if (alerte) alerte.lue = false;
    }
    notifications.error('Erreur lors de la mise à jour');
  }
}
```

#### Supprimer alerte (avec animation)

```typescript
async function removeAlerte(alerteId: string) {
  // 1. Optimistic : retirer de la liste avec animation fade-out
  const index = data.value?.data?.findIndex((a) => a.id === alerteId) ?? -1;
  const removed = data.value?.data?.splice(index, 1)[0];

  try {
    await $fetch(`/api/alertes/${alerteId}`, { method: 'DELETE' });
    emit('alerte:deleted', { id: alerteId });
  } catch (e) {
    // Rollback : remettre l'alerte
    if (removed && data.value?.data) {
      data.value.data.splice(index, 0, removed);
    }
    notifications.error('Erreur lors de la suppression');
  }
}
```

#### Toggle statut stock (actif/inactif)

Même pattern : modifier l'UI → requête → rollback si erreur.

### Composable utilitaire `useOptimistic.ts`

```typescript
// app/composables/useOptimistic.ts

export function useOptimistic() {
  async function execute<T>(
    optimisticFn: () => T, // Applique le changement optimiste, retourne le state précédent
    serverFn: () => Promise<void>, // Appel serveur
    rollbackFn: (previous: T) => void, // Annulation si erreur
  ) {
    const previous = optimisticFn();
    try {
      await serverFn();
    } catch (e) {
      rollbackFn(previous);
      const msg = getApiErrorMessage(e, 'Erreur lors de la mise à jour');
      useNotifications().error(msg);
      throw e;
    }
  }
  return { execute };
}
```

---

## 6. AXE 5 — LIENS CONTEXTUELS "ET ENSUITE ?"

### Composant `PostActionToast.vue`

Les toasts Nuxt UI supportent des actions (boutons cliquables). Utiliser ce mécanisme pour proposer des actions de suivi après chaque mutation.

### Mapping actions → follow-ups

```typescript
// app/utils/followUps.ts

interface FollowUp {
  label: string;
  to: string;
  icon?: string;
}

// Retourne les follow-ups pertinents selon le contexte
export function getFollowUps(
  event: DataEvent,
  context: { rucheId?: string; rucherId?: string; clientId?: string; recolteId?: string },
): FollowUp[] {
  switch (event) {
    case 'intervention:created':
      return [
        context.rucheId && {
          label: 'Voir la ruche',
          to: `/ruches/${context.rucheId}`,
          icon: 'i-lucide-eye',
        },
      ].filter(Boolean) as FollowUp[];

    case 'recolte:created':
      return [
        {
          label: 'Compléter la quantité',
          to: `/production/recoltes/${context.recolteId}`,
          icon: 'i-lucide-edit',
        },
        { label: 'Voir la production', to: '/production', icon: 'i-lucide-bar-chart' },
      ];

    case 'client:created':
      return [
        {
          label: 'Créer une vente',
          to: `/finances/ventes?clientId=${context.clientId}&action=create`,
          icon: 'i-lucide-receipt',
        },
      ];

    case 'vente:created':
      return [
        {
          label: 'Voir la facture',
          to: `/finances/facture/${context.id}`,
          icon: 'i-lucide-file-text',
        },
      ];

    case 'ruche:created':
      return [
        {
          label: 'Nouvelle intervention',
          to: `/interventions/nouvelle?rucheId=${context.id}`,
          icon: 'i-lucide-plus',
        },
      ];

    default:
      return [];
  }
}
```

### Intégration dans usePostAction

```typescript
// Le toast affiche le premier follow-up comme action cliquable
// Les autres sont disponibles dans un dropdown si besoin

notifications.success(title, {
  description,
  actions: followUps.slice(0, 2).map((fu) => ({
    label: fu.label,
    click: () => navigateTo(fu.to),
  })),
  timeout: 8000, // 8 secondes (plus long car il y a une action)
});
```

---

## 7. AXE 6 — CONSOLIDATION BUGS RÉCURRENTS

### 6.1 — Guard `sql` template literals

Créer un utilitaire qui empêche de passer des `Date` objects dans les templates SQL :

```typescript
// server/utils/sql-helpers.ts

import { sql } from 'drizzle-orm';

// Helper safe pour les dates dans les templates SQL
export function sqlDate(date: Date | string): string {
  if (date instanceof Date) return date.toISOString();
  return date;
}

// Helper safe pour les comparaisons de dates
export function sqlDateRange(start: Date | string, end: Date | string) {
  return {
    start: sqlDate(start),
    end: sqlDate(end),
  };
}

// Pattern d'utilisation :
// AVANT (DANGER) :
// sql`created_at >= ${new Date(2026, 0, 1)}`  ← CRASH
// APRÈS (SAFE) :
// sql`created_at >= ${sqlDate(new Date(2026, 0, 1))}`
```

**Action** : Grep tout le codebase serveur et remplacer chaque `new Date()` dans un `sql\`\``par`sqlDate()`.

### 6.2 — Guard `v-model.number` input vide

```typescript
// app/utils/form-helpers.ts

// Vérifie qu'une valeur est un nombre fini (pas NaN, pas Infinity, pas "")
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

// Nettoie un champ numérique avant envoi API
// Retourne le nombre ou undefined (pour que Zod le gère côté serveur)
export function cleanNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}
```

**Action** : Utiliser `cleanNumber()` dans tous les formulaires avant d'envoyer les données au serveur. Particulièrement dans :

- `interventions/nouvelle.vue` (meteo.temperature, pesee.poidsKg)
- `FormPesee.vue`, `FormNourrissement.vue`, `FormVarroa.vue`
- `RecolteForm.vue` (quantite, humidite)

### 6.3 — Guard ECharts init

```typescript
// app/utils/echarts-helpers.ts

import type { ECharts } from 'echarts';

// Init safe d'un chart ECharts
// Attend que le conteneur ait des dimensions avant d'initialiser
export async function safeInitChart(
  container: HTMLElement,
  initFn: (el: HTMLElement) => ECharts,
): Promise<ECharts | null> {
  await nextTick();

  // Attendre que le conteneur ait des dimensions (max 500ms)
  let attempts = 0;
  while (container.clientWidth === 0 && attempts < 10) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    attempts++;
  }

  if (container.clientWidth === 0) {
    console.warn('ECharts container has zero width after 10 frames');
    return null;
  }

  return initFn(container);
}
```

**Action** : Remplacer tous les `echarts.init(container)` dans `onMounted` par `safeInitChart()`.

### 6.4 — Convention noms de composants

```typescript
// RÈGLE : ne jamais utiliser le nom du dossier comme préfixe du composant
// car Nuxt 4 déduplique automatiquement

// ✅ BON :
// components/production/ProductionChart.vue → <ProductionChart>
// (Nuxt 4 retire le doublon "Production" du préfixe)

// ❌ MAUVAIS dans le template :
// <ProductionProductionChart> → composant introuvable

// CONVENTION PROJET :
// Toujours vérifier le nom auto-importé avec :
// npx nuxi prepare → vérifie dans .nuxt/components.d.ts
```

---

## 8. AXE 7 — PERFORMANCE PERÇUE

### 7.1 — Loading states systématiques

Créer un composable pour gérer les états de chargement des mutations :

```typescript
// app/composables/useMutationState.ts

export function useMutationState() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function execute<T>(fn: () => Promise<T>): Promise<T | null> {
    loading.value = true;
    error.value = null;
    try {
      const result = await fn();
      return result;
    } catch (e) {
      error.value = getApiErrorMessage(e, 'Une erreur est survenue');
      return null;
    } finally {
      loading.value = false;
    }
  }

  return { loading: readonly(loading), error: readonly(error), execute };
}
```

Utilisation dans les pages :

```vue
<script setup>
const { loading: saving, execute } = useMutationState();

async function onSubmit() {
  const result = await execute(() =>
    $fetch('/api/interventions/bulk', { method: 'POST', body: payload })
  );
  if (result) {
    postAction.execute('intervention:created', ...);
  }
}
</script>

<template>
  <UButton :loading="saving" color="primary" @click="onSubmit"> Enregistrer </UButton>
</template>
```

**Action** : Passer en revue TOUS les boutons d'action dans les pages et brancher `:loading`.

### 7.2 — Transitions de liste (animation ajout/suppression)

```vue
<!-- Pattern pour les listes qui changent dynamiquement -->
<TransitionGroup name="list" tag="div" class="space-y-4">
  <div v-for="item in items" :key="item.id">
    <RucheCard :ruche="item" />
  </div>
</TransitionGroup>

<style>
.list-enter-active {
  transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
.list-leave-active {
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}
.list-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.list-move {
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
```

**Action** : Ajouter `<TransitionGroup>` sur les listes principales : ruchers, ruches, interventions, alertes, stocks.

### 7.3 — Skeleton loaders cohérents

Vérifier que CHAQUE page liste affiche un skeleton pendant le chargement initial. Pattern :

```vue
<template>
  <div v-if="pending">
    <UiLoadingSkeleton :lines="5" />
  </div>
  <div v-else-if="!data?.data?.length">
    <UiEmptyState title="Aucune ruche" icon="i-lucide-inbox" />
  </div>
  <div v-else>
    <!-- Contenu -->
  </div>
</template>
```

---

## 9. CONVENTIONS — RAPPEL

### Règles critiques pour ce sprint

- **JAMAIS de `onMounted(() => refresh())`** → le DataBus s'en charge
- **TOUJOURS `emit()` après une mutation `$fetch`** → le bus propage
- **TOUJOURS `:loading` sur les boutons de mutation** → feedback immédiat
- **TOUJOURS lire `route.query.from` pour le retour contextuel**
- **TOUJOURS lire `route.query.rucheId/rucherId/clientId` pour le pré-remplissage**
- **JAMAIS `new Date()` dans `sql\`\``** → utiliser `sqlDate()`
- **JAMAIS faire confiance à `v-model.number` sur input vide** → utiliser `cleanNumber()`

### Fichiers à créer (8 nouveaux)

```
app/composables/useDataBus.ts         → Event bus central
app/composables/usePostAction.ts      → Redirections + toasts post-mutation
app/composables/useOptimistic.ts      → Updates optimistes
app/composables/useMutationState.ts   → Loading/error state mutations
app/utils/followUps.ts                → Mapping follow-up actions
app/utils/form-helpers.ts             → cleanNumber, isValidNumber
app/utils/echarts-helpers.ts          → safeInitChart
server/utils/sql-helpers.ts           → sqlDate, sqlDateRange
```

### Fichiers à modifier (20+ fichiers)

```
# Composables — ajouter DataBus
app/composables/useRuchers.ts
app/composables/useRuches.ts
app/composables/useInterventions.ts
app/composables/useProduction.ts
app/composables/useStocks.ts
app/composables/useClients.ts
app/composables/useFinances.ts
app/composables/useAlertes.ts
app/composables/useDashboard.ts
app/composables/useMembres.ts

# Pages — ajouter pré-remplissage + redirections + loading
app/pages/interventions/nouvelle.vue
app/pages/interventions/groupe.vue
app/pages/ruches/[id].vue
app/pages/ruchers/[id].vue
app/pages/clients/[id].vue
app/pages/finances/ventes.vue
app/pages/production/recoltes.vue

# Composants ECharts — safeInit
app/components/dashboard/ProductionChart.vue
app/components/dashboard/SanteScore.vue
app/components/finances/RevenueChart.vue
app/components/production/ProductionChart.vue
```

---

## 10. CHECKLIST D'IMPLÉMENTATION

### Étape 1 — Fondations (faire en premier)

- [ ] Créer `app/composables/useDataBus.ts`
- [ ] Créer `app/composables/usePostAction.ts`
- [ ] Créer `app/composables/useOptimistic.ts`
- [ ] Créer `app/composables/useMutationState.ts`
- [ ] Créer `app/utils/followUps.ts`
- [ ] Créer `app/utils/form-helpers.ts`
- [ ] Créer `app/utils/echarts-helpers.ts`
- [ ] Créer `server/utils/sql-helpers.ts`

### Étape 2 — Intégrer DataBus dans les 10 composables

- [ ] `useRuchers.ts` — emit sur create/update/delete + on(['rucher:*', 'ruche:*'])
- [ ] `useRuches.ts` — emit + on(['ruche:*'])
- [ ] `useInterventions.ts` — emit + on(['intervention:*'])
- [ ] `useProduction.ts` — emit + on(['recolte:*'])
- [ ] `useStocks.ts` — emit + on(['stock:*', 'vente:created', 'achat:created'])
- [ ] `useClients.ts` — emit + on(['client:*'])
- [ ] `useFinances.ts` — emit + on(['vente:*', 'achat:*'])
- [ ] `useAlertes.ts` — emit + on(['alerte:*', 'intervention:created'])
- [ ] `useDashboard.ts` — on(['ruche:*', 'intervention:*', 'recolte:*', 'vente:*'])
- [ ] `useMembres.ts` — emit + on(['membre:*'])
- [ ] Supprimer TOUS les `onMounted(() => refresh())` des pages

### Étape 3 — Pré-remplissage cross-module

- [ ] `interventions/nouvelle.vue` — lire `rucheId`, `preselect`, `from` → skip étape 1
- [ ] `interventions/groupe.vue` — lire `rucherId`, `from` → pré-sélection rucher
- [ ] `ruches/nouveau.vue` — lire `rucherId` → pré-sélection rucher
- [ ] `finances/ventes.vue` — lire `clientId`, `action` → ouvrir modal pré-remplie
- [ ] Modifier les boutons CTA dans `ruches/[id].vue`, `ruchers/[id].vue`, `clients/[id].vue` → ajouter query params

### Étape 4 — Redirections intelligentes

- [ ] Intégrer `usePostAction()` dans `interventions/nouvelle.vue`
- [ ] Intégrer dans `interventions/groupe.vue`
- [ ] Intégrer dans tous les formulaires de création (ruche, rucher, client, vente, achat)
- [ ] Ajouter les follow-ups contextuels (récolte → compléter, division → voir ruches, mort → nettoyer)

### Étape 5 — Loading states + animations

- [ ] Brancher `:loading` sur TOUS les boutons de mutation (grep tous les `@click` qui font `$fetch`)
- [ ] Ajouter `<TransitionGroup>` sur les listes principales (5 pages minimum)
- [ ] Vérifier skeletons sur toutes les pages listes

### Étape 6 — Guards bugs récurrents

- [ ] Remplacer tous les `new Date()` dans `sql\`\``par`sqlDate()`
- [ ] Ajouter `cleanNumber()` avant tous les envois de champs numériques
- [ ] Remplacer tous les `echarts.init()` par `safeInitChart()`

### Étape 7 — Optimistic updates

- [ ] Alertes : markRead + delete optimiste
- [ ] Autres cas simples identifiés pendant l'implémentation

### VALIDATION

- [ ] `npm run typecheck` → 0 erreurs
- [ ] `npm run build` → PASS
- [ ] `npm run test` → tous PASS
- [ ] `npm run lint` → 0 erreurs
- [ ] Test manuel : créer intervention depuis fiche ruche → retour sur fiche ruche → intervention visible SANS refresh
- [ ] Test manuel : créer ruche depuis fiche rucher → ruche visible SANS refresh
- [ ] Test manuel : marquer alerte comme lue → badge header mis à jour SANS refresh

---

## 11. MATRICE DE TESTS

### Scénarios de non-régression cache

| #   | Scénario                                                           | Résultat attendu                                   |
| --- | ------------------------------------------------------------------ | -------------------------------------------------- |
| 1   | Créer intervention depuis fiche ruche → retour fiche               | Timeline rafraîchie, nouvelle intervention visible |
| 2   | Créer ruche depuis fiche rucher → rester                           | Liste ruches mise à jour, compteur incrémenté      |
| 3   | Supprimer ruche → retour liste                                     | Ruche disparue de la liste                         |
| 4   | Créer vente → naviguer vers dashboard                              | KPI CA mis à jour                                  |
| 5   | Mouvement stock → naviguer vers alertes                            | Alerte stock bas si seuil atteint                  |
| 6   | Marquer alerte lue → regarder header                               | Badge compteur décrémenté                          |
| 7   | Nav rapide : liste → détail → retour liste → détail autre → retour | Données toujours fraîches, pas de cache croisé     |

### Scénarios pré-remplissage

| #   | Scénario                                           | Résultat attendu                                          |
| --- | -------------------------------------------------- | --------------------------------------------------------- |
| 8   | Cliquer "Nouvelle intervention" depuis fiche ruche | Étape 1 skippée, ruche pré-sélectionnée                   |
| 9   | Cliquer "Intervention groupée" depuis fiche rucher | Toutes les ruches du rucher pré-cochées                   |
| 10  | Cliquer "Créer une vente" depuis fiche client      | Modal vente ouverte, client pré-sélectionné               |
| 11  | Division de 3 → toast                              | Toast avec lien "Voir les 3 nouvelles ruches →" cliquable |
| 12  | Essaim mort → toast                                | Toast avec lien "Nettoyer cette ruche →" cliquable        |

### Scénarios performance perçue

| #   | Scénario                            | Résultat attendu                                         |
| --- | ----------------------------------- | -------------------------------------------------------- |
| 13  | Cliquer "Enregistrer" intervention  | Bouton passe en loading immédiatement                    |
| 14  | Supprimer alerte                    | Alerte disparaît avec animation AVANT la réponse serveur |
| 15  | Naviguer vers dashboard avec charts | Charts s'affichent sans warning "width=0"                |
| 16  | Input numérique vide → submit       | Pas de 400 (cleanNumber filtre les valeurs invalides)    |

---

_Fin du Sprint UX & Optimisation. Ce sprint ne crée aucune feature — il rend toutes les features existantes utilisables au quotidien._
