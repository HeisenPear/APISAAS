<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">🧬 Élevage de reines</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Gérez vos lignées génétiques, planifiez vos sessions de greffage et suivez les performances de
      vos reines — jusqu'à la sélection génétique avancée.
    </p>

    <ol class="space-y-3">
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >1</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Créer une lignée</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Élevage → Lignées → Nouvelle lignée. Renseignez l'origine, la race et les
            caractéristiques génétiques.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >2</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Greffer en lot</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Élevage → Greffage → Nouvelle session. Choisissez la ruche donneuse, les ruches
            receveuses (récepteurs) et le nombre de cupules — tout le lot en une seule saisie.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >3</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Suivre la généalogie</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Chaque fiche reine affiche son arbre généalogique visuel — ascendants et descendantes —
            pour tracer l'origine de vos meilleures lignées.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >4</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">
            Sélection génétique avancée <span class="text-[var(--honey-deep)]">· Expert</span>
          </p>
          <p class="text-xs text-[var(--text-secondary)]">
            Un index composite sur 9 critères (douceur, productivité, résistance varroa, essaimage…)
            classe vos reines, avec un benchmark anonymisé face aux autres apiculteurs de la
            communauté.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >5</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Vendre vos reines</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Une vente de reine reste liée à sa fiche généalogique — votre client garde la
            traçabilité complète du pedigree qu'il achète.
          </p>
        </div>
      </li>
    </ol>

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • L'arbre généalogique se parcourt dans les deux sens : ancêtres comme descendantes
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Les alertes de suivi rappellent les étapes clés du greffage (J+5, J+16…)
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Le benchmark génétique reste anonyme : vous voyez votre position, jamais les autres
          apiculteurs
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Exportez votre registre d'élevage pour les certifications de race
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
