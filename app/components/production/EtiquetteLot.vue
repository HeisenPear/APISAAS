<template>
  <div>
    <!-- Contrôles -->
    <div class="mb-3 flex flex-wrap items-end gap-3">
      <label class="flex flex-col gap-1">
        <span class="text-[11px] font-medium text-stone-500">Poids net (g)</span>
        <input
          v-model.number="poidsNet"
          type="number"
          min="0"
          step="10"
          class="h-9 w-24 rounded-lg border border-stone-200 bg-white px-2.5 text-sm focus:border-[var(--honey)] focus:outline-none focus:ring-2 focus:ring-[var(--honey)]/20"
        />
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-[11px] font-medium text-stone-500">Étiquettes / planche</span>
        <select
          v-model.number="copies"
          class="h-9 rounded-lg border border-stone-200 bg-white px-2.5 text-sm focus:border-[var(--honey)] focus:outline-none focus:ring-2 focus:ring-[var(--honey)]/20"
        >
          <option v-for="n in [1, 6, 12, 24]" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>
      <label class="flex items-center gap-1.5 pb-2">
        <input v-model="showQr" type="checkbox" class="accent-[var(--honey)]" />
        <span class="text-[12px] text-stone-600">QR de traçabilité</span>
      </label>
      <div class="ml-auto flex gap-2 pb-0.5">
        <button
          type="button"
          class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          @click="printLabels"
        >
          <UIcon name="i-lucide-printer" class="h-4 w-4" />
          Imprimer
        </button>
        <button
          type="button"
          :disabled="busy"
          class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--honey)] px-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          @click="downloadPdf"
        >
          <UIcon
            :name="busy ? 'i-lucide-loader-circle' : 'i-lucide-download'"
            :class="busy ? 'h-4 w-4 animate-spin' : 'h-4 w-4'"
          />
          Télécharger PDF
        </button>
      </div>
    </div>

    <!-- Planche d'étiquettes (aperçu = rendu imprimé) -->
    <div class="overflow-auto rounded-xl border border-stone-200 bg-stone-50 p-3">
      <div
        ref="sheetRef"
        class="etiquette-sheet mx-auto grid grid-cols-2 gap-2.5 bg-white p-2"
        style="max-width: 460px"
      >
        <div
          v-for="n in copies"
          :key="n"
          class="etiquette flex flex-col rounded-[10px] border-2 border-[var(--honey)] bg-white p-3 text-center"
          style="break-inside: avoid"
        >
          <p class="text-[14px] font-bold leading-tight text-stone-900">Miel {{ denomination }}</p>
          <p class="mt-0.5 text-[9.5px] text-stone-500">Récolté en France</p>
          <div v-if="showQr && qrDataUrl" class="my-1.5 flex justify-center">
            <img :src="qrDataUrl" alt="QR traçabilité" class="h-14 w-14" />
          </div>
          <div
            class="mt-1.5 space-y-0.5 border-t border-[var(--honey)]/40 pt-1.5 text-left text-[9px] leading-snug text-stone-600"
          >
            <p>
              Poids net : <strong>{{ poidsNet }} g</strong>
            </p>
            <p>Lot n° {{ lot.numeroLot }}</p>
            <p>À consommer de préférence avant fin {{ ddmLabel }}</p>
            <p v-if="producteur" class="truncate">{{ producteur }}</p>
          </div>
        </div>
      </div>
    </div>
    <p
      v-if="mentionManquante"
      class="mt-2 text-[11px] leading-snug text-[var(--clay-deep)] print:hidden"
    >
      ⚠️ La mention « producteur » est obligatoire sur l’étiquette et manque ici : renseignez votre
      nom dans
      <NuxtLink to="/parametres" class="font-semibold underline">Réglages › Mon profil</NuxtLink>
      avant d’imprimer votre planche.
    </p>
    <p class="mt-2 text-[10px] text-stone-400">
      Mentions obligatoires : dénomination, origine, poids net, lot, DDM, producteur (Règ. INCO
      1169/2011, Décret 2003-587). Imprimez sur planche d'étiquettes adhésives.
    </p>
  </div>
</template>

<script setup lang="ts">
import { identiteEmetteur, nomImprimable } from '~/config/identite-emetteur';
const props = defineProps<{
  lot: { numeroLot: string; typesMiel: string[]; ddm: string };
}>();

const poidsNet = ref(500);
const copies = ref(12);
const showQr = ref(false);
const busy = ref(false);
const sheetRef = ref<HTMLElement | null>(null);

const authStore = useAuthStore();

const denomination = computed(() =>
  props.lot.typesMiel.length === 1 ? `de ${props.lot.typesMiel[0]}` : 'toutes fleurs',
);

const ddmLabel = computed(() =>
  new Date(props.lot.ddm).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
);

/**
 * LE PRODUCTEUR, mention obligatoire de l'étiquette (Règ. INCO 1169/2011).
 *
 * ⚠️ L'ÉTIQUETTE EST UN DOCUMENT, ET ELLE COMPOSAIT SON NOM À LA MAIN. Elle
 * était la quatrième copie de `[prenom, nom].filter(Boolean).join(' ')` — celle
 * qu'aucune des trois autres n'avait vue. Conséquence directe : un apiculteur
 * qui renseignait « Le Rucher de Maël » comme nom commercial le voyait sur ses
 * factures et pas sur ses pots, alors que c'est le pot que le consommateur
 * tient dans la main.
 *
 * C'est le nom d'AFFICHAGE qui convient ici : l'INCO demande le nom sous lequel
 * l'exploitant exerce, et l'adresse le rend identifiable — d'où la ville juste
 * après.
 */
const producteur = computed(() => {
  const profil = authStore.profil as Record<string, unknown> | null;
  const { affichage } = identiteEmetteur(profil as Parameters<typeof identiteEmetteur>[0]);
  const ville = (profil?.ville as string | undefined) ?? '';
  // Même garde que le passeport : l'étiquette part chez le consommateur, et le
  // QR qu'elle porte est gravé sur le papier.
  return [nomImprimable(affichage), ville].filter(Boolean).join(' · ');
});

/**
 * ⚠️ LA MENTION MANQUANTE SE DIT, ELLE NE DISPARAÎT PAS EN SILENCE.
 *
 * Sans nom au profil, `producteur` vaut la chaîne vide et le `v-if` faisait
 * simplement s'évanouir la ligne — sur une étiquette dont le fichier écrit
 * lui-même que le producteur est une mention OBLIGATOIRE (Règ. INCO
 * 1169/2011). L'apiculteur imprimait sa planche sans rien remarquer.
 *
 * On n'empêche PAS d'imprimer : une étiquette n'est pas une pièce comptable, et
 * bloquer une planche d'autocollants pour un profil incomplet serait
 * disproportionné. On le DIT — à l'écran seulement, jamais sur l'étiquette.
 */
const mentionManquante = computed(() => !producteur.value);

// QR : résumé de traçabilité lisible par le consommateur
const qrPayload = computed(
  () =>
    `APIGO — Traçabilité miel\nLot: ${props.lot.numeroLot}\nVariété: Miel ${denomination.value}\nDDM: fin ${ddmLabel.value}\nOrigine: France${producteur.value ? `\nProducteur: ${producteur.value}` : ''}`,
);
const { qrDataUrl } = useQrCode(qrPayload);

function pdfOptions() {
  return {
    filename: `etiquettes-lot-${props.lot.numeroLot}.pdf`,
    margin: [8, 8, 8, 8] as [number, number, number, number],
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
  };
}

async function downloadPdf() {
  if (!sheetRef.value) return;
  busy.value = true;
  try {
    const html2pdf = (await import('html2pdf.js')).default;
    await html2pdf().set(pdfOptions()).from(sheetRef.value).save();
  } finally {
    busy.value = false;
  }
}

function printLabels() {
  document.body.classList.add('printing-etiquettes');
  window.print();
  // nettoyage après le dialogue d'impression
  window.addEventListener(
    'afterprint',
    () => document.body.classList.remove('printing-etiquettes'),
    {
      once: true,
    },
  );
}
</script>

<!-- Style d'impression non scopé : n'imprime que la planche d'étiquettes -->
<style>
@media print {
  body.printing-etiquettes * {
    visibility: hidden;
  }
  body.printing-etiquettes .etiquette-sheet,
  body.printing-etiquettes .etiquette-sheet * {
    visibility: visible;
  }
  body.printing-etiquettes .etiquette-sheet {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    max-width: none !important;
    padding: 0;
  }
  @page {
    margin: 10mm;
    size: A4;
  }
}
</style>
