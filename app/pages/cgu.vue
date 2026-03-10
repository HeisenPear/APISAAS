<template>
  <div>
    <NuxtLayout name="auth">
      <div class="max-h-[70vh] overflow-y-auto text-left">
        <NuxtLink
          to="/login"
          class="mb-6 inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-amber-600"
        >
          <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
          Retour
        </NuxtLink>

        <h2 class="mb-6 text-xl font-bold text-stone-900">Conditions generales d'utilisation</h2>
        <p class="mb-4 text-xs text-stone-400">Derniere mise a jour : 9 mars 2026</p>

        <div class="space-y-6 text-sm leading-relaxed text-stone-700">
          <section>
            <h3 class="mb-2 font-semibold text-stone-900">1. Objet</h3>
            <p>
              Les presentes Conditions Generales d'Utilisation (CGU) regissent l'acces et
              l'utilisation de la plateforme Apiculture 360°, un service en ligne (SaaS) de gestion
              apicole edite par la societe exploitante du service (ci-apres "l'Editeur").
            </p>
            <p class="mt-2">
              L'utilisation du service implique l'acceptation pleine et entiere des presentes CGU.
            </p>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-stone-900">2. Inscription et compte</h3>
            <ul class="ml-4 list-disc space-y-1">
              <li>
                L'inscription est ouverte a toute personne physique ou morale exercant une activite
                apicole ou connexe.
              </li>
              <li>
                L'utilisateur s'engage a fournir des informations exactes et a les maintenir a jour.
              </li>
              <li>
                Chaque compte est personnel et l'utilisateur est responsable de la confidentialite
                de ses identifiants.
              </li>
              <li>
                En cas d'utilisation non autorisee du compte, l'utilisateur doit en informer
                l'Editeur sans delai.
              </li>
            </ul>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-stone-900">3. Description du service</h3>
            <p>
              Apiculture 360° propose une solution de gestion apicole comprenant notamment : la
              gestion des ruchers et ruches, le suivi des interventions, la gestion de la production
              et des stocks, la facturation, le suivi meteo, les alertes et le calendrier apicole.
            </p>
            <p class="mt-2">
              L'Editeur se reserve le droit de faire evoluer les fonctionnalites du service a tout
              moment.
            </p>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-stone-900">4. Abonnements et paiement</h3>
            <ul class="ml-4 list-disc space-y-1">
              <li>
                Le service est propose sous forme d'abonnements mensuels ou annuels selon les
                formules disponibles (Starter, Pro, Expert).
              </li>
              <li>
                Les prix sont indiques en euros TTC. La TVA applicable est celle en vigueur au
                moment de la facturation.
              </li>
              <li>
                Le paiement est effectue par carte bancaire via la plateforme securisee Stripe.
              </li>
              <li>
                L'abonnement est reconduit tacitement a chaque echeance. L'utilisateur peut
                l'annuler a tout moment depuis ses parametres.
              </li>
              <li>
                Aucun remboursement n'est effectue pour la periode en cours en cas d'annulation
                anticipee.
              </li>
            </ul>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-stone-900">5. Propriete intellectuelle</h3>
            <p>
              L'ensemble des elements du service (code source, design, textes, logos, images) sont
              la propriete exclusive de l'Editeur et sont proteges par le droit de la propriete
              intellectuelle. Toute reproduction, meme partielle, est interdite sans autorisation
              prealable.
            </p>
            <p class="mt-2">
              Les donnees saisies par l'utilisateur restent sa propriete. L'Editeur n'acquiert aucun
              droit sur le contenu utilisateur.
            </p>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-stone-900">6. Responsabilite</h3>
            <ul class="ml-4 list-disc space-y-1">
              <li>
                L'Editeur s'engage a assurer la disponibilite du service dans la mesure du possible,
                sans garantie de continuite absolue.
              </li>
              <li>
                L'Editeur ne saurait etre tenu responsable des dommages indirects resultant de
                l'utilisation ou de l'impossibilite d'utilisation du service.
              </li>
              <li>
                L'utilisateur est seul responsable de l'exactitude des donnees saisies et des
                decisions prises sur la base des informations fournies par le service.
              </li>
              <li>
                Les fonctions d'analyse et de prediction sont fournies a titre indicatif et ne
                remplacent pas l'expertise d'un professionnel.
              </li>
            </ul>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-stone-900">7. Donnees personnelles</h3>
            <p>
              Le traitement des donnees personnelles est detaille dans notre
              <NuxtLink to="/politique-confidentialite" class="text-amber-600 hover:underline">
                Politique de confidentialite </NuxtLink
              >. L'utilisateur est invite a en prendre connaissance.
            </p>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-stone-900">8. Resiliation</h3>
            <ul class="ml-4 list-disc space-y-1">
              <li>
                L'utilisateur peut resilier son abonnement a tout moment depuis la page Parametres
                de son compte.
              </li>
              <li>
                L'Editeur se reserve le droit de suspendre ou supprimer un compte en cas de
                violation des presentes CGU, apres notification prealable.
              </li>
              <li>
                En cas de resiliation, l'utilisateur peut exporter ses donnees pendant un delai de
                30 jours. Passe ce delai, les donnees seront supprimees conformement a la politique
                de confidentialite.
              </li>
            </ul>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-stone-900">9. Modification des CGU</h3>
            <p>
              L'Editeur se reserve le droit de modifier les presentes CGU a tout moment. Les
              utilisateurs seront informes par email de toute modification substantielle. La
              poursuite de l'utilisation du service apres notification vaut acceptation des
              nouvelles conditions.
            </p>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-stone-900">10. Droit applicable et juridiction</h3>
            <p>
              Les presentes CGU sont soumises au droit francais. En cas de litige relatif a
              l'interpretation ou a l'execution des presentes, les parties s'efforceront de trouver
              une solution amiable. A defaut, les tribunaux competents de Paris seront seuls
              competents.
            </p>
          </section>
        </div>
      </div>
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});

useHead({
  title: "Conditions generales d'utilisation — Apiculture 360°",
});
</script>
