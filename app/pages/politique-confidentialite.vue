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

      <h1 class="text-3xl font-bold tracking-tight text-stone-900">Politique de confidentialité</h1>
      <p class="mt-2 text-sm text-stone-400">Dernière mise à jour : mars 2026</p>

      <div class="mt-10 space-y-8 text-[15px] leading-[1.75] text-stone-700">
        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">1. Responsable de traitement</h2>
          <p>
            Le responsable du traitement des données personnelles collectées via le Service est
            <strong>{{ editor.raisonSociale }}</strong
            >, entrepreneur individuel exploitant sous le nom commercial
            {{ editor.nomCommercial }} — {{ editor.adresse }} (SIREN {{ editor.siren }}), joignable
            à
            <a href="mailto:apigo360.apiculture@gmail.com" class="text-honey-deep hover:underline"
              >apigo360.apiculture@gmail.com</a
            >.
          </p>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">2. Données collectées</h2>
          <p>Dans le cadre du fonctionnement du Service, nous collectons les données suivantes :</p>
          <ul class="mt-3 space-y-1.5 pl-5">
            <li class="list-disc"><strong>Identification :</strong> nom, prénom, adresse email</li>
            <li class="list-disc">
              <strong>Exploitation :</strong> adresse de l'exploitation, numéro NAPI, SIRET
            </li>
            <li class="list-disc">
              <strong>Facturation :</strong> coordonnées de facturation (via Stripe — aucune donnée
              CB stockée chez nous)
            </li>
            <li class="list-disc">
              <strong>Données apicoles :</strong> localisations des ruchers, interventions,
              production, stocks
            </li>
            <li class="list-disc">
              <strong>Données clients :</strong> coordonnées des clients dans le module facturation
            </li>
            <li class="list-disc">
              <strong>Données techniques :</strong> adresse IP, logs d'accès, type de navigateur
            </li>
          </ul>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">3. Finalités du traitement</h2>
          <ul class="mt-2 space-y-1.5 pl-5">
            <li class="list-disc">Création et gestion de votre compte utilisateur</li>
            <li class="list-disc">
              Fourniture des fonctionnalités du Service (suivi apicole, facturation, analytics)
            </li>
            <li class="list-disc">Facturation et gestion des abonnements</li>
            <li class="list-disc">Amélioration et sécurisation du Service</li>
            <li class="list-disc">
              Envoi d'emails transactionnels (confirmation, alertes, résumés)
            </li>
          </ul>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">4. Base légale</h2>
          <p>
            Le traitement est fondé sur l'<strong>exécution du contrat</strong> (art. 6.1.b RGPD)
            pour les données nécessaires au fonctionnement du Service, et sur votre
            <strong>consentement</strong> (art. 6.1.a RGPD) pour les communications optionnelles.
          </p>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">5. Durée de conservation</h2>
          <ul class="mt-2 space-y-1.5 pl-5">
            <li class="list-disc">
              Données de compte : durée d'activité + 3 ans après suppression du compte
            </li>
            <li class="list-disc">Factures et données comptables : 10 ans (obligation légale)</li>
            <li class="list-disc">Logs techniques : 12 mois maximum</li>
          </ul>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">6. Destinataires des données</h2>
          <p>Vos données peuvent être transmises aux sous-traitants suivants :</p>
          <!--
            ⚠️ `overflow-x-auto` ET NON `overflow-hidden`.
            À 360 px, ce tableau demande 370 px : la colonne « Localisation » —
            celle qui dit si vos données sortent de l'UE, donc précisément ce
            qu'on vient lire ici — était COUPÉE et inatteignable. `hidden` ne
            prévient pas le débordement, il le masque : le contenu existe
            toujours, mais on ne peut même pas défiler jusqu'à lui.
          -->
          <div class="mt-3 overflow-x-auto rounded-xl border border-stone-200/60">
            <table class="w-full min-w-[22rem] text-sm">
              <thead>
                <tr class="border-b border-stone-100 bg-stone-50">
                  <th class="px-4 py-2.5 text-left font-semibold text-stone-600">Sous-traitant</th>
                  <th class="px-4 py-2.5 text-left font-semibold text-stone-600">Rôle</th>
                  <th class="px-4 py-2.5 text-left font-semibold text-stone-600">Localisation</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100 bg-white">
                <tr v-for="st in soustraitants" :key="st.name">
                  <td class="px-4 py-3 font-medium">{{ st.name }}</td>
                  <td class="px-4 py-3 text-stone-500">{{ st.role }}</td>
                  <td class="px-4 py-3 text-stone-500">{{ st.location }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-2 text-xs text-stone-400">
            CCT = Clauses Contractuelles Types. Aucune vente à des tiers.
          </p>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">7. Transferts hors UE</h2>
          <p>
            Certains sous-traitants (Vercel, Stripe, Resend, Sentry) sont établis aux États-Unis.
            Ces transferts sont encadrés par des <strong>Clauses Contractuelles Types</strong> (CCT)
            conformes au RGPD.
          </p>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">8. Vos droits</h2>
          <p>
            Conformément au RGPD, vous disposez des droits d'accès, de rectification, d'effacement,
            de portabilité, d'opposition et de limitation (art. 15 à 21 RGPD).
          </p>
          <p class="mt-3">
            Pour les exercer :
            <a href="mailto:apigo360.apiculture@gmail.com" class="text-honey-deep hover:underline"
              >apigo360.apiculture@gmail.com</a
            >
            ou depuis votre page
            <NuxtLink to="/parametres" class="text-honey-deep hover:underline">Paramètres</NuxtLink
            >. Droit de réclamation auprès de la <strong>CNIL</strong> :
            <a href="https://www.cnil.fr" class="text-honey-deep hover:underline">cnil.fr</a>.
          </p>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">9. Analytics &amp; Cookies</h2>
          <p>
            Aucun cookie tiers publicitaire. Seul le
            <strong>cookie de session Supabase Auth</strong>
            est utilisé pour maintenir votre connexion (durée : session ou 7 jours si "Se souvenir
            de moi").
          </p>
          <p class="mt-2">
            Avec votre <strong>accord explicite</strong>, nous utilisons
            <strong>PostHog</strong> (hébergé en UE, Francfort) pour mesurer l'usage de
            l'application et améliorer le produit. Les données sont anonymisées (IP masquée, replay
            de session avec masquage intégral des textes et inputs). Vous pouvez retirer votre
            consentement à tout moment depuis le bandeau de cookies.
          </p>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold text-stone-900">10. Sécurité</h2>
          <ul class="mt-2 space-y-1.5 pl-5">
            <li class="list-disc">Chiffrement TLS 1.3 en transit</li>
            <li class="list-disc">Mots de passe hashés bcrypt (Supabase Auth)</li>
            <li class="list-disc">Row Level Security (RLS) PostgreSQL</li>
            <li class="list-disc">Sauvegardes automatiques quotidiennes</li>
          </ul>
        </section>
      </div>
    </main>

    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
import { LEGAL_EDITOR } from '~/config/legal';

definePageMeta({ layout: false });

useHead({
  title: 'Politique de confidentialité — APIGO',
  meta: [{ name: 'robots', content: 'noindex' }],
});

const editor = LEGAL_EDITOR;

// Sous-traitants RÉELS (doivent refléter l'infrastructure effective) : e-mails
// transactionnels via Resend, supervision d'erreurs via Sentry — cf. code serveur.
const soustraitants = [
  { name: 'Supabase', role: 'BDD & authentification', location: 'UE (Francfort)' },
  { name: 'Stripe', role: 'Paiement', location: 'UE + US (CCT)' },
  { name: 'Vercel', role: 'Hébergement applicatif', location: 'US (CCT)' },
  { name: 'Resend', role: 'Emails transactionnels', location: 'US (CCT)' },
  { name: 'Sentry', role: 'Supervision des erreurs (fiabilité)', location: 'US (CCT)' },
  {
    name: 'PostHog',
    role: 'Analytics produit (opt-in, données anonymisées)',
    location: 'UE (Frankfurt)',
  },
];
</script>
