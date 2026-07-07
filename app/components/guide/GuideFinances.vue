<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">💰 Clients & Facturation</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Gérez vos ventes, émettez des factures PDF conformes et suivez vos finances apicoles.
    </p>

    <ol class="space-y-3">
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >1</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Créer un client</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Clients → Nouveau client. Renseignez les coordonnées, le SIREN si professionnel.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >2</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Émettre une facture</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Finances → Nouvelle facture. Ajoutez les lignes de produits, la TVA et téléchargez le
            PDF.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >3</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Saisir les transactions</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Enregistrez chaque vente et achat pour un suivi financier précis. APIGO calcule votre
            bénéfice net.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >4</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Exporter & bilans</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Exportez vos transactions en CSV et générez votre bilan annuel en un clic.
          </p>
        </div>
      </li>
    </ol>

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • La numérotation des factures est automatique et conforme à l'article 242 nonies A CGI
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Factur-X XML est disponible pour la facturation électronique obligatoire 2026
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Le prévisionnel de trésorerie projette vos revenus sur 12 mois
        </li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-3">
      <UButton
        label="Finances"
        icon="i-lucide-wallet"
        variant="soft"
        color="primary"
        to="/finances"
      />
      <UButton
        label="Clients"
        icon="i-lucide-users"
        variant="outline"
        color="neutral"
        to="/clients"
      />
    </div>
  </div>
</template>
