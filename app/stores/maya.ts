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
    if (p === 'pause') bubbleOpen.value = false;
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
    ouvrirBulleDirect();
    const c = commande.trim();
    commandeVocale.value = c.length >= 3 ? c : null;
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
    declencherVocal,
    openBubble,
    closeBubble,
    toggleBubble,
    openSettings,
    closeSettings,
    marquerPresentationVue,
    fermerPresentation,
  };
});
