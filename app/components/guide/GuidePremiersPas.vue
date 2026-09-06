<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">🚀 Premiers pas sur APIGO</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      APIGO est votre outil de gestion apicole tout-en-un : du rucher à la facturation. Voici
      comment démarrer efficacement en moins de 10 minutes, puis comment vous y retrouver une fois
      lancé.
    </p>

    <GuidePhasesGuide theme="premiers-pas" />

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Utilisez ⌘K (ou Ctrl+K) pour la recherche globale instantanée — ruche, client,
          intervention
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Le mode terrain simplifie les saisies sur smartphone, même en connexion faible
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Vos données sont synchronisées en temps réel entre tous vos appareils
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Chaque ruche a son QR code : scannez-le sur le terrain pour ouvrir directement ses
          actions rapides
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Le guide propose une visite interactive pour chaque module — repérez le bandeau « Lancer
          le guide » en bas de chaque section
        </li>
      </ul>
    </div>

    <div class="rounded-[12px] bg-[var(--sage-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--sage-deep)]">🐝 Le saviez-vous ?</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Une colonie forte compte 40 000 à 60 000 abeilles au printemps, contre 10 000-15 000
          seulement en hiver — la population fluctue énormément selon la saison.
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Démarrez avec 2 ou 3 ruches plutôt qu'une seule : vous pourrez comparer les colonies
          entre elles et dépanner l'une avec des cadres de couvain de l'autre en cas de problème.
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • La première année, ne récoltez pas tout : laissez à la jeune colonie assez de réserves
          pour passer l'hiver sereinement.
        </li>
      </ul>
    </div>

    <div class="rounded-[12px] border border-[var(--border-default)] p-4">
      <p class="text-xs font-semibold text-[var(--text-primary)]">🧭 Pour aller plus loin</p>
      <ul class="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        <li class="text-xs text-[var(--text-secondary)]">
          🧭 Pilotage — alertes, tournée optimisée (Pro), calendrier, météo
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          🍯 Production — récoltes, lots, traçabilité
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          💰 Finances — clients, factures, bons de livraison, trésorerie
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          🚛 Transhumance — emplacements, carte mellifère (Pro)
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          🧬 Élevage — généalogie, index génétique, greffage (Expert)
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          👥 Équipe — rôles technicien/comptable/lecture (Pro/Expert)
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          🛡️ Conformité — NAPI, mortalités, sanitaire, vétérinaires
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          📊 Stocks, clients & analytics — rentabilité par ruche (Starter/Pro)
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          🤝 Communauté & association — benchmarks anonymisés, gestion syndicale
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          <NuxtLink to="/outils" class="hover:underline hover:text-[var(--honey-deep)]"
            >🧮 Outils pratiques — calculettes sirop/candi, distances</NuxtLink
          >
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          <NuxtLink to="/fonctionnalites" class="hover:underline hover:text-[var(--honey-deep)]"
            >✨ Fonctionnalités — tout ce qu'inclut chaque plan</NuxtLink
          >
        </li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-3">
      <UButton
        label="Créer un rucher"
        icon="i-lucide-map-pin"
        variant="soft"
        color="primary"
        to="/ruchers/nouveau"
      />
      <UButton
        label="Voir le dashboard"
        icon="i-lucide-layout-dashboard"
        variant="outline"
        color="neutral"
        to="/dashboard"
      />
    </div>
  </div>
</template>
