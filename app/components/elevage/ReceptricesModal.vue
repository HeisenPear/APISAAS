<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  session: { id: string; nombreCellulesGreffees?: number } | null;
}>();
const emit = defineEmits<{ 'update:open': [boolean] }>();

const toast = useToast();
const isOpen = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
});

interface Receptrice {
  id: string;
  identifiantReceptrice: string;
  celluleAcceptee: boolean | null;
  reineNeeId: string | null;
}

const sessionId = computed(() => props.session?.id ?? null);
const receptrices = ref<Receptrice[]>([]);

async function refresh() {
  if (!sessionId.value) return;
  const res = await $fetch<{ data: Receptrice[] }>(
    `/api/elevage/sessions/${sessionId.value}/receptrices`,
  );
  receptrices.value = res.data;
}

watch(
  () => props.open,
  (v) => {
    if (v && sessionId.value) refresh();
  },
);

// Génération rapide en série ("Ruchette 1..N") — le vrai "greffage en lot".
const nombreALotter = ref(props.session?.nombreCellulesGreffees || 10);
const prefixe = ref('Ruchette');
const generating = ref(false);

async function genererEnLot() {
  if (!sessionId.value) return;
  generating.value = true;
  try {
    await $fetch(`/api/elevage/sessions/${sessionId.value}/receptrices`, {
      method: 'POST',
      body: { count: nombreALotter.value, prefix: prefixe.value },
    });
    await refresh();
    toast.add({ title: `${nombreALotter.value} récepteurs créés`, color: 'success' });
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur'), color: 'error' });
  } finally {
    generating.value = false;
  }
}

async function marquer(recId: string, celluleAcceptee: boolean) {
  if (!sessionId.value) return;
  try {
    await $fetch(`/api/elevage/sessions/${sessionId.value}/receptrices/${recId}`, {
      method: 'PUT',
      body: { celluleAcceptee },
    });
    await refresh();
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur'), color: 'error' });
  }
}

async function supprimer(recId: string) {
  if (!sessionId.value) return;
  try {
    await $fetch(`/api/elevage/sessions/${sessionId.value}/receptrices/${recId}`, {
      method: 'DELETE',
    });
    await refresh();
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'Erreur'), color: 'error' });
  }
}

function statutClass(accepte: boolean | null) {
  if (accepte === true) return 'bg-[var(--sage-soft)] text-[var(--sage-deep)]';
  if (accepte === false) return 'bg-red-50 text-red-600';
  return 'bg-[var(--surface-muted)] text-[var(--text-tertiary)]';
}
</script>

<template>
  <UModal v-model:open="isOpen" title="Récepteurs de la session">
    <template #body>
      <div class="space-y-5">
        <div
          class="flex items-end gap-2 rounded-[12px] border border-dashed border-[var(--border-default)] p-3"
        >
          <UFormField label="Nombre" class="w-24">
            <UInput v-model.number="nombreALotter" type="number" min="1" max="200" />
          </UFormField>
          <UFormField label="Préfixe" class="flex-1">
            <UInput v-model="prefixe" placeholder="Ruchette" />
          </UFormField>
          <UButton :loading="generating" color="primary" variant="soft" @click="genererEnLot">
            Générer en lot
          </UButton>
        </div>

        <div
          v-if="!receptrices.length"
          class="py-6 text-center text-sm text-[var(--text-tertiary)]"
        >
          Aucun récepteur pour l'instant — générez-en en lot ci-dessus.
        </div>
        <div v-else class="max-h-96 space-y-2 overflow-y-auto">
          <div
            v-for="r in receptrices"
            :key="r.id"
            class="flex items-center justify-between rounded-[10px] border border-[var(--border-default)] px-3 py-2"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-[13px] font-medium text-[var(--text-primary)]">
                {{ r.identifiantReceptrice }}
              </p>
              <p v-if="r.reineNeeId" class="text-[11px] text-[var(--text-tertiary)]">
                Reine née enregistrée
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-1.5">
              <span
                class="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                :class="statutClass(r.celluleAcceptee)"
              >
                {{
                  r.celluleAcceptee === true
                    ? 'Acceptée'
                    : r.celluleAcceptee === false
                      ? 'Rejetée'
                      : 'En attente'
                }}
              </span>
              <UButton
                icon="i-lucide-check"
                size="xs"
                variant="ghost"
                color="primary"
                title="Marquer acceptée"
                @click="marquer(r.id, true)"
              />
              <UButton
                icon="i-lucide-x"
                size="xs"
                variant="ghost"
                color="error"
                title="Marquer rejetée"
                @click="marquer(r.id, false)"
              />
              <UButton
                icon="i-lucide-trash"
                size="xs"
                variant="ghost"
                title="Supprimer"
                @click="supprimer(r.id)"
              />
            </div>
          </div>
        </div>

        <p class="text-[11.5px] text-[var(--text-tertiary)]">
          Une fois une cellule acceptée, enregistrez la reine née depuis
          <NuxtLink to="/elevage/reines" class="underline">la page Reines</NuxtLink>
          en renseignant sa reine mère.
        </p>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end">
        <UButton color="neutral" variant="outline" @click="isOpen = false">Fermer</UButton>
      </div>
    </template>
  </UModal>
</template>
