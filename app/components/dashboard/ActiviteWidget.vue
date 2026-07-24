<!-- ActiviteWidget — fil des dernières actions (interventions, récoltes, ventes). -->
<template>
  <div class="p-4">
    <div class="mb-3 flex items-center gap-2.5">
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--honey-soft)]">
        <UIcon name="i-lucide-history" class="h-4 w-4" style="color: var(--honey-deep)" />
      </div>
      <div>
        <p class="text-[13.5px] font-semibold" style="color: var(--text-primary)">
          Activité récente
        </p>
        <p class="text-[11px]" style="color: var(--text-tertiary)">Tes dernières actions</p>
      </div>
    </div>

    <ul v-if="items.length" class="space-y-1.5">
      <li v-for="(a, i) in items" :key="a.id ?? i" class="flex items-center gap-2.5">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px]"
          style="background: var(--honey-soft)"
        >
          <UIcon :name="icone(a.type)" class="h-3.5 w-3.5" style="color: var(--honey-deep)" />
        </span>
        <span class="min-w-0 flex-1 truncate text-[12.5px]" style="color: var(--text-primary)">
          {{ a.description }}
        </span>
        <span class="shrink-0 text-[11px]" style="color: var(--text-tertiary)">
          {{ relatif(a.date) }}
        </span>
      </li>
    </ul>
    <p v-else class="py-4 text-center text-[12.5px]" style="color: var(--text-tertiary)">
      Aucune activité récente.
    </p>
  </div>
</template>

<script setup lang="ts">
interface Activite {
  id?: string;
  type?: string;
  date?: string | Date;
  description?: string;
}
const props = defineProps<{ activites?: Activite[] }>();

const items = computed(() => (props.activites ?? []).slice(0, 6));

function icone(type?: string): string {
  if (type === 'recolte') return 'i-lucide-droplet';
  if (type === 'transaction') return 'i-lucide-receipt';
  return 'i-lucide-clipboard-check';
}

function relatif(d?: string | Date): string {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  const jours = Math.floor((Date.now() - dt.getTime()) / 86_400_000);
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return 'hier';
  if (jours < 7) return `il y a ${jours} j`;
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}
</script>
