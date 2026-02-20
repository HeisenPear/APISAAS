export interface MeteoActuel {
  temperature: number;
  ressenti: number;
  vent: number;
  rafale: number;
  humidite: number;
  pluie: number;
  code: number;
  label: string;
  icon: string;
  conditionsOptimales: boolean;
}

export interface MeteoHeure {
  heure: string;
  temp: number;
  probPluie: number;
  pluie: number;
  vent: number;
  rafale: number;
  code: number;
  icon: string;
}

export interface MeteoPrevision {
  date: string;
  tempMax: number;
  tempMin: number;
  pluieMm: number;
  probPluie: number;
  ventMax: number;
  rafaleMax: number;
  uvMax: number;
  code: number;
  label: string;
  icon: string;
  sunrise: string;
  sunset: string;
  scoreVisite: number;
  optimalVisite: boolean;
  alerteGel: boolean;
  alerteOrage: boolean;
  alerteVent: boolean;
}

export interface MeteoData {
  rucherNom: string;
  actuel: MeteoActuel;
  heures: MeteoHeure[];
  previsions: MeteoPrevision[];
  alertes: string[];
}

export function useMeteo(rucherId: Ref<string | null>) {
  const meteo = ref<MeteoData | null>(null);
  const pending = ref(false);
  const error = ref<Error | null>(null);

  async function fetch() {
    if (!rucherId.value) {
      meteo.value = null;
      return;
    }
    pending.value = true;
    error.value = null;
    try {
      const res = await $fetch<{ data: MeteoData }>(`/api/meteo/${rucherId.value}`);
      meteo.value = res.data;
    } catch (e) {
      error.value = e as Error;
      meteo.value = null;
    } finally {
      pending.value = false;
    }
  }

  watch(rucherId, fetch, { immediate: true });

  return { meteo, pending, error, refresh: fetch };
}
