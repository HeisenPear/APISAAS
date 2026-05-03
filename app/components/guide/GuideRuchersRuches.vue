<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">🏕️ Ruchers & Ruches</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Organisez votre cheptel en ruchers géolocalisés. Chaque ruche possède une fiche détaillée avec son historique complet.
    </p>

    <ol class="space-y-3">
      <li class="flex items-start gap-3">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]">1</span>
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Créer un rucher</p>
          <p class="text-xs text-[var(--text-secondary)]">Ruchers → Nouveau rucher. Renseignez l'environnement (forêt, culture, mixte) pour la météo locale.</p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]">2</span>
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Ajouter des ruches</p>
          <p class="text-xs text-[var(--text-secondary)]">Depuis la fiche rucher, ajoutez vos ruches une à une ou par lot. Choisissez le type (Dadant, Langstroth…).</p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]">3</span>
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Consulter la fiche ruche</p>
          <p class="text-xs text-[var(--text-secondary)]">Cliquez sur une ruche pour voir sa timeline, ses hausses, le statut de la reine et les notes.</p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]">4</span>
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Utiliser la carte</p>
          <p class="text-xs text-[var(--text-secondary)]">La vue carte affiche tous vos ruchers sur OpenStreetMap. Cliquez sur un marqueur pour les détails.</p>
        </div>
      </li>
    </ol>

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">• Le GPS automatique positionne votre rucher en un clic</li>
        <li class="text-xs text-[var(--text-secondary)]">• Attribuez des couleurs aux ruches pour les identifier sur le terrain</li>
        <li class="text-xs text-[var(--text-secondary)]">• Les QR codes permettent d'accéder à la fiche depuis votre téléphone</li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-3">
      <UButton label="Mes ruchers" icon="i-lucide-map-pin" variant="soft" color="primary" to="/ruchers" />
      <UButton label="Mes ruches" icon="i-lucide-hexagon" variant="outline" color="neutral" to="/ruches" />
    </div>
  </div>
</template>
