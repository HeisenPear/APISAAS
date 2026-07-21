<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">📋 Interventions</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Enregistrez chaque visite, traitement ou observation. APIGO vous aide à planifier et suivre
      toute votre activité apicole.
    </p>

    <ol class="space-y-3">
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >1</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Créer une intervention</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Interventions → Nouvelle. Sélectionnez la ruche, le type (visite, traitement, récolte…)
            et la date.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >2</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Remplir le formulaire</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Selon le type, des champs spécifiques s'affichent : état de la reine, score population,
            produit utilisé…
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >3</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Interventions groupées</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Appliquez la même action sur plusieurs ruches en une seule saisie via Interventions →
            Groupée.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >4</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Planifier à l'avance</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Créez des interventions futures pour le calendrier. APIGO vous enverra un rappel la
            veille.
          </p>
        </div>
      </li>
    </ol>

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Le mode terrain affiche un formulaire simplifié pour la saisie sur téléphone
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Les templates sauvegardent vos configurations d'interventions fréquentes
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Le calendrier montre toutes vos interventions passées et futures
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Scannez le QR code d'une ruche pour ouvrir directement le formulaire d'intervention
          pré-rempli
        </li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-3">
      <UButton
        label="Nouvelle intervention"
        icon="i-lucide-plus"
        variant="soft"
        color="primary"
        to="/interventions/nouvelle"
      />
      <UButton
        label="Calendrier"
        icon="i-lucide-calendar"
        variant="outline"
        color="neutral"
        to="/calendrier"
      />
    </div>
  </div>
</template>
