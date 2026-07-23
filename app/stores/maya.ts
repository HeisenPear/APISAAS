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
    openBubble();
    const c = commande.trim();
    commandeVocale.value = c.length >= 3 ? c : null;
  }

  function openBubble(): void {
    if (bubbleDisponible.value) bubbleOpen.value = true;
  }
  function closeBubble(): void {
    bubbleOpen.value = false;
  }
  function toggleBubble(): void {
    if (bubbleOpen.value) closeBubble();
    else openBubble();
  }
  function openSettings(): void {
    settingsOpen.value = true;
  }
  function closeSettings(): void {
    settingsOpen.value = false;
  }

  return {
    presence,
    surveillance,
    bubbleOpen,
    settingsOpen,
    reveilVocal,
    commandeVocale,
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
  };
});
