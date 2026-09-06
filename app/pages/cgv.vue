<template>
  <div class="min-h-screen bg-[#FAFAF8]">
    <LandingHeader />

    <main class="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:px-6">
      <NuxtLink
        to="/"
        class="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-honey-deep hover:text-amber-700"
      >
        <UIcon name="i-lucide-arrow-left" class="h-4 w-4" />
        Retour à l'accueil
      </NuxtLink>

      <h1 class="text-3xl font-bold tracking-tight text-stone-900">
        Conditions Générales de Vente
      </h1>
      <p class="mt-2 text-sm text-stone-400">Version {{ version }} — en vigueur au 29 juin 2026</p>

      <!-- Bandeau d'avertissement (à retirer après relecture juridique) -->
      <div
        class="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
      >
        <strong>Document à finaliser.</strong> Le
        <strong>médiateur de la consommation</strong> (obligatoire pour la vente aux particuliers)
        reste à désigner, et l'ensemble doit être relu par un professionnel du droit avant toute
        commercialisation.
      </div>

      <div class="mt-10 space-y-8 text-[15px] leading-[1.75] text-stone-700">
        <!-- 1 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">
            Article 1 — Objet et champ d'application
          </h2>
          <p>
            Les présentes Conditions Générales de Vente (ci-après « CGV ») régissent la vente des
            abonnements au service en ligne <strong>APIGO</strong> (ci-après « le Service »),
            logiciel de gestion apicole accessible à l'adresse {{ editor.site }}.
          </p>
          <p class="mt-3">
            Elles s'appliquent à toute souscription d'un abonnement payant, sans restriction ni
            réserve. Le fait de souscrire emporte acceptation pleine et entière des présentes CGV,
            que le Client reconnaît avoir lues avant sa commande. Elles complètent les
            <NuxtLink to="/cgu" class="text-honey-deep hover:underline">CGU</NuxtLink> et la
            <NuxtLink to="/politique-confidentialite" class="text-honey-deep hover:underline"
              >Politique de confidentialité</NuxtLink
            >.
          </p>
        </section>

        <!-- 2 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">Article 2 — Identité du vendeur</h2>
          <div class="mt-3 rounded-xl border border-stone-200/60 bg-white p-5 text-sm space-y-0.5">
            <p><strong>Vendeur :</strong> {{ editor.raisonSociale }}</p>
            <p><strong>Nom commercial :</strong> {{ editor.nomCommercial }}</p>
            <p><strong>Forme :</strong> {{ editor.formeJuridique }}</p>
            <p><strong>SIREN :</strong> {{ editor.siren }}</p>
            <p><strong>SIRET :</strong> {{ editor.siret }}</p>
            <p><strong>RCS :</strong> {{ editor.rcs }}</p>
            <p><strong>Siège :</strong> {{ editor.adresse }}</p>
            <p><strong>Email :</strong> {{ editor.email }}</p>
            <p class="text-stone-500">{{ editor.tvaMention }}</p>
          </div>
        </section>

        <!-- 3 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">Article 3 — Définitions</h2>
          <ul class="mt-2 space-y-1.5 pl-5">
            <li class="list-disc">
              <strong>Client :</strong> toute personne physique ou morale souscrivant un abonnement
              payant au Service.
            </li>
            <li class="list-disc">
              <strong>Consommateur :</strong> Client personne physique agissant à des fins n'entrant
              pas dans le cadre de son activité professionnelle.
            </li>
            <li class="list-disc">
              <strong>Abonnement :</strong> droit d'accès au Service pour une période donnée
              (mensuelle ou annuelle), reconductible.
            </li>
          </ul>
        </section>

        <!-- 4 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">Article 4 — Formules et tarifs</h2>
          <p>Le Service est proposé selon les formules suivantes :</p>
          <div class="mt-3 overflow-hidden rounded-xl border border-stone-200/60">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-stone-100 bg-stone-50">
                  <th class="px-4 py-2.5 text-left font-semibold text-stone-600">Formule</th>
                  <th class="px-4 py-2.5 text-left font-semibold text-stone-600">Mensuel</th>
                  <th class="px-4 py-2.5 text-left font-semibold text-stone-600">Annuel</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100 bg-white">
                <tr v-for="p in tarifs" :key="p.label">
                  <td class="px-4 py-3 font-medium">{{ p.label }}</td>
                  <td class="px-4 py-3 text-stone-500">{{ p.mois }}</td>
                  <td class="px-4 py-3 text-stone-500">{{ p.an }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-3 text-sm text-stone-500">
            Les prix sont indiqués en euros, toutes taxes comprises ({{ editor.tvaMention }}) : le
            montant affiché correspond au montant effectivement débité. Le Vendeur se réserve le
            droit de modifier ses tarifs ; les nouveaux tarifs sont notifiés au Client au moins 30
            jours avant leur prise d'effet et ne s'appliquent qu'aux échéances postérieures, le
            Client restant libre de résilier avant.
          </p>
        </section>

        <!-- 5 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">
            Article 5 — Souscription (processus de commande)
          </h2>
          <ol class="mt-2 space-y-1.5 pl-5">
            <li class="list-decimal">
              Sélection de la formule et de la périodicité (mensuelle ou annuelle).
            </li>
            <li class="list-decimal">
              Acceptation des présentes CGV par case à cocher dédiée, préalable au paiement.
            </li>
            <li class="list-decimal">
              Renseignement des informations de paiement sur la page sécurisée de notre prestataire
              Stripe.
            </li>
            <li class="list-decimal">Confirmation de la commande et accès immédiat au Service.</li>
          </ol>
          <p class="mt-3">
            La commande est définitivement formée à la validation du paiement. Un email de
            confirmation récapitulant la commande est adressé au Client.
          </p>
        </section>

        <!-- 6 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">Article 6 — Paiement</h2>
          <ul class="mt-2 space-y-1.5 pl-5">
            <li class="list-disc">
              Le paiement s'effectue par carte bancaire via
              <strong>Stripe Payments Europe Ltd</strong>. Aucune donnée bancaire n'est conservée
              par le Vendeur.
            </li>
            <li class="list-disc">
              L'abonnement est payé d'avance et reconduit automatiquement à chaque échéance
              (mensuelle ou annuelle) par prélèvement sur le moyen de paiement enregistré.
            </li>
            <li class="list-disc">
              En cas d'échec de paiement, l'accès aux fonctionnalités payantes peut être suspendu
              après relance, jusqu'à régularisation. Le compte et les données du Client restent
              accessibles selon les conditions des CGU.
            </li>
          </ul>
        </section>

        <!-- 7 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">Article 7 — Période d'essai</h2>
          <p>
            Un essai de la formule Pro de 60 jours peut être proposé, activable une seule fois par
            compte. Il nécessite l'enregistrement d'une carte bancaire ; aucun montant n'est débité
            pendant l'essai. Le Client est informé par email avant la fin de l'essai. À défaut de
            résiliation avant le terme, l'abonnement se poursuit et le premier paiement intervient
            automatiquement au tarif en vigueur. Le Client peut résilier à tout moment avant le
            terme, sans frais.
          </p>
        </section>

        <!-- 8 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">
            Article 8 — Durée, reconduction et résiliation
          </h2>
          <p>
            L'abonnement est souscrit pour la période choisie (mensuelle ou annuelle) et reconduit
            tacitement pour des périodes successives de même durée, sauf résiliation.
          </p>
          <p class="mt-3">
            Le Client peut résilier à tout moment, sans frais ni motif, depuis l'espace
            <NuxtLink to="/parametres/abonnement" class="text-honey-deep hover:underline"
              >Paramètres → Abonnement</NuxtLink
            >, par une fonctionnalité de résiliation accessible en quelques clics (conformément à
            l'article L. 215-1-1 du Code de la consommation). La résiliation prend effet à la fin de
            la période en cours ; aucun remboursement au prorata n'est dû pour la période déjà
            entamée, sauf disposition légale impérative contraire.
          </p>
          <p class="mt-3">
            Le Vendeur peut suspendre ou résilier l'abonnement en cas de manquement du Client à ses
            obligations (CGU/CGV), après mise en demeure restée sans effet, sauf manquement grave.
          </p>
        </section>

        <!-- 9 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">
            Article 9 — Droit de rétractation
          </h2>
          <p>
            Conformément à l'article L. 221-18 du Code de la consommation, le Consommateur dispose
            d'un délai de 14 jours pour se rétracter, sans avoir à justifier de motif.
          </p>
          <div
            class="mt-3 rounded-xl border border-stone-200/60 bg-stone-50 p-4 text-sm text-stone-700"
          >
            <p>
              <strong>Renonciation expresse — accès immédiat.</strong> Le Service étant un contenu
              numérique fourni immédiatement, le Client qui demande, lors de la souscription, à
              bénéficier de l'accès dès la validation du paiement,
              <strong>consent expressément</strong> à l'exécution immédiate du contrat et
              <strong>renonce à son droit de rétractation</strong> (articles L. 221-25 et L. 221-28
              du Code de la consommation). Cette renonciation est recueillie par une case à cocher
              dédiée au moment du paiement.
            </p>
          </div>
          <p class="mt-3">
            À défaut d'une telle demande, le Consommateur peut exercer son droit de rétractation
            dans le délai de 14 jours en adressant une demande non équivoque à
            <a :href="`mailto:${editor.email}`" class="text-honey-deep hover:underline">{{
              editor.email
            }}</a
            >.
          </p>
        </section>

        <!-- 10 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">Article 10 — Facturation</h2>
          <p>
            Une facture est émise à chaque paiement et mise à disposition du Client (espace
            Abonnement et/ou par email). Les factures sont conservées conformément à la
            réglementation applicable.
          </p>
        </section>

        <!-- 11 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">
            Article 11 — Disponibilité et responsabilité
          </h2>
          <ul class="mt-2 space-y-1.5 pl-5">
            <li class="list-disc">
              Le Vendeur s'engage à une obligation de moyens quant à la disponibilité du Service
              (best-effort), hors maintenances et cas de force majeure.
            </li>
            <li class="list-disc">
              Les analyses, scores et prédictions fournis sont indicatifs et ne se substituent pas
              au jugement de l'apiculteur ni à l'avis d'un professionnel.
            </li>
            <li class="list-disc">
              La responsabilité du Vendeur ne saurait être engagée pour les dommages indirects ;
              elle est, en tout état de cause, limitée au montant des sommes versées par le Client
              au titre des 12 derniers mois, dans les limites permises par la loi.
            </li>
          </ul>
        </section>

        <!-- 12 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">
            Article 12 — Données personnelles
          </h2>
          <p>
            Le traitement des données personnelles du Client est décrit dans la
            <NuxtLink to="/politique-confidentialite" class="text-honey-deep hover:underline"
              >Politique de confidentialité</NuxtLink
            >, qui fait partie intégrante de la relation contractuelle.
          </p>
        </section>

        <!-- 13 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">
            Article 13 — Réclamation et médiation
          </h2>
          <p>
            Pour toute réclamation, le Client peut contacter le Vendeur à
            <a :href="`mailto:${editor.email}`" class="text-honey-deep hover:underline">{{
              editor.email
            }}</a
            >. Conformément aux articles L. 612-1 et suivants du Code de la consommation, le
            Consommateur peut, après démarche écrite préalable auprès du Vendeur, recourir
            gratuitement à un médiateur de la consommation : {{ editor.mediateur }}. Le Consommateur
            peut également utiliser la plateforme européenne de règlement des litiges en ligne.
          </p>
        </section>

        <!-- 14 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">
            Article 14 — Modification des CGV
          </h2>
          <p>
            Le Vendeur peut modifier les présentes CGV. Les CGV applicables sont celles en vigueur à
            la date de la commande. Toute modification substantielle est notifiée au Client au moins
            30 jours avant son entrée en vigueur ; le Client peut résilier avant cette date s'il ne
            les accepte pas.
          </p>
        </section>

        <!-- 15 -->
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">
            Article 15 — Droit applicable et litiges
          </h2>
          <p>
            Les présentes CGV sont régies par le droit français. En cas de litige, une solution
            amiable sera recherchée en priorité. À défaut, les tribunaux français sont compétents,
            sous réserve des règles impératives applicables au Consommateur, qui peut saisir la
            juridiction de son lieu de domicile.
          </p>
        </section>

        <div class="rounded-xl border border-stone-200/60 bg-stone-50 p-5 text-sm text-stone-500">
          <p>Version {{ version }} — entrée en vigueur le 29 juin 2026.</p>
        </div>
      </div>
    </main>

    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
import { PLAN_CONFIGS } from '~/config/plans';
import { LEGAL_EDITOR, LEGAL_VERSIONS } from '~/config/legal';

definePageMeta({ layout: false });

useHead({
  title: 'Conditions Générales de Vente — APIGO',
  meta: [{ name: 'robots', content: 'noindex' }],
});

const editor = LEGAL_EDITOR;
const version = LEGAL_VERSIONS.cgv;

const tarifs = Object.values(PLAN_CONFIGS).map((p) => ({
  label: p.label,
  mois: p.prix ? `${p.prix.mois.toFixed(2).replace('.', ',')} €/mois` : 'Gratuit',
  an: p.prix ? `${p.prix.an.toFixed(2).replace('.', ',')} €/an` : 'Gratuit',
}));
</script>
