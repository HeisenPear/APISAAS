<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">📋 Interventions</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Enregistrez chaque visite, traitement ou observation. APIGO vous aide à planifier et suivre
      toute votre activité apicole, ruche par ruche.
    </p>

    <GuidePhasesGuide theme="interventions" />

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Le mode terrain affiche un formulaire simplifié pour la saisie sur téléphone, même hors
          ligne
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Les modèles sauvegardent vos configurations d'interventions fréquentes
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Le calendrier montre toutes vos interventions passées et futures d'un coup d'œil
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Scannez le QR code d'une ruche pour ouvrir directement le formulaire d'intervention
          pré-rempli
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Un traitement varroa avec délai d'attente déclenche automatiquement une alerte avant
          toute récolte trop précoce
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Ajoutez des photos à vos interventions pour garder une trace visuelle de l'état de la
          colonie
        </li>
      </ul>
    </div>

    <div class="rounded-[12px] bg-[var(--sage-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--sage-deep)]">🐝 Le saviez-vous ?</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Comptez les varroas 3 fois par saison (sortie d'hiver, avant et après la miellée) :
          au-delà de 3 chutes/jour sur lange, un traitement s'impose.
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Une ruche très active à l'entrée avec beaucoup d'abeilles qui « barbent » dehors est
          souvent un signe avant-coureur d'essaimage — vérifiez les cellules royales sous 48h.
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
