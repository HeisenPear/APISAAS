<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">🛡️ Conformité Administrative</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Restez en règle avec la réglementation apicole française : NAPI, sanitaire, mortalités et
      registre d'élevage — tout centralisé, tout exportable.
    </p>

    <GuidePhasesGuide theme="conformite" />

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • La déclaration NAPI est à faire chaque année avant le 31 décembre
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Les alertes de délai d'attente préviennent avant toute récolte trop précoce après
          traitement
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Le registre de mortalités est une pièce attendue de votre registre d'élevage
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Le registre d'élevage est obligatoire et doit être conservé 5 ans
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Une transhumance déclarée alimente automatiquement la liste de vos emplacements pour la
          NAPI
        </li>
      </ul>
    </div>

    <div class="rounded-[12px] bg-[var(--sage-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--sage-deep)]">🐝 Le saviez-vous ?</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • La NAPI sert de base au suivi épidémiologique national — c'est elle qui alimente les
          alertes sanitaires zonées (loque, frelon…) diffusées par les GDSA.
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Le délai d'attente d'un traitement varroa (souvent 4 à 6 semaines selon le produit)
          protège le consommateur : ne récoltez jamais avant son terme, même si le traitement semble
          fini.
        </li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-3">
      <UButton
        label="Déclaration NAPI"
        icon="i-lucide-file-text"
        variant="soft"
        color="primary"
        to="/declarations/napi"
      />
      <UButton
        label="Mortalités"
        icon="i-lucide-heart-off"
        variant="outline"
        color="neutral"
        to="/conformite/mortalites"
      />
      <UButton
        label="Registre d'élevage"
        icon="i-lucide-book-open"
        variant="outline"
        color="neutral"
        to="/exports"
      />
    </div>
  </div>
</template>
