<script setup lang="ts">
definePageMeta({ layout: 'default' });

const { data: reines, pending: reinesPending } = useFetch('/api/elevage/reines', {
  key: 'elevage-reines-overview',
  query: { limit: 8, page: 1, active: 'true' },
  lazy: true,
});

const { data: sessions, pending: sessionsPending } = useFetch('/api/elevage/sessions', {
  key: 'elevage-sessions-overview',
  query: { limit: 5, page: 1, terminee: 'false' },
  lazy: true,
});

const { data: classement } = useFetch('/api/elevage/classement', {
  key: 'elevage-classement-overview',
  lazy: true,
});
const indexByReine = computed(() => {
  const m = new Map<string, { index: number; completeness: number }>();
  for (const r of classement.value?.data ?? [])
    m.set(r.reineId, { index: r.index, completeness: r.completeness });
  return m;
});
function idx(id: string) {
  return indexByReine.value.get(id) ?? null;
}

const marquageColors: Record<string, string> = {
  blanc: 'bg-white border-2 border-stone-200',
  jaune: 'bg-yellow-400',
  rouge: 'bg-red-500',
  vert: 'bg-green-500',
  bleu: 'bg-blue-500',
};

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1
          class="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
          style="
            font-family:
              'SF Pro Display',
              -apple-system,
              BlinkMacSystemFont,
              sans-serif;
          "
        >
          Élevage de reines
        </h1>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">
          Sélection génétique et suivi de vos lignées
        </p>
        <p class="mt-2 max-w-lg text-[13px] leading-relaxed text-[var(--text-tertiary)]">
          Ce module est destiné aux apiculteurs qui pratiquent l'élevage de reines : greffage,
          sélection génétique et tests de performance. Si vous achetez vos reines, vous n'avez pas
          besoin de ce module.
        </p>
      </div>
    </div>

    <!-- Nav tabs -->
    <div
      class="flex items-center gap-1 rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-muted)] w-fit p-0.5"
    >
      <NuxtLink
        to="/elevage/reines"
        class="rounded-[8px] px-4 py-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        Reines
      </NuxtLink>
      <NuxtLink
        to="/elevage/lignees"
        class="rounded-[8px] px-4 py-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        Lignées
      </NuxtLink>
      <NuxtLink
        to="/elevage/greffage"
        class="rounded-[8px] px-4 py-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        Greffage
      </NuxtLink>
      <NuxtLink
        to="/elevage/registre"
        class="rounded-[8px] px-4 py-1.5 text-xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
      >
        Registre
      </NuxtLink>
    </div>

    <!-- 01 — Reines actives -->
    <section class="space-y-3" data-tutorial="elevage-lignees">
      <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
        01 — Reines actives
      </p>

      <!-- Loading -->
      <div
        v-if="reinesPending"
        class="bg-white border border-[var(--border-default)] rounded-[12px] overflow-hidden"
      >
        <div
          v-for="i in 4"
          :key="i"
          class="h-12 animate-pulse border-b border-[var(--border-faint)] last:border-0 bg-[var(--surface-muted)]"
        />
      </div>

      <!-- Empty -->
      <div
        v-else-if="!reines?.data?.length"
        class="flex flex-col items-center gap-2 rounded-[14px] border border-[var(--border-default)] bg-white py-14 text-center"
      >
        <UIcon name="i-lucide-crown" class="h-8 w-8 text-[var(--text-tertiary)]" />
        <p class="text-sm text-[var(--text-secondary)]">
          Vos reines n'attendent qu'un nom 👑 Ajoutez-en une pour suivre sa lignée et ses
          performances.
        </p>
        <UButton to="/elevage/reines" size="sm" color="primary" variant="soft"
          >Ajouter une reine</UButton
        >
      </div>

      <!-- Table -->
      <div
        v-else
        class="bg-white border border-[var(--border-default)] rounded-[12px] overflow-hidden"
      >
        <table class="w-full">
          <thead class="bg-[var(--surface-muted)]">
            <tr>
              <th
                class="px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
              >
                Identifiant
              </th>
              <th
                class="hidden px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] sm:table-cell"
              >
                Lignée
              </th>
              <th
                class="hidden px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] md:table-cell"
              >
                Ruche
              </th>
              <th
                class="hidden px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] md:table-cell"
              >
                Origine
              </th>
              <th
                class="hidden px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] sm:table-cell"
              >
                Date intro
              </th>
              <th
                class="px-5 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]"
              >
                Qualité
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--border-faint)]">
            <tr
              v-for="item in reines.data"
              :key="item.reine.id"
              class="transition-colors hover:bg-[var(--surface-primary)]"
            >
              <td class="px-5 py-3">
                <div class="flex items-center gap-2">
                  <div
                    v-if="item.reine.couleurMarquage"
                    class="h-3.5 w-3.5 shrink-0 rounded-full border border-white shadow-sm"
                    :class="marquageColors[item.reine.couleurMarquage]"
                  />
                  <UIcon
                    v-else
                    name="i-lucide-crown"
                    class="h-3.5 w-3.5 shrink-0 text-[var(--honey)]"
                  />
                  <span class="text-sm font-medium text-[var(--text-primary)]">
                    {{ item.reine.identifiant || `Reine ${item.reine.anneeNaissance || ''}` }}
                  </span>
                </div>
              </td>
              <td class="hidden px-5 py-3 sm:table-cell">
                <NuxtLink
                  v-if="item.ligneeNom"
                  to="/elevage/lignees"
                  class="text-sm font-medium text-[var(--honey-deep)] hover:underline"
                >
                  {{ item.ligneeNom }}
                </NuxtLink>
                <span v-else class="text-xs text-[var(--text-tertiary)]">—</span>
              </td>
              <td class="hidden px-5 py-3 md:table-cell">
                <NuxtLink
                  v-if="item.reine.rucheId"
                  :to="`/ruches/${item.reine.rucheId}`"
                  class="text-sm font-medium text-[var(--honey-deep)] hover:underline"
                >
                  Voir ruche
                </NuxtLink>
                <span v-else class="text-xs text-[var(--text-tertiary)]">—</span>
              </td>
              <td class="hidden px-5 py-3 text-sm text-[var(--text-secondary)] md:table-cell">
                {{ item.reine.origine || '—' }}
              </td>
              <td class="hidden px-5 py-3 text-sm text-[var(--text-secondary)] sm:table-cell">
                {{ formatDate(item.reine.dateIntroduction) }}
              </td>
              <td class="px-5 py-3">
                <ElevageIndexBadge
                  :index="idx(item.reine.id)?.index ?? null"
                  :completeness="idx(item.reine.id)?.completeness"
                  size="sm"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 02 — Sessions récentes -->
    <section class="space-y-3" data-tutorial="elevage-sessions">
      <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--honey-deep)]">
        02 — Sessions récentes
      </p>

      <div v-if="sessionsPending" class="space-y-3">
        <div
          v-for="i in 3"
          :key="i"
          class="h-16 animate-pulse rounded-[14px] bg-[var(--surface-muted)]"
        />
      </div>

      <div
        v-else-if="!sessions?.data?.length"
        class="flex flex-col items-center gap-2 rounded-[14px] border border-[var(--border-default)] bg-white py-14 text-center"
      >
        <UIcon name="i-lucide-scissors" class="h-8 w-8 text-[var(--text-tertiary)]" />
        <p class="text-sm text-[var(--text-secondary)]">
          Prêt à élever vos reines ? Lancez votre première session de greffage et suivez chaque
          cellule.
        </p>
        <UButton to="/elevage/greffage" size="sm" color="primary" variant="soft"
          >Créer une session</UButton
        >
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="sess in sessions.data"
          :key="sess.id"
          class="flex items-center gap-4 rounded-[14px] border border-[var(--border-default)] bg-white px-5 py-4 transition-colors hover:bg-[var(--surface-primary)]"
        >
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--honey-soft)]"
          >
            <UIcon name="i-lucide-scissors" class="h-4 w-4 text-[var(--honey-deep)]" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-[var(--text-primary)]">
              {{ formatDate(sess.dateGreffage) }}
            </p>
            <p class="text-xs text-[var(--text-secondary)]">
              {{ sess.nombreCellulesGreffees }} greffées
              <span v-if="sess.nombreCellulesAcceptees">
                · {{ sess.nombreCellulesAcceptees }} acceptées</span
              >
              <span v-if="sess.technique"> · {{ sess.technique.replace('_', ' ') }}</span>
            </p>
          </div>
          <NuxtLink
            to="/elevage/greffage"
            class="shrink-0 text-xs font-medium text-[var(--honey-deep)] hover:underline"
          >
            Détail →
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
