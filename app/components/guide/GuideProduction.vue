<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">🍯 Production & Récoltes</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Suivez vos pesées, gérez vos lots de miel et assurez la traçabilité complète de votre
      production.
    </p>

    <ol class="space-y-3">
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >1</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Enregistrer une récolte</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Production → Nouvelle récolte. Saisissez le poids, le type de miel et les ruches
            concernées.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >2</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Traçabilité des lots</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Chaque récolte peut être divisée en lots numérotés, conformes CE 178/2002 — cahier de
            miellerie numérique prêt pour un contrôle.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >3</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Suivre les hausses</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Chaque hausse a sa fiche détaillée : pose, retrait, durée, ruche associée et historique
            complet — module Hausses.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >4</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Livrer vos clients</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Groupez plusieurs bons de livraison d'un même client en une seule facture depuis
            Finances → Bons de livraison — l'historique reste visible sur sa fiche.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >5</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Consulter les statistiques</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Le tableau de bord affiche votre production par rucher, par type de miel et par période,
            avec l'évolution N/N-1.
          </p>
        </div>
      </li>
    </ol>

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • La corrélation météo/production vous aide à identifier les meilleures périodes
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Exportez votre registre de production en PDF pour la traçabilité
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Les pesées automatisées via balance connectée sont prises en charge
        </li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-3">
      <UButton
        label="Production"
        icon="i-lucide-droplets"
        variant="soft"
        color="primary"
        to="/production"
      />
      <UButton
        label="Hausses"
        icon="i-lucide-layers-2"
        variant="outline"
        color="neutral"
        to="/hausses"
      />
      <UButton
        label="Bons de livraison"
        icon="i-lucide-truck"
        variant="outline"
        color="neutral"
        to="/finances/bons-livraison"
      />
    </div>
  </div>
</template>
