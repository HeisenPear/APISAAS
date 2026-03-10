<template>
  <div>
    <UiPageHeader
      title="Communaute"
      description="Statistiques collectives de votre association"
      :breadcrumbs="[{ label: 'Association', to: '/association' }, { label: 'Communaute' }]"
    />

    <!-- Info banner -->
    <div
      class="mb-6 flex items-start gap-3 rounded-2xl border border-blue-200/60 bg-blue-50/50 p-4"
    >
      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100">
        <UIcon name="i-lucide-shield-check" class="h-4 w-4 text-blue-600" />
      </div>
      <div>
        <p class="text-sm font-medium text-stone-900">Donnees anonymisees</p>
        <p class="mt-0.5 text-xs text-stone-500">
          Les donnees sont anonymisees et collectees uniquement avec le consentement des membres.
          Aucune donnee individuelle n'est partagee.
        </p>
      </div>
    </div>

    <!-- KPI cards -->
    <div class="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <UiKpiCard icon="i-lucide-users" label="Membres" :value="0" />
      <UiKpiCard icon="i-lucide-box" label="Ruches total" :value="0" />
      <UiKpiCard icon="i-lucide-droplets" label="Production kg" :value="0" suffix=" kg" />
      <UiKpiCard icon="i-lucide-heart-pulse" label="Taux mortalite" :value="0" suffix="%" />
    </div>

    <!-- Empty state chart area -->
    <div
      class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-white/50 px-6 py-20 text-center"
    >
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
        <UIcon name="i-lucide-bar-chart-3" class="h-8 w-8 text-stone-400" />
      </div>
      <h3 class="text-base font-semibold text-stone-900">Bientot disponible</h3>
      <p class="mx-auto mt-1 max-w-sm text-sm text-stone-500">
        Invitez des membres et activez le partage de statistiques pour visualiser les donnees
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
          label="Parametres association"
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
