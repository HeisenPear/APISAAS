import { describe, expect, it } from 'vitest';
import { PROFIL_CRON, PROFIL_DASHBOARD, SOCLE } from '~~/server/utils/moteurAlertes/profils';
import { preferencesDepuisProfil } from '~~/server/utils/moteurAlertes';
import { CATEGORIE_PAR_TYPE } from '~~/server/utils/alertesCategories';
import type { Detecteur, ProfilMoteur } from '~~/server/utils/moteurAlertes/types';

// Ces tests ne vérifient aucune règle métier : ils vérifient la STRUCTURE du
// moteur. Chacun ferme la porte à une régression qui s'est réellement produite
// quand les deux chemins de génération vivaient leur vie séparément.

const PROFILS: ProfilMoteur[] = [PROFIL_DASHBOARD, PROFIL_CRON];

function typesDe(profil: ProfilMoteur): string[] {
  return profil.detecteurs.flatMap((d) => [...d.types]);
}

describe('invariants de structure du moteur', () => {
  it('tout détecteur du dashboard existe aussi dans le cron', () => {
    // C'est EXACTEMENT le bug qu'on corrige : « santé critique » n'était
    // produite que par la route dashboard, donc un apiculteur qui n'ouvrait
    // jamais l'app ne recevait jamais l'alerte la plus grave du produit.
    const clesCron = new Set(PROFIL_CRON.detecteurs.map((d) => d.cle));
    for (const d of PROFIL_DASHBOARD.detecteurs) {
      expect(clesCron.has(d.cle), `détecteur « ${d.cle} » absent du cron`).toBe(true);
    }
  });

  it('le socle est bien commun aux deux profils', () => {
    for (const profil of PROFILS) {
      const cles = new Set(profil.detecteurs.map((d) => d.cle));
      for (const d of SOCLE) {
        expect(cles.has(d.cle), `socle « ${d.cle} » absent du profil ${profil.cle}`).toBe(true);
      }
    }
  });

  it('tout type produit est soit auto-résolu, soit explicitement déclaré sans résolution', () => {
    // Une alerte jamais résolue survit à la disparition de sa cause ET bloque,
    // par anti-doublon, la prochaine alerte légitime du même type.
    const detecteurs: Detecteur[] = [...new Set(PROFILS.flatMap((p) => [...p.detecteurs]))];
    for (const d of detecteurs) {
      if (d.resoudre) continue;
      for (const type of d.types) {
        expect(
          d.sansResolution?.[type],
          `« ${type} » n'est jamais résolu et ne dit pas pourquoi`,
        ).toBeTruthy();
      }
    }
  });

  it('tout type produit a une catégorie de notification déclarée', () => {
    // Un type absent de CATEGORIE_PAR_TYPE retombe silencieusement sur « sante »
    // et bafoue la préférence de l'utilisateur.
    for (const type of new Set(PROFILS.flatMap(typesDe))) {
      expect(CATEGORIE_PAR_TYPE[type], `« ${type} » sans catégorie`).toBeTruthy();
    }
  });

  it('aucun type n’est produit par deux détecteurs du même profil', () => {
    for (const profil of PROFILS) {
      const types = typesDe(profil);
      expect(new Set(types).size, `doublon de type dans le profil ${profil.cle}`).toBe(
        types.length,
      );
    }
  });

  it('les clés de détecteur sont uniques dans un profil', () => {
    for (const profil of PROFILS) {
      const cles = profil.detecteurs.map((d) => d.cle);
      expect(new Set(cles).size).toBe(cles.length);
    }
  });

  it('seul le cron porte les règles qui n’ont de sens qu’une fois par jour', () => {
    const clesDashboard = new Set(PROFIL_DASHBOARD.detecteurs.map((d) => d.cle));
    // Météo = appel réseau ; RDV et balances muettes = fenêtres calibrées sur le
    // passage du matin.
    for (const cle of ['meteo', 'rdv', 'balances-muettes']) {
      expect(clesDashboard.has(cle), `« ${cle} » ne doit pas tourner au dashboard`).toBe(false);
    }
  });

  it('l’anti-rafale ne concerne que le dashboard, le briefing que le cron', () => {
    expect(PROFIL_DASHBOARD.antiRafale).toBe(true); // rechargements successifs
    expect(PROFIL_CRON.antiRafale).toBe(false); // un seul passage par jour
    expect(PROFIL_CRON.respecterBriefing).toBe(true);
  });
});

describe('preferencesDepuisProfil', () => {
  it('un plan sans feuille de route n’a pas de briefing, même résumé activé', () => {
    expect(preferencesDepuisProfil('decouverte', null).briefingActif).toBe(false);
  });

  it('un plan Pro avec résumé activé (défaut) a un briefing', () => {
    expect(preferencesDepuisProfil('pro', null).briefingActif).toBe(true);
  });

  it('un plan Pro qui a coupé le résumé n’a plus de briefing', () => {
    expect(preferencesDepuisProfil('pro', { resume_quotidien: false }).briefingActif).toBe(false);
  });

  it('préférences absentes → les 6 catégories sont actives par défaut', () => {
    const { categories } = preferencesDepuisProfil(null, null);
    expect(Object.values(categories).every(Boolean)).toBe(true);
    expect(Object.keys(categories)).toHaveLength(6);
  });

  it('une catégorie coupée est respectée', () => {
    const { categories } = preferencesDepuisProfil('pro', { sante: false });
    expect(categories.sante).toBe(false);
    expect(categories.production).toBe(true);
  });
});
