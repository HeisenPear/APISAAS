<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">🚀 Premiers pas sur APIGO</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      APIGO est votre outil de gestion apicole tout-en-un. Voici comment démarrer efficacement en
      moins de 10 minutes.
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
            Rendez-vous dans Ruchers → Nouveau rucher. Renseignez le nom, la commune et la position
            GPS.
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
            Dans Ruches → Nouvelle ruche, ou par lot depuis la fiche de votre rucher.
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
            Enregistrez une intervention
          </p>
          <p class="text-xs text-[var(--text-secondary)]">
            Interventions → Nouvelle intervention. Choisissez la ruche, le type et notez vos
            observations.
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
            Consultez le tableau de bord
          </p>
          <p class="text-xs text-[var(--text-secondary)]">
            Le dashboard résume votre activité, vos alertes et la météo de vos ruchers.
          </p>
        </div>
      </li>
    </ol>

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Utilisez ⌘K pour la recherche globale rapide
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Le mode terrain simplifie les saisies sur smartphone
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Vos données sont synchronisées en temps réel
        </li>
      </ul>
    </div>

    <div class="rounded-[12px] border border-[var(--border-default)] p-4">
      <p class="text-xs font-semibold text-[var(--text-primary)]">🧭 Pour aller plus loin</p>
      <ul class="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        <li class="text-xs text-[var(--text-secondary)]">
          🍯 Production — récoltes, lots, traçabilité
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          💰 Finances — clients, factures, trésorerie
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          🚛 Transhumance — emplacements, carte mellifère (Pro)
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          🧬 Élevage — reines, lignées, greffage (Expert)
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          👥 Équipe — invitez des collaborateurs (Pro)
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          📋 Conformité — NAPI, registre, sanitaire
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
