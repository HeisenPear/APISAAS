<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">
      💰 Finances : facturez, encaissez, pilotez
    </h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Du client à la trésorerie, tout le cycle commercial — facturation conforme, suivi des
      encaissements et prévision de trésorerie. APIGO s'arrête volontairement
      <strong>au bord de la comptabilité</strong> : aucun plan de comptes, aucune écriture. Juste
      vos factures et vos flux, toujours à jour.
    </p>

    <ol class="space-y-3">
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >1</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Créez un client</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Clients → Nouveau client. Renseignez les coordonnées, et le SIREN si professionnel
            (obligatoire pour la facturation électronique).
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >2</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Émettez une facture</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Finances → Ventes → Nouvelle vente. Ajoutez les lignes, la TVA est calculée, et vous
            téléchargez un PDF conforme (numérotation automatique + Factur-X 2026).
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >3</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">
            Suivez les paiements <span class="text-[var(--honey-deep)]">· Pro</span>
          </p>
          <p class="text-xs text-[var(--text-secondary)]">
            Finances → Paiements &amp; relances. Importez votre relevé bancaire : les factures
            réglées se pointent toutes seules, et vous relancez les impayés en un clic.
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
            Pilotez votre trésorerie <span class="text-[var(--honey-deep)]">· Pro</span>
          </p>
          <p class="text-xs text-[var(--text-secondary)]">
            Finances → Prévisionnel. Projetez votre solde sur 12 mois à partir de vos ventes et
            achats réels, plus les dépenses que vous planifiez. Anticipez les creux de saison.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >5</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Exportez pour le comptable</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Finances → Rapports. CSV de vos transactions et bilan annuel PDF : tout ce qu'il faut
            transmettre à votre comptable, sans le faire à sa place.
          </p>
        </div>
      </li>
    </ol>

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">🔗 Tout est connecté</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Une seule saisie : enregistrez une vente, et votre chiffre d'affaires, votre stock et
          votre prévisionnel de trésorerie se mettent à jour d'un coup.
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Pointez une facture payée → elle disparaît de vos impayés et alimente votre trésorerie
          réelle.
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Aucune compta : APIGO tient vos factures et vos flux à jour ; votre comptable fait le
          reste.
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
        label="Paiements & relances"
        icon="i-lucide-banknote"
        variant="outline"
        color="neutral"
        to="/finances/reglements"
      />
    </div>
  </div>
</template>
