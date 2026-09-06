// ═══════════════════════════════════════════════════════════════════════════
// CINQUANTE-SEPT EXPLICATIONS ÉCRITES, VINGT-TROIS UTILISÉES.
//
// ─── LE DÉFAUT ─────────────────────────────────────────────────────────────
// Chaque `Guide*.vue` portait son propre `<ol>` de phases rédigées — 57 au
// total, détaillées, à jour. Les visites guidées de `tutorials.ts`, elles,
// portaient 23 étapes ÉCRITES SÉPARÉMENT sur les mêmes sujets.
//
// Deux textes pour la même chose : corriger une phrase n'en corrigeait qu'une
// moitié, et l'apiculteur qui lançait une visite guidée recevait bien moins que
// ce que la page de guide, juste à côté, lui expliquait déjà.
//
// Le contenu vit maintenant dans `app/config/guides-contenu.ts` — en DONNÉES,
// sans fonction ni import de serveur, donc lisible des deux côtés. La page le
// rend, les tours en dérivent leurs étapes.
//
// ─── MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────────
//   · réécrire une phase en dur dans un `Guide*.vue` ;
//   · faire dériver un tour d'autre chose que `PHASES_PAR_THEME` ;
//   · retirer le saut d'étape pour une phase gatée.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PHASES_PAR_THEME, phasesDuTheme, type ThemeGuide } from '~~/app/config/guides-contenu';
import { ALL_TUTORIALS } from '~~/app/config/tutorials';
import { PLAN_CONFIGS } from '~~/app/config/plans';
import { NAV_SECTIONS } from '~~/app/config/navigation';

const THEMES = Object.keys(PHASES_PAR_THEME) as ThemeGuide[];
const PHASES = THEMES.flatMap((t) => PHASES_PAR_THEME[t].map((p) => ({ theme: t, ...p })));

describe('le contenu des guides est complet et cohérent', () => {
  it('GARDE-FOU : les cinquante-sept phases sont bien là', () => {
    // Le chiffre est celui MESURÉ dans les gabarits avant l'extraction, avec le
    // vrai compilateur Vue. S'il baisse, du contenu rédigé a été perdu en route
    // — c'est exactement ce qu'une extraction manuelle aurait fait sans bruit.
    expect(THEMES.length).toBe(10);
    expect(PHASES.length).toBe(57);
  });

  it('chaque phase a un titre, un corps et un identifiant unique', () => {
    const ids = new Set<string>();
    for (const p of PHASES) {
      expect(p.titre.length, `${p.theme}/${p.id}`).toBeGreaterThan(3);
      expect(p.corps.length, `${p.theme}/${p.id} — un corps, pas un titre bis`).toBeGreaterThan(40);
      const cle = `${p.theme}/${p.id}`;
      expect(ids.has(cle), `identifiant en double : ${cle}`).toBe(false);
      ids.add(cle);
    }
  });

  it('aucune phase n’est restée en dur dans un gabarit', () => {
    // La moitié structurelle de la règle : extraire ne suffit pas, encore
    // faut-il que plus personne ne recopie. Un `Guide*.vue` qui rouvrirait son
    // propre `<ol>` de phases ferait diverger les deux textes à nouveau.
    const guides = readdirSync('app/components/guide').filter(
      (f) => f.startsWith('Guide') && f.endsWith('.vue'),
    );
    expect(guides.length, 'le balayage voit bien les guides').toBeGreaterThanOrEqual(10);

    const coupables = guides.filter((f) => {
      const src = readFileSync(`app/components/guide/${f}`, 'utf8');
      // Le motif exact des phases d'origine : un titre en `text-sm font-semibold`.
      return /class="text-sm font-semibold text-\[var\(--text-primary\)\]"/.test(src);
    });
    expect(
      coupables,
      'ces guides réécrivent des phases au lieu de rendre `PHASES_PAR_THEME` — ' +
        'deux textes pour la même chose finissent toujours par diverger.',
    ).toEqual([]);
  });

  it('un thème inconnu rend une liste vide, il n’explose pas', () => {
    expect(phasesDuTheme('theme-qui-nexiste-pas')).toEqual([]);
  });
});

describe('les visites guidées DÉRIVENT du contenu', () => {
  it('GARDE-FOU : il y a bien des tours, et ils ont des étapes', () => {
    expect(ALL_TUTORIALS.length).toBeGreaterThanOrEqual(9);
    const total = ALL_TUTORIALS.reduce((n, t) => n + t.steps.length, 0);
    expect(total, 'le compte doit avoir AUGMENTÉ : 23 avant l’extraction').toBeGreaterThan(23);
  });

  it('LA RÈGLE : chaque étape provient d’une phase, aucune n’est écrite à la main', () => {
    const connues = new Map(PHASES.map((p) => [p.id, p]));
    for (const t of ALL_TUTORIALS) {
      for (const s of t.steps) {
        const p = connues.get(s.id);
        expect(p, `l’étape « ${s.id} » du tour « ${t.id} » ne vient d’aucune phase`).toBeDefined();
        expect(s.title, `${t.id}/${s.id} : titre recopié`).toBe(p!.titre);
        expect(s.content, `${t.id}/${s.id} : corps recopié`).toBe(p!.corps);
      }
    }
  });

  it('une phase SANS module ne devient pas une étape', () => {
    // On ne surligne pas un concept. Une carte qui flotte sans rien montrer est
    // exactement le défaut qu'on vient de corriger sur le tour « Production ».
    const sansModule = PHASES.filter((p) => !p.ancre).map((p) => p.id);
    expect(sansModule.length, 'certaines phases sont bien de la pédagogie pure').toBeGreaterThan(0);
    const idsEtapes = new Set(ALL_TUTORIALS.flatMap((t) => t.steps.map((s) => s.id)));
    for (const id of sansModule) {
      expect(idsEtapes.has(id), `« ${id} » n’a pas d’ancre et ne doit pas être une étape`).toBe(
        false,
      );
    }
  });

  it('chaque étape porte la route de son module', () => {
    // La route est PAR ÉTAPE : une visite traverse plusieurs modules, et un
    // tour qui n'en connaissait qu'une seule ne pouvait pas les suivre.
    for (const t of ALL_TUTORIALS) {
      for (const s of t.steps) {
        expect(s.route, `${t.id}/${s.id} doit savoir où il se joue`).toBeTruthy();
      }
    }
  });
});

describe('les routes et les fonctionnalités citées existent vraiment', () => {
  const ROUTES_NAV = new Set(NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.to)));
  const FEATURES = new Set(Object.keys(PLAN_CONFIGS.expert.features));

  it('GARDE-FOU : le balayage voit les routes et les fonctionnalités', () => {
    expect(ROUTES_NAV.size).toBeGreaterThan(20);
    expect(FEATURES.size).toBeGreaterThan(30);
  });

  it('toute route citée par une phase est un module réel', () => {
    // Une route inventée produirait une ancre morte — donc une étape qui ne
    // montre rien, sans la moindre erreur.
    const inconnues = PHASES.filter(
      (p) => p.route && !ROUTES_NAV.has(p.route) && !p.route.startsWith('/parametres'),
    ).map((p) => `${p.theme}/${p.id} → ${p.route}`);
    expect(inconnues).toEqual([]);
  });

  it('toute fonctionnalité citée existe dans le catalogue', () => {
    // Un nom de feature fautif ne se voit pas : `can('typo')` rend simplement
    // faux, et l'étape serait sautée pour TOUT LE MONDE, en silence.
    const inconnues = PHASES.filter((p) => p.feature && !FEATURES.has(p.feature)).map(
      (p) => `${p.theme}/${p.id} → ${p.feature}`,
    );
    expect(inconnues).toEqual([]);
  });

  it('les phases marquées « Pro » ou « Expert » portent bien une fonctionnalité', () => {
    // Le titre le dit à l'apiculteur ; sans `feature`, l'étape ne serait pas
    // sautée et la visite guidée montrerait un module verrouillé.
    const oubliees = PHASES.filter((p) => /·\s*(Pro|Expert)\b/.test(p.titre) && !p.feature).map(
      (p) => `${p.theme}/${p.id} — « ${p.titre} »`,
    );
    expect(oubliees).toEqual([]);
  });
});
