<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">📋 Conformité Administrative</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Restez en règle avec la réglementation apicole française : NAPI, ordonnances vétérinaires et registre d'élevage.
    </p>

    <ol class="space-y-3">
      <li class="flex items-start gap-3">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]">1</span>
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Déclaration NAPI</p>
          <p class="text-xs text-[var(--text-secondary)]">Conformité → Déclaration NAPI. APIGO prépare automatiquement votre déclaration annuelle de cheptel.</p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]">2</span>
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Ordonnances vétérinaires</p>
          <p class="text-xs text-[var(--text-secondary)]">Stockez vos ordonnances, gérez les délais d'attente et les traitements en cours pour chaque rucher.</p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]">3</span>
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Registre d'élevage</p>
          <p class="text-xs text-[var(--text-secondary)]">Exports → Registre d'élevage. Générez le PDF réglementaire avec toutes vos interventions sanitaires.</p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]">4</span>
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Visites sanitaires</p>
          <p class="text-xs text-[var(--text-secondary)]">Planifiez et enregistrez vos visites sanitaires annuelles. Les rappels sont automatiques.</p>
        </div>
      </li>
    </ol>

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">• La déclaration NAPI est à faire chaque année avant le 31 décembre</li>
        <li class="text-xs text-[var(--text-secondary)]">• Les alertes de délai d'attente préviennent avant toute récolte après traitement</li>
        <li class="text-xs text-[var(--text-secondary)]">• Le registre d'élevage est obligatoire et doit être conservé 5 ans</li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-3">
      <UButton label="Déclaration NAPI" icon="i-lucide-file-text" variant="soft" color="primary" to="/declarations/napi" />
      <UButton label="Registre d'élevage" icon="i-lucide-book-open" variant="outline" color="neutral" to="/exports" />
    </div>
  </div>
</template>
