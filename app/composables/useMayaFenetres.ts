/**
 * Maya — Fenêtres d'intervention prédictives (client).
 * Miroir client des types serveur (server/utils/maya-fenetres.ts), 100 %
 * déterministe. Charge les suggestions et matérialise une alerte en un clic.
 */

export type TacheFenetre = 'controle' | 'recolte' | 'varroa' | 'nourrissement';
export type Urgence = 'haute' | 'moyenne' | 'basse';

export interface FenetreSuggestion {
  rucherId: string;
  rucherNom: string;
  tache: TacheFenetre;
  tacheLabel: string;
  icon: string;
  urgence: Urgence;
  raison: string;
  meilleureDate: string | null;
  meilleureDateLabel: string | null;
  scoreMeteo: number | null;
  meteoResume: string | null;
  alerte: {
    type: string;
    titre: string;
    message: string;
    priorite: Urgence;
    actionUrl: string;
  };
}

interface CreerAlerteResult {
  created: boolean;
  id?: string;
  raison?: string;
  tacheLabel?: string;
}

export function useMayaFenetres() {
  const notifications = useNotifications();

  const fenetres = ref<FenetreSuggestion[]>([]);
  const pending = ref(true);
  const erreur = ref<string | null>(null);
  /** Clés `rucherId:tache` des fenêtres déjà transformées en alerte. */
  const planifiees = ref<Set<string>>(new Set());
  const enCours = ref<Set<string>>(new Set());

  const cle = (f: FenetreSuggestion) => `${f.rucherId}:${f.tache}`;

  async function refresh() {
    pending.value = true;
    erreur.value = null;
    try {
      const res = await appelApi<{ data: FenetreSuggestion[] }>('/api/ia/fenetres');
      fenetres.value = res.data;
    } catch (e: unknown) {
      erreur.value = getApiErrorMessage(e, 'Maya n’a pas pu calculer les fenêtres.');
    } finally {
      pending.value = false;
    }
  }

  async function creerAlerte(f: FenetreSuggestion) {
    const k = cle(f);
    if (planifiees.value.has(k) || enCours.value.has(k)) return;
    enCours.value.add(k);
    try {
      const res = await appelApi<{ data: CreerAlerteResult }>('/api/ia/fenetres-alerte', {
        method: 'POST',
        body: {
          rucherId: f.rucherId,
          tache: f.tache,
          titre: f.alerte.titre,
          message: f.alerte.message,
          priorite: f.alerte.priorite,
        },
      });
      planifiees.value.add(k);
      if (res.data.created) {
        notifications.success(`Alerte créée — ${f.tacheLabel} · ${f.rucherNom}`);
      } else {
        notifications.info('Cette alerte existe déjà dans ton suivi.');
      }
    } catch (e: unknown) {
      notifications.error(getApiErrorMessage(e, 'Impossible de créer l’alerte.'));
    } finally {
      enCours.value.delete(k);
    }
  }

  const estPlanifiee = (f: FenetreSuggestion) => planifiees.value.has(cle(f));
  const estEnCours = (f: FenetreSuggestion) => enCours.value.has(cle(f));

  return { fenetres, pending, erreur, refresh, creerAlerte, estPlanifiee, estEnCours };
}
