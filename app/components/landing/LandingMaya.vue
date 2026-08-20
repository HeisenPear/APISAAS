<!--
  LandingMaya — la section « 01 · Maya » de la page d'accueil.

  Elle ne raconte PAS tout Maya : c'est une accroche qui mène à `/maya`, où les
  six chapitres tiennent le discours. La landing garde son rôle — présenter
  APIGO — et Maya y prend la place d'un cœur, pas d'un chapitre de plus.

  Trois partis pris de mise en page :

   · FOND SOMBRE. C'est la seule section sombre de la landing. Sur une page qui
     déroule des blocs clairs, le noir agit comme un silence : on s'arrête, on
     regarde. Le contraste fait le travail qu'une bordure ne ferait pas.

   · LA MARK D'ABORD, À GRANDE TAILLE. 260 px, halo posé derrière. Elle est
     l'argument autant que le texte — un copilote qu'on présente doit d'abord
     avoir un visage.

   · TROIS PREUVES, PAS UNE LISTE. Chacune renvoie à un chapitre de /maya. On
     annonce ce qu'on saura tenir, et on dit où aller le vérifier.
-->
<template>
  <section id="maya" class="sect-maya">
    <!-- Deux nappes lumineuses, l'une derrière la mark, l'autre en fuite. -->
    <div class="nappe nappe-a" aria-hidden="true" />
    <div class="nappe nappe-b" aria-hidden="true" />

    <div class="relative mx-auto max-w-6xl px-5 sm:px-6">
      <div class="grid items-center gap-14 md:grid-cols-[1.08fr_1fr] md:gap-20">
        <!-- Colonne texte -->
        <div>
          <div v-reveal class="mb-6 flex items-center gap-3">
            <span
              class="text-[11px] font-semibold tabular-nums"
              style="color: rgba(255, 255, 255, 0.4)"
            >
              01
            </span>
            <span
              class="h-px w-7"
              style="background: rgba(255, 255, 255, 0.22)"
              aria-hidden="true"
            />
            <span class="eyebrow">Maya</span>
            <span class="pastille-neuve">Nouveau</span>
          </div>

          <h2 v-reveal="80" class="titre-maya">
            Le nouveau cœur d’APIGO<br class="hidden sm:block" />
            s’appelle <span class="mot-honey">Maya</span>.
          </h2>

          <p v-reveal="160" class="chapo-maya">
            Elle ne range pas vos données, elle les lit. Toute la nuit, elle repère ce qui menace
            une colonie — et au réveil, elle vous dit par où commencer.
          </p>

          <ul v-reveal.cascade class="mt-9 space-y-0">
            <li v-for="p in preuves" :key="p.texte" class="preuve">
              <UIcon :name="p.icone" class="preuve-icone" aria-hidden="true" />
              <span class="preuve-texte">{{ p.texte }}</span>
            </li>
          </ul>

          <div v-reveal="240" class="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
            <NuxtLink to="/maya" class="cta-maya">
              Découvrir Maya
              <UIcon name="i-lucide-arrow-right" class="h-4 w-4" aria-hidden="true" />
            </NuxtLink>
            <p class="text-[12.5px]" style="color: rgba(255, 255, 255, 0.45)">
              Ce qu’elle surveille, ce qu’elle propose,<br class="hidden sm:block" />
              ce qu’elle ne fera jamais.
            </p>
          </div>
        </div>

        <!-- Colonne mark -->
        <div v-reveal="120" class="flex flex-col items-center gap-5">
          <div class="scene">
            <span class="anneau anneau-1" aria-hidden="true" />
            <span class="anneau anneau-2" aria-hidden="true" />
            <IaMayaMark :size="260" glow interactif state="idle" />
          </div>
          <p class="text-center text-[12px]" style="color: rgba(255, 255, 255, 0.38)">
            Approchez le curseur — les alvéoles suivent
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * Trois promesses, et pas une de plus que ce que le produit tient. Chacune est
 * développée — avec ses limites — dans un chapitre de `/maya` :
 *   veille  → heures calmes 21 h–8 h, anti-rafale, résumé (server/utils/alertesPush.ts)
 *   règles  → seuils ITSAP, aucun appel LLM  (server/utils/santeScore.ts)
 *   accord  → rien ne s'écrit sans confirmation (server/api/ia/copilote.post.ts)
 */
const preuves = [
  {
    icone: 'i-lucide-moon',
    texte: 'Elle veille la nuit et ne vous réveille que pour ce qui compte.',
  },
  {
    icone: 'i-lucide-ruler',
    texte: 'Elle suit des règles apicoles nommées — jamais une intuition.',
  },
  {
    icone: 'i-lucide-hand',
    texte: 'Elle prépare, vous confirmez. Rien ne s’écrit sans votre geste.',
  },
];
</script>

<style scoped>
.sect-maya {
  position: relative;
  overflow: hidden;
  background: #17171a;
  padding: 96px 0;
}
@media (min-width: 768px) {
  .sect-maya {
    padding: 150px 0;
  }
}

/* Nappes : elles donnent la profondeur sans qu'on puisse les nommer. Aucune
   animation — le seul mouvement de la section doit venir de la mark. */
.nappe {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(10px);
}
.nappe-a {
  top: -18%;
  right: -6%;
  width: 620px;
  height: 620px;
  background: radial-gradient(circle, rgba(230, 152, 44, 0.2), transparent 62%);
}
.nappe-b {
  bottom: -30%;
  left: -12%;
  width: 520px;
  height: 520px;
  background: radial-gradient(circle, rgba(230, 152, 44, 0.09), transparent 66%);
}

.eyebrow {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #f0b454;
}
.pastille-neuve {
  border-radius: 999px;
  border: 1px solid rgba(240, 180, 84, 0.38);
  padding: 3px 9px;
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #f0b454;
}

/* Grande chasse, interlignage serré, tracking négatif : la signature d'un titre
   de page produit. En dessous de 1,04 d'interlignage les accents se touchent. */
.titre-maya {
  font-size: clamp(30px, 5.2vw, 52px);
  font-weight: 700;
  line-height: 1.06;
  letter-spacing: -0.035em;
  color: #fff;
}
.mot-honey {
  color: #f0b454;
}

.chapo-maya {
  margin-top: 22px;
  max-width: 480px;
  font-size: clamp(15px, 1.5vw, 17.5px);
  line-height: 1.62;
  color: rgba(255, 255, 255, 0.62);
}

/* Les preuves sont séparées par des filets, pas par des puces : on lit trois
   lignes d'un même registre, pas une énumération. */
.preuve {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 15px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.preuve:last-child {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.preuve-icone {
  margin-top: 1px;
  height: 17px;
  width: 17px;
  flex-shrink: 0;
  color: #f0b454;
}
.preuve-texte {
  font-size: 14.5px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.76);
}

.cta-maya {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  border-radius: 999px;
  background: var(--honey);
  padding: 13px 24px;
  font-size: 14.5px;
  font-weight: 600;
  color: #1c1c1e;
  transition:
    transform 260ms var(--ease-out-expo),
    box-shadow 260ms var(--ease-out-expo);
}
.cta-maya:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(230, 152, 44, 0.32);
}
.cta-maya:focus-visible {
  outline: 2px solid #f0b454;
  outline-offset: 3px;
}

.scene {
  position: relative;
  display: grid;
  place-items: center;
  padding: 30px;
}
/* Deux anneaux concentriques très pâles : ils donnent une échelle à la mark et
   un centre à la composition. Statiques — cf. la note sur les nappes. */
.anneau {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.07);
  pointer-events: none;
}
.anneau-1 {
  inset: -10px;
}
.anneau-2 {
  inset: -58px;
  border-color: rgba(255, 255, 255, 0.045);
}
</style>
