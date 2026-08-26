<!--
  Chapitre 05 — « Elle vous parle ».

  L'autre sens de la conversation : ce n'est plus elle qui ouvre, c'est vous.

  Le fil se JOUE au lieu de s'afficher — les bulles arrivent l'une après l'autre,
  comme dans l'application. C'est la seule façon de montrer que Maya répond en
  préparant un formulaire, et non en récitant un paragraphe. Il démarre quand la
  section entre à l'écran (jouer un fil que personne ne regarde, c'est le gâcher)
  et se rejoue à la demande.

  `maya-msg-in` vient du bloc MAYA de `main.css` : c'est la même entrée de bulle
  que dans la vraie fenêtre de Maya.
-->
<template>
  <LandingMayaChapitre numero="05" intitule="Elle vous parle" ancre="parle">
    <template #titre>Comme un collègue,{{ ' ' }}<br />les mains dans la ruche.</template>
    <template #chapo>
      Vous pouvez aussi lui parler le premier. À l’écrit ou à la voix, sans formuler de requête :
      dites la visite, elle remplit le formulaire et vous le montre avant d’enregistrer.
    </template>

    <div class="grid gap-8 md:grid-cols-[1fr_420px] md:gap-12">
      <!-- Les trois moyens -->
      <div class="flex flex-col justify-center gap-4">
        <!-- ⚠️ TROIS CARTES IDENTIQUES ARRIVAIENT SANS TITRE DE COLONNE, en face
             d'un fil de discussion qui, lui, s'annonce. L'œil n'avait aucun
             point d'entrée à gauche, et rien ne disait que ces trois-là sont
             une LISTE — d'où le numéro : il donne un ordre de lecture sans
             prétendre à une hiérarchie qui n'existe pas (les trois moyens sont
             bel et bien parallèles). -->
        <p
          class="text-[11.5px] font-bold uppercase tracking-[0.1em]"
          style="color: var(--honey-deep)"
        >
          Trois façons de lui parler
        </p>

        <div
          v-for="(m, i) in moyens"
          :key="m.titre"
          class="rounded-[16px] border p-5"
          style="border-color: var(--border-default); background: white"
        >
          <div class="flex items-center gap-2.5">
            <span class="moyen-num">{{ String(i + 1).padStart(2, '0') }}</span>
            <UIcon
              :name="m.icone"
              class="h-5 w-5 shrink-0"
              style="color: var(--honey-deep)"
              aria-hidden="true"
            />
            <p class="text-[15px] font-semibold" style="color: var(--text-primary)">
              {{ m.titre }}
            </p>
          </div>
          <p class="mt-1.5 text-[13.5px] leading-relaxed" style="color: var(--text-secondary)">
            {{ m.detail }}
          </p>
        </div>

        <p class="mt-1 flex items-center gap-2 text-[11.5px]" style="color: var(--text-tertiary)">
          <UIcon name="i-lucide-shield-check" class="h-4 w-4 shrink-0" aria-hidden="true" />
          Maya suit des règles apicoles éprouvées — vous gardez la main sur tout.
        </p>
      </div>

      <!-- Le fil -->
      <div ref="cadre" class="fil">
        <div class="fil-entete">
          <span class="fil-avatar"><IaMayaMark :size="18" state="idle" /></span>
          <span class="text-[13.5px] font-semibold" style="color: var(--text-primary)">Maya</span>
          <span class="text-[11.5px]" style="color: var(--text-tertiary)">· en ligne</span>
          <button type="button" class="fil-rejouer" @click="jouer">
            <UIcon name="i-lucide-rotate-ccw" class="h-3.5 w-3.5" aria-hidden="true" />
            Rejouer
          </button>
        </div>

        <div class="fil-corps" aria-live="polite">
          <template v-for="(m, i) in messages" :key="i">
            <div v-if="i < visibles" :class="m.de === 'maya' ? 'bulle-maya' : 'bulle-vous'">
              <template v-if="m.riche">
                C’est prêt :
                <strong>traitement varroa</strong> sur la Ruche 14, aujourd’hui. J’ai calculé le
                délai avant récolte — <strong>12 juin</strong>.
                <!-- ⚠️ « Enregistrer » / « Modifier » n'existent pas. Quand Maya
                     attend un accord avant d'écrire, `CopiloteMessage.vue`
                     n'affiche que « Confirmer » (fond noir) et « Annuler ». -->
                <span class="mt-2.5 flex flex-wrap gap-1.5">
                  <span class="puce-primaire">Confirmer</span>
                  <span class="puce-neutre">Annuler</span>
                </span>
              </template>
              <template v-else>{{ m.texte }}</template>
            </div>
          </template>

          <div v-if="visibles < messages.length" class="bulle-maya bulle-points" aria-hidden="true">
            <span /><span /><span />
          </div>
        </div>

        <div class="fil-saisie">
          <span class="fil-champ">Écrire à Maya…</span>
          <span class="fil-bouton" style="background: #fef6e4">
            <UIcon name="i-lucide-mic" class="h-4 w-4" style="color: var(--honey-deep)" />
          </span>
          <span class="fil-bouton" style="background: var(--honey)">
            <UIcon name="i-lucide-arrow-up" class="h-4 w-4 text-white" />
          </span>
        </div>
      </div>
    </div>
  </LandingMayaChapitre>
</template>

<script setup lang="ts">
const moyens = [
  {
    icone: 'i-lucide-mic',
    titre: '« Salut Maya »',
    detail: 'Le réveil vocal. Gants aux mains, cadre dans l’autre — vous n’avez rien à toucher.',
  },
  {
    icone: 'i-lucide-pen-line',
    titre: 'Elle écrit vos interventions',
    detail:
      'Dictez, elle structure. Vous relisez, vous validez. Même si vous donnez les informations dans le désordre.',
  },
  {
    icone: 'i-lucide-wifi-off',
    titre: 'Même sans réseau',
    detail: 'La saisie part au rucher, la synchronisation suit toute seule quand ça revient.',
  },
];

const messages = [
  {
    de: 'maya',
    texte: 'Bonjour Antoine 🐝 J’ai deux choses pour vous ce matin, on commence par les Tilleuls ?',
  },
  { de: 'vous', texte: 'Note la 14 : varroa traité aujourd’hui' },
  { de: 'maya', riche: true },
];

const cadre = ref<HTMLElement | null>(null);
const visibles = ref(0);
let minuteurs: ReturnType<typeof setTimeout>[] = [];

function nettoyer(): void {
  minuteurs.forEach(clearTimeout);
  minuteurs = [];
}

/** Sans mouvement demandé, le fil s'affiche d'un coup — complet, sans attente. */
function calme(): boolean {
  return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function jouer(): void {
  nettoyer();
  if (calme()) {
    visibles.value = messages.length;
    return;
  }
  visibles.value = 0;
  // Des délais croissants : Maya « réfléchit » plus longtemps avant de rendre le
  // formulaire prêt que pour dire bonjour.
  [420, 1500, 2900].forEach((d, i) => {
    minuteurs.push(setTimeout(() => (visibles.value = i + 1), d));
  });
}

let io: IntersectionObserver | null = null;
onMounted(() => {
  if (typeof IntersectionObserver === 'undefined' || !cadre.value) {
    visibles.value = messages.length;
    return;
  }
  io = new IntersectionObserver(
    (entrees) => {
      // Une seule fois : rejouer à chaque passage rendrait la page nerveuse.
      if (entrees[0]?.isIntersecting) {
        jouer();
        io?.disconnect();
        io = null;
      }
    },
    { threshold: 0.35 },
  );
  io.observe(cadre.value);
});

onBeforeUnmount(() => {
  nettoyer();
  io?.disconnect();
});
</script>

<style scoped>
/* Le numéro d'ordre : même langage que la numérotation des chapitres, en plus
   petit. Il donne un chemin de lecture, pas un classement. */
.moyen-num {
  flex-shrink: 0;
  font-size: 11.5px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-tertiary);
}

.fil {
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(214, 211, 209, 0.6);
  background: var(--surface-muted);
  box-shadow: 0 20px 60px rgba(40, 30, 20, 0.1);
}

.fil-entete {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: white;
  border-bottom: 1px solid rgba(214, 211, 209, 0.6);
}
.fil-avatar {
  width: 30px;
  height: 30px;
  border-radius: 9999px;
  background: rgba(245, 166, 35, 0.2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.fil-rejouer {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 0;
  background: none;
  font-size: 11.5px;
  color: var(--text-tertiary);
  cursor: pointer;
}
.fil-rejouer:hover {
  color: var(--honey-deep);
}
.fil-rejouer:focus-visible {
  outline: 2px solid var(--honey);
  outline-offset: 2px;
  border-radius: 6px;
}

.fil-corps {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 14px;
  min-height: 232px;
}

.bulle-maya,
.bulle-vous {
  font-size: 13.5px;
  animation: maya-msg-in 0.4s ease-out both;
}
.bulle-maya {
  max-width: 88%;
  background: #fff;
  border: 1px solid rgba(214, 211, 209, 0.6);
  line-height: 1.5;
  padding: 11px 13px;
  border-radius: 4px 14px 14px 14px;
  color: var(--text-primary);
}
.bulle-vous {
  margin-left: auto;
  max-width: 80%;
  background: var(--honey);
  color: #fff;
  line-height: 1.45;
  padding: 9px 13px;
  border-radius: 14px 4px 14px 14px;
}

/* Les trois points d'attente : ce sont eux qui font croire qu'elle réfléchit. */
.bulle-points {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  width: fit-content;
  padding: 13px;
}
.bulle-points span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--text-tertiary);
  animation: points 1.2s ease-in-out infinite;
}
.bulle-points span:nth-child(2) {
  animation-delay: 0.18s;
}
.bulle-points span:nth-child(3) {
  animation-delay: 0.36s;
}
@keyframes points {
  0%,
  100% {
    opacity: 0.28;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-2px);
  }
}

.puce-primaire,
.puce-neutre {
  font-size: 11.5px;
  padding: 4px 11px;
  border-radius: 9999px;
}
/* Noir, comme le vrai bouton de confirmation (CopiloteMessage.vue). */
.puce-primaire {
  background: #1c1c1e;
  color: #fff;
  font-weight: 600;
}
.puce-neutre {
  background: #f4f2ed;
  color: #57534e;
  font-weight: 500;
}

.fil-saisie {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: white;
  border-top: 1px solid rgba(214, 211, 209, 0.6);
}
.fil-champ {
  flex: 1;
  height: 38px;
  border: 1.5px solid rgba(168, 162, 158, 0.5);
  border-radius: 11px;
  display: flex;
  align-items: center;
  padding: 0 13px;
  font-size: 13.5px;
  color: #706963;
}
.fil-bouton {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

@media (prefers-reduced-motion: reduce) {
  .bulle-maya,
  .bulle-vous,
  .bulle-points span {
    animation: none;
  }
}
</style>
