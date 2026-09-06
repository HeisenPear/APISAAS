import { ref, computed, watch, type Ref, type ComputedRef } from 'vue';
import { haversineKm } from '~/utils/tourneeRoutes';

/**
 * Socle partagé des cartes collaboratives (frelon, floraisons…).
 *
 * Toutes ces cartes posent les trois mêmes questions à l'utilisateur : « je
 * regarde la carte ou la liste ? », « autour de quoi ? » (ma position ou une
 * autre commune) et « jusqu'où ? » (le rayon). Ce composable porte cette
 * mécanique une seule fois, les pages n'ayant plus qu'à fournir leurs points.
 *
 * Pensé terrain/mobile : le rayon et le dernier centre sont mémorisés, pour
 * qu'un apiculteur qui rouvre l'app retrouve sa zone sans tout reparamétrer.
 */

export interface PointGeo {
  lat: number;
  lng: number;
}

export interface CentreCarte extends PointGeo {
  /** Ce qu'on affiche à l'utilisateur : « Ma position » ou « Nantes (44000) ». */
  label: string;
}

export interface CommuneSuggestion extends PointGeo {
  id: string;
  nom: string;
  codePostal: string | null;
}

export type VueCarte = 'carte' | 'liste';
export type EtatLocalisation = 'idle' | 'chargement' | 'ok' | 'refuse' | 'indisponible';

/** Rayons proposés, en km. `null` = aucun filtrage (« Tous »). */
export const RAYONS_KM: Array<number | null> = [5, 10, 25, 50, 100, null];

interface Options {
  /** Suffixe de la clé localStorage — une carte par usage (frelon, floraisons…). */
  cle: string;
  rayonDefaut?: number | null;
}

interface Persistance {
  rayonKm: number | null;
  centre: CentreCarte | null;
}

function lirePersistance(cle: string): Persistance | null {
  if (import.meta.server) return null;
  try {
    const brut = localStorage.getItem(cle);
    if (!brut) return null;
    const p = JSON.parse(brut) as Partial<Persistance>;
    const centre =
      p.centre && typeof p.centre.lat === 'number' && typeof p.centre.lng === 'number'
        ? p.centre
        : null;
    return { rayonKm: p.rayonKm ?? null, centre };
  } catch {
    // localStorage indisponible (mode privé) ou JSON corrompu : on repart neuf.
    return null;
  }
}

export function useCarteCollab(options: Options) {
  const cleStockage = `apigo_carte_${options.cle}`;
  const memo = lirePersistance(cleStockage);

  const vue = ref<VueCarte>('carte');
  const centre = ref<CentreCarte | null>(memo?.centre ?? null);
  const rayonKm = ref<number | null>(memo?.rayonKm ?? options.rayonDefaut ?? 25);
  const etatLocalisation = ref<EtatLocalisation>('idle');

  // Mémorisation : rayon + dernier centre, pour retrouver sa zone au retour.
  watch([centre, rayonKm], () => {
    if (import.meta.server) return;
    try {
      localStorage.setItem(
        cleStockage,
        JSON.stringify({ rayonKm: rayonKm.value, centre: centre.value } satisfies Persistance),
      );
    } catch {
      // Écriture impossible : la carte marche quand même, on n'alerte pas.
    }
  });

  /** Géolocalisation navigateur. Ne rejette jamais : l'état est porté par `etatLocalisation`. */
  function localiser(): Promise<void> {
    return new Promise((resolve) => {
      if (import.meta.server || !navigator.geolocation) {
        etatLocalisation.value = 'indisponible';
        resolve();
        return;
      }
      etatLocalisation.value = 'chargement';
      navigator.geolocation.getCurrentPosition(
        (p) => {
          centre.value = {
            lat: p.coords.latitude,
            lng: p.coords.longitude,
            label: 'Ma position',
          };
          etatLocalisation.value = 'ok';
          resolve();
        },
        () => {
          etatLocalisation.value = 'refuse';
          resolve();
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
      );
    });
  }

  /**
   * Recherche de commune via la Base Adresse Nationale (gratuite, sans clé),
   * déjà utilisée par le formulaire de rucher.
   */
  async function chercherCommunes(q: string): Promise<CommuneSuggestion[]> {
    if (q.trim().length < 2) return [];
    try {
      const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&type=municipality&limit=6`;
      const res = await appelApi<{
        features?: Array<{
          properties?: { id?: string; city?: string; label?: string; postcode?: string };
          geometry?: { coordinates?: [number, number] };
        }>;
      }>(url, { timeout: 6000 });

      return (res.features ?? [])
        .map((f) => {
          const coords = f.geometry?.coordinates;
          if (!coords) return null;
          return {
            id: f.properties?.id ?? `${coords[0]},${coords[1]}`,
            nom: f.properties?.city ?? f.properties?.label ?? 'Commune',
            codePostal: f.properties?.postcode ?? null,
            lat: coords[1],
            lng: coords[0],
          } satisfies CommuneSuggestion;
        })
        .filter((c): c is CommuneSuggestion => c !== null);
    } catch {
      // BAN injoignable : la recherche renvoie vide, la carte reste utilisable.
      return [];
    }
  }

  function choisirCommune(c: CommuneSuggestion) {
    centre.value = {
      lat: c.lat,
      lng: c.lng,
      label: c.codePostal ? `${c.nom} (${c.codePostal})` : c.nom,
    };
    etatLocalisation.value = 'ok';
  }

  function reinitialiserCentre() {
    centre.value = null;
    etatLocalisation.value = 'idle';
  }

  /** Distance au centre courant, ou `null` si aucun centre n'est défini. */
  function distanceKm(p: PointGeo): number | null {
    if (!centre.value) return null;
    return haversineKm({ lat: centre.value.lat, lng: centre.value.lng }, p);
  }

  /** Sans centre OU sans rayon, tout passe : le filtre est opt-in. */
  function dansRayon(p: PointGeo): boolean {
    if (!centre.value || rayonKm.value === null) return true;
    const d = haversineKm({ lat: centre.value.lat, lng: centre.value.lng }, p);
    return d <= rayonKm.value;
  }

  /**
   * Filtre une liste sur le rayon courant. `position` extrait les coordonnées ;
   * un point sans coordonnées exploitables est écarté.
   */
  function filtrerParRayon<T>(items: T[], position: (item: T) => PointGeo | null): T[] {
    if (!centre.value || rayonKm.value === null) return items;
    return items.filter((item) => {
      const p = position(item);
      return p ? dansRayon(p) : false;
    });
  }

  const rayonLabel = computed(() => (rayonKm.value === null ? 'Tous' : `${rayonKm.value} km`));
  const centreLabel = computed(() => centre.value?.label ?? null);

  return {
    vue,
    centre,
    rayonKm,
    etatLocalisation,
    rayonLabel,
    centreLabel,
    localiser,
    chercherCommunes,
    choisirCommune,
    reinitialiserCentre,
    distanceKm,
    dansRayon,
    filtrerParRayon,
  } satisfies {
    vue: Ref<VueCarte>;
    centre: Ref<CentreCarte | null>;
    rayonKm: Ref<number | null>;
    etatLocalisation: Ref<EtatLocalisation>;
    rayonLabel: ComputedRef<string>;
    centreLabel: ComputedRef<string | null>;
    localiser: () => Promise<void>;
    chercherCommunes: (q: string) => Promise<CommuneSuggestion[]>;
    choisirCommune: (c: CommuneSuggestion) => void;
    reinitialiserCentre: () => void;
    distanceKm: (p: PointGeo) => number | null;
    dansRayon: (p: PointGeo) => boolean;
    filtrerParRayon: <T>(items: T[], position: (item: T) => PointGeo | null) => T[];
  };
}
