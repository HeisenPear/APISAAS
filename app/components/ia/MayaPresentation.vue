<!--
  MayaPresentation — les présentations de Maya aux apiculteurs DÉJÀ installés.

  Ils n'ont jamais traversé l'onboarding version Maya : après la mise à jour,
  une bulle inconnue apparaît en bas à droite de leur application. La première
  fois qu'ils la touchent, on rejoue la NAISSANCE et rien d'autre — trois scènes
  au lieu de onze, aucune écriture de rucher ni de formule : leur compte existe.

  Déclenchée par le store (cf. `intercepterPresentation`), jamais par la voix :
  on ne coupe pas la parole à quelqu'un qui vient de dicter une commande.
  Montée dans le layout par défaut, indépendamment de la présence — un compte
  « en pause » y a droit aussi, par l'entrée « Maya » de la barre latérale.
-->
<template>
  <Teleport to="body">
    <Transition name="mpres">
      <div
        v-if="maya.presentationOpen"
        class="mpres-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Présentation de Maya"
      >
        <div class="cine-stage" @click="tap">
          <div class="cine-motes" aria-hidden="true">
            <span v-for="i in 14" :key="i" class="cine-mote" :style="mote(i)" />
          </div>

          <!-- ── LA NAISSANCE — même film que l'onboarding, mêmes durées ── -->
          <div v-if="phase === 'birth'" class="cine-naissance">
            <IaOnboardingMayaBirth :size="isWide ? 260 : 210" play />
            <div class="cine-titre">
              <p class="cine-eyebrow cine-fade">Nouveau sur APIGO</p>
              <h1 class="cine-h1 cine-fade">Maya s’éveille</h1>
            </div>
          </div>

          <!-- ── LE RÉCIT — trois scènes, dont la dernière est un vrai réglage ── -->
          <div v-else class="cine-play">
            <div class="cine-flow">
              <div class="cine-anchor cine-anchor-in">
                <IaMayaMark :size="isWide ? 88 : 72" :state="etatMark" />
              </div>

              <Transition name="cine-scene" mode="out-in">
                <div :key="scene.id" class="cine-scene">
                  <div class="cine-voice">
                    <IaOnboardingCineCaption :text="scene.caption" :size="isWide ? 40 : 30" />
                    <p v-if="scene.sub" class="cine-sub cine-subfade">{{ scene.sub }}</p>
                  </div>

                  <div class="cine-vis-in">
                    <IaOnboardingSceneHello v-if="scene.visual === 'hello'" />
                    <IaOnboardingScenePillars v-else-if="scene.visual === 'pillars'" />
                    <IaOnboardingScenePresence
                      v-else-if="scene.visual === 'presence'"
                      v-model="presence"
                    />
                  </div>

                  <button
                    v-if="scene.cta"
                    class="cine-cta"
                    type="button"
                    :disabled="enregistrement"
                    @click.stop="terminer"
                  >
                    {{ enregistrement ? 'Un instant…' : 'C’est parti' }}
                  </button>
                </div>
              </Transition>
            </div>

            <div class="cine-foot">
              <div class="cine-dots">
                <span
                  v-for="(s, k) in SCENES"
                  :key="s.id"
                  class="cine-dot"
                  :class="{ now: k === index, past: k < index }"
                />
              </div>
              <!-- Une échappatoire, contrairement à l'onboarding : ici
                   l'apiculteur travaillait et venait ouvrir Maya pour AGIR. Lui
                   imposer le film jusqu'au bout serait lui prendre son temps. -->
              <button
                v-if="!scene.cta"
                class="mpres-skip cine-skip"
                type="button"
                @click.stop="passer"
              >
                Passer
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { MayaPresence } from '~/stores/maya';

const maya = useMayaStore();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const isWide = useMediaQuery('(min-width: 900px)');
const mouvementReduit = useMediaQuery('(prefers-reduced-motion: reduce)');

interface Scene {
  id: string;
  visual: 'hello' | 'pillars' | 'presence';
  caption: string;
  sub?: string;
  /** Enchaînement automatique (ms). Absent = la scène attend une réponse. */
  dur?: number;
  cta?: boolean;
}

const prenom = computed(() => authStore.profil?.prenom?.trim() || '');

const SCENES = computed<Scene[]>(() => [
  {
    id: 'hello',
    visual: 'hello',
    caption: prenom.value
      ? `Bonjour ${prenom.value}. Moi, c’est Maya.`
      : 'Bonjour. Moi, c’est Maya.',
    sub: 'Ta binôme au rucher — je veille, tu décides.',
    dur: 4200,
  },
  {
    id: 'watch',
    visual: 'pillars',
    caption: 'Je veille sur ton cheptel, jour et nuit.',
    sub: 'Tes données sont déjà là : je les lis, je ne les invente pas.',
    dur: 5200,
  },
  {
    id: 'presence',
    visual: 'presence',
    caption: 'Comment veux-tu que je t’accompagne ?',
    sub: 'Tu pourras changer d’avis quand tu veux, depuis les réglages de Maya.',
    cta: true,
  },
]);

const phase = ref<'birth' | 'play'>('birth');
const index = ref(0);
const enregistrement = ref(false);
/** Pré-remplie avec le réglage courant : on ne réinitialise le choix de personne. */
const presence = ref<MayaPresence>(maya.presence);

const scene = computed(() => SCENES.value[index.value] ?? SCENES.value[0]!);
const etatMark = computed<'idle' | 'think'>(() => (scene.value.id === 'watch' ? 'think' : 'idle'));

/**
 * Poussière de miel — tirage DÉTERMINISTE (cf. onboarding) : `Math.random()`
 * donnerait au serveur et au navigateur deux couches différentes.
 */
function mote(i: number): Record<string, string> {
  const taille = 3 + ((i * 13) % 8);
  return {
    left: `${(i * 37) % 100}%`,
    bottom: `${(i * 17) % 40}%`,
    width: `${taille}px`,
    height: `${taille}px`,
    animationDelay: `${((i * 5.7) % 8).toFixed(1)}s`,
    animationDuration: `${7 + ((i * 3) % 8)}s`,
  };
}

// ── Enchaînement ────────────────────────────────────────────────────────────
let minuteur: ReturnType<typeof setTimeout> | null = null;
function stop(): void {
  if (minuteur) {
    clearTimeout(minuteur);
    minuteur = null;
  }
}
function armer(): void {
  stop();
  const s = scene.value;
  if (s.dur && !s.cta) minuteur = setTimeout(suivant, s.dur);
}
/**
 * L'avancement réarme LUI-MÊME la minuterie, plutôt qu'un `watch(index)`.
 *
 * Le veilleur se déclenchait après le bloc synchrone qui l'avait provoqué : en
 * remettant l'index à zéro pour rejouer le film, il s'exécutait APRÈS la pose
 * de la minuterie de naissance et l'écrasait. La naissance ne se terminait
 * jamais, et l'écran restait bloqué dessus — sans bouton pour en sortir.
 */
function suivant(): void {
  index.value = Math.min(SCENES.value.length - 1, index.value + 1);
  armer();
}
/** Tapoter accélère la narration — jamais l'écran qui attend une réponse. */
function tap(): void {
  if (phase.value === 'play' && !scene.value.cta) suivant();
}

/**
 * « Passer » : on grave la présentation comme vue et on rend son geste à
 * l'apiculteur, SANS toucher à sa présence — il n'a pas répondu, on ne décide
 * pas à sa place. Le réglage reste à portée dans les réglages de Maya.
 */
function passer(): void {
  stop();
  maya.fermerPresentation();
}

async function terminer(): Promise<void> {
  if (enregistrement.value) return;
  stop();
  enregistrement.value = true;
  maya.setPresence(presence.value);
  try {
    // Le choix suit le COMPTE, pas l'appareil : c'est un réglage, pas une
    // annonce. Un échec réseau ne bloque personne — le store a déjà appliqué.
    await authStore.updateProfil({
      preferences: {
        ...(authStore.profil?.preferences ?? {}),
        mayaPresence: presence.value,
      },
    });
  } catch {
    /* hors ligne / serveur muet : la présence locale fait foi jusqu'à la prochaine fois */
  } finally {
    enregistrement.value = false;
    maya.fermerPresentation();
  }
}

// ── Cycle de vie ────────────────────────────────────────────────────────────
/**
 * Le même drapeau que le Seuil : il signifie « une séquence Maya occupe tout
 * l'écran ». La bannière de consentement (z-index 9999) et les notes de patch
 * s'y rangent — sans lui, elles se posent par-dessus le film.
 */
const sceneActive = useState('maya-seuil-actif', () => false);

watch(
  () => maya.presentationOpen,
  (ouverte) => {
    sceneActive.value = ouverte;
    if (!ouverte) {
      stop();
      return;
    }
    // On repart du début à chaque ouverture : le composant reste monté.
    index.value = 0;
    presence.value = maya.presence;
    // Mouvement réduit : pas de naissance, on entre directement dans le récit.
    phase.value = mouvementReduit.value ? 'play' : 'birth';
    if (phase.value === 'play') {
      armer();
      return;
    }
    // Fin de la naissance à 2,6 s (`cinematic.jsx` fait foi). Ici le montage et
    // le premier rendu coïncident — l'ouverture est un clic, pas un chargement
    // de page — donc une minuterie simple suffit, sans recalage d'horloge.
    minuteur = setTimeout(() => {
      phase.value = 'play';
      armer();
    }, 2600);
  },
);

/**
 * REJOUER le film à la demande : `?maya=presentation` sur n'importe quelle page.
 *
 * Sans cette porte, la présentation n'est visible qu'UNE fois par appareil —
 * impossible à relire pour la valider, ni à montrer à quelqu'un, sans aller
 * vider le stockage du navigateur à la main. Le paramètre est retiré de l'URL
 * aussitôt, sinon un retour arrière relance le film en boucle (leçon du Seuil).
 */
watch(
  () => route.query.maya,
  (v) => {
    if (v !== 'presentation' || maya.presentationOpen) return;
    maya.presentationOpen = true;
    void nextTick(() => {
      const q = { ...route.query };
      delete q.maya;
      void router.replace({ path: route.path, query: q });
    });
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stop();
  sceneActive.value = false;
});
</script>

<!--
  UN SEUL bloc de style, et il pointe le fichier du cinématique.

  Une feuille `scoped` DOUBLÉE d'un `<style src>` fait échouer le build serveur
  (`[vite:vue] Cannot read properties of undefined (reading 'scoped')`) : le
  greffon Vue ne sait pas traiter un second bloc externe. Les règles propres à
  cet écran vivent donc dans `maya-onboarding.css`, aux côtés des `.cine-*`
  qu'elles prolongent — même famille visuelle, même feuille, préfixe `.mpres-`
  pour qu'elles ne croisent rien d'autre.

  Ce CSS n'est PAS global (~29 Ko réservés au cinématique) : il est importé par
  les seuls composants qui l'utilisent, et Vite le dédoublonne.
-->
<style src="~/assets/css/maya-onboarding.css"></style>
