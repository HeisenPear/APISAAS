<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">🏕️ Ruchers & Ruches</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Organisez votre cheptel en ruchers géolocalisés. Chaque ruche possède une fiche détaillée avec
      son historique complet.
    </p>

    <ol class="space-y-3">
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >1</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Créer un rucher</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Ruchers → Nouveau rucher. Renseignez l'environnement (forêt, culture, mixte) pour la
            météo locale.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >2</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Ajouter des ruches</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Depuis la fiche rucher, ajoutez vos ruches une à une ou par lot. Choisissez le type
            (Dadant, Langstroth…).
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >3</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Consulter la fiche ruche</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Timeline complète, hausses posées, statut de la reine, historique de renouvellement des
            cadres (cire) et score prédictif de santé à 30 jours (Pro).
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
            Scanner le QR code sur le terrain
          </p>
          <p class="text-xs text-[var(--text-secondary)]">
            Chaque ruche a son QR code. Un scan ouvre directement les actions rapides —
            intervention, pesée, note — sans chercher dans les menus.
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
            Surveiller le frelon asiatique
          </p>
          <p class="text-xs text-[var(--text-secondary)]">
            Module Surveillance frelon : signalez un nid ou une observation près d'un rucher, et
            consultez les signalements de la communauté autour de vous.
          </p>
        </div>
      </li>
    </ol>

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Le GPS automatique positionne votre rucher en un clic
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Attribuez des couleurs aux ruches pour les identifier sur le terrain
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • La vue carte affiche tous vos ruchers sur OpenStreetMap, marqueur cliquable vers la
          fiche
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • L'historique cire aide à planifier le renouvellement des cadres avant qu'ils ne
          noircissent trop
        </li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-3">
      <UButton
        label="Mes ruchers"
        icon="i-lucide-map-pin"
        variant="soft"
        color="primary"
        to="/ruchers"
      />
      <UButton
        label="Mes ruches"
        icon="i-lucide-hexagon"
        variant="outline"
        color="neutral"
        to="/ruches"
      />
      <UButton
        label="Surveillance frelon"
        icon="i-lucide-bug"
        variant="outline"
        color="neutral"
        to="/frelon"
      />
    </div>
  </div>
</template>
