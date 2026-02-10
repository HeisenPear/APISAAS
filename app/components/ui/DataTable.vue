<template>
  <div class="overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-sm">
    <!-- Loading state -->
    <div v-if="loading" class="p-6">
      <LoadingSkeleton :count="5" variant="row" />
    </div>

    <!-- Empty state -->
    <div v-else-if="data.length === 0">
      <slot name="empty">
        <EmptyState
          icon="i-lucide-database"
          title="Aucune donnee"
          description="Il n'y a aucun element a afficher pour le moment."
        />
      </slot>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-stone-200/60">
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500"
              :class="col.sortable ? 'cursor-pointer select-none hover:text-stone-700' : ''"
              @click="col.sortable ? handleSort(col.key) : undefined"
            >
              <div class="flex items-center gap-1.5">
                {{ col.label }}
                <template v-if="col.sortable && sortKey === col.key">
                  <UIcon
                    :name="sortOrder === 'asc' ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                    class="h-3.5 w-3.5"
                  />
                </template>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, rowIndex) in data"
            :key="rowIndex"
            class="border-b border-stone-100 transition-colors duration-[var(--duration-fast)] last:border-b-0 hover:bg-stone-50/50"
          >
            <td v-for="col in columns" :key="col.key" class="px-4 py-3 text-sm text-stone-700">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="!loading && data.length > 0 && pagination"
      class="flex items-center justify-between border-t border-stone-200/60 px-4 py-3"
    >
      <p class="text-sm text-stone-500">
        {{ paginationLabel }}
      </p>
      <div class="flex items-center gap-1">
        <UButton
          variant="ghost"
          size="sm"
          icon="i-lucide-chevron-left"
          :disabled="pagination.page <= 1"
          class="min-h-[44px] min-w-[44px]"
          @click="emit('page-change', pagination!.page - 1)"
        />
        <UButton
          variant="ghost"
          size="sm"
          icon="i-lucide-chevron-right"
          :disabled="pagination.page >= totalPages"
          class="min-h-[44px] min-w-[44px]"
          @click="emit('page-change', pagination!.page + 1)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

interface Pagination {
  page: number;
  perPage: number;
  total: number;
}

const props = defineProps<{
  columns: Column[];
  data: Record<string, unknown>[];
  loading: boolean;
  pagination?: Pagination;
}>();

const emit = defineEmits<{
  sort: [key: string, order: 'asc' | 'desc'];
  'page-change': [page: number];
}>();

const sortKey = ref('');
const sortOrder = ref<'asc' | 'desc'>('asc');

const totalPages = computed(() => {
  if (!props.pagination) return 1;
  return Math.ceil(props.pagination.total / props.pagination.perPage);
});

const paginationLabel = computed(() => {
  if (!props.pagination) return '';
  const start = (props.pagination.page - 1) * props.pagination.perPage + 1;
  const end = Math.min(props.pagination.page * props.pagination.perPage, props.pagination.total);
  return `${start}-${end} sur ${props.pagination.total}`;
});

function handleSort(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
  emit('sort', sortKey.value, sortOrder.value);
}
</script>
