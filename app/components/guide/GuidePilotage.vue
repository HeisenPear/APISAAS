<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">🧭 Pilotage</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Votre point d'entrée quotidien : ce qui se passe, ce qui presse, et où aller aujourd'hui.
    </p>

    <ol class="space-y-3">
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >1</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Tableau de bord</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Ruches actives, alertes critiques et activité récente en temps réel dès la connexion.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >2</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Alertes</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Toutes vos alertes centralisées (traitements dus, hausses pleines, échéances) avec un
            niveau de priorité.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >3</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Ma tournée · Pro</p>
          <p class="text-xs text-[var(--text-secondary)]">
            APIGO optimise l'ordre de vos visites du jour selon vos ruchers, en tenant compte des
            interventions à faire.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >4</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Calendrier & Météo</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Vue combinée de vos rendez-vous planifiés et de la météo locale de chacun de vos
            ruchers.
          </p>
        </div>
      </li>
    </ol>

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Le compteur d'alertes dans la sidebar reste visible où que vous soyez
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Ma tournée recalcule l'ordre optimal à chaque nouvelle intervention planifiée
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Le calendrier se synchronise avec vos rendez-vous professionnels (iCal)
        </li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-3">
      <UButton
        label="Tableau de bord"
        icon="i-lucide-layout-dashboard"
        variant="soft"
        color="primary"
        to="/dashboard"
      />
      <UButton
        label="Mes alertes"
        icon="i-lucide-bell"
        variant="outline"
        color="neutral"
        to="/alertes"
      />
    </div>
  </div>
</template>
