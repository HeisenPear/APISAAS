<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">🧭 Pilotage</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Votre point d'entrée quotidien : ce qui se passe, ce qui presse, et où aller aujourd'hui.
      Pensé pour être consulté chaque matin en 30 secondes avant de partir sur le terrain.
    </p>

    <GuidePhasesGuide theme="pilotage" />

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
