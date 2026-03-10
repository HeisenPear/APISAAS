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

        <h2 class="mb-6 text-xl font-bold text-stone-900">Politique de confidentialite</h2>
        <p class="mb-4 text-xs text-stone-400">Derniere mise a jour : 9 mars 2026</p>

        <div class="space-y-6 text-sm leading-relaxed text-stone-700">
          <section>
            <h3 class="mb-2 font-semibold text-stone-900">1. Responsable du traitement</h3>
            <p>
              Le responsable du traitement des donnees personnelles collectees via la plateforme
              Apiculture 360° est la societe editrice du service, joignable a l'adresse :
              <a href="mailto:dpo@apiculture360.fr" class="text-amber-600 hover:underline"
                >dpo@apiculture360.fr</a
              >.
            </p>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-stone-900">2. Donnees collectees et finalites</h3>
            <p class="mb-2">
              Nous collectons les donnees suivantes dans le cadre de l'utilisation du service :
            </p>
            <ul class="ml-4 list-disc space-y-1">
              <li>
                <strong>Donnees d'identification</strong> : nom, prenom, adresse email, numero de
                telephone — pour la creation et la gestion de votre compte.
              </li>
              <li>
                <strong>Donnees professionnelles</strong> : informations sur votre exploitation
                apicole (ruchers, ruches, recoltes, stocks) — pour le fonctionnement du service.
              </li>
              <li>
                <strong>Donnees de facturation</strong> : adresse, SIRET, numero TVA — pour la
                facturation et la comptabilite.
              </li>
              <li>
                <strong>Donnees techniques</strong> : adresse IP, type de navigateur, pages
                consultees — pour la securite et l'amelioration du service.
              </li>
              <li>
                <strong>Donnees de geolocalisation</strong> : coordonnees GPS de vos ruchers —
                uniquement avec votre consentement, pour la cartographie.
              </li>
            </ul>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-stone-900">
              3. Base legale du traitement (Art. 6 RGPD)
            </h3>
            <ul class="ml-4 list-disc space-y-1">
              <li>
                <strong>Execution du contrat</strong> : traitement necessaire a la fourniture du
                service (Art. 6.1.b).
              </li>
              <li>
                <strong>Obligation legale</strong> : conservation des factures et documents
                comptables (Art. 6.1.c).
              </li>
              <li>
                <strong>Interet legitime</strong> : securite du service, amelioration de
                l'experience utilisateur (Art. 6.1.f).
              </li>
              <li>
                <strong>Consentement</strong> : geolocalisation, cookies non essentiels (Art.
                6.1.a).
              </li>
            </ul>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-stone-900">4. Duree de conservation</h3>
            <ul class="ml-4 list-disc space-y-1">
              <li>
                <strong>Donnees du compte</strong> : conservees pendant toute la duree d'utilisation
                du service, puis 3 ans apres la suppression du compte.
              </li>
              <li>
                <strong>Donnees de facturation</strong> : 10 ans conformement aux obligations
                comptables francaises.
              </li>
              <li><strong>Journaux techniques</strong> : 12 mois.</li>
            </ul>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-stone-900">5. Droits des utilisateurs</h3>
            <p class="mb-2">Conformement au RGPD, vous disposez des droits suivants :</p>
            <ul class="ml-4 list-disc space-y-1">
              <li>
                <strong>Droit d'acces</strong> : obtenir une copie de vos donnees personnelles.
              </li>
              <li>
                <strong>Droit de rectification</strong> : corriger des donnees inexactes ou
                incompletes.
              </li>
              <li>
                <strong>Droit a l'effacement</strong> : demander la suppression de vos donnees (sous
                reserve des obligations legales).
              </li>
              <li>
                <strong>Droit a la portabilite</strong> : recevoir vos donnees dans un format
                structure et lisible par machine.
              </li>
              <li>
                <strong>Droit d'opposition</strong> : vous opposer au traitement de vos donnees pour
                des motifs legitimes.
              </li>
              <li>
                <strong>Droit a la limitation</strong> : demander la limitation du traitement dans
                certains cas.
              </li>
            </ul>
            <p class="mt-2">
              Pour exercer ces droits, contactez-nous a
              <a href="mailto:dpo@apiculture360.fr" class="text-amber-600 hover:underline"
                >dpo@apiculture360.fr</a
              >. Vous pouvez egalement introduire une reclamation aupres de la CNIL.
            </p>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-stone-900">6. Sous-traitants et transferts</h3>
            <p>
              Vos donnees sont hebergees au sein de l'Union europeenne par nos sous-traitants
              techniques (Supabase, Vercel). Aucun transfert hors UE n'est effectue sans garanties
              appropriees (clauses contractuelles types de la Commission europeenne).
            </p>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-stone-900">7. Cookies</h3>
            <p>
              Le site utilise des cookies strictement necessaires au fonctionnement du service
              (authentification, preferences). Aucun cookie publicitaire ou de tracage n'est
              utilise. Les cookies de session expirent a la fermeture du navigateur.
            </p>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-stone-900">8. Securite</h3>
            <p>
              Nous mettons en oeuvre des mesures techniques et organisationnelles appropriees pour
              proteger vos donnees : chiffrement en transit (TLS), authentification securisee,
              controle d'acces par ligne (RLS), sauvegardes regulieres.
            </p>
          </section>

          <section>
            <h3 class="mb-2 font-semibold text-stone-900">9. Contact DPO</h3>
            <p>
              Pour toute question relative a la protection de vos donnees, vous pouvez contacter
              notre Delegue a la Protection des Donnees a l'adresse :
              <a href="mailto:dpo@apiculture360.fr" class="text-amber-600 hover:underline"
                >dpo@apiculture360.fr</a
              >.
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
  title: 'Politique de confidentialite — Apiculture 360°',
});
</script>
