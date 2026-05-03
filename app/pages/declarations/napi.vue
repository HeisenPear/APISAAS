<script setup lang="ts">
definePageMeta({ layout: 'default' });

const now = new Date();
const currentYear = now.getFullYear();
const month = now.getMonth() + 1;

// Fetch données
const { data: decls, refresh: refreshDecls } = await useFetch('/api/declarations/napi', { key: 'napi-list' });
const { data: prefill } = await useFetch('/api/declarations/napi/prefill', { key: 'napi-prefill' });

const declarations = computed(() => (decls.value as any)?.data ?? []);
const prefillData = computed(() => (prefill.value as any)?.data);

const currentDecl = computed(() => declarations.value.find((d: any) => d.annee === currentYear));
const alreadyDeclared = computed(() => currentDecl.value && currentDecl.value.statut !== 'brouillon');

// État période
const inPeriod = month >= 9 && month <= 12;
const isPrepPeriod = month === 8;


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
    <!-- Header -->
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Déclaration NAPI</h1>
        <p class="mt-1 text-[13.5px] text-[var(--text-secondary)]">Déclaration annuelle de détention et d'emplacement de ruches (Cerfa 13995*07)</p>
      </div>
      <UButton
        v-if="inPeriod && !alreadyDeclared"
        icon="i-lucide-send"
        label="Faire la déclaration"
        color="primary"
        @click="showConfirmModal = true"
      />
    </div>

    <!-- Info banner -->
    <div class="bg-[var(--honey-soft)] border border-[var(--honey)] rounded-[12px] p-4 mb-6 flex items-start gap-3">
      <UIcon name="i-lucide-calendar-clock" class="h-5 w-5 text-[var(--honey-deep)] shrink-0 mt-0.5" />
      <div>
        <p class="text-[13px] font-semibold text-[var(--honey-deep)]">Période de déclaration : 1er septembre — 31 décembre</p>
        <p class="text-[12.5px] text-[var(--text-secondary)] mt-0.5">La déclaration NAPI est obligatoire chaque année. Tout apiculteur doit déclarer son cheptel avant le 31 décembre.</p>
      </div>
    </div>

    <!-- 01 — Déclarations -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-3">
        <p class="text-[11px] font-semibold text-[var(--honey-deep)] uppercase tracking-[0.12em]">01 — Déclarations</p>
        <div class="flex items-center gap-2">
          <span class="text-[12px] text-[var(--text-tertiary)]">Année</span>
          <select class="text-[12px] border border-[var(--border-default)] rounded-lg px-2 py-1 bg-white text-[var(--text-primary)] focus:border-[var(--honey)] focus:outline-none" :value="currentYear">
            <option v-for="y in [currentYear, currentYear - 1, currentYear - 2, currentYear - 3]" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
      </div>
      <div v-if="declarations.length === 0" class="bg-white border border-[var(--border-default)] rounded-[12px] px-4 py-8 text-center text-[13px] text-[var(--text-tertiary)]">
        Aucune déclaration enregistrée pour cette année
      </div>
      <div v-else class="bg-white border border-[var(--border-default)] rounded-[12px] overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-[var(--border-faint)] bg-[var(--surface-muted)]">
              <th class="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em]">Année</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em]">Nb ruches</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em]">Nb ruchers</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em]">Date dépôt</th>
              <th class="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.08em]">Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="decl in declarations"
              :key="decl.id"
              class="border-b border-[var(--border-faint)] last:border-0 hover:bg-[var(--surface-muted)] transition-colors"
            >
              <td class="px-4 py-3 font-semibold text-[var(--text-primary)]">{{ decl.annee }}</td>
              <td class="px-4 py-3 text-[var(--text-secondary)]">{{ decl.nombreTotalColonies }}</td>
              <td class="px-4 py-3 text-[var(--text-secondary)]">{{ decl.ruchersData?.length ?? '—' }}</td>
              <td class="px-4 py-3 text-[var(--text-secondary)]">{{ new Date(decl.dateDeclaration).toLocaleDateString('fr-FR') }}</td>
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  :style="decl.statut === 'recepisse_recu' ? 'background:var(--sage-soft);color:var(--sage-deep)' : decl.statut === 'enregistre' ? 'background:var(--honey-soft);color:var(--honey-deep)' : 'background:var(--surface-muted);color:var(--text-secondary)'"
                >
                  {{ decl.statut === 'recepisse_recu' ? 'Complet' : decl.statut === 'enregistre' ? 'Enregistrée' : 'Brouillon' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 02 — Préparer ma déclaration -->
    <div>
      <p class="text-[11px] font-semibold text-[var(--honey-deep)] uppercase tracking-[0.12em] mb-3">02 — Préparer ma déclaration</p>
      <div class="space-y-3">
        <div
          v-for="(step, i) in [
            { icon: 'i-lucide-user', title: 'Vérifier vos coordonnées', desc: 'Nom, adresse et numéro NAPI à jour dans les paramètres', to: '/parametres' },
            { icon: 'i-lucide-map-pin', title: 'Renseigner les communes', desc: 'Chaque rucher doit avoir une commune associée pour le formulaire Cerfa' },
            { icon: 'i-lucide-grid-2x2', title: 'Compter vos colonies', desc: 'Ruches de production, ruchettes et nuclei sont à déclarer séparément' },
            { icon: 'i-lucide-download', title: 'Télécharger le Cerfa pré-rempli', desc: 'Cerfa 13995*07 généré automatiquement avec vos données', action: true },
          ]"
          :key="i"
          class="bg-white border border-[var(--border-default)] rounded-[14px] p-4 flex items-start gap-4"
        >
          <div class="w-8 h-8 rounded-[8px] bg-[var(--surface-muted)] flex items-center justify-center shrink-0">
            <UIcon :name="step.icon" class="h-4 w-4 text-[var(--text-secondary)]" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-semibold text-[var(--text-primary)]">{{ step.title }}</p>
            <p class="text-[12.5px] text-[var(--text-tertiary)] mt-0.5">{{ step.desc }}</p>
          </div>
          <NuxtLink v-if="step.to" :to="step.to" class="text-[12px] font-semibold text-[var(--honey-deep)] hover:underline shrink-0">Configurer</NuxtLink>
          <button v-if="step.action" class="text-[12px] font-semibold text-[var(--honey-deep)] hover:underline shrink-0" @click="downloadCerfa">Télécharger</button>
        </div>
      </div>
    </div>

    <!-- État A : hors période -->
    <template v-if="!inPeriod && !isPrepPeriod">
      <div class="mt-6 rounded-[14px] border border-[var(--border-default)] bg-white p-8 text-center">
        <UIcon name="i-lucide-calendar" class="mx-auto h-10 w-10 text-[var(--text-tertiary)]" />
        <h2 class="mt-4 text-[17px] font-semibold text-[var(--text-primary)]">Hors période de déclaration</h2>
        <p class="mt-2 text-[13.5px] text-[var(--text-secondary)]">
          La période s'ouvre le <strong>1er septembre</strong> et se termine le <strong>31 décembre</strong>.
        </p>
      </div>
    </template>

    <!-- État C : déjà déclaré -->
    <template v-if="alreadyDeclared && currentDecl">
      <div class="mt-6 rounded-[14px] border border-[var(--sage-soft)] bg-[var(--sage-soft)] p-5 flex items-center gap-3">
        <UIcon name="i-lucide-check-circle" class="h-6 w-6 text-[var(--sage-deep)] shrink-0" />
        <div>
          <p class="text-[13px] font-semibold text-[var(--sage-deep)]">
            Déclaration {{ currentYear }} effectuée
            <span class="font-normal text-[var(--text-secondary)] ml-1">le {{ new Date(currentDecl.dateDeclaration).toLocaleDateString('fr-FR') }}</span>
          </p>
          <p class="text-[12.5px] text-[var(--text-secondary)]">{{ currentDecl.nombreTotalColonies }} colonies déclarées</p>
        </div>
      </div>
    </template>

    <!-- Modal confirmation -->
    <UModal v-model:open="showConfirmModal">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-[var(--text-primary)]">Confirmer la déclaration</h3>
          <p class="text-[13.5px] text-[var(--text-secondary)]">
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
