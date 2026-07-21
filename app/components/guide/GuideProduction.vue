<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">🍯 Production & Récoltes</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Suivez vos pesées, gérez vos lots de miel et assurez la traçabilité complète de votre
      production, de la hausse au pot.
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
            Production → Nouvelle récolte. Saisissez le poids, le type de miel (mono-floral ou
            toutes fleurs) et les ruches concernées. Une pesée via balance connectée peut être
            importée directement.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >2</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Mise en pot & lots</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Une récolte se transforme en stock de miel prêt à la vente : numéro de lot, date
            d'extraction, conditionnement (pot 250g/500g/1kg, vrac) et analyses éventuelles. Le
            numéro de lot suit le produit jusqu'à la facture client.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >3</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Traçabilité des lots</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Chaque lot est conforme CE 178/2002 — cahier de miellerie numérique prêt pour un
            contrôle : origine (ruches et rucher), dates, quantités, et destination (clients ayant
            reçu ce lot).
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >4</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Suivre les hausses</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Chaque hausse a sa fiche détaillée : pose, retrait, durée sur la ruche et historique
            complet — module Hausses. Sachez toujours combien de hausses sont posées, disponibles ou
            hors service.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >5</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Livrer vos clients</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Groupez plusieurs bons de livraison d'un même client en une seule facture depuis
            Finances → Bons de livraison — l'historique complet reste visible sur sa fiche, avec la
            traçabilité des lots livrés.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >6</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Consulter les statistiques</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Le tableau de bord affiche votre production par rucher, par type de miel et par période,
            avec l'évolution N/N-1 et la corrélation avec la météo de la saison — pour repérer vos
            meilleurs emplacements.
          </p>
        </div>
      </li>
    </ol>

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
