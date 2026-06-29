<template>
  <div class="min-h-screen bg-[#FAFAF8]">
    <LandingHeader />

    <main class="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6">
      <NuxtLink
        to="/"
        class="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700"
      >
        <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
        Retour à l'accueil
      </NuxtLink>

      <h1 class="text-3xl font-bold tracking-tight text-stone-900">
        Conditions Générales d'Utilisation
      </h1>
      <p class="mt-2 text-sm text-stone-400">Dernière mise à jour : mars 2026</p>

      <div class="mt-10 space-y-8 text-[15px] leading-[1.75] text-stone-700">
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">Article 1 — Objet</h2>
          <p>
            Les présentes Conditions Générales d'Utilisation (ci-après "CGU") régissent l'accès et
            l'utilisation de la plateforme <strong>APIGO</strong>, service SaaS de gestion apicole
            édité par <strong>APIGO</strong> (ci-après "l'Éditeur").
          </p>
          <p class="mt-3">
            L'utilisation du Service implique l'acceptation pleine et entière des présentes CGU.
          </p>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">Article 2 — Inscription</h2>
          <p>L'accès au Service nécessite la création d'un compte. L'utilisateur s'engage à :</p>
          <ul class="mt-2 space-y-1.5 pl-5">
            <li class="list-disc">Fournir une adresse email valide et des données véridiques</li>
            <li class="list-disc">Maintenir ses informations à jour</li>
            <li class="list-disc">Garder ses identifiants confidentiels</li>
            <li class="list-disc">
              Informer l'Éditeur de toute utilisation non autorisée de son compte
            </li>
          </ul>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">Article 3 — Plans et tarifs</h2>
          <p>Le Service est proposé selon quatre formules d'abonnement :</p>
          <div class="mt-3 overflow-hidden rounded-xl border border-stone-200/60">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-stone-100 bg-stone-50">
                  <th class="px-4 py-2.5 text-left font-semibold text-stone-600">Plan</th>
                  <th class="px-4 py-2.5 text-left font-semibold text-stone-600">Tarif mensuel</th>
                  <th class="px-4 py-2.5 text-left font-semibold text-stone-600">Tarif annuel</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100 bg-white">
                <tr v-for="plan in tarifs" :key="plan.name">
                  <td class="px-4 py-3 font-medium">{{ plan.name }}</td>
                  <td class="px-4 py-3 text-stone-500">{{ plan.mois }}</td>
                  <td class="px-4 py-3 text-stone-500">{{ plan.an }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-3 text-sm text-stone-500">
            Les tarifs sont indiqués en euros TTC. L'Éditeur se réserve le droit de les modifier,
            avec notification préalable par email.
          </p>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">Article 4 — Période d'essai</h2>
          <p>
            Un essai <strong>Pro 2 mois</strong> est disponible pour les utilisateurs du plan
            Découverte, activable une seule fois, sans carte bancaire requise. À l'expiration, le
            compte repasse automatiquement au plan Découverte.
          </p>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">Article 5 — Paiement</h2>
          <ul class="mt-2 space-y-1.5 pl-5">
            <li class="list-disc">
              Paiement sécurisé via <strong>Stripe</strong> — aucune donnée bancaire stockée chez
              l'Éditeur
            </li>
            <li class="list-disc">Prélèvement mensuel ou annuel selon la formule choisie</li>
            <li class="list-disc">Renouvellement automatique à chaque échéance</li>
            <li class="list-disc">Facturation émise à chaque renouvellement</li>
          </ul>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">Article 6 — Résiliation</h2>
          <p>
            L'utilisateur peut résilier son abonnement à tout moment depuis la page
            <NuxtLink to="/parametres/abonnement" class="text-amber-600 hover:underline"
              >Paramètres → Abonnement</NuxtLink
            >. La résiliation prend effet à la fin de la période en cours. Aucun remboursement
            proratisé n'est effectué pour la période déjà facturée.
          </p>
          <p class="mt-3">
            L'Éditeur peut suspendre ou supprimer un compte en cas de violation des CGU, après
            notification préalable par email.
          </p>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">Article 7 — Données utilisateur</h2>
          <p>
            Les données saisies dans le Service (ruchers, ruches, interventions, factures, clients)
            restent la <strong>propriété exclusive de l'utilisateur</strong>. L'Éditeur n'acquiert
            aucun droit sur ces données.
          </p>
          <p class="mt-3">
            L'utilisateur peut exporter l'intégralité de ses données à tout moment (XLSX, PDF, CSV).
            En cas de résiliation ou suppression de compte, les données sont conservées 30 jours
            pour permettre l'export, puis supprimées conformément à la politique de confidentialité.
          </p>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">Article 8 — Responsabilité</h2>
          <ul class="mt-2 space-y-1.5 pl-5">
            <li class="list-disc">Le Service est fourni "en l'état" sans garantie de résultat</li>
            <li class="list-disc">
              L'Éditeur s'engage à une disponibilité best-effort (SLA best-effort)
            </li>
            <li class="list-disc">
              Les analyses et prédictions sont indicatives — elles ne remplacent pas l'expertise
              professionnelle
            </li>
            <li class="list-disc">
              L'utilisateur est seul responsable de l'exactitude des données saisies
            </li>
          </ul>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">
            Article 9 — Propriété intellectuelle
          </h2>
          <p>
            Le logiciel APIGO (code source, design, marque, logos) est la propriété exclusive de
            <strong>APIGO</strong> et est protégé par le droit de la propriété intellectuelle. Toute
            reproduction sans autorisation est interdite.
          </p>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">
            Article 10 — Modification des CGU
          </h2>
          <p>
            L'Éditeur se réserve le droit de modifier les présentes CGU. Les utilisateurs seront
            notifiés par email au moins <strong>30 jours avant</strong> toute modification
            substantielle. La poursuite de l'utilisation du Service après ce délai vaut acceptation
            des nouvelles conditions.
          </p>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">
            Article 11 — Données personnelles
          </h2>
          <p>
            Le traitement des données personnelles est encadré par la
            <NuxtLink to="/politique-confidentialite" class="text-amber-600 hover:underline">
              Politique de confidentialité
            </NuxtLink>
            qui fait partie intégrante des présentes CGU.
          </p>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">Article 12 — Droit applicable</h2>
          <p>
            Les présentes CGU sont soumises au <strong>droit français</strong>. En cas de litige,
            les parties s'efforceront de trouver une solution amiable. À défaut, le tribunal
            compétent du ressort du siège social de la société APIGO sera seul compétent.
          </p>
        </section>

        <div class="rounded-xl border border-stone-200/60 bg-stone-50 p-5 text-sm text-stone-500">
          <p>Date d'entrée en vigueur des présentes CGU : mars 2026</p>
        </div>
      </div>
    </main>

    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

useHead({
  title: "Conditions Générales d'Utilisation — APIGO",
  meta: [{ name: 'robots', content: 'noindex' }],
});

const tarifs = [
  { name: 'Découverte', mois: 'Gratuit', an: 'Gratuit' },
  { name: 'Starter', mois: '4,99 €', an: '47,90 €' },
  { name: 'Pro', mois: '14,99 €', an: '143,90 €' },
  { name: 'Expert', mois: '29,99 €', an: '287,90 €' },
];
</script>
