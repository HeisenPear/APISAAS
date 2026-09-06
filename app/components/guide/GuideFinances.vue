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

    <GuidePhasesGuide theme="finances" />

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
        <li class="text-xs text-[var(--text-secondary)]">
          • Le régime fiscal (franchise en base, TVA débits) se règle une fois dans Paramètres et
          s'applique automatiquement à toutes vos factures.
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Une vente récurrente (abonnement, livraison régulière) peut être programmée pour se
          régénérer automatiquement.
        </li>
      </ul>
    </div>

    <div class="rounded-[12px] bg-[var(--sage-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--sage-deep)]">🐝 Le saviez-vous ?</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Le prix moyen du miel français varie de 12 à 25 €/kg selon le type et le circuit — les
          miels rares (acacia, châtaignier tardif, sapin) se valorisent nettement mieux en vente
          directe qu'en gros.
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Facturer dès la livraison, sans délai, réduit mécaniquement votre délai moyen de
          paiement — c'est souvent le levier de trésorerie le plus simple à activer.
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
        label="Bons de livraison"
        icon="i-lucide-truck"
        variant="outline"
        color="neutral"
        to="/finances/bons-livraison"
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
