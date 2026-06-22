<script setup lang="ts">
interface Espace {
  ownerId: string;
  label: string;
  role: string;
  isOwner: boolean;
  isActive: boolean;
}

const { data } = useFetch<{ data: Espace[] }>('/api/membres/espaces', {
  key: 'mes-espaces',
  lazy: true,
});

const root = ref<HTMLElement | null>(null);
const open = ref(false);
const switching = ref(false);
onClickOutside(root, () => (open.value = false));

const espaces = computed(() => data.value?.data ?? []);
// Le sélecteur n'apparaît que si l'utilisateur a accès à plus d'un espace.
const hasMultiple = computed(() => espaces.value.length > 1);
const active = computed(() => espaces.value.find((e) => e.isActive) ?? espaces.value[0] ?? null);

const roleLabels: Record<string, string> = {
  owner: 'Propriétaire',
  admin: 'Admin',
  apiculteur: 'Apiculteur',
  comptable: 'Comptable',
};

async function switchTo(ownerId: string) {
  if (switching.value || ownerId === active.value?.ownerId) {
    open.value = false;
    return;
  }
  switching.value = true;
  try {
    await $fetch('/api/membres/espace-actif', { method: 'POST', body: { ownerId } });
    // Recharge tout sous le nouveau périmètre de données.
    window.location.reload();
  } catch {
    switching.value = false;
    open.value = false;
  }
}
</script>

<template>
  <div v-if="hasMultiple" ref="root" class="relative mx-3.5 mb-2">
    <button
      class="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:brightness-125"
      style="background: rgba(255, 255, 255, 0.05)"
      :disabled="switching"
      @click="open = !open"
    >
      <UIcon
        :name="active?.isOwner ? 'i-lucide-home' : 'i-lucide-users'"
        class="h-4 w-4 shrink-0"
        style="color: rgba(255, 255, 255, 0.6)"
      />
      <span class="min-w-0 flex-1">
        <span class="block truncate text-[12px] font-semibold leading-tight text-white">
          {{ active?.label ?? 'Espace' }}
        </span>
        <span class="block text-[10px]" style="color: rgba(255, 255, 255, 0.45)">
          {{ roleLabels[active?.role ?? ''] ?? active?.role }}
        </span>
      </span>
      <UIcon
        name="i-lucide-chevrons-up-down"
        class="h-4 w-4 shrink-0"
        style="color: rgba(255, 255, 255, 0.4)"
      />
    </button>

    <div
      v-if="open"
      class="absolute left-0 right-0 z-50 mt-1 rounded-[10px] border border-white/10 p-1 shadow-xl"
      style="background: #2a2a2c"
    >
      <button
        v-for="e in espaces"
        :key="e.ownerId"
        class="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left transition-colors hover:bg-white/5"
        @click="switchTo(e.ownerId)"
      >
        <UIcon
          :name="e.isOwner ? 'i-lucide-home' : 'i-lucide-users'"
          class="h-4 w-4 shrink-0"
          style="color: rgba(255, 255, 255, 0.55)"
        />
        <span class="min-w-0 flex-1">
          <span class="block truncate text-[12px] text-white">{{ e.label }}</span>
          <span class="block text-[10px]" style="color: rgba(255, 255, 255, 0.45)">
            {{ roleLabels[e.role] ?? e.role }}
          </span>
        </span>
        <UIcon
          v-if="e.isActive"
          name="i-lucide-check"
          class="h-3.5 w-3.5 shrink-0"
          style="color: var(--honey)"
        />
      </button>
    </div>
  </div>
</template>
