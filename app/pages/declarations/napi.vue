<script setup lang="ts">
definePageMeta({ layout: 'default' });

const now = new Date();
const currentYear = now.getFullYear();
const month = now.getMonth() + 1;

// Fetch données
const { data: decls, refresh: refreshDecls } = await useFetch('/api/declarations/napi', { key: 'napi-list' });
const { data: prefill, pending: prefillPending } = await useFetch('/api/declarations/napi/prefill', { key: 'napi-prefill' });

const declarations = computed(() => (decls.value as any)?.data ?? []);
const prefillData = computed(() => (prefill.value as any)?.data);

const currentDecl = computed(() => declarations.value.find((d: any) => d.annee === currentYear));
const alreadyDeclared = computed(() => currentDecl.value && currentDecl.value.statut !== 'brouillon');

// État période
const inPeriod = month >= 9 && month <= 12;
const isPrepPeriod = month === 8;

// Timeline Sept→Dec
const periodStart = new Date(currentYear, 8, 1); // 1er sept
const periodEnd = new Date(currentYear, 11, 31); // 31 déc
const periodProgress = computed(() => {
  if (!inPeriod) return 0;
  const total = periodEnd.getTime() - periodStart.getTime();
  const elapsed = now.getTime() - periodStart.getTime();
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
});

// Form déclaration
const formNotes = ref('');
const showConfirmModal = ref(false);
const saving = ref(false);
const toast = useToast();

async function handleDeclarer() {
  if (!prefillData.value) return;
  saving.value = true;
  try {
    await $fetch('/api/declarations/napi', {
      method: 'POST',
      body: {
        annee: currentYear,
        dateDeclaration: new Date().toISOString(),
        nombreTotalColonies: prefillData.value.cheptel.total,
        nombreRuchesProduction: prefillData.value.cheptel.nbProduction,
        nombreRuchettes: prefillData.value.cheptel.nbRuchettes,
        nombreNuclei: prefillData.value.cheptel.nbNuclei,
        ruchersData: prefillData.value.ruchers,
        statut: 'enregistre',
        notes: formNotes.value || undefined,
      },
    });
    toast.add({ title: 'Déclaration enregistrée', color: 'success' });
    await refreshDecls();
    showConfirmModal.value = false;
  } catch {
    toast.add({ title: 'Erreur', description: 'Impossible d\'enregistrer la déclaration', color: 'error' });
  } finally {
    saving.value = false;
  }
}

function downloadCerfa() {
  window.open(`/api/declarations/napi/cerfa-pdf?annee=${currentYear}`, '_blank');
}
</script>

<template>
  <div>
    <UiPageHeader
      title="Déclaration NAPI"
      description="Déclaration annuelle de détention et d'emplacement de ruches (Cerfa 13995*07)"
    >
      <template #actions>
        <UButton
          v-if="inPeriod && !alreadyDeclared"
          icon="i-lucide-download"
          label="Cerfa pré-rempli"
          color="neutral"
          variant="outline"
          @click="downloadCerfa"
        />
      </template>
    </UiPageHeader>

    <!-- État A : hors période (jan-juil) -->
    <template v-if="!inPeriod && !isPrepPeriod">
      <div class="rounded-2xl border border-stone-200/60 bg-white p-8 text-center">
        <UIcon name="i-lucide-calendar" class="mx-auto h-12 w-12 text-stone-300" />
        <h2 class="mt-4 text-xl font-semibold text-stone-900">Hors période de déclaration</h2>
        <p class="mt-2 text-stone-500">
          La période de déclaration NAPI s'ouvre le <strong>1er septembre</strong> et se termine le <strong>31 décembre</strong>.
        </p>
        <p class="mt-1 text-sm text-stone-400">Vous serez notifié automatiquement à l'ouverture.</p>
      </div>
    </template>

    <!-- État préparation (août) -->
    <template v-else-if="isPrepPeriod">
      <div class="rounded-2xl border border-blue-200 bg-blue-50 p-6 mb-6">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-calendar-clock" class="h-6 w-6 text-blue-500" />
          <div>
            <p class="font-semibold text-stone-900">La période ouvre dans {{ 32 - now.getDate() }} jours</p>
            <p class="text-sm text-stone-600">Vérifiez dès maintenant que vos données sont complètes.</p>
          </div>
        </div>
      </div>
    </template>

    <!-- État B : en période + non déclaré -->
    <template v-else-if="inPeriod && !alreadyDeclared">
      <!-- Timeline -->
      <div class="mb-6 rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-stone-600">1er septembre</span>
          <span class="text-xs font-semibold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">Aujourd'hui</span>
          <span class="text-sm font-medium text-stone-600">31 décembre</span>
        </div>
        <div class="relative h-3 rounded-full bg-stone-100 overflow-hidden">
          <div
            class="absolute left-0 top-0 h-full rounded-full bg-amber-400 transition-all"
            :style="{ width: `${periodProgress}%` }"
          />
          <div
            class="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-amber-500 border-2 border-white shadow"
            :style="{ left: `calc(${periodProgress}% - 10px)` }"
          />
        </div>
        <p class="mt-2 text-xs text-stone-400 text-center">
          {{ Math.round(100 - periodProgress) }}% du temps restant
        </p>
      </div>

      <!-- Pré-remplissage -->
      <div v-if="prefillPending" class="h-48 animate-pulse rounded-2xl bg-stone-100 mb-6" />
      <div v-else-if="prefillData" class="mb-6 space-y-4">
        <!-- Erreurs de validation -->
        <div v-if="prefillData.validationErrors?.length" class="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p class="font-semibold text-red-700 text-sm mb-2">
            <UIcon name="i-lucide-alert-circle" class="h-4 w-4 inline mr-1" />
            {{ prefillData.validationErrors.length }} champ(s) incomplets
          </p>
          <ul class="space-y-1">
            <li
              v-for="err in prefillData.validationErrors"
              :key="err.field"
              class="text-sm text-red-600"
            >
              • {{ err.message }}
              <NuxtLink
                v-if="err.field === 'napi' || err.field === 'nom' || err.field === 'adresse'"
                to="/parametres"
                class="ml-1 underline"
              >
                Corriger
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Récap cheptel -->
        <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
          <h3 class="font-semibold text-stone-900 mb-4">Récapitulatif cheptel {{ currentYear }}</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="rounded-xl bg-stone-50 p-3 text-center">
              <p class="text-2xl font-bold text-stone-900">{{ prefillData.cheptel.nbProduction }}</p>
              <p class="text-xs text-stone-500 mt-1">Ruches production</p>
            </div>
            <div class="rounded-xl bg-stone-50 p-3 text-center">
              <p class="text-2xl font-bold text-stone-900">{{ prefillData.cheptel.nbRuchettes }}</p>
              <p class="text-xs text-stone-500 mt-1">Ruchettes</p>
            </div>
            <div class="rounded-xl bg-stone-50 p-3 text-center">
              <p class="text-2xl font-bold text-stone-900">{{ prefillData.cheptel.nbNuclei }}</p>
              <p class="text-xs text-stone-500 mt-1">Nuclei</p>
            </div>
            <div class="rounded-xl bg-amber-50 p-3 text-center border border-amber-200">
              <p class="text-2xl font-bold text-amber-700">{{ prefillData.cheptel.total }}</p>
              <p class="text-xs text-amber-600 mt-1 font-semibold">TOTAL</p>
            </div>
          </div>
        </div>

        <!-- Ruchers -->
        <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
          <h3 class="font-semibold text-stone-900 mb-4">Emplacements</h3>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-stone-100">
                <th class="pb-2 text-left font-medium text-stone-500">Rucher</th>
                <th class="pb-2 text-left font-medium text-stone-500">Commune</th>
                <th class="pb-2 text-right font-medium text-stone-500">Colonies</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in prefillData.ruchers"
                :key="r.rucherId"
                class="border-b border-stone-50"
              >
                <td class="py-2 text-stone-900">{{ r.nom }}</td>
                <td class="py-2 text-stone-600">
                  <span v-if="r.commune">{{ r.commune }}</span>
                  <span v-else class="text-red-400 italic">Manquante</span>
                </td>
                <td class="py-2 text-right font-medium text-stone-900">{{ r.nbColonies }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-3">
          <UButton
            icon="i-lucide-download"
            label="Télécharger le Cerfa pré-rempli"
            color="neutral"
            variant="outline"
            @click="downloadCerfa"
          />
          <a
            href="https://agriculture-portail.6tzen.fr"
            target="_blank"
            rel="noopener noreferrer"
          >
            <UButton
              icon="i-lucide-external-link"
              label="Déclarer en ligne (téléservice DGAL)"
              color="primary"
              variant="outline"
            />
          </a>
          <UButton
            icon="i-lucide-check-circle"
            label="J'ai déclaré — Enregistrer"
            color="primary"
            :loading="saving"
            :disabled="!prefillData.isComplete"
            @click="showConfirmModal = true"
          />
        </div>
      </div>
    </template>

    <!-- État C : déjà déclaré -->
    <template v-else-if="alreadyDeclared && currentDecl">
      <div class="mb-6 rounded-2xl border border-green-200 bg-green-50 p-6">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-check-circle" class="h-8 w-8 text-green-500" />
          <div>
            <p class="font-semibold text-stone-900">
              Déclaration {{ currentYear }} effectuée
              <span class="text-stone-500 font-normal ml-2">le {{ new Date(currentDecl.dateDeclaration).toLocaleDateString('fr-FR') }}</span>
            </p>
            <p class="text-sm text-stone-600">{{ currentDecl.nombreTotalColonies }} colonies déclarées</p>
          </div>
        </div>
      </div>

      <!-- Récépissé -->
      <div class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm mb-6">
        <h3 class="font-semibold text-stone-900 mb-3">Récépissé de déclaration</h3>
        <div v-if="currentDecl.recepisseUrl" class="flex items-center gap-3">
          <UIcon name="i-lucide-file-check" class="h-5 w-5 text-green-500" />
          <span class="text-sm text-stone-700">Récépissé téléversé</span>
          <a :href="currentDecl.recepisseUrl" target="_blank">
            <UButton size="xs" label="Voir" color="neutral" variant="outline" />
          </a>
        </div>
        <div v-else class="rounded-xl border-2 border-dashed border-stone-200 p-6 text-center">
          <UIcon name="i-lucide-upload" class="mx-auto h-8 w-8 text-stone-300" />
          <p class="mt-2 text-sm text-stone-500">Téléversez votre récépissé de déclaration</p>
          <p class="text-xs text-stone-400 mt-1">PDF ou image — à conserver 5 ans</p>
        </div>
      </div>
    </template>

    <!-- Historique -->
    <div v-if="declarations.length > 0" class="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
      <h3 class="font-semibold text-stone-900 mb-4">Historique des déclarations</h3>
      <div class="space-y-2">
        <div
          v-for="decl in declarations"
          :key="decl.id"
          class="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3"
        >
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-file-text" class="h-4 w-4 text-stone-400" />
            <div>
              <p class="text-sm font-medium text-stone-900">Déclaration {{ decl.annee }}</p>
              <p class="text-xs text-stone-400">{{ decl.nombreTotalColonies }} colonies • {{ new Date(decl.dateDeclaration).toLocaleDateString('fr-FR') }}</p>
            </div>
          </div>
          <UBadge
            :label="decl.statut === 'recepisse_recu' ? 'Complet' : decl.statut === 'enregistre' ? 'Enregistrée' : 'Brouillon'"
            :color="decl.statut === 'recepisse_recu' ? 'success' : decl.statut === 'enregistre' ? 'warning' : 'neutral'"
            variant="subtle"
            size="xs"
          />
        </div>
      </div>
    </div>

    <!-- Modal confirmation -->
    <UModal v-model:open="showConfirmModal">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-stone-900">Confirmer la déclaration</h3>
          <p class="text-sm text-stone-600">
            Confirmez-vous avoir effectué votre déclaration officielle sur le téléservice DGAL pour l'année {{ currentYear }} ?
          </p>
          <UInput
            v-model="formNotes"
            placeholder="Notes optionnelles (numéro de récépissé, etc.)"
          />
          <div class="flex gap-3 justify-end">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="showConfirmModal = false" />
            <UButton label="Confirmer" color="primary" :loading="saving" @click="handleDeclarer" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
