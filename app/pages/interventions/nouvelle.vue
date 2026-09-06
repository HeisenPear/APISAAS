<template>
  <div class="space-y-6">
    <!-- Back link -->
    <NuxtLink
      :to="safeInternalPath(route.query.from) ?? '/interventions'"
      class="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
      style="color: var(--text-tertiary)"
    >
      <UIcon name="i-lucide-arrow-left" class="h-3.5 w-3.5" />
      Retour
    </NuxtLink>

    <!-- ══════════════════════════════════════════ -->
    <!-- FLOW : Rendez-vous professionnel           -->
    <!-- ══════════════════════════════════════════ -->
    <template v-if="isRdvPro">
      <div class="flex items-center gap-4">
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
          style="background: #f3f0ff"
        >
          <UIcon name="i-lucide-briefcase" class="h-5 w-5" style="color: #7c3aed" />
        </div>
        <div>
          <h1
            class="text-[26px] font-semibold tracking-[-0.02em]"
            style="color: var(--text-primary)"
          >
            Rendez-vous professionnel
          </h1>
          <p class="text-sm" style="color: var(--text-secondary)">
            Planifiez un rendez-vous dans votre agenda
          </p>
        </div>
      </div>

      <div
        class="rounded-[14px] border bg-white p-6 shadow-sm"
        style="border-color: var(--border-default)"
      >
        <div class="space-y-4">
          <div>
            <label
              class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em]"
              style="color: var(--honey-deep)"
              >Date &amp; heure</label
            >
            <UiMobileDatePicker
              v-model="rdvDate"
              mode="datetime"
              placeholder="Choisir date et heure"
            />
          </div>
          <div>
            <label
              class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em]"
              style="color: var(--honey-deep)"
              >Type de rendez-vous</label
            >
            <select
              v-model="rdvType"
              class="form-select h-10 w-full rounded-[10px] border px-3 text-[14px] bg-white appearance-none cursor-pointer"
              style="border-color: var(--border-default); color: var(--text-primary)"
            >
              <option value="veterinaire">Vétérinaire</option>
              <option value="syndicat">Syndicat</option>
              <option value="fournisseur">Fournisseur</option>
              <option value="client">Client</option>
              <option value="administration">Administration</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label
              class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em]"
              style="color: var(--honey-deep)"
              >Avec qui (optionnel)</label
            >
            <input
              v-model="rdvContact"
              type="text"
              placeholder="Nom ou organisme…"
              class="form-input h-10 w-full rounded-[10px] border px-3 text-[14px]"
              style="border-color: var(--border-default); color: var(--text-primary)"
            />
          </div>
          <div>
            <label
              class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em]"
              style="color: var(--honey-deep)"
              >Notes</label
            >
            <textarea
              v-model="rdvNotes"
              :rows="3"
              placeholder="Observations, remarques…"
              class="form-textarea w-full rounded-[10px] border px-3 py-2.5 text-[14px]"
              style="border-color: var(--border-default); color: var(--text-primary)"
            />
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3">
        <UButton
          label="Annuler"
          variant="ghost"
          color="neutral"
          @click="navigateTo('/calendrier')"
        />
        <UButton
          label="Enregistrer"
          icon="i-lucide-check"
          color="primary"
          :loading="saving"
          @click="handleRdvProSubmit"
        />
      </div>
    </template>

    <!-- ══════════════════════════════════════════ -->
    <!-- FLOW NORMAL : Wizard 3 étapes             -->
    <!-- ══════════════════════════════════════════ -->
    <template v-else>
      <!-- Page header -->
      <div class="flex items-center gap-4">
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
          style="background: var(--honey-soft)"
        >
          <UIcon name="i-lucide-clipboard-check" class="h-5 w-5" style="color: var(--honey)" />
        </div>
        <div>
          <h1
            class="text-[26px] font-semibold tracking-[-0.02em]"
            style="color: var(--text-primary)"
          >
            Nouvelle intervention
          </h1>
          <p class="text-sm" style="color: var(--text-secondary)">
            Enregistrez une visite sur l'une de vos ruches ou un rucher entier
          </p>
        </div>
      </div>

      <!-- Choix du niveau (ruche vs rucher) -->
      <div v-if="niveau === null" class="space-y-4">
        <p
          class="text-[11px] font-semibold uppercase tracking-[0.12em]"
          style="color: var(--honey-deep)"
        >
          Que souhaitez-vous enregistrer ?
        </p>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            class="flex flex-col items-start gap-3 rounded-[16px] border-2 p-5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            style="border-color: var(--border-default); background: white"
            @click="niveau = 'ruche'"
          >
            <div
              class="flex h-11 w-11 items-center justify-center rounded-[12px]"
              style="background: var(--honey-soft)"
            >
              <UIcon name="i-lucide-hexagon" class="h-5 w-5" style="color: var(--honey)" />
            </div>
            <div>
              <p class="text-[15px] font-semibold mb-1" style="color: var(--text-primary)">
                Intervention ruche
              </p>
              <p class="text-[12.5px] leading-relaxed" style="color: var(--text-secondary)">
                Sélectionnez une ruche précise pour enregistrer une observation détaillée par
                catégorie.
              </p>
            </div>
          </button>
          <button
            type="button"
            class="flex flex-col items-start gap-3 rounded-[16px] border-2 p-5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            style="border-color: var(--border-default); background: white"
            @click="niveau = 'rucher'"
          >
            <div
              class="flex h-11 w-11 items-center justify-center rounded-[12px]"
              style="background: var(--sage-soft)"
            >
              <UIcon name="i-lucide-map-pin" class="h-5 w-5" style="color: var(--sage-deep)" />
            </div>
            <div>
              <p class="text-[15px] font-semibold mb-1" style="color: var(--text-primary)">
                Visite rucher
                <span
                  class="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style="background: var(--sage-soft); color: var(--sage-deep)"
                  >Recommandé 20+ ruches</span
                >
              </p>
              <p class="text-[12.5px] leading-relaxed" style="color: var(--text-secondary)">
                Observation globale du rucher en quelques touches. Notez seulement les exceptions
                par ruche si besoin.
              </p>
            </div>
          </button>
        </div>
      </div>

      <!-- Flow visite rucher -->
      <template v-else-if="niveau === 'rucher'">
        <!-- Sélection du rucher -->
        <div v-if="!visiteRucherId" class="space-y-4">
          <p
            class="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style="color: var(--honey-deep)"
          >
            Sélectionner un rucher
          </p>
          <div
            v-if="allRuchers.length === 0"
            class="rounded-[14px] border bg-white p-8 text-center"
            style="border-color: var(--border-default)"
          >
            <UIcon
              name="i-lucide-map-pin"
              class="mx-auto h-8 w-8 mb-2"
              style="color: var(--text-quaternary)"
            />
            <p class="text-sm" style="color: var(--text-tertiary)">Aucun rucher trouvé</p>
          </div>
          <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              v-for="rucher in allRuchers"
              :key="rucher.id"
              type="button"
              class="flex items-center gap-3 rounded-[12px] border-2 p-4 text-left transition-all duration-150 active:scale-[0.98] hover:shadow-sm"
              style="border-color: var(--border-default); background: white"
              @click="selectVisiteRucher(rucher)"
            >
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                style="background: var(--sage-soft)"
              >
                <UIcon name="i-lucide-map-pin" class="h-4 w-4" style="color: var(--sage-deep)" />
              </div>
              <div>
                <p class="text-[13px] font-semibold" style="color: var(--text-primary)">
                  {{ rucher.nom }}
                </p>
                <p v-if="rucher.commune" class="text-[11.5px]" style="color: var(--text-tertiary)">
                  {{ rucher.commune }}
                </p>
              </div>
            </button>
          </div>
          <div class="flex justify-start">
            <button
              type="button"
              class="text-[12.5px] font-medium hover:underline"
              style="color: var(--text-tertiary)"
              @click="niveau = null"
            >
              ← Retour au choix
            </button>
          </div>
        </div>

        <!-- Formulaire visite rucher -->
        <div v-else class="space-y-4">
          <div
            class="flex items-center gap-2 rounded-[12px] px-4 py-3 text-sm"
            style="background: var(--surface-muted)"
          >
            <UIcon name="i-lucide-map-pin" class="h-4 w-4" style="color: var(--sage-deep)" />
            <span class="font-semibold" style="color: var(--text-primary)">{{
              visiteRucherNom
            }}</span>
            <button
              type="button"
              class="ml-auto text-xs font-medium hover:underline"
              style="color: var(--honey-deep)"
              @click="visiteRucherId = ''"
            >
              Changer
            </button>
          </div>

          <!-- Skeleton pendant le chargement des ruches -->
          <div v-if="visiteRuchesLoading" class="space-y-3">
            <div
              v-for="i in 3"
              :key="i"
              class="h-16 animate-pulse rounded-[12px]"
              style="background: var(--surface-muted)"
            />
          </div>

          <!-- Aucune ruche dans ce rucher -->
          <div
            v-else-if="visiteRuches.length === 0"
            class="rounded-[14px] border bg-white p-8 text-center"
            style="border-color: var(--border-default)"
          >
            <UIcon
              name="i-lucide-box"
              class="mx-auto mb-2 h-8 w-8"
              style="color: var(--text-quaternary)"
            />
            <p class="text-[14px] font-semibold" style="color: var(--text-primary)">
              Aucune ruche dans ce rucher
            </p>
            <p class="mt-1 text-[12px]" style="color: var(--text-tertiary)">
              Ajoutez des ruches à ce rucher avant d'enregistrer une visite groupée.
            </p>
            <NuxtLink
              to="/ruches/nouveau"
              class="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline"
              style="color: var(--honey-deep)"
            >
              Ajouter une ruche →
            </NuxtLink>
          </div>

          <template v-else>
            <InterventionsVisiteRucherForm ref="visiteFormRef" :ruches="visiteRuches" />
            <div
              class="sticky bottom-4 flex items-center justify-end gap-3 rounded-[14px] border px-5 py-3 shadow-lg backdrop-blur-sm"
              style="border-color: var(--border-default); background: rgba(250, 250, 248, 0.9)"
            >
              <UButton
                label="Annuler"
                variant="ghost"
                color="neutral"
                @click="navigateTo('/interventions')"
              />
              <UButton
                label="Enregistrer la visite"
                icon="i-lucide-check"
                color="primary"
                :loading="savingVisite"
                @click="handleVisiteRucherSubmit"
              />
            </div>
          </template>
        </div>
      </template>

      <!-- Stepper (uniquement pour niveau ruche) -->
      <div v-if="niveau === 'ruche'" class="flex items-start justify-center gap-0">
        <template v-for="(s, i) in STEPS" :key="s.label">
          <div class="flex flex-col items-center gap-1.5">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200"
              :class="stepCircleClass(i + 1)"
            >
              <UIcon v-if="step > i + 1" name="i-lucide-check" class="h-4 w-4" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span
              class="text-xs font-medium transition-colors"
              :class="step === i + 1 ? 'text-[var(--honey-deep)]' : 'text-[var(--text-tertiary)]'"
              >{{ s.label }}</span
            >
          </div>
          <div
            v-if="i < STEPS.length - 1"
            class="mt-4 h-px w-12 flex-shrink-0 sm:w-20"
            style="background: var(--border-default)"
          />
        </template>
      </div>

      <!-- Step 1 : Ruche -->
      <div v-if="niveau === 'ruche' && step === 1" class="space-y-4">
        <div
          class="rounded-[14px] border bg-white p-6 shadow-sm"
          style="border-color: var(--border-default)"
        >
          <p
            class="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em]"
            style="color: var(--honey-deep)"
          >
            Sélectionner une ruche
          </p>

          <div v-if="allRuches.length > 4" class="mb-4">
            <input
              v-model="rucheSearch"
              type="search"
              placeholder="Rechercher…"
              class="form-input h-10 w-full rounded-[10px] border px-3 text-[14px]"
              style="border-color: var(--border-default); color: var(--text-primary)"
            />
          </div>

          <div v-if="ruchesLoading" class="flex items-center justify-center py-8">
            <UIcon
              name="i-lucide-loader-2"
              class="h-6 w-6 animate-spin"
              style="color: var(--text-tertiary)"
            />
          </div>

          <UiErrorState v-else-if="ruchesError" :error="ruchesError" :retry="refreshRuches" />

          <UiEmptyState
            v-else-if="allRuches.length === 0"
            icon="i-lucide-box"
            title="Aucune ruche"
            description="Ajoutez d'abord des ruches"
            action-label="Ajouter une ruche"
            @action="navigateTo('/ruches/nouveau')"
          />

          <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <button
              v-for="ruche in filteredRuches"
              :key="ruche.id"
              type="button"
              class="flex flex-col gap-2 rounded-[12px] border-2 p-4 text-left transition-all duration-150 active:scale-95"
              :style="
                selectedRucheId === ruche.id
                  ? 'border-color:var(--honey);background:var(--honey-soft)'
                  : 'border-color:var(--border-default);background:white'
              "
              @click="selectRuche(ruche)"
            >
              <div class="flex items-center gap-2">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-[8px]"
                  :style="
                    selectedRucheId === ruche.id
                      ? 'background:color-mix(in srgb,var(--honey) 20%,transparent)'
                      : 'background:var(--surface-muted)'
                  "
                >
                  <UIcon
                    name="i-lucide-hexagon"
                    class="h-5 w-5"
                    :style="
                      selectedRucheId === ruche.id
                        ? 'color:var(--honey)'
                        : 'color:var(--text-tertiary)'
                    "
                  />
                </div>
                <span class="text-sm font-bold" style="color: var(--text-primary)">{{
                  ruche.numero
                }}</span>
              </div>
              <span v-if="ruche.rucherNom" class="text-xs" style="color: var(--text-tertiary)">{{
                ruche.rucherNom
              }}</span>
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                :class="statutPillClass(ruche.statut)"
                >{{ ruche.statut ?? 'inconnu' }}</span
              >
            </button>

            <p
              v-if="filteredRuches.length === 0 && rucheSearch"
              class="col-span-full py-4 text-center text-sm"
              style="color: var(--text-tertiary)"
            >
              Aucune ruche trouvée pour "{{ rucheSearch }}"
            </p>
          </div>

          <div v-if="allRuches.length === 0" class="mt-4 text-center">
            <button
              type="button"
              class="text-sm font-medium hover:underline"
              style="color: var(--honey-deep)"
              @click="navigateTo('/ruches/nouveau')"
            >
              + Créer une ruche
            </button>
          </div>
        </div>
      </div>

      <!-- Step 2 : Catégories -->
      <div v-if="niveau === 'ruche' && step === 2" class="space-y-4">
        <div
          class="rounded-[14px] border bg-white p-6 shadow-sm"
          style="border-color: var(--border-default)"
        >
          <div class="mb-4 flex items-center gap-2 text-sm">
            <div
              class="flex h-6 w-6 items-center justify-center rounded-[6px]"
              style="background: var(--honey-soft)"
            >
              <UIcon name="i-lucide-hexagon" class="h-4 w-4" style="color: var(--honey)" />
            </div>
            <span class="font-semibold" style="color: var(--text-primary)">{{
              selectedRuche?.numero
            }}</span>
            <span v-if="selectedRuche?.rucherNom" style="color: var(--text-tertiary)"
              >· {{ selectedRuche.rucherNom }}</span
            >
            <button
              type="button"
              class="ml-auto text-xs font-medium hover:underline"
              style="color: var(--honey-deep)"
              @click="step = 1"
            >
              Changer
            </button>
          </div>
          <InterventionsInterventionGrid v-model="selectedCategories" :multi="true" />
        </div>

        <div v-if="selectedCategories.length > 0" class="flex justify-end">
          <UButton
            label="Continuer"
            icon="i-lucide-arrow-right"
            color="primary"
            @click="step = 3"
          />
        </div>
      </div>

      <!-- Step 3 : Formulaire -->
      <div v-if="niveau === 'ruche' && step === 3" class="space-y-6">
        <!-- Context bar -->
        <div
          class="flex flex-wrap items-center gap-2 rounded-[12px] px-4 py-3 text-sm"
          style="background: var(--surface-muted)"
        >
          <div class="flex items-center gap-1.5">
            <UIcon name="i-lucide-hexagon" class="h-4 w-4" style="color: var(--honey)" />
            <span class="font-semibold" style="color: var(--text-primary)">{{
              selectedRuche?.numero
            }}</span>
          </div>
          <InterventionsInterventionBadge v-for="t in selectedCategories" :key="t" :type="t" />
          <button
            type="button"
            class="ml-auto text-xs font-medium hover:underline"
            style="color: var(--honey-deep)"
            @click="step = 2"
          >
            Modifier
          </button>
        </div>

        <!-- Date + Météo -->
        <div
          class="rounded-[14px] border bg-white px-5 py-4 shadow-sm"
          style="border-color: var(--border-default)"
        >
          <div class="flex items-end gap-3">
            <div class="flex-1">
              <label
                class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em]"
                style="color: var(--honey-deep)"
                >Date</label
              >
              <UiMobileDatePicker
                v-model="formDate"
                mode="datetime"
                placeholder="Choisir date et heure"
              />
            </div>
            <div class="w-32 shrink-0">
              <label
                class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em]"
                style="color: var(--honey-deep)"
                >Temp.</label
              >
              <div class="relative">
                <UIcon
                  name="i-lucide-thermometer"
                  class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                  style="color: var(--text-tertiary)"
                />
                <input
                  v-model.number="formMeteo.temperature"
                  type="number"
                  step="0.5"
                  min="-20"
                  max="50"
                  placeholder="22°C"
                  class="form-input h-10 w-full rounded-[10px] border pl-7 pr-3 text-[14px]"
                  style="border-color: var(--border-default); color: var(--text-primary)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Dynamic forms per category -->
        <div
          v-for="cat in selectedCategories"
          :key="cat"
          class="rounded-[14px] border bg-white p-6 shadow-sm"
          style="border-color: var(--border-default)"
        >
          <div class="mb-4 flex items-center gap-2">
            <InterventionsInterventionBadge :type="cat" />
          </div>
          <component
            :is="formComponentMap[cat]"
            v-if="formComponentMap[cat]"
            :model-value="categoriesData[cat] ?? getDefaultData(cat)"
            :ruchers="allRuchers"
            :ruches="otherRuches"
            @update:model-value="(val: Record<string, unknown>) => updateCategoryData(cat, val)"
          />
          <p v-else class="text-sm" style="color: var(--text-tertiary)">
            Formulaire en cours de développement
          </p>
        </div>

        <!-- Notes générales -->
        <div
          class="rounded-[14px] border bg-white p-6 shadow-sm"
          style="border-color: var(--border-default)"
        >
          <p
            class="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
            style="color: var(--honey-deep)"
          >
            Notes générales
          </p>
          <textarea
            v-model="formNotes"
            :rows="3"
            class="form-textarea w-full rounded-[10px] border px-3 py-2.5 text-[14px]"
            style="border-color: var(--border-default); color: var(--text-primary)"
            placeholder="Observations, remarques…"
          />
        </div>

        <!-- Sticky footer -->
        <div
          class="sticky bottom-4 flex items-center justify-end gap-3 rounded-[14px] border px-5 py-3 shadow-lg backdrop-blur-sm"
          style="border-color: var(--border-default); background: rgba(250, 250, 248, 0.9)"
        >
          <UButton
            label="Annuler"
            variant="ghost"
            color="neutral"
            @click="navigateTo('/interventions')"
          />
          <UButton
            label="Enregistrer"
            icon="i-lucide-check"
            color="primary"
            :loading="saving"
            @click="handleSubmit"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Ruche } from '~/types/models';
import type { ApiListResponse } from '~/types/api';
import { CATEGORIES_INTERVENTION } from '~/types/interventions';
import type { CategorieIntervention, BulkInterventionPayload } from '~/types/interventions';

definePageMeta({ layout: 'default' });

const route = useRoute();
const notifications = useNotifications();
const postAction = usePostAction();
const { createBulkIntervention } = useInterventions();
const { emit: busEmit } = useDataBus();
const { ruchers: allRuchers } = useRuchers();

// Niveau (null = choix, 'ruche' = flow normal, 'rucher' = visite rucher)
const niveau = ref<'ruche' | 'rucher' | null>(
  route.query.niveau === 'rucher' ? 'rucher' : route.query.niveau === 'ruche' ? 'ruche' : null,
);

// Visite rucher state
const visiteRucherId = ref((route.query.rucherId as string) ?? '');
const visiteRucherNom = ref('');
const visiteRuches = ref<{ id: string; numero: string | number }[]>([]);
const visiteRuchesLoading = ref(false);
const savingVisite = ref(false);
const visiteFormRef = ref<{ buildPayload: () => Record<string, unknown> } | null>(null);

function selectVisiteRucher(rucher: { id: string; nom: string }) {
  visiteRucherId.value = rucher.id;
  visiteRucherNom.value = rucher.nom;
  visiteRuchesLoading.value = true;
  visiteRuches.value = [];
  // `appelApi` et pas `$fetch` — cf. `app/utils/appelApi.ts` : résoudre le
  // chemin contre l'union des 213 routes dépasse le plafond d'instanciation.
  appelApi<ApiListResponse<Ruche>>('/api/ruches', { query: { rucherId: rucher.id, limit: 100 } })
    .then((res) => {
      visiteRuches.value = res.data.map((r) => ({ id: r.id, numero: r.numero }));
    })
    .catch(() => {
      visiteRuches.value = [];
    })
    .finally(() => {
      visiteRuchesLoading.value = false;
    });
}

// Hydrate le nom + ruches quand on arrive avec ?rucherId= pré-rempli
watch(
  allRuchers,
  (list) => {
    if (!visiteRucherId.value || visiteRucherNom.value || !list.length) return;
    const found = list.find((r: { id: string; nom: string }) => r.id === visiteRucherId.value);
    if (found) selectVisiteRucher(found);
  },
  { immediate: true },
);

async function handleVisiteRucherSubmit() {
  if (!visiteRucherId.value || !visiteFormRef.value || savingVisite.value) return;
  savingVisite.value = true;
  try {
    const payload = visiteFormRef.value.buildPayload();
    const body = { rucherId: visiteRucherId.value, ...payload };
    const { isOnline, queueMutation } = useOfflineSync();
    if (!isOnline.value) {
      // Hors-ligne : file d'attente IndexedDB, rejouée au retour du réseau
      await queueMutation('/api/interventions/visite-rucher', 'POST', body);
      notifications.success('Visite enregistrée hors ligne — synchronisée au retour du réseau');
    } else {
      // `appelApi` et pas `$fetch` — cf. `app/utils/appelApi.ts`.
      await appelApi<unknown>('/api/interventions/visite-rucher', { method: 'POST', body });
      notifications.success('Visite du rucher enregistrée');
    }
    busEmit('visite_rucher:created', { extra: { rucherId: visiteRucherId.value } });
    busEmit('intervention:created');
    await navigateTo(route.query.from ? String(route.query.from) : '/interventions');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'enregistrement"));
  } finally {
    savingVisite.value = false;
  }
}

const isRdvPro = computed(() => route.query.type === 'rendez_vous_pro');
const rdvDate = ref(
  route.query.date ? `${route.query.date}T09:00` : new Date().toISOString().slice(0, 16),
);
const rdvType = ref<
  'veterinaire' | 'syndicat' | 'fournisseur' | 'client' | 'administration' | 'autre'
>('veterinaire');
const rdvContact = ref('');
const rdvNotes = ref('');

const STEPS = [{ label: 'Ruche' }, { label: 'Catégories' }, { label: 'Formulaire' }];
const step = ref(1);
const selectedRucheId = ref('');
const selectedRuche = ref<(Ruche & { rucherNom?: string; statut?: string | null }) | null>(null);
const selectedCategories = ref<CategorieIntervention[]>([]);
const saving = ref(false);
const rucheSearch = ref('');

const formDate = ref(
  route.query.date ? `${route.query.date}T09:00` : new Date().toISOString().slice(0, 16),
);
const formMeteo = reactive<{ temperature?: number }>({});
const formNotes = ref('');
const categoriesData = reactive<Record<string, Record<string, unknown>>>({});

const {
  data: ruchesData,
  status: ruchesStatus,
  error: ruchesError,
  refresh: refreshRuches,
} = useAsyncData<ApiListResponse<Ruche & { rucherNom?: string; statut?: string | null }>>(
  'interventions-nouvelle-ruches',
  /**
   * ⚠️ `appelApi` ET PAS `useFetch` — cf. `app/utils/appelApi.ts`. Typer ce
   * chemin contre l'union des 213 routes fait déplier à TypeScript le type de
   * retour réel de chaque handler ; le projet est au-delà du plafond
   * d'instanciation. La `query` (constante) est écrite dans l'URL.
   */
  () =>
    appelApi<ApiListResponse<Ruche & { rucherNom?: string; statut?: string | null }>>(
      '/api/ruches?limit=100',
    ),
  {
    default: () => ({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }),
  },
);

/**
 * ⚠️ LE FORMULAIRE DE SAISIE CHOISIT UNE RUCHE, et il n'écoutait rien. Maya en
 * crée à la voix — « ajoute une ruche », ou une division qui en fait naître une.
 * La ruche neuve manquait au sélecteur, et l'apiculteur croyait sa dictée
 * perdue : il la redictait.
 */
const { on: surRuchesFormulaire } = useDataBus();
surRuchesFormulaire(['ruche:created', 'ruche:updated', 'ruche:deleted'], () => {
  void refreshRuches();
});

const ruchesLoading = computed(
  () => ruchesStatus.value !== 'success' && ruchesStatus.value !== 'error',
);
const allRuches = computed(() => ruchesData.value?.data ?? []);
const otherRuches = computed(() => allRuches.value.filter((r) => r.id !== selectedRucheId.value));
const filteredRuches = computed(() => {
  if (!rucheSearch.value) return allRuches.value;
  const q = rucheSearch.value.toLowerCase();
  return allRuches.value.filter(
    (r) =>
      String(r.numero).toLowerCase().includes(q) || (r.rucherNom ?? '').toLowerCase().includes(q),
  );
});

watch(
  allRuches,
  (ruches) => {
    const rucheId = route.query.rucheId as string;
    if (rucheId && ruches.length > 0 && !selectedRucheId.value) {
      const found = ruches.find((r) => r.id === rucheId);
      if (found) selectRuche(found);
    }
  },
  { once: true },
);

function stepCircleClass(n: number) {
  if (step.value > n) return 'bg-[var(--sage)] text-white';
  if (step.value === n) return 'bg-[var(--honey)] text-white shadow-md';
  return 'bg-[var(--surface-muted)] text-[var(--text-tertiary)]';
}

function statutPillClass(statut: string | null | undefined) {
  const map: Record<string, string> = {
    active: 'bg-amber-50 text-amber-700',
    hivernage: 'bg-blue-50 text-blue-700',
    orpheline: 'bg-red-50 text-red-700',
    empilee: 'bg-violet-50 text-violet-700',
  };
  return map[statut ?? ''] ?? 'bg-stone-100 text-stone-600';
}

function selectRuche(ruche: Ruche & { rucherNom?: string; statut?: string | null }) {
  selectedRucheId.value = ruche.id;
  selectedRuche.value = ruche;

  const preselectQuery = route.query.preselect as string | undefined;
  const typeQuery = route.query.type as string | undefined;

  if (preselectQuery) {
    const cats = preselectQuery
      .split(',')
      .filter((c) =>
        (CATEGORIES_INTERVENTION as readonly string[]).includes(c),
      ) as CategorieIntervention[];
    if (cats.length > 0) {
      selectedCategories.value = cats;
      step.value = cats.length === 1 ? 3 : 2;
      return;
    }
  }

  if (typeQuery && (CATEGORIES_INTERVENTION as readonly string[]).includes(typeQuery)) {
    selectedCategories.value = [typeQuery as CategorieIntervention];
    step.value = 3;
  } else {
    step.value = 2;
  }
}

const formComponentMap: Record<string, ReturnType<typeof defineAsyncComponent> | undefined> = {
  controle: defineAsyncComponent(() => import('~/components/interventions/forms/FormControle.vue')),
  materiel: defineAsyncComponent(() => import('~/components/interventions/forms/FormMateriel.vue')),
  recolte: defineAsyncComponent(() => import('~/components/interventions/forms/FormRecolte.vue')),
  nourrissement: defineAsyncComponent(
    () => import('~/components/interventions/forms/FormNourrissement.vue'),
  ),
  essaimage: defineAsyncComponent(
    () => import('~/components/interventions/forms/FormEssaimage.vue'),
  ),
  division: defineAsyncComponent(() => import('~/components/interventions/forms/FormDivision.vue')),
  deplacement: defineAsyncComponent(
    () => import('~/components/interventions/forms/FormDeplacement.vue'),
  ),
  varroa: defineAsyncComponent(() => import('~/components/interventions/forms/FormVarroa.vue')),
  pesee: defineAsyncComponent(() => import('~/components/interventions/forms/FormPesee.vue')),
  commentaire: defineAsyncComponent(
    () => import('~/components/interventions/forms/FormCommentaire.vue'),
  ),
  empilement: defineAsyncComponent(
    () => import('~/components/interventions/forms/FormEmpilement.vue'),
  ),
  sanitaire: defineAsyncComponent(
    () => import('~/components/interventions/forms/FormSanitaire.vue'),
  ),
  transvasement: defineAsyncComponent(
    () => import('~/components/interventions/forms/FormTransvasement.vue'),
  ),
};

function getDefaultData(cat: string): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    materiel: { elements: [] },
    controle: {
      reineVue: null,
      couvainPresent: null,
      celluleRoyale: null,
      reserves: null,
      forceColonie: 2,
      comportement: 'calme',
    },
    recolte: { typeProduit: 'miel' },
    nourrissement: { type: 'sirop_sucre', quantite: 1, unite: 'kg' },
    essaimage: { essaimRecupere: false },
    division: { nombreDivisions: 1 },
    deplacement: { rucherDestinationId: '' },
    varroa: { sousAction: 'comptage_plancher', nombreVarroas: 0, dureeJours: 3 },
    pesee: { poidsKg: 1, typePesee: 'totale' },
    commentaire: { texte: '' },
    empilement: { rucheDestinationId: '' },
    sanitaire: { typeEvenement: 'essaim_mort' },
    transvasement: { rucheDestinationId: '', cadresTransferes: 0, devenirRucheSource: 'stockage' },
  };
  return defaults[cat] ?? {};
}

function updateCategoryData(cat: string, val: Record<string, unknown>) {
  categoriesData[cat] = val;
}

async function handleRdvProSubmit() {
  if (saving.value) return;
  saving.value = true;
  try {
    const body = {
      date: new Date(rdvDate.value).toISOString(),
      typeRdv: rdvType.value,
      contact: rdvContact.value || undefined,
      notes: rdvNotes.value || undefined,
    };
    const { isOnline, queueMutation } = useOfflineSync();
    if (!isOnline.value) {
      await queueMutation('/api/interventions/rdv-pro', 'POST', body);
      notifications.success('Rendez-vous enregistré hors ligne — synchronisé au retour du réseau');
    } else {
      // `appelApi` et pas `$fetch` — cf. `app/utils/appelApi.ts`.
      await appelApi<unknown>('/api/interventions/rdv-pro', { method: 'POST', body });
      notifications.success('Rendez-vous enregistré');
    }
    busEmit('intervention:created');
    await navigateTo('/calendrier');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'enregistrement"));
  } finally {
    saving.value = false;
  }
}

async function handleSubmit() {
  if (saving.value || !selectedRucheId.value || selectedCategories.value.length === 0) return;

  saving.value = true;
  try {
    const categories: Record<string, Record<string, unknown>> = {};
    for (const cat of selectedCategories.value) {
      categories[cat] = categoriesData[cat] ?? getDefaultData(cat);
    }

    const payload: BulkInterventionPayload = {
      rucheId: selectedRucheId.value,
      dateVisite: new Date(formDate.value).toISOString(),
      notes: formNotes.value || undefined,
      meteo:
        cleanNumber(formMeteo.temperature) !== undefined
          ? { temperature: cleanNumber(formMeteo.temperature) }
          : undefined,
      categories,
    };

    const result = await createBulkIntervention(payload);

    const hasRecolte = selectedCategories.value.includes('recolte');
    const isSanitaireMort =
      selectedCategories.value.includes('sanitaire') &&
      (categoriesData.sanitaire as { typeEvenement?: string } | undefined)?.typeEvenement ===
        'essaim_mort';

    const title =
      selectedCategories.value.length > 1
        ? `${selectedCategories.value.length} catégories enregistrées`
        : 'Intervention enregistrée';

    let followUp: { label: string; to: string } | undefined;
    if (isSanitaireMort) {
      followUp = {
        label: 'Nettoyer cette ruche →',
        to: `/interventions/nouvelle?rucheId=${selectedRucheId.value}&preselect=sanitaire&from=/ruches/${selectedRucheId.value}`,
      };
    } else if (hasRecolte) {
      followUp = { label: 'Compléter la récolte →', to: '/production' };
    }

    postAction.execute(
      'intervention:created',
      { id: result?.id, extra: { rucheId: selectedRucheId.value } },
      { toast: { title }, returnToOrigin: true, followUp },
    );

    if (!route.query.from) await navigateTo('/interventions');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'enregistrement"));
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--honey);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--honey) 15%, transparent);
}
</style>
