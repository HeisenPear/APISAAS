<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">🧬 Élevage de reines</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Gérez vos lignées génétiques, planifiez vos sessions de greffage et suivez les performances de
      vos reines — jusqu'à la sélection génétique avancée.
    </p>

    <GuidePhasesGuide theme="elevage" />

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • L'arbre généalogique se parcourt dans les deux sens : ancêtres comme descendantes
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Les alertes de suivi rappellent les étapes clés du greffage (J+5 introduction, J+16
          naissance…)
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Le benchmark génétique reste anonyme : vous voyez votre position, jamais les autres
          apiculteurs
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Exportez votre registre d'élevage pour les certifications de race ou une vente à un
          autre éleveur
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Un test de performance incomplet reste pris en compte : l'index s'affine avec les
          critères disponibles
        </li>
      </ul>
    </div>

    <div class="rounded-[12px] bg-[var(--sage-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--sage-deep)]">🐝 Le saviez-vous ?</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Greffez des larves de moins de 24-36h : passé ce délai, la qualité de la future reine
          (taille, fécondité) diminue nettement.
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Une reine s'accouple en vol sur 1 à 3 sorties, par temps calme et chaud (&gt;20°C, peu
          de vent) — la météo des jours suivant l'émergence conditionne fortement le succès de la
          fécondation.
        </li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-3">
      <UButton label="Élevage" icon="i-lucide-crown" variant="soft" color="primary" to="/elevage" />
      <UButton
        label="Mes reines"
        icon="i-lucide-circle-dot"
        variant="outline"
        color="neutral"
        to="/elevage/reines"
      />
      <UButton
        label="Lignées"
        icon="i-lucide-dna"
        variant="outline"
        color="neutral"
        to="/elevage/lignees"
      />
    </div>
  </div>
</template>
