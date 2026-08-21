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
  est incluse dans l'ESSAI — 60 jours de Pro, cf. `app/pages/activer-essai.vue` —
  puis à partir de Starter. « Essayer Maya gratuitement » est donc exact ;
  « incluse dès le plan gratuit » ne l'est pas. Ne pas rétablir la formulation
  d'origine sans avoir d'abord ouvert copiloteIa au plan Découverte.

  ⚠️ ET L'ESSAI DEMANDE UNE CARTE. `server/api/stripe/trial-checkout.post.ts`
  pose `payment_method_collection: 'always'` : le parcours passe par Stripe et
  la carte est TOUJOURS collectée, même si 0 € est débité. J'avais écrit ici
  « 60 jours de Pro sans carte bancaire » — faux, et faux sur le seul sujet où
  un visiteur ne pardonne pas : il clique, découvre un formulaire de carte, et
  s'en va. Le reste du site dit juste : « sans carte » s'attache au plan
  DÉCOUVERTE (tarifs.vue, faq.vue, conformite), jamais à l'essai.
-->
<template>
  <div>
    <LandingMayaNav />
    <main>
      <!-- Ouverture : Maya parle la première. C'est tout le propos de la page. -->
      <section class="hero">
        <div class="hero-lueur" aria-hidden="true" />
        <div class="hero-grain" aria-hidden="true" />

        <div class="relative mx-auto max-w-5xl px-5 sm:px-6">
          <div class="grid items-center gap-12 md:grid-cols-[1.25fr_1fr] md:gap-16">
            <div>
              <div class="hero-eyebrow">
                <IaMayaMark :size="26" state="idle" />
                <span>Copilote apicole</span>
              </div>

              <h1 class="hero-titre">
                <span v-reveal.cascade class="rev-ligne"><span>Cette nuit,</span></span>
                <span v-reveal.cascade="110" class="rev-ligne"><span>j’ai veillé sur</span></span>
                <span v-reveal.cascade="220" class="rev-ligne"
                  ><span>vos <span class="mot-honey">colonies</span>.</span></span
                >
              </h1>

              <p v-reveal="360" class="hero-chapo">
                Deux demandent votre attention ce matin. Je vous dis lesquelles, pourquoi, et ce que
                je ferais — vous décidez. C’est tout le métier de Maya.
              </p>

              <div v-reveal="460" class="mt-10 flex flex-wrap items-center gap-3">
                <NuxtLink to="/register" class="hero-cta">
                  Essayer Maya gratuitement
                  <UIcon name="i-lucide-arrow-right" class="h-4 w-4" aria-hidden="true" />
                </NuxtLink>
                <a href="#veille" class="hero-lien">
                  Voir sa nuit
                  <UIcon name="i-lucide-arrow-down" class="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            <!-- La mark, grande et vivante : elle EST le sujet de la page. -->
            <div v-parallaxe="70" class="hero-scene">
              <span class="hero-anneau hero-anneau-1" aria-hidden="true" />
              <span class="hero-anneau hero-anneau-2" aria-hidden="true" />
              <IaMayaMark :size="230" glow interactif state="idle" />
            </div>
          </div>

          <!-- Trois repères, tous vérifiables dans le produit. -->
          <dl v-reveal.cascade="560" class="hero-reperes">
            <div v-for="r in reperes" :key="r.libelle">
              <dt class="hero-repere-val">{{ r.valeur }}</dt>
              <dd class="hero-repere-lib">{{ r.libelle }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <LandingMayaVeille />
      <LandingMayaPropose />
      <LandingMayaRaisonne />
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
            Elle est incluse dans l’essai — 60 jours de Pro, 0 € débité aujourd’hui, carte demandée
            pour la suite et résiliable en un clic — puis à partir du plan Starter, à
            {{ prixStarter }} par mois. Créez votre rucher ce soir : elle aura veillé avant votre
            réveil.
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

/**
 * Ces trois lignes sont des ENGAGEMENTS, pas des arguments. Chacune est
 * vérifiable ailleurs dans le produit, et deux d'entre elles ont dû être
 * réécrites après vérification :
 *
 *  · l'essai demande une carte (payment_method_collection: 'always') ;
 *  · « données hébergées en UE » était trop large. La base l'est bien —
 *    Supabase, Francfort — mais Vercel, Stripe, Resend et Sentry sont aux
 *    États-Unis sous CCT, comme le dit la politique de confidentialité. On
 *    nomme donc ce qui est vrai : la base, là où vivent les données de
 *    l'apiculteur.
 */
const garanties = [
  '60 jours de Pro — 0 € débité aujourd’hui',
  'Vos données en Europe — Supabase, Francfort',
  'Vous gardez la main sur toutes les écritures',
];

useSeoPage({
  title: 'Maya — le copilote apicole d’APIGO',
  description:
    'Maya veille sur vos colonies la nuit et vous dit par où commencer le matin. Règles apicoles nommées, aucun appel à un modèle de langage, aucune écriture sans votre accord.',
  path: '/maya',
});
</script>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  background: #17171a;
  padding: 92px 0 76px;
}
@media (min-width: 768px) {
  .hero {
    padding: 132px 0 104px;
  }
}

.hero-lueur {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(78% 62% at 12% -12%, rgba(245, 166, 35, 0.3), transparent 60%);
}
/* Un grain très fin : sur un aplat sombre aussi large, une surface parfaitement
   lisse se lit comme un défaut d'écran. Le bruit lui rend une matière. */
.hero-grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.28;
  background-image: radial-gradient(rgba(255, 255, 255, 0.055) 1px, transparent 1px);
  background-size: 3px 3px;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 11.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #f0b454;
}

.hero-titre {
  margin-top: 26px;
  font-size: clamp(34px, 6vw, 62px);
  font-weight: 700;
  line-height: 1.03;
  letter-spacing: -0.042em;
  color: #fff;
}
.mot-honey {
  color: #f0b454;
}

.hero-chapo {
  margin-top: 26px;
  max-width: 480px;
  font-size: clamp(15.5px, 1.6vw, 18px);
  line-height: 1.62;
  color: rgba(255, 255, 255, 0.62);
  text-wrap: pretty;
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  border-radius: 999px;
  background: var(--honey);
  padding: 14px 26px;
  font-size: 15px;
  font-weight: 600;
  color: #1c1c1e;
  transition:
    transform 260ms var(--ease-out-expo),
    box-shadow 260ms var(--ease-out-expo);
}
.hero-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 34px rgba(230, 152, 44, 0.34);
}
.hero-cta:focus-visible {
  outline: 2px solid #f0b454;
  outline-offset: 3px;
}

.hero-lien {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 14px 18px;
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.72);
  transition: color 200ms var(--ease-out-expo);
}
.hero-lien:hover {
  color: #fff;
}

.hero-scene {
  position: relative;
  display: grid;
  place-items: center;
  padding: 24px;
}
.hero-anneau {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.07);
  pointer-events: none;
}
.hero-anneau-1 {
  inset: -8px;
}
.hero-anneau-2 {
  inset: -52px;
  border-color: rgba(255, 255, 255, 0.04);
}

.hero-reperes {
  margin-top: 64px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  max-width: 620px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  padding-top: 30px;
}
.hero-repere-val {
  font-size: clamp(20px, 2.4vw, 26px);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
  color: #f5a623;
}
.hero-repere-lib {
  margin-top: 4px;
  font-size: 11.5px;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.45);
}
</style>
