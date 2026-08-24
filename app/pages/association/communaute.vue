<template>
  <div>
    <UiPageHeader
      title="Communauté"
      description="Statistiques collectives de votre association"
      :breadcrumbs="[{ label: 'Association', to: '/association' }, { label: 'Communauté' }]"
    />

    <!-- Info banner -->
    <div
      class="mb-6 flex items-start gap-3 rounded-[12px] border border-blue-200/60 bg-blue-50/50 p-4"
    >
      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-blue-100">
        <UIcon name="i-lucide-shield-check" class="h-4 w-4 text-blue-600" />
      </div>
      <div>
        <p class="text-[13px] font-medium text-[var(--text-primary)]">Données anonymisées</p>
        <p class="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
          Les données sont anonymisées et collectées uniquement avec le consentement des membres.
          Aucune donnée individuelle n'est partagée.
        </p>
      </div>
    </div>

    <!-- KPI cards -->
    <div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <UiKpiCard icon="i-lucide-users" label="Membres" :value="0" />
      <UiKpiCard icon="i-lucide-box" label="Ruches total" :value="0" />
      <UiKpiCard icon="i-lucide-droplets" label="Production (kg)" :value="0" suffix=" kg" />
      <UiKpiCard icon="i-lucide-heart-pulse" label="Taux mortalité" :value="0" suffix="%" />
    </div>

    <!-- Empty state -->
    <div
      class="flex flex-col items-center justify-center rounded-[14px] border-2 border-dashed border-[var(--border-default)] bg-white/50 px-6 py-20 text-center"
    >
      <div
        class="mb-4 flex h-16 w-16 items-center justify-center rounded-[14px] bg-[var(--surface-muted)]"
      >
        <UIcon name="i-lucide-bar-chart-3" class="h-8 w-8 text-[var(--text-tertiary)]" />
      </div>
      <h2 class="text-[15px] font-semibold text-[var(--text-primary)]">Bientôt disponible</h2>
      <p class="mx-auto mt-1 max-w-sm text-[13px] text-[var(--text-secondary)]">
        Invitez des membres et activez le partage de statistiques pour visualiser les données
        collectives de votre association.
      </p>
      <div class="mt-6 flex items-center gap-3">
        <UButton
          label="Inviter des membres"
          icon="i-lucide-user-plus"
          color="primary"
          to="/parametres"
        />
        <UButton
          label="Paramètres association"
          icon="i-lucide-settings"
          variant="outline"
          color="neutral"
          to="/association/parametres"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });
</script>
