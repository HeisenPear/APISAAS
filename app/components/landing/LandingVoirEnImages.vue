<!--
  LandingVoirEnImages — ce qui reste, sur la page d'accueil, de la section
  « En images ».

  ─── CE QUI S'EST PASSÉ ────────────────────────────────────────────────────
  Les quatre écrans du produit vivaient ICI, en quatre pavés alternés. Ils sont
  partis dans /maya, où ils forment maintenant l'acte II. Deux raisons, et la
  seconde est la vraie :

   1. sur la page d'accueil ils arrivaient au quatorzième écran de défilement,
      c'est-à-dire pour les rares qui descendaient jusque-là ;
   2. les GARDER ICI ET LÀ aurait fait deux copies des mêmes maquettes, avec les
      mêmes promesses commerciales à l'intérieur. Ce dépôt a déjà payé pour
      savoir ce que deviennent deux copies d'une même vérité : le jour où l'une
      dit « Factur-X inclus » pendant que l'autre dit « dès Starter », c'est le
      client qui arbitre.

  ⚠️ MAIS ON NE LAISSE PAS UN TROU. La page d'accueil est la page de
  conversion : elle ne peut pas passer des promesses aux tarifs sans avoir
  montré un seul écran. Cette bande montre donc UN écran — un seul, celui de
  Maya, parce que c'est là qu'elle mène — et emmène voir les autres. Une preuve
  visuelle, pas un quatrième pavé.

  L'écran vient de `EcranApigo`, le même composant que l'acte II : il n'y a
  toujours qu'une seule maquette de la conversation dans tout le dépôt.
-->
<template>
  <section class="bande">
    <div class="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-2 lg:gap-16">
      <div>
        <p class="surtitre">En images</p>
        <h2 v-reveal class="titre">Ce que ça donne,{{ ' ' }}<span class="mot">vraiment.</span></h2>
        <p v-reveal="140" class="texte">
          Pas de promesse en l’air : quatre écrans du produit, dont deux où Maya travaille avec vous
          et deux où elle s’efface. Elle vous les montre elle-même.
        </p>
        <div v-reveal="240" class="mt-8">
          <NuxtLink to="/maya#en-images" class="cta">
            Voir le produit en images
            <UIcon name="i-lucide-arrow-right" class="h-4 w-4" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>

      <div v-reveal="120" class="scene">
        <span class="lueur" aria-hidden="true" />
        <LandingMayaEcranApigo id="maya" />
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Sombre, comme l'acte qu'elle annonce : la bande donne un avant-goût du
   changement de lumière, et l'écran clair s'y allume comme un appareil. */
.bande {
  background: #17150f;
  padding: 72px 0;
}
@media (min-width: 640px) {
  .bande {
    padding: 96px 0;
  }
}

.surtitre {
  margin-bottom: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #f0b454;
}
.titre {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.025em;
  color: #fff;
}
@media (min-width: 640px) {
  .titre {
    font-size: 38px;
  }
}
.mot {
  color: #f0b454;
}
.texte {
  margin-top: 16px;
  max-width: 32em;
  font-size: 15px;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.68);
}
@media (min-width: 640px) {
  .texte {
    font-size: 16.5px;
  }
}

.cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 11px;
  background: var(--honey);
  padding: 13px 22px;
  font-size: 14.5px;
  font-weight: 600;
  color: #fff;
  transition:
    transform var(--duration-base) var(--ease-out-expo),
    box-shadow var(--duration-base) var(--ease-out-expo);
}
.cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(245, 166, 35, 0.28);
}

.scene {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lueur {
  position: absolute;
  height: 380px;
  width: 380px;
  border-radius: 9999px;
  background: radial-gradient(circle, rgba(245, 166, 35, 0.16), transparent 66%);
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .cta:hover {
    transform: none;
  }
}
</style>
