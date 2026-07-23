<!--
  PatchNotesModal — annonce éphémère des nouveautés, à la première connexion qui
  suit une mise à jour, puis plus jamais (cf. usePatchNotes + config/patchNotes).
  Montée une fois dans le layout par défaut. Ne s'invite jamais pendant l'accueil
  d'un nouvel inscrit (onboarding + Seuil de bienvenue) : un compte tout neuf
  découvre déjà TOUT.
-->
<template>
  <UModal v-model:open="ouvert">
    <template #content>
      <div class="overflow-hidden rounded-[var(--radius-lg,16px)]">
        <!-- En-tête chaleureux, cohérent avec la bulle Maya / les réglages -->
        <div
          class="relative overflow-hidden px-6 pb-5 pt-6"
          style="background: linear-gradient(135deg, #2c2218, #1a1a1c)"
        >
          <div
            class="pointer-events-none absolute inset-0"
            style="
              background: radial-gradient(
                120% 100% at 12% -10%,
                rgba(245, 166, 35, 0.42),
                transparent 56%
              );
            "
          />
          <div
            class="pointer-events-none absolute -left-5 -top-16 h-40 w-40 rounded-full"
            style="
              background: radial-gradient(circle, rgba(245, 166, 35, 0.5), transparent 70%);
              filter: blur(7px);
            "
          />
          <div class="relative flex items-start gap-3">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]"
              style="
                background: rgba(245, 166, 35, 0.16);
                border: 1px solid rgba(240, 180, 84, 0.4);
              "
            >
              <UIcon
                name="i-lucide-party-popper"
                class="h-[22px] w-[22px]"
                style="color: #f0b454"
              />
            </div>
            <div class="min-w-0 flex-1">
              <span
                class="inline-block rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
                style="color: #f0b454; border: 1px solid rgba(240, 180, 84, 0.4)"
                >{{ note.badge }}</span
              >
              <h2
                class="mt-1.5 text-[19px] font-semibold text-white"
                style="font-family: var(--font-display)"
              >
                {{ note.titre }}
              </h2>
              <p class="mt-1 text-[13px] leading-snug" style="color: rgba(255, 255, 255, 0.6)">
                {{ note.sousTitre }}
              </p>
            </div>
            <button
              type="button"
              class="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] text-white transition-colors hover:brightness-125"
              style="background: rgba(255, 255, 255, 0.1)"
              aria-label="Fermer"
              @click="fermer"
            >
              <UIcon name="i-lucide-x" class="h-[17px] w-[17px]" />
            </button>
          </div>
        </div>

        <!-- Liste des nouveautés -->
        <div
          class="space-y-2.5 px-5 py-5"
          style="background: linear-gradient(180deg, #fdf8ef, #fbf3e4)"
        >
          <div
            v-for="(n, i) in note.nouveautes"
            :key="i"
            class="flex items-start gap-3 rounded-[13px] border p-3"
            style="background: rgba(255, 255, 255, 0.6); border-color: var(--border-default)"
          >
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
              style="background: var(--honey-soft); color: var(--honey-deep)"
            >
              <UIcon :name="n.icone" class="h-[18px] w-[18px]" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[14px] font-semibold" style="color: var(--text-primary)">
                {{ n.titre }}
              </p>
              <p class="mt-0.5 text-[12.5px] leading-relaxed" style="color: var(--text-secondary)">
                {{ n.texte }}
              </p>
            </div>
          </div>

          <div class="pt-1.5">
            <UButton block color="primary" size="lg" :label="note.cta" @click="fermer" />
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const { note, dejaVu, marquerVu } = usePatchNotes();
const route = useRoute();
const seuilActif = useState('maya-seuil-actif', () => false);

const ouvert = ref(false);

/**
 * Mauvais moment : l'accueil d'un nouvel inscrit (onboarding + Seuil de
 * bienvenue). Un compte tout neuf n'a pas de « nouveautés » — il découvre tout.
 * Le Seuil pré-marque d'ailleurs la note comme vue, ceinture et bretelles.
 */
const momentMalvenu = computed(() => route.path === '/onboarding' || seuilActif.value);

function fermer(): void {
  ouvert.value = false;
}

// Fermeture par le bouton, le fond ou Échap → on grave « vue » dans tous les cas.
watch(ouvert, (v, ancien) => {
  if (ancien && !v) marquerVu();
});

onMounted(() => {
  if (dejaVu() || momentMalvenu.value) return;
  // Court délai : laisser la page se poser (et le Seuil s'activer le cas échéant)
  // avant de proposer l'annonce, pour ne pas la superposer à une transition.
  setTimeout(() => {
    if (!dejaVu() && !momentMalvenu.value) ouvert.value = true;
  }, 900);
});
</script>
