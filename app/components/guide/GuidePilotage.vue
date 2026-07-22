<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">🧭 Pilotage</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Votre point d'entrée quotidien : ce qui se passe, ce qui presse, et où aller aujourd'hui.
      Pensé pour être consulté chaque matin en 30 secondes avant de partir sur le terrain.
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
            Ruches actives, alertes critiques et activité récente en temps réel dès la connexion. Le
            score de santé global du cheptel (0-100) résume l'état de vos colonies à partir de vos
            derniers contrôles.
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
            Toutes vos alertes centralisées (traitements dus, hausses pleines, échéances
            réglementaires, stock bas…) avec un niveau de priorité. Réglez vos préférences par
            catégorie dans Paramètres → Notifications pour ne recevoir que ce qui compte.
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
            APIGO optimise l'ordre de vos visites du jour selon vos ruchers et les interventions à
            faire, pour minimiser les trajets. Cochez chaque visite au fur et à mesure : la tournée
            se met à jour en direct.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >4</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Calendrier</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Toutes vos interventions planifiées et vos rendez-vous professionnels au même endroit.
            Synchronisez-le avec votre agenda personnel via un lien iCal (Paramètres → Calendrier)
            pour le retrouver sur votre téléphone.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >5</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Météo</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Prévisions locales pour chacun de vos ruchers (Open-Meteo), avec des alertes
            automatiques avant les épisodes de gel, forte chaleur ou vent violent qui peuvent
            justifier une intervention préventive.
          </p>
        </div>
      </li>
    </ol>

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Le compteur d'alertes dans la sidebar reste visible où que vous soyez dans l'app
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Ma tournée recalcule l'ordre optimal à chaque nouvelle intervention planifiée ou
          terminée
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Le calendrier se synchronise avec vos rendez-vous professionnels (iCal), lisible dans
          Google/Apple Calendar
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Une alerte traitée disparaît automatiquement — pas de gestion manuelle à faire
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Sur mobile, la barre du bas donne un accès direct à Aujourd'hui, Ruchers et Ma tournée
        </li>
      </ul>
    </div>

    <div class="rounded-[12px] bg-[var(--sage-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--sage-deep)]">🐝 Le saviez-vous ?</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Au printemps, une visite toutes les 8-10 jours suffit pour suivre le risque d'essaimage
          ; en été espacez à 2-3 semaines ; en hiver, limitez les ouvertures au strict nécessaire
          pour ne pas refroidir la grappe.
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Visitez en milieu de journée, par temps sec et sans vent : les butineuses sont dehors,
          la colonie est plus calme et moins défensive.
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
