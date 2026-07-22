<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">🚀 Premiers pas sur APIGO</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      APIGO est votre outil de gestion apicole tout-en-un : du rucher à la facturation. Voici
      comment démarrer efficacement en moins de 10 minutes, puis comment vous y retrouver une fois
      lancé.
    </p>

    <ol class="space-y-3">
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >1</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Créez votre premier rucher</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Ruchers → Nouveau rucher. Renseignez le nom, la commune et la position GPS (bouton « Me
            géolocaliser » ou clic sur la carte). L'environnement (forêt, culture, mixte) affine la
            météo locale et les suggestions de floraisons.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >2</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Ajoutez vos ruches</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Depuis la fiche du rucher, ajoutez vos ruches une à une ou par lot (pratique pour un
            grand cheptel). Choisissez le type (Dadant, Langstroth, Warré…) et une couleur pour les
            repérer d'un coup d'œil sur le terrain.
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
            Enregistrez votre première intervention
          </p>
          <p class="text-xs text-[var(--text-secondary)]">
            Interventions → Nouvelle. Choisissez la ruche, le type (visite, traitement,
            nourrissement, récolte… plus de 14 disponibles) et notez vos observations. Sur le
            terrain, le mode simplifié accélère la saisie au smartphone.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >4</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Suivez récoltes et ventes</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Une récolte enregistrée alimente automatiquement votre stock de miel ; une vente débite
            ce même stock et met à jour votre chiffre d'affaires. Une seule saisie, tout le reste se
            met à jour tout seul.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >5</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">
            Consultez le tableau de bord
          </p>
          <p class="text-xs text-[var(--text-secondary)]">
            Le dashboard résume votre activité : ruches actives, alertes en cours, score de santé du
            cheptel, production de la saison et météo de vos ruchers — tout en un écran, mis à jour
            en temps réel.
          </p>
        </div>
      </li>
    </ol>

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
