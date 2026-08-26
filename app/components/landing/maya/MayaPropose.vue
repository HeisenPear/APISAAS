<!--
  Chapitre 02 — « Elle propose ».

  Le cœur de l'argument : la différence avec un chatbot n'est pas le ton, c'est
  l'initiative. La chaîne observe → déduit → propose → vous décidez est la vraie
  séquence du produit, et la dernière marche n'est pas décorative :
  `server/api/ia/copilote.post.ts` prévisualise avant d'écrire, toujours.

  La carte reprend le codage de la maquette, et il porte du sens :
   · une ÉPINE honey de 3 px en tête — la même que sur MayaCard dans le produit,
     c'est ce qui signe « ceci vient de Maya » ;
   · l'urgence est en ROUGE (#B54545 sur #FBEEEE), pas en miel. Le miel est la
     couleur de Maya ; le rouge est celle du risque. Les confondre reviendrait à
     dire que tout ce qu'elle propose est urgent, donc que rien ne l'est ;
   · le coût d'inaction a son propre encart rouge : c'est l'information qui fait
     décider, elle ne peut pas être une ligne de plus.
-->
<template>
  <LandingMayaChapitre numero="02" intitule="Elle propose" ancre="propose">
    <template #titre>Un chatbot répond.{{ ' ' }}<br />Maya propose.</template>
    <template #chapo>
      La différence n’est pas dans le ton, elle est dans l’initiative. Personne n’a rien demandé :
      Maya a vu, elle a déduit, elle propose un geste daté — et elle s’arrête là.
    </template>

    <div class="grid items-center gap-10 md:grid-cols-[0.88fr_1.12fr] md:gap-[60px]">
      <!-- La chaîne : quatre lignes séparées par des filets, pas une frise -->
      <div>
        <p
          class="mb-1 text-[11.5px] font-bold uppercase tracking-[0.1em]"
          style="color: var(--honey-deep)"
        >
          La séquence, à chaque fois
        </p>

        <!-- ⚠️ LES MARCHES SONT DES BOUTONS, ET CE N'EST PAS UN ORNEMENT.
             Ce chapitre était le seul de la page où l'on ne pouvait RIEN faire
             qu'y passer. Or la colonne de gauche et la carte de droite disent
             la même chose deux fois : les trois premières marches SONT les trois
             lignes de la carte. Les relier montre l'argument au lieu de le
             répéter — et la quatrième désigne les boutons, c'est-à-dire vous. -->
        <ol>
          <li v-for="(e, i) in etapes" :key="e.cle">
            <button
              type="button"
              class="etape"
              :class="{ 'etape-active': actif === e.cle }"
              :aria-pressed="actif === e.cle"
              @click="actif = actif === e.cle ? null : e.cle"
            >
              <span class="etape-num" :class="{ 'etape-num-fin': i === etapes.length - 1 }">
                {{ i + 1 }}
              </span>
              <span class="block text-left">
                <span
                  class="block text-[11.5px] font-bold uppercase tracking-[0.1em]"
                  style="color: var(--honey-deep)"
                >
                  {{ e.cle }}
                </span>
                <span
                  class="mt-1 block text-[13.5px] leading-relaxed"
                  style="color: var(--text-secondary)"
                >
                  {{ e.detail }}
                </span>
              </span>
            </button>
          </li>
        </ol>
      </div>

      <!-- La proposition, telle qu'elle arrive -->
      <div class="carte">
        <span class="epine" aria-hidden="true" />

        <div class="carte-entete">
          <IaMayaMark :size="34" state="alert" />
          <div class="min-w-0 flex-1">
            <p class="text-[13.5px] font-semibold" style="color: var(--text-primary)">Maya</p>
            <p class="text-[11.5px]" style="color: var(--text-tertiary)">
              Sans qu’on lui demande · 06 h 58
            </p>
          </div>
          <span class="badge-urgent">Priorité</span>
        </div>

        <div class="px-[22px] pb-[18px]">
          <p class="text-[15.5px] font-semibold" style="color: var(--text-primary)">
            Ruche 07 · Les Tilleuls
          </p>
          <p class="text-[11.5px]" style="color: var(--text-tertiary)">
            Buckfast · reine 2023 · colonie forte
          </p>
        </div>

        <dl class="carte-lecture">
          <div
            v-for="l in lecture"
            :key="l.cle"
            class="lecture-ligne"
            :class="{ 'lecture-visee': actif === l.cle }"
          >
            <dt
              class="text-[11.5px] font-bold uppercase tracking-[0.1em]"
              style="color: var(--honey-deep)"
            >
              {{ l.cle }}
            </dt>
            <!-- « Je propose » est le point d'arrivée de la carte : c'est le
                 geste daté, la seule ligne qu'on retient. Elle était au même
                 corps que les deux constats qui la précèdent. -->
            <dd
              class="mt-1 leading-relaxed"
              :class="l.fort ? 'text-[15.5px] font-semibold' : 'text-[13.5px]'"
              :style="{ color: l.fort ? 'var(--text-primary)' : 'var(--text-secondary)' }"
            >
              {{ l.texte }}
              <span v-if="l.regle" class="jeton">{{ l.regle }}</span>
            </dd>
          </div>
        </dl>

        <!-- Le coût d'inaction : c'est lui qui fait décider -->
        <div class="consequence">
          <UIcon
            name="i-lucide-triangle-alert"
            class="mt-0.5 h-4 w-4 shrink-0"
            style="color: #b54545"
            aria-hidden="true"
          />
          <!-- ⚠️ CETTE PHRASE CHIFFRAIT UNE PERTE QUE LE PRODUIT NE CALCULE PAS.
               Elle annonçait « −1 colonie et environ 18 kg de miel ». Or
               `server/utils/maya-consequences.ts` est QUALITATIF par
               construction, et son propre banc interdit d'affirmer qu'une chose
               VA arriver — on ne dit qu'une conséquence PROBABLE. Aucun kilo
               perdu n'est calculé nulle part dans le dépôt. La maquette
               promettait donc une précision que Maya ne saura jamais tenir, sur
               l'écran même où elle demande la confiance de l'apiculteur.
               La formulation reprend maintenant le registre réel du moteur. -->
          <p class="text-[13.5px] leading-relaxed" style="color: #7a3a3a">
            Si rien n’est fait : <strong>la colonie peut partir</strong>, et emporter une bonne part
            des butineuses.
          </p>
        </div>

        <!-- ⚠️ CES BOUTONS N'EXISTAIENT PAS. La maquette proposait
             « Planifier demain » / « Modifier » / « Plus tard » : trois gestes
             dont AUCUN n'est offert par le produit, et le premier promettait
             même une fonction absente (planifier une action à une date).
             `app/components/ia/CopiloteMessage.vue` n'a que deux boutons quand
             Maya attend un accord — « Confirmer » (fond noir #1C1C1E, icône
             check) et « Annuler » — plus « Confirmer tout » / « Tout annuler »
             pour un lot. Rien d'autre. Un visiteur venu pour « Planifier
             demain » ne le trouvera jamais. -->
        <div class="carte-actions" :class="{ 'carte-actions-visee': actif === 'Vous décidez' }">
          <span class="act-primaire">
            <UIcon name="i-lucide-check" class="h-4 w-4" aria-hidden="true" />
            Confirmer
          </span>
          <span class="act-secondaire">Annuler</span>
        </div>
      </div>
    </div>

    <p class="mt-6 text-center text-[11.5px]" style="color: var(--text-tertiary)">
      Exemple. Rien ne part en base tant que vous n’avez pas choisi.
    </p>
  </LandingMayaChapitre>
</template>

<script setup lang="ts">
/** La marche montrée du doigt. `null` = la carte se lit d'un bloc, comme avant. */
const actif = ref<string | null>(null);

const etapes = [
  {
    cle: 'J’observe',
    detail: 'Les faits bruts de vos visites et de vos capteurs, sans interprétation.',
  },
  { cle: 'Je déduis', detail: 'Une règle apicole, nommée, avec sa source. Jamais une intuition.' },
  { cle: 'Je propose', detail: 'Un geste concret, une date, une quantité. Prêt à enregistrer.' },
  {
    cle: 'Vous décidez',
    detail: 'Rien ne s’écrit sans votre geste. Elle ne touche pas à vos données seule.',
  },
];

const lecture = [
  { cle: 'J’observe', texte: '3 cellules royales à la visite du 12 mai. Hausse pleine à 82 %.' },
  {
    cle: 'Je déduis',
    texte: 'Essaimage probable entre le 20 et le 24 mai.',
    regle: 'règle essaimage · J+9',
  },
  {
    cle: 'Je propose',
    texte: 'Diviser sur 2 cadres de couvain operculé, demain matin, avant 11 h.',
    fort: true,
  },
];
</script>

<style scoped>
.etape {
  display: flex;
  width: 100%;
  gap: 16px;
  padding: 16px 4px;
  border: 0;
  border-bottom: 1px solid rgba(214, 211, 209, 0.6);
  background: none;
  text-align: left;
  cursor: pointer;
  border-radius: 10px;
  transition: background-color 180ms ease;
}
li:last-child .etape {
  border-bottom: 0;
}
.etape:hover,
.etape-active {
  background: var(--honey-soft);
}
.etape:focus-visible {
  outline: 2px solid var(--honey);
  outline-offset: 2px;
}
.etape-num {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  font-size: 11.5px;
  font-weight: 700;
  background: var(--honey-soft);
  color: var(--honey-deep);
}
/* La dernière marche est celle de l'apiculteur : elle prend la couleur pleine. */
.etape-num-fin {
  background: var(--honey);
  color: #fff;
}

.carte {
  position: relative;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(214, 211, 209, 0.6);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(40, 30, 20, 0.1);
}
/* L'épine : la signature de Maya, reprise de MayaCard dans le produit. */
.epine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--honey);
}

.carte-entete {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 19px 22px 15px;
}

/* Rouge, pas miel : le miel est la couleur de Maya, le rouge celle du risque. */
.badge-urgent {
  flex-shrink: 0;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #b54545;
  background: #fbeeee;
  padding: 5px 10px;
  border-radius: 9999px;
}

.carte-lecture {
  border-top: 1px solid rgba(214, 211, 209, 0.6);
  padding: 17px 22px;
  display: grid;
  gap: 14px;
}

/* La ligne visée s'ÉCLAIRE ; les autres ne s'éteignent pas. Baisser le contraste
   des voisines serait la façon la plus simple de rendre la carte illisible pour
   ceux qui en ont le plus besoin. */
.lecture-ligne {
  margin: -6px -10px;
  padding: 6px 10px;
  border-radius: 10px;
  transition: background-color 200ms ease;
}
.lecture-visee {
  background: var(--honey-soft);
  box-shadow: inset 3px 0 0 var(--honey);
}

.carte-actions-visee {
  box-shadow: inset 3px 0 0 var(--honey);
}

.jeton {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 600;
  color: #7d5220;
  background: #f9efe3;
  padding: 2px 8px;
  border-radius: 9999px;
  margin-left: 6px;
  white-space: nowrap;
}

.consequence {
  margin: 0 22px 18px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #fbeeee;
  border: 1px solid rgba(181, 69, 69, 0.2);
  display: flex;
  gap: 11px;
  align-items: flex-start;
}

.carte-actions {
  border-top: 1px solid rgba(214, 211, 209, 0.6);
  background: #fdfbf6;
  padding: 15px 22px;
  display: flex;
  gap: 9px;
  flex-wrap: wrap;
}
.act-primaire,
.act-secondaire {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13.5px;
  border-radius: 11px;
}
/* Le vrai bouton de confirmation est NOIR, pas miel : le miel signe Maya, le
   noir signe « c'est vous qui appuyez ». Voir CopiloteMessage.vue. */
.act-primaire {
  background: #1c1c1e;
  color: #fff;
  font-weight: 600;
  padding: 10px 18px;
}
.act-secondaire {
  background: #fff;
  border: 1px solid rgba(214, 211, 209, 0.6);
  color: #706963;
  font-weight: 500;
  padding: 10px 16px;
}
</style>
