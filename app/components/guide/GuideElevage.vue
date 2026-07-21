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
            Élevage → Lignées → Nouvelle lignée. Renseignez l'origine, la race (noire, buckfast,
            carnica…) et les caractéristiques génétiques recherchées. Une lignée regroupe toutes les
            reines qui en descendent.
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
            Élevage → Greffage → Nouvelle session. Choisissez la ruche donneuse (souvent la reine
            mère), les ruches receveuses (récepteurs) et le nombre de cupules — tout le lot en une
            seule saisie, avec le taux d'acceptation calculé automatiquement.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >3</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Suivre chaque réceptrice</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Pour chaque ruchette receveuse d'une session, notez si la cellule a été acceptée et
            quelle reine en est née — la filiation mère/fille se construit automatiquement, sans
            ressaisie.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >4</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Suivre la généalogie</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Chaque fiche reine affiche son arbre généalogique visuel — ascendants et descendantes —
            pour tracer l'origine de vos meilleures lignées sur plusieurs générations.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >5</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">
            Enregistrer des tests de performance
          </p>
          <p class="text-xs text-[var(--text-secondary)]">
            Une fois par saison et par reine, notez douceur, productivité, tenue de cadre,
            hygiénisme (test PIN), résistance varroa, tendance à l'essaimage, hivernage et qualité
            de ponte — chaque test affine un peu plus l'index de sélection.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >6</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">
            Sélection génétique avancée <span class="text-[var(--honey-deep)]">· Expert</span>
          </p>
          <p class="text-xs text-[var(--text-secondary)]">
            Un index composite sur 9 critères classe vos reines, avec un benchmark anonymisé face
            aux autres apiculteurs de la communauté — vous savez exactement quelles lignées vaut la
            peine de reproduire, et lesquelles remplacer.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >7</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Vendre vos reines</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Une vente de reine reste liée à sa fiche généalogique — votre client garde la
            traçabilité complète du pedigree qu'il achète, un vrai argument commercial pour un
            éleveur sérieux.
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
