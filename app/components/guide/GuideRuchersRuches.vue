<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">🏕️ Ruchers & Ruches</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      Organisez votre cheptel en ruchers géolocalisés. Chaque ruche possède une fiche détaillée avec
      son historique complet, sa reine et son état de santé.
    </p>

    <ol class="space-y-3">
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >1</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Créer un rucher</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Ruchers → Nouveau rucher. Renseignez l'environnement (forêt, culture, mixte) pour la
            météo locale et les suggestions de floraisons — indiquez aussi si le terrain vous
            appartient ou fait l'objet d'un accord avec un propriétaire.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >2</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Ajouter des ruches</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Depuis la fiche rucher, ajoutez vos ruches une à une ou par lot (pratique pour numéroter
            10-20 ruches d'un coup). Choisissez le type (Dadant, Langstroth, Warré, Kenyane…) et le
            statut (active, hivernage, en réserve).
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >3</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Consulter la fiche ruche</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Timeline complète, hausses posées, statut de la reine (couleur, année, qualité de
            ponte), historique de renouvellement des cadres (cire) et score prédictif de santé à 30
            jours (Pro) — tout au même endroit.
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
            Scanner le QR code sur le terrain
          </p>
          <p class="text-xs text-[var(--text-secondary)]">
            Chaque ruche a son QR code, imprimable depuis sa fiche. Un scan ouvre directement les
            actions rapides — intervention, pesée, note — sans chercher dans les menus, gants aux
            mains.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >5</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Basculer en vue carte</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Visualisez tous vos ruchers sur OpenStreetMap : distances entre eux, zones de butinage
            qui se chevauchent, et accès rapide à chaque fiche depuis le marqueur. Utile pour
            planifier une tournée ou une transhumance.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >6</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">
            Surveiller le frelon asiatique
          </p>
          <p class="text-xs text-[var(--text-secondary)]">
            Module Surveillance frelon : signalez un nid ou une observation près d'un rucher (photo,
            localisation, espèce), et consultez les signalements de la communauté autour de vous,
            validés par votes.
          </p>
        </div>
      </li>
    </ol>

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Le GPS automatique positionne votre rucher en un clic
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Attribuez des couleurs aux ruches pour les identifier sur le terrain sans lire
          l'étiquette
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • La vue carte affiche tous vos ruchers sur OpenStreetMap, marqueur cliquable vers la
          fiche
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • L'historique cire aide à planifier le renouvellement des cadres avant qu'ils ne
          noircissent trop
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Marquez une ruche « hors service » plutôt que de la supprimer : vous gardez son
          historique
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Le statut de la reine se met à jour automatiquement après un événement d'introduction ou
          de remplacement
        </li>
      </ul>
    </div>

    <div class="rounded-[12px] bg-[var(--sage-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--sage-deep)]">🐝 Le saviez-vous ?</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Orientez l'entrée des ruches au sud ou sud-est, à l'abri du vent dominant, avec un point
          d'eau à moins de 200 m.
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Espacez vos ruches d'au moins 1 mètre : ça limite la « dérive » des butineuses qui se
          trompent de ruche au retour.
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Un léger dévers vers l'avant (2-3°) évite l'accumulation d'eau de pluie sur le plancher.
        </li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-3">
      <UButton
        label="Mes ruchers"
        icon="i-lucide-map-pin"
        variant="soft"
        color="primary"
        to="/ruchers"
      />
      <UButton
        label="Mes ruches"
        icon="i-lucide-hexagon"
        variant="outline"
        color="neutral"
        to="/ruches"
      />
      <UButton
        label="Surveillance frelon"
        icon="i-lucide-bug"
        variant="outline"
        color="neutral"
        to="/frelon"
      />
    </div>
  </div>
</template>
