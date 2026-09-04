<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">🍯 Production & Récoltes</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Suivez vos pesées, gérez vos lots de miel et assurez la traçabilité complète de votre
      production, de la hausse au pot.
    </p>

    <GuidePhasesGuide theme="production" />

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • La corrélation météo/production vous aide à identifier les meilleures périodes de
          miellée
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Exportez votre registre de production en PDF pour la traçabilité réglementaire
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Les pesées automatisées via balance connectée sont prises en charge
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Un numéro de lot peut être scanné (QR) pour retrouver instantanément son origine
          complète
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Comparez vos rendements par rucher pour décider où concentrer vos futures ruches
        </li>
      </ul>
    </div>

    <div class="rounded-[12px] bg-[var(--sage-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--sage-deep)]">🐝 Le saviez-vous ?</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Récoltez quand au moins 80% des cellules d'un cadre sont operculées : le miel est alors
          assez mature (humidité &lt;18-20%) pour bien se conserver sans fermenter.
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Un cadre récolté trop tôt, peu operculé, donne un miel trop riche en eau qui peut
          fermenter en quelques semaines au stockage.
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
