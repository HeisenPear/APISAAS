<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">🚛 Transhumance</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Planifiez et suivez vos déplacements de ruchers vers les miellées. Consultez le référentiel de
      floraisons et repérez les meilleurs emplacements avant de partir.
    </p>

    <ol class="space-y-3">
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >1</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Créer un emplacement</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Transhumance → Emplacements → Nouvel emplacement. Ajoutez les coordonnées GPS, la
            capacité max de ruches, les floraisons locales et si besoin les coordonnées du
            propriétaire du terrain et l'accord signé.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >2</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Planifier un déplacement</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Transhumance → Nouveau plan. Sélectionnez le rucher source, l'emplacement cible, les
            dates de départ et de retour prévues, et le nombre de ruches concernées.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >3</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Suivre le plan</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Changez le statut du plan (planifié → en cours → réalisé) et notez la production
            obtenue, la durée du trajet et le coût carburant — de quoi comparer la rentabilité
            réelle de chaque emplacement d'une année sur l'autre.
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
            Explorer la carte mellifère
          </p>
          <p class="text-xs text-[var(--text-secondary)]">
            Transhumance → Carte mellifère. Calques d'occupation du sol (RPG, BD Forêt) et
            suggestions de floraisons pour repérer les meilleurs emplacements avant de déplacer un
            rucher — un clic sur la carte donne l'altitude, la commune et l'analyse du point.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >5</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Déclarer votre cheptel</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Chaque emplacement utilisé dans l'année alimente votre déclaration NAPI annuelle
            (Conformité → Déclaration NAPI) — plus besoin de reconstituer la liste de vos sites à la
            main en fin d'année.
          </p>
        </div>
      </li>
    </ol>

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Notez le rendement de chaque emplacement pour optimiser vos déplacements futurs
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Les alertes météo préviennent automatiquement avant chaque transhumance planifiée
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • La carte affiche tous vos emplacements et ruchers simultanément
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Le référentiel de floraisons couvre les principales miellées françaises (acacia,
          châtaignier, lavande, tournesol, sarrasin, bruyère…) avec leurs périodes typiques par
          région
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Un accord de terrain signé peut être joint numériquement à la fiche emplacement
        </li>
      </ul>
    </div>

    <div class="rounded-[12px] bg-[var(--sage-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--sage-deep)]">🐝 Le saviez-vous ?</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • En dessous de 3 km, une partie des butineuses risque de se réorienter vers l'ancien
          emplacement — préférez les déplacements de nuit, portes fermées, quand toute la colonie
          est rentrée.
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Laissez 48h de quarantaine à l'arrivée avant toute intervention lourde : le temps que la
          colonie se stabilise après le transport.
        </li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-3">
      <UButton
        label="Plans de transhumance"
        icon="i-lucide-truck"
        variant="soft"
        color="primary"
        to="/transhumance"
      />
      <UButton
        label="Carte mellifère"
        icon="i-lucide-map"
        variant="outline"
        color="neutral"
        to="/transhumance/carte"
      />
      <UButton
        label="Emplacements"
        icon="i-lucide-map-pin-plus"
        variant="outline"
        color="neutral"
        to="/transhumance/emplacements"
      />
    </div>
  </div>
</template>
