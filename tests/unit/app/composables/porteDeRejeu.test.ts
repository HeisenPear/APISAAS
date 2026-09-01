import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { porteDeRejeuOuverte, REJEUX, type Rejeu } from '../../../../app/composables/porteDeRejeu';
import { usePatchNotes } from '../../../../app/composables/usePatchNotes';
import { useMayaPresentation } from '../../../../app/composables/useMayaPresentation';
import { PATCH_NOTE } from '../../../../app/config/patchNotes';

/**
 * LA PORTE DE REJEU — trois séquences du produit ne se montrent QU'UNE FOIS
 * (le film d'onboarding, la présentation de Maya, les notes de patch), et
 * l'équipe doit pouvoir les relire pendant qu'elle les peaufine.
 *
 * CE BANC EXISTE POUR DEUX RAISONS PRÉCISES, chacune un défaut déjà payé ici :
 *
 * 1. `/onboarding?rejouer` avait été introduit AVEC son garde placé avant la
 *    relecture du paramètre : le commit qui livrait l'outil de vérification
 *    cassait cet outil, et personne ne s'en est aperçu parce qu'aucun banc ne
 *    le traversait. Trois portes au lieu d'une multiplient d'autant les
 *    occasions de refaire exactement ça.
 *
 * 2. Une porte de rejeu qui laisserait passer un CLIENT lui resservirait une
 *    annonce qu'il a lue et fermée ; une porte qui ÉCRIRAIT consommerait
 *    l'annonce de celui qui la relit — un membre de l'équipe ne pourrait plus
 *    jamais vérifier ce que vit un apiculteur au premier passage. Les deux
 *    défauts sont muets : rien ne plante, on découvre des mois plus tard.
 *
 * Le banc est BEHAVIOURAL : il appelle les vraies fonctions avec une vraie URL
 * et un vrai `localStorage` (happy-dom). Chercher la chaîne
 * « porteDeRejeuOuverte » dans les sources ne prouverait rien — CLAUDE.md
 * appelle ça « le mot au lieu de l'appel », et ce dépôt s'est déjà fait avoir.
 */

// Les composables résolvent leurs dépendances par auto-import Nuxt : sous
// Vitest ce sont des identifiants libres, donc des globales. On câble la VRAIE
// porte (on veut l'intégration, pas un double) et un faux magasin d'auth.
let estAdmin = true;
let authJette = false;

beforeEach(() => {
  estAdmin = true;
  authJette = false;
  vi.stubGlobal('porteDeRejeuOuverte', porteDeRejeuOuverte);
  vi.stubGlobal('useAuthStore', () => {
    if (authJette) throw new Error('[pinia] no active Pinia');
    return { isAdmin: estAdmin };
  });
  localStorage.clear();
  poserUrl('/dashboard');
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

function poserUrl(chemin: string): void {
  window.history.replaceState({}, '', chemin);
}

describe('porte de rejeu — garde-fous du banc', () => {
  it('la porte S’OUVRE quand tout est réuni (sans ce cas, tout le reste est vide)', () => {
    // ⚠️ Ce cas d'abord. Si la porte ne s'ouvrait JAMAIS — globale mal câblée,
    // `window.history` inopérant sous happy-dom, `import.meta.client` faux dans
    // le harnais — chacune des assertions « fermée » ci-dessous passerait au
    // vert sans rien mesurer. C'est la forme « le balayage vide » de CLAUDE.md.
    poserUrl('/dashboard?rejouer=maya');
    expect(
      porteDeRejeuOuverte('maya'),
      'la porte ne s’ouvre dans AUCUNE condition : le banc ne mesure rien',
    ).toBe(true);
  });

  it('le `localStorage` du harnais retient vraiment (deuxième garde-fou)', () => {
    // Les cas « on n'écrit rien » comparent à `null`. Si le stockage était
    // inopérant, ils rendraient `null` quoi qu'il arrive — y compris pendant
    // une écriture bien réelle.
    localStorage.setItem('sonde', 'x');
    expect(localStorage.getItem('sonde'), 'localStorage inopérant dans le harnais').toBe('x');
  });
});

describe('porte de rejeu — qui ouvre quoi', () => {
  it('sans paramètre, les trois portes sont fermées', () => {
    for (const quoi of REJEUX) {
      expect(porteDeRejeuOuverte(quoi), `${quoi} ouverte sans \`?rejouer\``).toBe(false);
    }
  });

  // On itère sur REJEUX, la SOURCE DE VÉRITÉ, et non sur une liste recopiée :
  // ajouter une quatrième séquence sans la nommer correctement fera tomber ce
  // cas. CLAUDE.md § « la couverture qui s'arrête juste avant » — le banc de
  // gating testait trois plafonds sur quatre, et c'est le quatrième qui était
  // cassé.
  it.each(REJEUX)('`?rejouer=%s` n’ouvre QUE sa propre porte', (cible) => {
    poserUrl(`/dashboard?rejouer=${cible}`);
    for (const quoi of REJEUX) {
      expect(
        porteDeRejeuOuverte(quoi),
        `\`?rejouer=${cible}\` ${quoi === cible ? 'devrait ouvrir' : 'ne doit PAS ouvrir'} « ${quoi} »`,
      ).toBe(quoi === cible);
    }
  });

  it('`?rejouer=tout` ouvre les trois', () => {
    poserUrl('/dashboard?rejouer=tout');
    for (const quoi of REJEUX) {
      expect(porteDeRejeuOuverte(quoi), `${quoi} fermée malgré \`=tout\``).toBe(true);
    }
  });

  it('`?rejouer` nu ouvre les trois — c’est la forme historique d’`/onboarding`', () => {
    // Rétro-compatibilité DURE : `/onboarding?rejouer` est le geste que
    // l'apiculteur-développeur a dans les doigts depuis des mois. Le refactor
    // qui a mutualisé les trois portes ne doit pas le lui retirer en silence.
    poserUrl('/onboarding?rejouer');
    expect(porteDeRejeuOuverte('onboarding')).toBe(true);
    poserUrl('/onboarding?rejouer=');
    expect(porteDeRejeuOuverte('onboarding')).toBe(true);
  });

  it('une valeur inconnue n’ouvre rien', () => {
    // `null` / « inconnu » ne vaut JAMAIS « laisse passer » (CLAUDE.md §4).
    poserUrl('/dashboard?rejouer=nimportequoi');
    for (const quoi of REJEUX) {
      expect(porteDeRejeuOuverte(quoi), `${quoi} ouverte par une valeur inconnue`).toBe(false);
    }
  });
});

describe('porte de rejeu — réservée à l’équipe, et fermée par défaut', () => {
  it('un apiculteur NON-admin n’ouvre aucune porte, même avec le bon paramètre', () => {
    estAdmin = false;
    for (const cible of [...REJEUX, 'tout' as const, '' as const]) {
      poserUrl(`/dashboard?rejouer=${cible}`);
      for (const quoi of REJEUX) {
        expect(
          porteDeRejeuOuverte(quoi),
          `un client ouvre « ${quoi} » avec \`?rejouer=${cible}\``,
        ).toBe(false);
      }
    }
  });

  it('si le magasin d’auth est indisponible, la porte échoue FERMÉE', () => {
    // Ces fonctions sont appelées hors `setup()` (plugin d'hydratation du
    // magasin Maya, `setTimeout` de la fenêtre des notes). Le jour où le
    // singleton Pinia n'est pas là, l'exception ne doit pas se transformer en
    // « admin par défaut ». Devant une porte qu'on ne sait pas mesurer, on
    // refuse.
    authJette = true;
    poserUrl('/dashboard?rejouer=tout');
    for (const quoi of REJEUX) {
      expect(porteDeRejeuOuverte(quoi), `${quoi} ouverte alors que l’auth a jeté`).toBe(false);
    }
  });
});

describe('les notes de patch traversent la porte', () => {
  it('sans porte, une note déjà lue reste lue', () => {
    localStorage.setItem('apigo_patchnote_vu', PATCH_NOTE.id);
    expect(usePatchNotes().dejaVu()).toBe(true);
  });

  it('`?rejouer=patch` rend la note « jamais vue »', () => {
    localStorage.setItem('apigo_patchnote_vu', PATCH_NOTE.id);
    poserUrl('/dashboard?rejouer=patch');
    expect(usePatchNotes().dejaVu(), 'la note reste masquée malgré la porte').toBe(false);
  });

  it('`?rejouer=maya` ne rejoue PAS les notes de patch', () => {
    localStorage.setItem('apigo_patchnote_vu', PATCH_NOTE.id);
    poserUrl('/dashboard?rejouer=maya');
    expect(usePatchNotes().dejaVu()).toBe(true);
  });

  it('un client avec `?rejouer=patch` ne revoit rien', () => {
    estAdmin = false;
    localStorage.setItem('apigo_patchnote_vu', PATCH_NOTE.id);
    poserUrl('/dashboard?rejouer=patch');
    expect(usePatchNotes().dejaVu()).toBe(true);
  });

  it('porte ouverte, `marquerVu()` n’écrit RIEN', () => {
    // Le point le plus important du banc. Sans lui, un membre de l'équipe qui
    // relit l'annonce se la consomme : il ne peut plus jamais vérifier ce que
    // voit un apiculteur au premier passage, et il ne le saura pas.
    poserUrl('/dashboard?rejouer=patch');
    usePatchNotes().marquerVu();
    expect(
      localStorage.getItem('apigo_patchnote_vu'),
      'le rejeu a consommé l’annonce : ce n’est plus une observation',
    ).toBeNull();
  });

  it('porte fermée, `marquerVu()` grave bien (contrôle négatif)', () => {
    // Sans ce cas, un `marquerVu()` devenu inerte PARTOUT passerait au vert.
    usePatchNotes().marquerVu();
    expect(localStorage.getItem('apigo_patchnote_vu')).toBe(PATCH_NOTE.id);
  });
});

describe('la présentation de Maya traverse la porte', () => {
  const CLE = 'apigo_maya_presentation_vue';

  it('sans porte, une présentation déjà vue reste vue', () => {
    localStorage.setItem(CLE, useMayaPresentation().id);
    expect(useMayaPresentation().dejaVue()).toBe(true);
  });

  it('`?rejouer=maya` rend la présentation à nouveau due', () => {
    localStorage.setItem(CLE, useMayaPresentation().id);
    poserUrl('/dashboard?rejouer=maya');
    expect(useMayaPresentation().dejaVue(), 'la présentation reste masquée malgré la porte').toBe(
      false,
    );
  });

  it('`?rejouer=patch` ne rejoue PAS la présentation', () => {
    localStorage.setItem(CLE, useMayaPresentation().id);
    poserUrl('/dashboard?rejouer=patch');
    expect(useMayaPresentation().dejaVue()).toBe(true);
  });

  it('un client avec `?rejouer=maya` ne revoit rien', () => {
    estAdmin = false;
    localStorage.setItem(CLE, useMayaPresentation().id);
    poserUrl('/dashboard?rejouer=maya');
    expect(useMayaPresentation().dejaVue()).toBe(true);
  });

  it('porte ouverte, `marquerVue()` n’écrit RIEN', () => {
    poserUrl('/dashboard?rejouer=maya');
    useMayaPresentation().marquerVue();
    expect(
      localStorage.getItem(CLE),
      'le rejeu a consommé la présentation : ce n’est plus une observation',
    ).toBeNull();
  });

  it('porte fermée, `marquerVue()` grave bien (contrôle négatif)', () => {
    useMayaPresentation().marquerVue();
    expect(localStorage.getItem(CLE)).toBe(useMayaPresentation().id);
  });
});

describe('chaque séquence déclarée est réellement câblée', () => {
  /**
   * Le défaut « la liste qui rétrécit en silence », à l'envers : une entrée
   * ajoutée à `REJEUX` mais jamais consultée donnerait une porte annoncée dans
   * l'URL et sans effet — on chercherait le défaut du côté du navigateur.
   *
   * On dérive la preuve de la table elle-même, jamais d'une liste recopiée.
   */
  const SOURCES = execSync(
    "grep -rlo \"porteDeRejeuOuverte(\" app --include='*.ts' --include='*.vue' | sort",
    { encoding: 'utf-8' },
  )
    .trim()
    .split('\n')
    .filter(Boolean);

  it('le balayage voit bien des fichiers (garde-fou)', () => {
    expect(SOURCES.length, 'aucun appelant trouvé : la règle ci-dessous est vide').toBeGreaterThan(
      1,
    );
  });

  it.each(REJEUX)('« %s » est consulté quelque part dans `app/`', (quoi: Rejeu) => {
    const appelants = SOURCES.filter((f) =>
      execSync(`cat ${JSON.stringify(f)}`, { encoding: 'utf-8' }).includes(
        `porteDeRejeuOuverte('${quoi}')`,
      ),
    );
    expect(
      appelants,
      `« ${quoi} » figure dans REJEUX mais personne ne l’interroge : la porte serait annoncée et sans effet`,
    ).not.toEqual([]);
  });
});
