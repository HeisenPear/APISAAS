import { defineStore } from 'pinia';

/**
 * Mode de présence de Maya (§7bis du handoff) — une même identité, trois postures :
 *  - `partout`  : proactive. MayaCard, briefings, launcher menu s'affichent.
 *  - `discrete` : sur demande. Aucune surface proactive ; juste la bulle en bas
 *                 à droite qu'on ouvre à la demande.
 *  - `pause`    : retrait total. Maya n'apparaît nulle part.
 * En mode discret, Maya ne parle jamais sans qu'on l'appelle (déterministe, au tap/voix).
 */
export type MayaPresence = 'partout' | 'discrete' | 'pause';

export interface MayaSurveillance {
  alertes: boolean;
  briefing: boolean;
  dictee: boolean;
}

const STORAGE_KEY = 'apigo_maya_presence';

export const useMayaStore = defineStore('maya', () => {
  const presence = ref<MayaPresence>('partout');
  const surveillance = ref<MayaSurveillance>({ alertes: true, briefing: true, dictee: true });
  /** Fenêtre de la bulle ouverte (déplié). Piloté par le FAB + la BottomNav mobile. */
  const bubbleOpen = ref(false);
  /** Modale de réglages de présence (ouverte depuis la sidebar « Maya · Assistant »). */
  const settingsOpen = ref(false);
  /**
   * Réveil vocal « Salut Maya » — OPT-IN, coupé par défaut. Écoute seulement quand
   * l'app est ouverte au premier plan (jamais en arrière-plan / téléphone
   * verrouillé). Persisté.
   */
  const reveilVocal = ref(false);
  /**
   * Commande dictée après « Salut Maya … » (transitoire, non persistée). La bulle
   * l'observe, l'envoie à Maya, puis la vide. C'est le pont entre le lecteur de
   * réveil (global) et le chat (qui vit dans la bulle).
   */
  const commandeVocale = ref<string | null>(null);
  /**
   * Une dictée est-elle en cours ? Le réveil vocal DOIT se taire pendant ce
   * temps : deux reconnaissances sur le même micro et le navigateur en tue une
   * immédiatement — c'est ce qui coupait la dictée au bout d'une seconde sur la
   * page Maya, où la bulle est fermée, donc où le réveil écoute.
   */
  const dicteeEnCours = ref(false);
  /**
   * LE MODE VOCAL — le contact avec Maya se tient à la voix seule.
   *
   * ⚠️ CE N'EST PAS « la dictée est allumée ». C'est une BOUCLE : la bulle s'est
   * ouverte à la voix, la dictée repart d'elle-même après chaque réponse, la fin
   * d'une phrase déclenche l'envoi, et Maya répond à voix haute. L'apiculteur a
   * les mains dans une ruche : il ne peut ni taper, ni viser un bouton, ni même
   * regarder l'écran.
   *
   * Il se coupe dès que l'apiculteur reprend la main autrement — il ferme la
   * bulle, il touche le micro, il tape. Un mode qui survivrait à son propre
   * abandon rouvrirait le micro dans le dos de son propriétaire, et c'est la
   * seule chose qu'on ne peut pas se permettre avec un microphone.
   */
  const modeVocal = ref(false);
  /**
   * LE PASSAGE DE RELAIS DU MICRO — vrai entre « la bulle s'ouvre » et « la
   * phrase est finie ».
   *
   * ⚠️ IL EXISTE PARCE QUE LES DEUX BESOINS SE CONTREDISENT. On veut ouvrir la
   * bulle DÈS « Salut Maya » (deux dixièmes, sur un intermédiaire) et recevoir
   * la commande ENTIÈRE (« …comment vont mes ruches ? », qui n'arrive qu'au
   * résultat final, une seconde plus tard). Entre les deux, le lecteur de réveil
   * doit GARDER le micro : le rendre ferait perdre la moitié de la phrase, et
   * le reprendre par une seconde reconnaissance ferait tuer l'une des deux par
   * le navigateur.
   *
   * Tant que ce drapeau est levé, la dictée de la bulle ne démarre pas, et le
   * réveil continue d'écouter bien que la bulle soit ouverte.
   */
  const transfertVocal = ref(false);
  /**
   * Présentation de Maya (cf. useMayaPresentation) — la mini-cinématique due aux
   * apiculteurs installés AVANT la mise à jour, qui n'ont jamais vu d'où sort
   * cette bulle. Elle s'intercale la première fois qu'ils touchent à Maya.
   */
  const presentationOpen = ref(false);
  const presentationDue = ref(false);
  /**
   * Ce que l'apiculteur voulait VRAIMENT ouvrir. On le rejoue à la fin de la
   * présentation : son geste n'est pas perdu, juste précédé des présentations.
   */
  const intentionApres = ref<'bulle' | 'reglages' | null>(null);

  /** Surfaces proactives (MayaCard, launcher menu, cartes contextuelles) → seulement « partout ». */
  const proactif = computed(() => presence.value === 'partout');
  /** La bulle est atteignable partout SAUF en pause. */
  const bubbleDisponible = computed(() => presence.value !== 'pause');
  /** En mode discret, la bulle REMPLACE le launcher proactif (desktop). */
  const modeDiscret = computed(() => presence.value === 'discrete');

  function hydrate(): void {
    if (!import.meta.client) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as Partial<{
        presence: MayaPresence;
        surveillance: MayaSurveillance;
        reveilVocal: boolean;
      }>;
      if (p.presence === 'partout' || p.presence === 'discrete' || p.presence === 'pause') {
        presence.value = p.presence;
      }
      if (p.surveillance) surveillance.value = { ...surveillance.value, ...p.surveillance };
      if (typeof p.reveilVocal === 'boolean') reveilVocal.value = p.reveilVocal;
    } catch {
      /* localStorage indisponible / JSON corrompu → défauts */
    } finally {
      // Lu ici, une seule fois, et non à chaque clic : la présentation est due
      // tant que l'apiculteur ne l'a pas vue (ni été pré-crédité par le Seuil).
      // Dans le `finally` : un JSON de présence corrompu ne doit pas priver de
      // la présentation celui qui ne l'a jamais vue.
      presentationDue.value = !useMayaPresentation().dejaVue();
    }
  }

  function persist(): void {
    if (!import.meta.client) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          presence: presence.value,
          surveillance: surveillance.value,
          reveilVocal: reveilVocal.value,
        }),
      );
    } catch {
      /* quota / mode privé — non bloquant */
    }
  }

  function setPresence(p: MayaPresence): void {
    presence.value = p;
    // Passer Maya en pause ferme la bulle — donc coupe aussi le mode vocal, par
    // le MÊME chemin que la fermeture manuelle. Poser `bubbleOpen = false` ici
    // laissait le micro pris par une bulle que plus rien n'affiche.
    if (p === 'pause') closeBubble();
    persist();
  }

  function toggleSurveillance(k: keyof MayaSurveillance): void {
    surveillance.value[k] = !surveillance.value[k];
    persist();
  }

  function setReveilVocal(v: boolean): void {
    reveilVocal.value = v;
    persist();
  }

  /** Non persisté : c'est un état de l'instant, pas un réglage. */
  function setDicteeEnCours(v: boolean): void {
    dicteeEnCours.value = v;
  }

  /**
   * Le réveil a entendu « Salut Maya » : on ouvre, on passe en mode vocal, et on
   * LAISSE le micro au réveil le temps qu'il finisse d'entendre la phrase.
   */
  function ouvrirPourLaVoix(): void {
    ouvrirBulleDirect();
    // Si la bulle n'est pas disponible (présence « pause »), il n'y a pas de
    // mode vocal à ouvrir : on ne prend pas le micro pour rien.
    if (!bubbleOpen.value) return;
    modeVocal.value = true;
    transfertVocal.value = true;
  }

  /**
   * Le réveil a fini d'entendre : voici la phrase, il rend le micro.
   *
   * Une commande vide est un cas NORMAL — « Salut Maya » tout seul, ou une
   * révision qui a effacé le réveil. La bulle est ouverte, la dictée prend le
   * relais, et l'apiculteur parle.
   */
  function livrerCommandeVocale(commande: string): void {
    transfertVocal.value = false;
    const q = commande.trim();
    commandeVocale.value = q.length >= 3 ? q : null;
  }

  /**
   * Sortie du mode vocal — un seul endroit, appelé par tous les gestes qui
   * signifient « je reprends la main » (fermer la bulle, couper le micro,
   * taper). Deux copies de cette remise à zéro auraient divergé le jour où l'un
   * des deux drapeaux aurait été ajouté.
   */
  function quitterModeVocal(): void {
    modeVocal.value = false;
    transfertVocal.value = false;
  }

  /**
   * Déclenché quand le lecteur de réveil entend « Salut Maya … ». Ouvre la bulle,
   * et si une commande a été dictée dans la foulée, la met en attente pour que la
   * bulle l'envoie. Sinon, la bulle s'ouvre simplement (l'apiculteur enchaîne au
   * micro d'un tap).
   */
  function declencherVocal(commande: string): void {
    // La voix NE passe PAS par la présentation : l'apiculteur a déjà parlé, on
    // ne lui coupe pas la parole avec un film. Sa commande partirait à la
    // poubelle et il aurait dicté pour rien.
    poserQuestion(commande);
  }

  /**
   * Ouvre Maya AVEC une question déjà posée — la perche tendue par les cartes
   * contextuelles, et le canal du réveil vocal.
   *
   * Ne passe pas par la présentation, pour la même raison que la voix : la
   * question serait perdue derrière le film. Ces surfaces ne s'affichent de
   * toute façon qu'en présence « partout », donc à quelqu'un qui connaît Maya.
   */
  function poserQuestion(question: string): void {
    ouvrirBulleDirect();
    const q = question.trim();
    commandeVocale.value = q.length >= 3 ? q : null;
  }

  /**
   * La présentation s'intercale-t-elle ? Vrai une seule fois, à la première
   * sollicitation de Maya après la mise à jour ; on retient au passage ce que
   * l'apiculteur voulait ouvrir pour le lui rendre juste après.
   */
  function intercepterPresentation(intention: 'bulle' | 'reglages'): boolean {
    if (!presentationDue.value || presentationOpen.value) return false;
    intentionApres.value = intention;
    presentationOpen.value = true;
    return true;
  }

  function ouvrirBulleDirect(): void {
    if (bubbleDisponible.value) bubbleOpen.value = true;
  }

  function openBubble(): void {
    if (intercepterPresentation('bulle')) return;
    ouvrirBulleDirect();
  }
  function closeBubble(): void {
    bubbleOpen.value = false;
    // ⚠️ FERMER LA BULLE COUPE LE MODE VOCAL, ET C'EST UNE CORRECTION. La dictée
    // survivait à la fermeture : le micro restait pris, l'indicateur
    // d'enregistrement restait allumé, le brouillon continuait de se remplir
    // dans une fenêtre invisible — et le réveil vocal, lui, ne pouvait pas
    // reprendre puisqu'il cède la place à toute dictée en cours.
    quitterModeVocal();
  }
  function toggleBubble(): void {
    if (bubbleOpen.value) closeBubble();
    else openBubble();
  }
  function openSettings(): void {
    if (intercepterPresentation('reglages')) return;
    settingsOpen.value = true;
  }
  function closeSettings(): void {
    settingsOpen.value = false;
  }

  /**
   * Pré-crédite la présentation sans la jouer — pour qui vient de traverser
   * l'onboarding, où Maya s'est déjà présentée en long et en large.
   */
  function marquerPresentationVue(): void {
    useMayaPresentation().marquerVue();
    presentationDue.value = false;
  }

  /** Fin de la présentation : on grave, puis on rend son geste à l'apiculteur. */
  function fermerPresentation(): void {
    presentationOpen.value = false;
    marquerPresentationVue();
    const suite = intentionApres.value;
    intentionApres.value = null;
    if (suite === 'bulle') ouvrirBulleDirect();
    else if (suite === 'reglages') settingsOpen.value = true;
  }

  return {
    presence,
    surveillance,
    bubbleOpen,
    settingsOpen,
    reveilVocal,
    dicteeEnCours,
    modeVocal,
    transfertVocal,
    commandeVocale,
    presentationOpen,
    presentationDue,
    proactif,
    bubbleDisponible,
    modeDiscret,
    hydrate,
    persist,
    setPresence,
    toggleSurveillance,
    setReveilVocal,
    setDicteeEnCours,
    ouvrirPourLaVoix,
    livrerCommandeVocale,
    quitterModeVocal,
    declencherVocal,
    poserQuestion,
    openBubble,
    closeBubble,
    toggleBubble,
    openSettings,
    closeSettings,
    marquerPresentationVue,
    fermerPresentation,
  };
});
