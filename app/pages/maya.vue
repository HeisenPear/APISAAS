<!--
  /maya — la page dédiée au copilote.

  La landing pose l'accroche ; ici on tient le discours en six chapitres :
  elle veille · elle propose · elle réagit · elle anticipe · elle vous parle ·
  ses limites. Le dernier n'est pas une précaution rhétorique — c'est celui qui
  rend les cinq autres croyables.

  ⚠️ HONNÊTETÉ COMMERCIALE. La maquette d'origine annonçait « Maya est incluse
  dès le plan gratuit » et un badge « Incluse dès Découverte ». C'est FAUX :
  `copiloteIa` vaut false sur `decouverte` (app/config/plans.ts) et la route
  POST /api/ia/copilote est gatée dessus. Un visiteur qui s'inscrirait en
  gratuit pour Maya ne l'aurait pas.

  La page dit donc le vrai, et il se trouve être meilleur que la maquette : Maya
  est incluse dans l'ESSAI — 60 jours de Pro sans carte bancaire, cf.
  `app/pages/activer-essai.vue` — puis à partir de Starter. « Essayer Maya
  gratuitement » est donc exact ; « incluse dès le plan gratuit » ne l'est pas.
  Ne pas rétablir la formulation d'origine sans avoir d'abord ouvert copiloteIa
  au plan Découverte.
-->
<template>
  <div>
    <LandingMayaNav />
    <main>
      <!-- Ouverture : Maya parle la première. C'est tout le propos de la page. -->
      <section class="relative overflow-hidden" style="background: #1a1a1c">
        <div
          class="pointer-events-none absolute inset-0"
          style="
            background: radial-gradient(
              90% 70% at 15% -10%,
              rgba(245, 166, 35, 0.34),
              transparent 58%
            );
          "
          aria-hidden="true"
        />
        <div class="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28 md:py-32">
          <div class="flex items-center gap-3">
            <IaMayaMark :size="34" glow state="idle" />
            <span
              class="text-[11.5px] font-semibold uppercase tracking-[0.12em]"
              style="color: #f0b454"
            >
              Copilote apicole
            </span>
          </div>

          <h1
            class="mt-6 max-w-3xl text-[34px] font-bold leading-[1.06] tracking-[-0.04em] text-white sm:text-[46px] md:text-[56px]"
          >
            Cette nuit, j’ai veillé<br class="hidden sm:block" />
            sur vos <span style="color: #f0b454">colonies</span>.
          </h1>

          <p
            class="mt-6 max-w-[520px] text-[15.5px] leading-[1.6] sm:text-[17.5px]"
            style="color: rgba(255, 255, 255, 0.62); text-wrap: pretty"
          >
            Deux demandent votre attention ce matin. Je vous dis lesquelles, pourquoi, et ce que je
            ferais — vous décidez. C’est tout le métier de Maya.
          </p>

          <div class="mt-9 flex flex-wrap items-center gap-3">
            <UButton to="/register" size="lg" color="primary">Essayer Maya gratuitement</UButton>
            <UButton
              to="#veille"
              size="lg"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-arrow-down"
            >
              Voir sa nuit
            </UButton>
          </div>

          <!-- Trois repères, tous vérifiables dans le produit. -->
          <dl
            class="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t pt-8"
            style="border-color: rgba(255, 255, 255, 0.14)"
          >
            <div v-for="r in reperes" :key="r.libelle">
              <dt
                class="text-[22px] font-bold tabular-nums"
                style="color: #f5a623; letter-spacing: -0.03em"
              >
                {{ r.valeur }}
              </dt>
              <dd
                class="mt-0.5 text-[11.5px] leading-snug"
                style="color: rgba(255, 255, 255, 0.45)"
              >
                {{ r.libelle }}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <LandingMayaVeille />
      <LandingMayaPropose />
      <LandingMayaReagit />
      <LandingMayaAnticipe />
      <LandingMayaParle />
      <LandingMayaLimites />

      <!-- Sortie -->
      <section class="py-16 sm:py-24" style="background: var(--surface-muted)">
        <div class="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2
            class="text-[27px] font-bold leading-tight tracking-[-0.025em] sm:text-[34px]"
            style="color: var(--text-primary)"
          >
            Demain matin, elle vous dira<br class="hidden sm:block" />
            par où commencer.
          </h2>
          <p
            class="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed sm:text-[16.5px]"
            style="color: var(--text-secondary)"
          >
            Elle est incluse dans l’essai — 60 jours de Pro, sans carte bancaire — puis à partir du
            plan Starter, à {{ prixStarter }} par mois. Créez votre rucher ce soir : elle aura
            veillé avant votre réveil.
          </p>

          <div class="mt-8 flex flex-wrap justify-center gap-3">
            <UButton to="/register" size="lg" color="primary">Commencer l’essai</UButton>
            <UButton to="/tarifs" size="lg" color="neutral" variant="outline"
              >Voir les tarifs</UButton
            >
          </div>

          <ul
            class="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[12.5px]"
            style="color: var(--text-tertiary)"
          >
            <li v-for="g in garanties" :key="g" class="flex items-center gap-1.5">
              <UIcon name="i-lucide-check" class="h-3.5 w-3.5" aria-hidden="true" />
              {{ g }}
            </li>
          </ul>
        </div>
      </section>
    </main>
    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
import { PLAN_CONFIGS } from '~/config/plans';

definePageMeta({ layout: false });

/**
 * Le prix vient du catalogue, jamais d'une chaîne écrite ici. Les prix en dur
 * dans une page ont déjà dérivé une fois dans ce dépôt (ScenePlan.vue) — c'est
 * exactement le genre d'écart qui se voit seulement sur la facture du client.
 */
const prixStarter = computed(() => {
  const p = PLAN_CONFIGS.starter.prix;
  return p ? `${p.mois.toFixed(2).replace('.', ',')} €` : 'un plan payant';
});

const reperes = [
  { valeur: '6', libelle: 'familles de règles en veille' },
  { valeur: '21 h → 8 h', libelle: 'heures calmes respectées' },
  { valeur: '0', libelle: 'appel à un modèle de langage' },
];

const garanties = [
  '60 jours de Pro, sans carte bancaire',
  'Données hébergées en UE',
  'Vous gardez la main sur toutes les écritures',
];

useSeoPage({
  title: 'Maya — le copilote apicole d’APIGO',
  description:
    'Maya veille sur vos colonies la nuit et vous dit par où commencer le matin. Règles apicoles nommées, aucun appel à un modèle de langage, aucune écriture sans votre accord.',
  path: '/maya',
});
</script>
