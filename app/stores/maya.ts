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
      }>;
      if (p.presence === 'partout' || p.presence === 'discrete' || p.presence === 'pause') {
        presence.value = p.presence;
      }
      if (p.surveillance) surveillance.value = { ...surveillance.value, ...p.surveillance };
    } catch {
      /* localStorage indisponible / JSON corrompu → défauts */
    }
  }

  function persist(): void {
    if (!import.meta.client) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ presence: presence.value, surveillance: surveillance.value }),
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
    proactif,
    bubbleDisponible,
    modeDiscret,
    hydrate,
    persist,
    setPresence,
    toggleSurveillance,
    openBubble,
    closeBubble,
    toggleBubble,
    openSettings,
    closeSettings,
  };
});
