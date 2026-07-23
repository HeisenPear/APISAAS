<template>
  <section v-if="afficher" class="maya-ctx">
    <IaMayaMark :size="26" state="idle" />
    <div class="min-w-0 flex-1">
      <p class="text-[12.5px] font-medium leading-snug" style="color: var(--text-secondary)">
        {{ brief?.intro }}
      </p>
      <div class="mt-1.5 flex flex-col gap-1">
        <NuxtLink
          v-for="(it, i) in brief?.items"
          :key="i"
          :to="it.to ?? '/copilote'"
          class="inline-flex items-center gap-2 text-[12.5px] transition-colors hover:underline"
          style="color: var(--text-primary)"
        >
          <span v-if="it.icone">{{ it.icone }}</span>
          <span>{{ it.texte }}</span>
        </NuxtLink>
      </div>
    </div>
    <NuxtLink
      to="/copilote"
      class="inline-flex shrink-0 items-center gap-1 rounded-[8px] px-2 py-1 text-[11.5px] font-semibold transition-all hover:-translate-y-0.5"
      style="background: var(--honey-soft); color: var(--honey-deep)"
    >
      Maya
      <UIcon name="i-lucide-arrow-up-right" class="h-3 w-3" />
    </NuxtLink>
  </section>
</template>

<script setup lang="ts">
interface BriefItem {
  icone: string;
  texte: string;
  ton: string;
  to?: string;
}
interface Brief {
  salutation: string;
  intro: string;
  items: BriefItem[];
}

const props = defineProps<{
  contexte: 'ruches' | 'meteo' | 'alertes' | 'stocks' | 'calendrier';
}>();

// Deux gardes réunis DANS la carte, pour que chaque page qui la monte hérite du
// bon comportement sans rien importer :
//   · `aAcces('copiloteIa')` — sans lui l'appel part quand même, le serveur
//     répond 402 et l'intercepteur global ouvre le modal d'abonnement tout seul.
//   · `maya.proactif` — une carte PROACTIVE ne doit apparaître qu'en présence
//     « partout ». En discret ou en pause, Maya ne parle que sur demande. La
//     page météo l'ignorait auparavant : Maya s'y invitait même réglée discrète.
const { aAcces } = useSubscription();
const maya = useMayaStore();
const mayaDisponible = computed(() => maya.proactif && aAcces('copiloteIa'));

const { data, error } = useFetch<{ data: Brief }>('/api/ia/brief', {
  key: `maya-brief-${props.contexte}`,
  query: { contexte: props.contexte },
  lazy: true,
  immediate: mayaDisponible.value,
  default: () => ({ data: { salutation: '', intro: '', items: [] } }),
});

const brief = computed(() => data.value?.data);
const afficher = computed(
  () => mayaDisponible.value && !error.value && (brief.value?.items?.length ?? 0) > 0,
);
</script>

<style scoped>
.maya-ctx {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border-radius: 14px;
  border: 1px solid var(--border-default);
  background: var(--surface-card);
  padding: 12px 14px;
  position: relative;
  overflow: hidden;
}
.maya-ctx::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 3px;
  background: var(--honey);
}
</style>
