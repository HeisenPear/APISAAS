<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">👥 Équipe & collaborateurs</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      À partir du plan Pro, partagez votre exploitation avec des collaborateurs. Ils accèdent à vos
      données sous <strong>votre</strong> abonnement — ils n'ont aucun abonnement à payer de leur
      côté.
    </p>

    <GuidePhasesGuide theme="equipe" />

    <div class="rounded-[12px] bg-[var(--honey-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--honey-deep)]">💡 Astuces</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Un collaborateur garde son propre compte mais travaille dans votre exploitation — un
          bandeau le lui rappelle en haut de l'app.
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Vous voyez tout ; chaque membre agit selon son rôle (les rôles limités sont réservés à
          Expert).
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Une invitation en attente peut être relancée par email en un clic si elle traîne dans la
          boîte du destinataire.
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Besoin de plus de 10 sièges ? Contactez-nous, on adapte votre forfait.
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Retrouvez le détail de chaque plan (dont les sièges d'équipe inclus) dans
          <NuxtLink to="/fonctionnalites" class="font-medium hover:underline"
            >Fonctionnalités</NuxtLink
          >.
        </li>
      </ul>
    </div>

    <div class="rounded-[12px] bg-[var(--sage-soft)] p-4">
      <p class="text-xs font-semibold text-[var(--sage-deep)]">🐝 Le saviez-vous ?</p>
      <ul class="mt-2 space-y-1">
        <li class="text-xs text-[var(--text-secondary)]">
          • Un rôle Technicien bien calibré permet de déléguer les visites de terrain sans exposer
          vos données financières — idéal pour un salarié saisonnier.
        </li>
        <li class="text-xs text-[var(--text-secondary)]">
          • Documentez vos protocoles (dosages, produits) dans des modèles d'intervention : un
          nouveau collaborateur applique alors vos méthodes dès le premier jour, sans y repenser.
        </li>
      </ul>
    </div>

    <div class="flex flex-wrap gap-3">
      <UButton
        label="Gérer l'équipe"
        icon="i-lucide-users-round"
        variant="soft"
        color="primary"
        to="/parametres/equipe"
      />
      <UButton
        label="Voir les plans"
        icon="i-lucide-sparkles"
        variant="outline"
        color="neutral"
        to="/parametres/abonnement"
      />
    </div>
  </div>
</template>
