import { describe, expect, it } from 'vitest';
import {
  categorieDeType,
  typeActif,
  normaliserPrefs,
  resumeQuotidienActif,
  heureResumeQuotidien,
  HEURE_RESUME_DEFAUT,
  CATEGORIES_DEFAUT,
} from '../../../../server/utils/alertesCategories';

describe('alertesCategories', () => {
  it('mappe chaque type vers sa catégorie', () => {
    expect(categorieDeType('visite_requise')).toBe('sante');
    expect(categorieDeType('premiere_visite')).toBe('sante');
    expect(categorieDeType('traitement_fin')).toBe('production');
    expect(categorieDeType('stock_bas')).toBe('stock');
    expect(categorieDeType('rappel_saison')).toBe('saison');
    expect(categorieDeType('rdv_rappel')).toBe('saison');
    expect(categorieDeType('facture_retard')).toBe('gestion');
    expect(categorieDeType('napi')).toBe('reglementaire');
  });

  it('type inconnu → catégorie santé par défaut', () => {
    expect(categorieDeType('type_imaginaire')).toBe('sante');
  });

  it('typeActif lit la préférence de la CATÉGORIE', () => {
    expect(typeActif({ sante: false }, 'visite_requise')).toBe(false);
    expect(typeActif({ sante: false }, 'stock_bas')).toBe(true); // autre catégorie
    expect(typeActif({ saison: false }, 'rdv_rappel')).toBe(false);
  });

  it('typeActif : défaut activé quand non renseigné', () => {
    expect(typeActif({}, 'sante_critique')).toBe(true);
    expect(typeActif(null, 'facture_retard')).toBe(true);
  });

  it('typeActif ignore les anciennes clés PAR TYPE (retombe sur le défaut)', () => {
    // ancien format stocké : { visite_requise: false } — ne doit PAS désactiver
    expect(typeActif({ visite_requise: false }, 'visite_requise')).toBe(true);
  });

  it('normaliserPrefs ne garde que les 6 booléens de catégorie', () => {
    const out = normaliserPrefs({ sante: false, visite_requise: false, bidon: 1 });
    expect(out).toEqual({ ...CATEGORIES_DEFAUT, sante: false });
    expect(Object.keys(out)).toHaveLength(6);
  });

  it('normaliserPrefs(null) → tout activé', () => {
    expect(normaliserPrefs(null)).toEqual(CATEGORIES_DEFAUT);
  });

  it('resumeQuotidienActif : activé par défaut, désactivable', () => {
    expect(resumeQuotidienActif(null)).toBe(true);
    expect(resumeQuotidienActif({})).toBe(true);
    expect(resumeQuotidienActif({ resume_quotidien: false })).toBe(false);
    expect(resumeQuotidienActif({ resume_quotidien: true })).toBe(true);
  });

  it('heureResumeQuotidien : défaut 7 h, borné 5-21, arrondi', () => {
    expect(heureResumeQuotidien(null)).toBe(HEURE_RESUME_DEFAUT);
    expect(heureResumeQuotidien({})).toBe(7);
    expect(heureResumeQuotidien({ heure_resume: 6 })).toBe(6);
    expect(heureResumeQuotidien({ heure_resume: 2 })).toBe(5); // clamp bas
    expect(heureResumeQuotidien({ heure_resume: 23 })).toBe(21); // clamp haut
    expect(heureResumeQuotidien({ heure_resume: 7.6 })).toBe(8); // arrondi
  });
});
