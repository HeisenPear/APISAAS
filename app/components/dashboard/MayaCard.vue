<template>
  <!-- Skeleton — Maya « prépare » le briefing (state loading : lueur qui tourne) -->
  <section v-if="pending" class="maya-card">
    <div class="flex items-center gap-2.5">
      <IaMayaMark :size="32" state="loading" />
      <div class="h-4 w-44 animate-pulse rounded bg-[var(--surface-muted)]" />
    </div>
    <div class="mt-3 space-y-2">
      <div
        v-for="i in 3"
        :key="i"
        class="h-9 animate-pulse rounded-[10px] bg-[var(--surface-muted)]"
      />
    </div>
  </section>

  <!-- Carte Maya -->
  <section v-else-if="afficher" class="maya-card">
    <div class="flex items-center gap-2.5">
      <IaMayaMark :size="32" :state="aUnePriorite ? 'alert' : 'idle'" />
      <p
        class="min-w-0 flex-1 text-[13.5px] font-semibold leading-tight"
        style="color: var(--text-primary)"
      >
        Maya
      </p>
      <NuxtLink
        to="/copilote"
        class="inline-flex items-center gap-1 rounded-[9px] px-2.5 py-1.5 text-[12px] font-semibold transition-all hover:-translate-y-0.5"
        style="background: var(--honey-soft); color: var(--honey-deep)"
      >
        Ouvrir
        <UIcon name="i-lucide-arrow-up-right" class="h-3.5 w-3.5" />
      </NuxtLink>
    </div>

    <!-- Salutation conversationnelle -->
    <div class="mt-2.5">
      <p class="text-[15px] font-semibold leading-tight" style="color: var(--text-primary)">
        {{ brief?.salutation }}
      </p>
      <p class="mt-1 text-[12.5px] leading-snug" style="color: var(--text-secondary)">
        {{ brief?.intro }}
      </p>
    </div>

    <ul class="mt-3 space-y-1.5">
      <li v-for="(it, i) in brief?.items" :key="i">
        <NuxtLink
          v-if="it.to"
          :to="it.to"
          class="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 transition-colors hover:bg-[var(--surface-muted)]"
        >
          <span class="maya-chip" :style="tonBg(it.ton)">{{ it.icone }}</span>
          <span class="flex-1 text-[12.5px] leading-snug" style="color: var(--text-primary)">{{
            it.texte
          }}</span>
          <UIcon
            name="i-lucide-chevron-right"
            class="h-4 w-4 shrink-0 text-[var(--text-quaternary)]"
          />
        </NuxtLink>
        <div v-else class="flex items-center gap-2.5 px-2.5 py-2">
          <span class="maya-chip" :style="tonBg(it.ton)">{{ it.icone }}</span>
          <span class="flex-1 text-[12.5px] leading-snug" style="color: var(--text-secondary)">{{
            it.texte
          }}</span>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { hasFeature } from '~/config/plans';

interface BriefItem {
  icone: string;
  texte: string;
  ton: 'honey' | 'sage' | 'clay' | 'neutre';
  to?: string;
}
interface Brief {
  salutation: string;
  intro: string;
  items: BriefItem[];
}

/**
 * On ne DEMANDE pas ce à quoi la formule ne donne pas droit.
 *
 * Sans ce garde, la carte partait chercher le brief en Découverte, le serveur
 * répondait 402, et l'intercepteur global ouvrait le modal « Limite du plan
 * atteinte » — tout seul, sans le moindre geste de l'apiculteur. Un nouvel
 * inscrit était donc accueilli par un mur payant en arrivant sur son tableau
 * de bord. Constaté en pilotant un vrai navigateur, juste après l'onboarding.
 *
 * La carte se masquait bien en cas d'erreur ; c'est l'APPEL lui-même qu'il
 * fallait éviter.
 */
const { currentPlan } = useSubscription();
const mayaDisponible = hasFeature(currentPlan.value, 'copiloteIa');

const { data, pending, error } = useFetch<{ data: Brief }>('/api/ia/brief', {
  key: 'maya-brief',
  lazy: true,
  immediate: mayaDisponible,
  default: () => ({ data: { salutation: '', intro: '', items: [] } }),
});

const brief = computed(() => data.value?.data);
// Masquée si non disponible (plan sans Maya, erreur) ou si aucun item utile.
const afficher = computed(
  () => mayaDisponible && !error.value && (brief.value?.items?.length ?? 0) > 0,
);

// Une priorité à regarder (ton honey/clay) → la mark héros s'embrase (state alert).
const aUnePriorite = computed(() =>
  (brief.value?.items ?? []).some((i) => i.ton === 'honey' || i.ton === 'clay'),
);

function tonBg(ton: BriefItem['ton']): string {
  switch (ton) {
    case 'honey':
      return 'background: var(--honey-soft); color: var(--honey-deep)';
    case 'sage':
      return 'background: var(--sage-soft); color: var(--sage-deep)';
    case 'clay':
      return 'background: var(--clay-soft); color: var(--clay-deep)';
    default:
      return 'background: var(--surface-muted); color: var(--text-secondary)';
  }
}
</script>

<style scoped>
.maya-card {
  border-radius: 16px;
  border: 1px solid var(--border-default);
  background: var(--surface-card);
  padding: 16px;
  position: relative;
  overflow: hidden;
}
.maya-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--honey);
}
.maya-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 1.6rem;
  width: 1.6rem;
  border-radius: 8px;
  font-size: 13px;
  flex-shrink: 0;
}
</style>
