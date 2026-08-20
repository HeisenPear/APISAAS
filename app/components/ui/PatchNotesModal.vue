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

        <!-- Corps : les nouveautés DÉFILENT, le bouton non.
             Sans hauteur bornée, une liste un peu longue sur un téléphone bas
             de gamme pousse le bouton hors de l'écran — l'annonce devient alors
             impossible à fermer autrement qu'en tapant le fond. -->
        <div class="px-5 py-5" style="background: linear-gradient(180deg, #fdf8ef, #fbf3e4)">
          <div class="animate-stagger max-h-[min(56vh,440px)] space-y-2.5 overflow-y-auto">
            <component
              :is="n.details?.length ? 'button' : 'div'"
              v-for="(n, i) in note.nouveautes"
              :key="i"
              :type="n.details?.length ? 'button' : undefined"
              :aria-expanded="n.details?.length ? deplie === i : undefined"
              :aria-controls="n.details?.length ? `pn-detail-${i}` : undefined"
              class="flex w-full items-start gap-3 rounded-[13px] border p-3 text-left"
              :class="n.details?.length ? 'pn-ligne' : ''"
              style="background: rgba(255, 255, 255, 0.6); border-color: var(--border-default)"
              @click="n.details?.length ? basculer(i) : undefined"
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
                <p
                  class="mt-0.5 text-[12.5px] leading-relaxed"
                  style="color: var(--text-secondary)"
                >
                  {{ n.texte }}
                </p>
                <ul
                  v-if="n.details?.length && deplie === i"
                  :id="`pn-detail-${i}`"
                  class="pn-detail mt-2 space-y-1.5 border-t pt-2"
                  style="border-color: var(--border-default)"
                >
                  <li
                    v-for="(d, j) in n.details"
                    :key="j"
                    class="flex gap-2 text-[12px] leading-relaxed"
                    style="color: var(--text-secondary)"
                  >
                    <span aria-hidden="true" style="color: var(--honey-deep)">·</span>
                    <span>{{ d }}</span>
                  </li>
                </ul>
              </div>
              <UIcon
                v-if="n.details?.length"
                name="i-lucide-chevron-down"
                class="mt-0.5 h-4 w-4 shrink-0 transition-transform"
                :class="deplie === i ? 'rotate-180' : ''"
                style="color: var(--text-tertiary)"
                aria-hidden="true"
              />
            </component>

            <!-- Sécurité : présent, mais en retrait. Ça ne se vend pas ; le taire
                 serait se priver d'une raison de faire confiance. -->
            <button
              v-if="note.securite"
              type="button"
              :aria-expanded="securiteOuverte"
              aria-controls="pn-securite"
              class="pn-ligne flex w-full items-start gap-3 rounded-[13px] border border-dashed p-3 text-left"
              style="border-color: var(--border-default)"
              @click="securiteOuverte = !securiteOuverte"
            >
              <UIcon
                name="i-lucide-shield-check"
                class="mt-0.5 h-4 w-4 shrink-0"
                style="color: var(--text-tertiary)"
                aria-hidden="true"
              />
              <div class="min-w-0 flex-1">
                <p class="text-[12.5px] font-medium" style="color: var(--text-secondary)">
                  {{ note.securite.titre }}
                </p>
                <p class="mt-0.5 text-[11.5px]" style="color: var(--text-tertiary)">
                  {{ note.securite.texte }}
                </p>
                <ul v-if="securiteOuverte" id="pn-securite" class="pn-detail mt-2 space-y-1.5">
                  <li
                    v-for="(d, j) in note.securite.details"
                    :key="j"
                    class="flex gap-2 text-[11.5px] leading-relaxed"
                    style="color: var(--text-tertiary)"
                  >
                    <span aria-hidden="true">·</span>
                    <span>{{ d }}</span>
                  </li>
                </ul>
              </div>
              <UIcon
                name="i-lucide-chevron-down"
                class="mt-0.5 h-4 w-4 shrink-0 transition-transform"
                :class="securiteOuverte ? 'rotate-180' : ''"
                style="color: var(--text-tertiary)"
                aria-hidden="true"
              />
            </button>
          </div>

          <div class="pt-3.5">
            <UButton
              block
              color="primary"
              size="lg"
              :label="note.cta"
              @click="fermerEtRencontrerMaya"
            />
            <p
              v-if="note.pied"
              class="mt-2.5 text-center text-[11.5px]"
              style="color: var(--text-tertiary)"
            >
              {{ note.pied }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const { note, dejaVu, marquerVu } = usePatchNotes();
const route = useRoute();
const maya = useMayaStore();
const seuilActif = useState('maya-seuil-actif', () => false);

const ouvert = ref(false);

/** Index de la ligne dépliée. Une seule à la fois : la liste reste lisible. */
const deplie = ref<number | null>(null);
const securiteOuverte = ref(false);

function basculer(i: number): void {
  deplie.value = deplie.value === i ? null : i;
}

/**
 * Mauvais moment : l'accueil d'un nouvel inscrit (onboarding + Seuil de
 * bienvenue). Un compte tout neuf n'a pas de « nouveautés » — il découvre tout.
 * Le Seuil pré-marque d'ailleurs la note comme vue, ceinture et bretelles.
 */
const momentMalvenu = computed(() => route.path === '/onboarding' || seuilActif.value);

function fermer(): void {
  ouvert.value = false;
}

/**
 * Le bouton principal ferme l'annonce ET fait les présentations.
 *
 * Avant, la note disait « Maya se présentera la première fois que vous la
 * solliciterez » — ce qui supposait de deviner qu'il fallait aller la chercher
 * dans les réglages. On lisait une promesse, et on devait partir à sa recherche.
 * `openBubble()` joue la présentation si elle est due, puis ouvre la bulle ;
 * si elle a déjà été vue, il ouvre simplement la bulle.
 *
 * Uniquement sur CE bouton : fermer par la croix, le fond ou Échap est un refus,
 * et on ne répond pas à un refus en ouvrant autre chose.
 */
function fermerEtRencontrerMaya(): void {
  fermer();
  // Laisser la fermeture se jouer avant d'ouvrir la suite — sans ce délai, les
  // deux couches se superposent le temps de l'animation.
  setTimeout(() => maya.openBubble(), 260);
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

<style scoped>
/* La ligne est un bouton : elle doit se comporter comme tel au survol et au
   clavier, sans pour autant crier — c'est une liste, pas une barre d'actions. */
.pn-ligne {
  cursor: pointer;
  transition:
    border-color 180ms var(--ease-out-expo, ease),
    background-color 180ms var(--ease-out-expo, ease);
}
.pn-ligne:hover {
  border-color: var(--honey);
}
.pn-ligne:focus-visible {
  outline: 2px solid var(--honey);
  outline-offset: 2px;
}

.pn-detail {
  animation: pn-deplier 220ms var(--ease-out-expo, ease-out);
}
@keyframes pn-deplier {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
