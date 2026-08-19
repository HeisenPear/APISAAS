<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em]" style="color: var(--text-primary)">
          Codes promo
        </h1>
        <p class="text-sm" style="color: var(--text-secondary)">
          Codes de réduction sponsoring & suivi des acquisitions
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        variant="outline"
        color="neutral"
        size="sm"
        :loading="pending"
        @click="refresh()"
      >
        Rafraîchir
      </UButton>
    </div>

    <AdminTabs />

    <!-- Résumé par type de sponsor -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div
        v-for="t in TYPES"
        :key="t.value"
        class="rounded-[14px] border bg-white p-4"
        style="border-color: var(--border-default)"
      >
        <p
          class="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          {{ t.label }}
        </p>
        <p class="text-[22px] font-bold tracking-[-0.02em]" style="color: var(--text-primary)">
          {{ resume(t.value).acquisitions }}
          <span class="text-[13px] font-medium" style="color: var(--text-tertiary)"
            >acquisition{{ resume(t.value).acquisitions > 1 ? 's' : '' }}</span
          >
        </p>
        <p class="text-[12px]" style="color: var(--text-tertiary)">
          {{ resume(t.value).codes }} code{{ resume(t.value).codes > 1 ? 's' : '' }}
        </p>
      </div>
    </div>

    <!-- Création d'un code -->
    <form
      class="rounded-[14px] border bg-white p-5"
      style="border-color: var(--border-default)"
      @submit.prevent="creer"
    >
      <p
        class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style="color: var(--honey-deep)"
      >
        Nouveau code
      </p>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-medium" style="color: var(--text-secondary)">Code</span>
          <input
            v-model="form.code"
            required
            placeholder="MIEL2026"
            class="h-10 rounded-lg border px-3 text-sm uppercase outline-none focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
            style="border-color: var(--border-default)"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-medium" style="color: var(--text-secondary)">Sponsor</span>
          <input
            v-model="form.sponsorNom"
            required
            placeholder="Rucher des Tilleuls"
            class="h-10 rounded-lg border px-3 text-sm outline-none focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
            style="border-color: var(--border-default)"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-medium" style="color: var(--text-secondary)">Type</span>
          <select
            v-model="form.typeSponsoring"
            class="h-10 rounded-lg border px-3 text-sm outline-none focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
            style="border-color: var(--border-default)"
          >
            <option v-for="t in TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-medium" style="color: var(--text-secondary)"
            >Réduction (%)</span
          >
          <input
            v-model.number="form.reductionPourcent"
            type="number"
            min="1"
            max="100"
            required
            class="h-10 rounded-lg border px-3 text-sm outline-none focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
            style="border-color: var(--border-default)"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-medium" style="color: var(--text-secondary)"
            >Durée (mois)</span
          >
          <input
            v-model.number="form.dureeMois"
            type="number"
            min="1"
            max="36"
            required
            class="h-10 rounded-lg border px-3 text-sm outline-none focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
            style="border-color: var(--border-default)"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-medium" style="color: var(--text-secondary)"
            >Plafond d'usages (option.)</span
          >
          <input
            v-model.number="form.maxRedemptions"
            type="number"
            min="1"
            placeholder="illimité"
            class="h-10 rounded-lg border px-3 text-sm outline-none focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
            style="border-color: var(--border-default)"
          />
        </label>
        <label class="flex flex-col gap-1 sm:col-span-2">
          <span class="text-[11px] font-medium" style="color: var(--text-secondary)"
            >Notes (interne)</span
          >
          <input
            v-model="form.notes"
            placeholder="Contexte du partenariat…"
            class="h-10 rounded-lg border px-3 text-sm outline-none focus:border-[var(--honey)] focus:ring-2 focus:ring-[var(--honey)]/20"
            style="border-color: var(--border-default)"
          />
        </label>
      </div>
      <div class="mt-4 flex items-center justify-between">
        <p class="max-w-md text-[12px]" style="color: var(--text-tertiary)">
          Crée le coupon Stripe (−{{ form.reductionPourcent || 0 }} % pendant
          {{ form.dureeMois || 0 }} mois) et le code saisissable au paiement. La durée en mois vaut
          pour le paiement <strong>mensuel</strong> ; sur l'abonnement <strong>annuel</strong>, la
          remise ne porte que sur la 1ʳᵉ échéance.
        </p>
        <UButton type="submit" color="primary" icon="i-lucide-plus" :loading="creating">
          Créer le code
        </UButton>
      </div>
    </form>

    <!-- Liste des codes -->
    <div
      class="overflow-hidden rounded-[14px] border bg-white"
      style="border-color: var(--border-default)"
    >
      <div v-if="pending" class="p-8 text-center text-sm" style="color: var(--text-tertiary)">
        Chargement…
      </div>
      <UiErrorState v-else-if="error" :error="error" :retry="refresh" />

      <div
        v-else-if="!codes.length"
        class="p-8 text-center text-sm"
        style="color: var(--text-tertiary)"
      >
        Aucun code promo pour l'instant.
      </div>
      <table v-else class="w-full text-left text-[13px]">
        <thead>
          <tr style="border-bottom: 1px solid var(--border-default)">
            <th class="px-4 py-3 font-semibold" style="color: var(--text-tertiary)">Code</th>
            <th class="px-4 py-3 font-semibold" style="color: var(--text-tertiary)">Sponsor</th>
            <th class="px-4 py-3 font-semibold" style="color: var(--text-tertiary)">Réduction</th>
            <th class="px-4 py-3 text-right font-semibold" style="color: var(--text-tertiary)">
              Acquis.
            </th>
            <th class="px-4 py-3 text-right font-semibold" style="color: var(--text-tertiary)">
              Remise cumulée
            </th>
            <th class="px-4 py-3 text-center font-semibold" style="color: var(--text-tertiary)">
              Actif
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in codes" :key="c.id" style="border-bottom: 1px solid var(--border-default)">
            <td class="px-4 py-3">
              <button
                class="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono font-semibold transition-colors hover:bg-[var(--surface-muted)]"
                style="color: var(--text-primary)"
                title="Copier le code"
                @click="copier(c.code)"
              >
                {{ c.code }}
                <UIcon name="i-lucide-copy" class="h-3 w-3" style="color: var(--text-tertiary)" />
              </button>
            </td>
            <td class="px-4 py-3">
              <p style="color: var(--text-primary)">{{ c.sponsorNom }}</p>
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style="background: var(--honey-soft); color: var(--honey-deep)"
                >{{ typeLabel(c.typeSponsoring) }}</span
              >
            </td>
            <td class="px-4 py-3" style="color: var(--text-secondary)">
              −{{ c.reductionPourcent }} % · {{ c.dureeMois }} mois
              <span v-if="c.maxRedemptions" class="text-[11px]" style="color: var(--text-tertiary)">
                (max {{ c.maxRedemptions }})
              </span>
            </td>
            <td class="px-4 py-3 text-right font-semibold" style="color: var(--text-primary)">
              {{ c.acquisitions }}
            </td>
            <td class="px-4 py-3 text-right" style="color: var(--text-secondary)">
              {{ euros(c.remiseTotaleCents) }}
            </td>
            <td class="px-4 py-3 text-center">
              <button
                role="switch"
                :aria-checked="c.actif"
                :aria-label="`Activer ou désactiver le code ${c.code}`"
                title="Désactiver empêche les nouveaux clients d'utiliser le code ; les abonnements déjà souscrits conservent la remise jusqu'à sa fin."
                class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                :style="c.actif ? 'background: var(--honey)' : 'background: var(--border-default)'"
                @click="toggle(c)"
              >
                <span
                  class="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                  :class="c.actif ? 'translate-x-[18px]' : 'translate-x-1'"
                />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-[12px]" style="color: var(--text-tertiary)">
      Désactiver un code empêche les <strong>nouveaux</strong> clients de l'utiliser ; les
      abonnements <strong>déjà souscrits</strong> conservent la remise jusqu'à la fin de sa durée
      (Stripe ne l'annule pas rétroactivement).
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'admin' });

type TypeSponsoring = 'ambassadeur' | 'syndicat' | 'magasin';

interface CodePromo {
  id: string;
  code: string;
  sponsorNom: string;
  typeSponsoring: TypeSponsoring;
  reductionPourcent: number;
  dureeMois: number;
  maxRedemptions: number | null;
  actif: boolean;
  createdAt: string;
  acquisitions: number;
  remiseTotaleCents: number;
}
interface ResumeType {
  typeSponsoring: TypeSponsoring;
  codes: number;
  acquisitions: number;
}

const TYPES: { value: TypeSponsoring; label: string }[] = [
  { value: 'ambassadeur', label: 'Ambassadeur' },
  { value: 'syndicat', label: 'Syndicat / association' },
  { value: 'magasin', label: 'Magasin / fournisseur' },
];

const toast = useToast();

const { data, pending, error, refresh } = await useFetch<{
  data: { codes: CodePromo[]; parType: ResumeType[] };
}>('/api/admin/codes-promo', { default: () => ({ data: { codes: [], parType: [] } }) });

const codes = computed(() => data.value?.data.codes ?? []);

function resume(type: TypeSponsoring) {
  const r = data.value?.data.parType.find((p) => p.typeSponsoring === type);
  return { codes: r?.codes ?? 0, acquisitions: r?.acquisitions ?? 0 };
}

function typeLabel(t: TypeSponsoring) {
  return TYPES.find((x) => x.value === t)?.label ?? t;
}

function euros(cents: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    (cents ?? 0) / 100,
  );
}

const form = reactive({
  code: '',
  sponsorNom: '',
  typeSponsoring: 'ambassadeur' as TypeSponsoring,
  reductionPourcent: 20,
  dureeMois: 3,
  maxRedemptions: null as number | null,
  notes: '',
});
const creating = ref(false);

async function creer() {
  creating.value = true;
  try {
    await $fetch('/api/admin/codes-promo', {
      method: 'POST',
      body: {
        code: form.code,
        sponsorNom: form.sponsorNom,
        typeSponsoring: form.typeSponsoring,
        reductionPourcent: form.reductionPourcent,
        dureeMois: form.dureeMois,
        ...(form.maxRedemptions ? { maxRedemptions: form.maxRedemptions } : {}),
        ...(form.notes ? { notes: form.notes } : {}),
      },
    });
    toast.add({ title: `Code ${form.code.toUpperCase()} créé`, color: 'success' });
    form.code = '';
    form.sponsorNom = '';
    form.notes = '';
    form.maxRedemptions = null;
    await refresh();
  } catch (e: unknown) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur lors de la création'), color: 'error' });
  } finally {
    creating.value = false;
  }
}

async function toggle(c: CodePromo) {
  try {
    await $fetch(`/api/admin/codes-promo/${c.id}`, { method: 'PATCH', body: { actif: !c.actif } });
    await refresh();
  } catch (e: unknown) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur'), color: 'error' });
  }
}

async function copier(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    toast.add({ title: 'Code copié', color: 'success' });
  } catch {
    // ignore
  }
}
</script>
