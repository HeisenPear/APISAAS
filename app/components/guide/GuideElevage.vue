<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">🧬 Élevage de reines</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Gérez vos lignées génétiques, planifiez vos sessions de greffage et suivez les performances de vos reines.
    </p>

    <ol class="space-y-3">
      <li class="flex items-start gap-3">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]">1</span>
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Créer une lignée</p>
          <p class="text-xs text-[var(--text-secondary)]">Élevage → Lignées → Nouvelle lignée. Renseignez l'origine, la race et les caractéristiques génétiques.</p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]">2</span>
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Planifier une session de greffage</p>
          <p class="text-xs text-[var(--text-secondary)]">Élevage → Greffage → Nouvelle session. Choisissez la ruche donneuse, la date et le nombre de cupules.</p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]">3</span>
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Enregistrer les reines</p>
          <p class="text-xs text-[var(--text-secondary)]">Suivez chaque reine : date de naissance, fécondation, ruche affectée, scores de comportement.</p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]">4</span>
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Tests de performance</p>
          <p class="text-xs text-[var(--text-secondary)]">Notez les critères de sélection (douceur, essaimage, production) pour orienter votre programme de sélection.</p>
        </div>
      </li>
    </ol>

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">• L'arbre généalogique visualise les liens entre vos lignées</li>
        <li class="text-xs text-[var(--text-secondary)]">• Les alertes de suivi rappellent les étapes clés du greffage (J+5, J+16…)</li>
        <li class="text-xs text-[var(--text-secondary)]">• Exportez votre registre d'élevage pour les certifications de race</li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-3">
      <UButton label="Élevage" icon="i-lucide-crown" variant="soft" color="primary" to="/elevage" />
      <UButton label="Lignées" icon="i-lucide-dna" variant="outline" color="neutral" to="/elevage/lignees" />
    </div>
  </div>
</template>
