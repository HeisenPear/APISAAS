<!--
  PasseportPotQr — génère le QR « passeport du miel » à coller sur les pots.

  Tout le contenu du passeport est encodé DANS le QR (apigo.fr/p#<données>) : aucune
  route serveur, aucune donnée client, aucun quota consommé. Le client final scanne
  le pot → page publique `/p` qui décode et affiche l'histoire du miel.
-->
<template>
  <div class="rounded-[14px] border bg-white p-4" style="border-color: var(--border-default)">
    <div class="mb-2 flex items-center gap-2">
      <UIcon name="i-lucide-qr-code" class="h-4 w-4" style="color: var(--honey-deep)" />
      <h3 class="text-[14px] font-semibold" style="color: var(--text-primary)">Passeport du pot</h3>
    </div>
    <p class="mb-3 text-[12.5px] leading-relaxed" style="color: var(--text-secondary)">
      Collez ce QR code sur vos pots : vos clients le scannent et découvrent l'histoire de ce miel
      (origine, fleurs, éco-score, récolte → mise en pot). Tout est contenu dans le QR — aucune
      donnée client, aucune connexion requise.
    </p>

    <div class="flex items-center gap-4">
      <div
        class="shrink-0 rounded-[12px] border p-2"
        style="border-color: var(--border-default); background: white"
      >
        <img
          v-if="qrDataUrl"
          :src="qrDataUrl"
          width="132"
          height="132"
          alt="QR code du passeport du pot"
        />
        <div
          v-else
          class="h-[132px] w-[132px] animate-pulse rounded-[8px] bg-[var(--surface-muted)]"
        />
      </div>

      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <a
          v-if="qrDataUrl"
          :href="qrDataUrl"
          :download="`passeport-${lot.numeroLot}.png`"
          class="inline-flex items-center justify-center gap-1.5 rounded-[9px] px-3 py-2 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5"
          style="background: var(--honey)"
        >
          <UIcon name="i-lucide-download" class="h-3.5 w-3.5" />
          Télécharger le QR
        </a>
        <a
          :href="url"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center justify-center gap-1.5 rounded-[9px] border px-3 py-2 text-[12.5px] font-semibold transition-colors"
          style="border-color: var(--border-default); color: var(--text-primary)"
        >
          <UIcon name="i-lucide-eye" class="h-3.5 w-3.5" style="color: var(--honey-deep)" />
          Prévisualiser
        </a>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-1.5 rounded-[9px] border px-3 py-2 text-[12.5px] font-medium transition-colors"
          style="border-color: var(--border-default); color: var(--text-secondary)"
          @click="copierLien"
        >
          <UIcon :name="copie ? 'i-lucide-check' : 'i-lucide-link'" class="h-3.5 w-3.5" />
          {{ copie ? 'Lien copié' : 'Copier le lien' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { encoderPasseport, type PasseportMiel } from '~/utils/passeportMiel';
import { urlPasseportPot } from '~/utils/urlQr';

interface LotPasseport {
  numeroLot: string;
  typesMiel?: (string | null)[];
  dateDebut?: string | Date | null;
  dateFin?: string | Date | null;
  ddm?: string | Date | null;
  humidite?: { moyenne: number | null };
  conditionnement?: {
    teneurEauPct?: string | number | null;
    dateConditionnement?: string | Date | null;
    dluo?: string | Date | null;
  } | null;
  ecoScore?: { score: number; note: string } | null;
}

const props = defineProps<{
  lot: LotPasseport;
  producteur?: string;
  origine?: string;
}>();

function annee(d?: string | Date | null): number | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt.getFullYear();
}
function moisIso(d?: string | Date | null): string | undefined {
  if (!d) return undefined;
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return undefined;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}
function periodeRecolte(): string | undefined {
  const a = annee(props.lot.dateDebut);
  const b = annee(props.lot.dateFin);
  if (a && b) return a === b ? String(a) : `${a}–${b}`;
  return a ? String(a) : b ? String(b) : undefined;
}

const passeport = computed<PasseportMiel>(() => {
  const l = props.lot;
  const miels = (l.typesMiel ?? []).filter((m): m is string => Boolean(m));
  const eauBrut =
    l.conditionnement?.teneurEauPct != null
      ? Number(l.conditionnement.teneurEauPct)
      : (l.humidite?.moyenne ?? null);
  const eau = eauBrut != null && !Number.isNaN(eauBrut) ? Math.round(eauBrut * 10) / 10 : undefined;

  return {
    v: 1,
    lot: l.numeroLot,
    prod: props.producteur || undefined,
    miels: miels.length ? miels : undefined,
    origine: props.origine || undefined,
    recolte: periodeRecolte(),
    pot: moisIso(l.conditionnement?.dateConditionnement),
    ddm: moisIso(l.conditionnement?.dluo ?? l.ddm),
    eau,
    eco: l.ecoScore ? { s: l.ecoScore.score, n: l.ecoScore.note } : undefined,
  };
});

// La règle « domaine de production, jamais l'URL de génération » vivait ici,
// dans un commentaire, au lieu d'être une fonction — et les QR de hausse et
// de ruche ne l'appliquaient donc pas. Elle est maintenant dérivée.
const url = computed(() => urlPasseportPot(encoderPasseport(passeport.value)));
const { qrDataUrl } = useQrCode(url);

const copie = ref(false);
async function copierLien(): Promise<void> {
  try {
    await navigator.clipboard.writeText(url.value);
    copie.value = true;
    setTimeout(() => (copie.value = false), 1800);
  } catch {
    /* presse-papiers indisponible — le bouton Prévisualiser reste utilisable */
  }
}
</script>
