<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">📋 Interventions</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Enregistrez chaque visite, traitement ou observation. APIGO vous aide à planifier et suivre
      toute votre activité apicole, ruche par ruche.
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
            Interventions → Nouvelle. Sélectionnez la ruche, le type (visite, traitement varroa,
            nourrissement, division, essaimage, récolte, mortalité…) et la date. Plus de 14 types
            couvrent la quasi-totalité de votre activité.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >2</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">
            Remplir le formulaire adapté
          </p>
          <p class="text-xs text-[var(--text-secondary)]">
            Selon le type, des champs spécifiques s'affichent : état de la reine, score population,
            produit et numéro de lot utilisé, poids pesé, comptage varroa (méthode plancher ou VPH)…
            Chaque intervention alimente ensuite le registre d'élevage automatiquement.
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
            Groupée — idéal pour un traitement varroa de rucher entier ou une visite de routine sur
            15 ruches en quelques clics.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >4</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Utiliser des modèles</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Sauvegardez une configuration d'intervention fréquente (type + champs pré-remplis) comme
            modèle réutilisable — pratique pour un traitement récurrent que vous appliquez chaque
            saison de la même façon.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >5</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Planifier à l'avance</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Créez des interventions futures pour le calendrier — un traitement à poser dans 3
            semaines, une visite de contrôle programmée. APIGO vous enverra un rappel la veille, et
            Ma tournée les intègre automatiquement le jour venu.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >6</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Consulter l'historique</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Toutes vos interventions apparaissent triées par date, filtrables par type, rucher ou
            période. C'est votre registre de terrain complet — exportable pour vos obligations de
            traçabilité.
          </p>
        </div>
      </li>
    </ol>

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
