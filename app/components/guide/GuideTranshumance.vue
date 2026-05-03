<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">🚛 Transhumance</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Planifiez et suivez vos déplacements de ruchers vers les miellées. Consultez le référentiel de floraisons.
    </p>

    <ol class="space-y-3">
      <li class="flex items-start gap-3">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]">1</span>
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Créer un emplacement</p>
          <p class="text-xs text-[var(--text-secondary)]">Transhumance → Emplacements → Nouvel emplacement. Ajoutez les coordonnées GPS et les floraisons locales.</p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]">2</span>
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Planifier un déplacement</p>
          <p class="text-xs text-[var(--text-secondary)]">Transhumance → Nouveau plan. Sélectionnez le rucher source, l'emplacement cible et les dates.</p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]">3</span>
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Suivre le plan</p>
          <p class="text-xs text-[var(--text-secondary)]">Changez le statut du plan (Planifié → En cours → Réalisé) et notez les observations.</p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]">4</span>
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Consulter les floraisons</p>
          <p class="text-xs text-[var(--text-secondary)]">Le référentiel de floraisons vous aide à choisir les meilleures périodes pour chaque région.</p>
        </div>
      </li>
    </ol>

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">• Notez le rendement de chaque emplacement pour optimiser vos déplacements futurs</li>
        <li class="text-xs text-[var(--text-secondary)]">• Les alertes météo préviennent automatiquement avant chaque transhumance planifiée</li>
        <li class="text-xs text-[var(--text-secondary)]">• La carte affiche tous vos emplacements et ruchers simultanément</li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-3">
      <UButton label="Plans de transhumance" icon="i-lucide-truck" variant="soft" color="primary" to="/transhumance" />
      <UButton label="Emplacements" icon="i-lucide-map-pin-plus" variant="outline" color="neutral" to="/transhumance/emplacements" />
    </div>
  </div>
</template>
