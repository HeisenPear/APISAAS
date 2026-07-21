<template>
  <div class="space-y-6">
    <h2 class="text-xl font-bold text-[var(--text-primary)]">👥 Équipe & collaborateurs</h2>
    <p class="text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
      À partir du plan Pro, partagez votre exploitation avec des collaborateurs. Ils accèdent à vos
      données sous <strong>votre</strong> abonnement — ils n'ont aucun abonnement à payer de leur
      côté.
    </p>

    <ol class="space-y-3">
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >1</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Inviter un collaborateur</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Paramètres → Équipe → « Inviter un membre ». Saisissez son email et choisissez un rôle :
            il reçoit une invitation par email.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >2</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Il rejoint l'exploitation</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Depuis Paramètres → Équipe, votre collaborateur accepte l'invitation — même s'il est en
            plan Découverte. Il bascule alors dans votre espace et retrouve vos ruchers, ruches et
            données.
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
            Attribuer les bons accès (Expert)
          </p>
          <p class="text-xs text-[var(--text-secondary)]">
            Administrateur et Apiculteur ont un accès complet. Avec Expert, affinez les rôles :
            Technicien (rucher uniquement), Comptable (facturation & finances) ou Lecture seule.
          </p>
        </div>
      </li>
      <li class="flex items-start gap-3">
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--honey-soft)] text-xs font-bold text-[var(--honey-deep)]"
          >4</span
        >
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">Gérer les sièges</p>
          <p class="text-xs text-[var(--text-secondary)]">
            Pro inclut 3 collaborateurs, Expert jusqu'à 10. Le compteur de sièges s'affiche sur la
            page Équipe ; retirez un membre à tout moment pour libérer un siège.
          </p>
        </div>
      </li>
    </ol>

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
