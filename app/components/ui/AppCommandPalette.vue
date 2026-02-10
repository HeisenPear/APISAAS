<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-[15vh] backdrop-blur-sm"
        @click.self="emit('close')"
        @keydown.escape="emit('close')"
      >
        <Transition name="palette" appear>
          <div
            v-if="open"
            class="w-full max-w-lg overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Palette de commandes"
          >
            <!-- Search input -->
            <div class="flex items-center gap-3 border-b border-stone-200/60 px-4">
              <UIcon name="i-lucide-search" class="h-5 w-5 shrink-0 text-stone-400" />
              <input
                ref="searchInput"
                v-model="query"
                type="text"
                placeholder="Rechercher une page, une action..."
                class="h-12 w-full border-0 bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
                @keydown.arrow-down.prevent="moveSelection(1)"
                @keydown.arrow-up.prevent="moveSelection(-1)"
                @keydown.enter.prevent="selectCurrent"
              />
              <kbd
                class="shrink-0 rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px] font-medium text-stone-400"
              >
                ESC
              </kbd>
            </div>

            <!-- Results -->
            <div class="max-h-80 overflow-y-auto p-2">
              <template v-for="group in filteredGroups" :key="group.label">
                <p
                  class="mb-1 mt-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400 first:mt-0"
                >
                  {{ group.label }}
                </p>
                <ul>
                  <li v-for="(item, itemIndex) in group.items" :key="item.label">
                    <button
                      type="button"
                      class="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors duration-[var(--duration-fast)]"
                      :class="
                        flatIndex(group, itemIndex) === selectedIndex
                          ? 'bg-amber-50 text-amber-900'
                          : 'text-stone-700 hover:bg-stone-50'
                      "
                      @click="executeItem(item)"
                      @mouseenter="selectedIndex = flatIndex(group, itemIndex)"
                    >
                      <UIcon :name="item.icon" class="h-5 w-5 shrink-0 text-stone-400" />
                      <span class="flex-1 truncate">{{ item.label }}</span>
                      <span v-if="item.shortcut" class="text-xs text-stone-400">
                        {{ item.shortcut }}
                      </span>
                    </button>
                  </li>
                </ul>
              </template>

              <p
                v-if="filteredGroups.length === 0"
                class="px-3 py-8 text-center text-sm text-stone-400"
              >
                Aucun resultat pour &laquo;&nbsp;{{ query }}&nbsp;&raquo;
              </p>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface CommandItem {
  icon: string;
  label: string;
  shortcut?: string;
  to?: string;
  action?: () => void;
}

interface CommandGroup {
  label: string;
  items: CommandItem[];
}

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const query = ref('');
const selectedIndex = ref(0);
const searchInput = ref<HTMLInputElement | null>(null);

const groups: CommandGroup[] = [
  {
    label: 'Navigation',
    items: [
      {
        icon: 'i-lucide-layout-dashboard',
        label: 'Tableau de bord',
        to: '/dashboard',
        shortcut: '\u2318 1',
      },
      { icon: 'i-lucide-map-pin', label: 'Ruchers', to: '/ruchers', shortcut: '\u2318 2' },
      { icon: 'i-lucide-box', label: 'Ruches', to: '/ruches', shortcut: '\u2318 3' },
      { icon: 'i-lucide-clipboard-check', label: 'Inspections', to: '/inspections' },
      { icon: 'i-lucide-droplets', label: 'Production', to: '/production' },
      { icon: 'i-lucide-wallet', label: 'Finances', to: '/finances' },
    ],
  },
  {
    label: 'Actions rapides',
    items: [
      { icon: 'i-lucide-plus', label: 'Nouvelle inspection', to: '/inspections/new' },
      { icon: 'i-lucide-plus', label: 'Ajouter un rucher', to: '/ruchers/new' },
      { icon: 'i-lucide-plus', label: 'Ajouter une ruche', to: '/ruches/new' },
      { icon: 'i-lucide-file-text', label: 'Exporter les donnees' },
    ],
  },
];

const filteredGroups = computed<CommandGroup[]>(() => {
  if (!query.value.trim()) return groups;

  const q = query.value.toLowerCase();
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.label.toLowerCase().includes(q)),
    }))
    .filter((group) => group.items.length > 0);
});

const totalItems = computed(() =>
  filteredGroups.value.reduce((sum, group) => sum + group.items.length, 0),
);

function flatIndex(group: CommandGroup, itemIndex: number): number {
  let index = 0;
  for (const g of filteredGroups.value) {
    if (g === group) return index + itemIndex;
    index += g.items.length;
  }
  return index + itemIndex;
}

function moveSelection(delta: number) {
  const total = totalItems.value;
  if (total === 0) return;
  selectedIndex.value = (selectedIndex.value + delta + total) % total;
}

function selectCurrent() {
  let index = 0;
  for (const group of filteredGroups.value) {
    for (const item of group.items) {
      if (index === selectedIndex.value) {
        executeItem(item);
        return;
      }
      index++;
    }
  }
}

function executeItem(item: CommandItem) {
  emit('close');
  query.value = '';
  selectedIndex.value = 0;
  if (item.to) navigateTo(item.to);
  else if (item.action) item.action();
}

watch(
  () => query.value,
  () => {
    selectedIndex.value = 0;
  },
);
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) nextTick(() => searchInput.value?.focus());
    else {
      query.value = '';
      selectedIndex.value = 0;
    }
  },
);
</script>
