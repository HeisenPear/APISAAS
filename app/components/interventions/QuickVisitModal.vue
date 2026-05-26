<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-[60] flex flex-col bg-white lg:items-center lg:justify-center lg:bg-black/40 lg:p-4"
        @click.self="$emit('update:open', false)"
      >
        <div class="flex h-full w-full flex-col overflow-hidden lg:max-h-[90dvh] lg:max-w-xl lg:rounded-[20px] lg:shadow-2xl">
          <!-- Safe area top spacer (notch iOS PWA standalone) -->
          <div class="safe-area-top shrink-0 lg:hidden" />
          <!-- Header -->
          <div class="flex shrink-0 items-center justify-between border-b px-5 py-4" style="border-color:var(--border-default)">
            <div>
              <h2 class="text-[16px] font-semibold" style="color:var(--text-primary)">Visite rapide · {{ rucherNom }}</h2>
              <p class="text-[12px]" style="color:var(--text-tertiary)">{{ ruches.length }} ruche{{ ruches.length > 1 ? 's' : '' }}</p>
            </div>
            <button type="button" class="flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors hover:bg-[var(--surface-muted)]" @click="$emit('update:open', false)">
              <UIcon name="i-lucide-x" class="h-4 w-4" style="color:var(--text-tertiary)" />
            </button>
          </div>

          <!-- Scrollable body -->
          <div class="app-content flex-1 overflow-y-auto px-5 py-5">
            <InterventionsVisiteRucherForm
              ref="formRef"
              :ruches="ruches"
            />
          </div>

          <!-- Sticky footer -->
          <div class="shrink-0 border-t px-5 py-4" style="border-color:var(--border-default);background:white;padding-bottom:max(1rem, constant(safe-area-inset-bottom, 0px));padding-bottom:max(1rem, env(safe-area-inset-bottom, 0px))">
            <UButton
              block
              color="primary"
              size="lg"
              icon="i-lucide-check"
              :loading="saving"
              class="font-semibold"
              @click="submit"
            >
              Enregistrer la visite
            </UButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  rucherId: string;
  rucherNom: string;
  ruches: { id: string; numero: string | number }[];
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  saved: [];
}>();

const notifications = useNotifications();
const { emit: busEmit } = useDataBus();
const saving = ref(false);
const formRef = ref<{ buildPayload: () => Record<string, unknown> } | null>(null);

async function submit() {
  if (!formRef.value) return;
  const payload = formRef.value.buildPayload();

  saving.value = true;
  try {
    await $fetch('/api/interventions/visite-rucher', {
      method: 'POST',
      body: { rucherId: props.rucherId, ...payload },
    });
    busEmit('visite_rucher:created', { extra: { rucherId: props.rucherId } });
    busEmit('intervention:created');
    notifications.success('Visite enregistrée');
    emit('update:open', false);
    emit('saved');
  } catch (e: unknown) {
    notifications.error(getApiErrorMessage(e, "Erreur lors de l'enregistrement"));
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
