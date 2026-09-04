// ═══════════════════════════════════════════════════════════════════════════
// LE POINT DU JOUR — LA SEULE SURFACE DE MAYA QUI NE SE TAIT JAMAIS.
//
// Sur une PAGE, au calme, la carte disparaît (c'est `propositionsMaya.test.ts`
// qui le tient). Le tableau de bord, lui, garde toujours la parole : il ouvre
// sur la veille de la nuit, liste ce qui mérite un regard, et ferme sur la note
// de saison — plus, de temps en temps, une info du jour.
//
// Les cas de contexte qui vivaient ici sont partis dans `propositionsMaya`,
// où ils sont mesurés sur la SOURCE des contextes et non sur une liste
// recopiée. Ce fichier ne garde que ce qui est propre au point du jour.
// ═══════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { composerBriefDuJour, type DonneesBrief } from '../../../../server/utils/maya-brief';
import { VOIX, seedVoix } from '../../../../server/utils/maya-voix';
import { PATCH_NOTE } from '../../../../app/config/patchNotes';
import type { RucheSante, MeteoResultat } from '../../../../server/utils/copilote-data';

const meteoVide = { erreur: 'aucun_rucher' };

const meteoFav: MeteoResultat = {
  rucher: 'Rucher',
  previsions: [
    {
      date: '2026-06-12',
      conditions: 'Ensoleillé',
      tempMax: 22,
      tempMin: 12,
      pluieMm: 0,
      ventMaxKmh: 8,
      scoreVisite: 85,
    },
  ],
};

function ruche(over: Partial<RucheSante>): RucheSante {
  return {
    numero: '1',
    rucher: 'Rucher',
    statut: 'active',
    scoreSante: 80,
    derniereVisite: '2026-06-10',
    joursDepuisVisite: 2,
    varroa: null,
    maladieObservee: null,
    ...over,
  };
}

function donnees(over: Partial<DonneesBrief> = {}): DonneesBrief {
  return { ruches: [], alertes: [], stocks: [], meteo: meteoVide, ...over };
}

/** Le point du jour, sans info du jour : le tirage resterait sinon aléatoire. */
function brief(input: Partial<Parameters<typeof composerBriefDuJour>[0]> = {}) {
  return composerBriefDuJour({
    heure: 9,
    plan: 'pro',
    donnees: donnees(),
    mois: 5,
    avecInfoDuJour: false,
    ...input,
  });
}

describe('le point du jour — salutation et veille de la nuit', () => {
  it('salue par le prénom et ouvre sur « rien d’anormal » quand tout va bien', () => {
    const b = brief({ prenom: 'Antoine', mois: 4 });
    expect(b.salutation).toContain('Bonjour Antoine');
    expect(VOIX.veilleNuit.some((o) => b.intro.startsWith(o))).toBe(true);
    expect(VOIX.veilleRAS.some((r) => b.intro.includes(r))).toBe(true);
    // Même sans rien à signaler, la note de saison ferme la carte.
    expect(b.items).toHaveLength(1);
    expect(b.items[0]?.texte).toContain('saison');
  });

  it('les QUATRE moments de la journée se distinguent', () => {
    /**
     * ⚠️ TROIS DE CES QUATRE BRANCHES ÉTAIENT MORTES EN PRODUCTION, ET RIEN NE
     * LE DISAIT. `briefDuJour` calculait l'heure à la main :
     * `Number(Intl.DateTimeFormat('fr-FR', { hour: '2-digit' }).format(…))`.
     * Le français colle son suffixe — le format rend « 21 h » —, donc
     * `Number(…)` valait `NaN` et le repli `? 9 :` s'appliquait à CHAQUE appel.
     * Maya disait « Bonjour » à trois heures du matin comme à neuf heures du
     * soir, tous les jours, depuis toujours.
     *
     * Le banc ne pouvait pas le voir : il appelait `composerBriefDuJour` avec
     * une heure fournie à la main, jamais la couche qui la CALCULE. Les quatre
     * cas ci-dessous tiennent la table ; le cas de `horloge.test.ts` qui
     * interdit un `Intl.DateTimeFormat` monté à la main tient la cause.
     */
    expect(brief({ prenom: 'Marie', heure: 5 }).salutation).toContain('Déjà debout Marie');
    expect(brief({ prenom: 'Marie', heure: 9 }).salutation).toContain('Bonjour Marie');
    expect(brief({ prenom: 'Marie', heure: 15 }).salutation).toContain('Bon après-midi Marie');
    expect(brief({ prenom: 'Marie', heure: 20 }).salutation).toContain('Bonsoir Marie');
  });

  it('les bornes tombent du bon côté', () => {
    // 7 h et 12 h et 18 h sont des CHARNIÈRES : c'est là qu'un `<` devenu `<=`
    // décale toute la journée sans jamais faire tomber un cas au milieu.
    expect(brief({ heure: 6 }).salutation).toContain('Déjà debout');
    expect(brief({ heure: 7 }).salutation).toContain('Bonjour');
    expect(brief({ heure: 11 }).salutation).toContain('Bonjour');
    expect(brief({ heure: 12 }).salutation).toContain('Bon après-midi');
    expect(brief({ heure: 17 }).salutation).toContain('Bon après-midi');
    expect(brief({ heure: 18 }).salutation).toContain('Bonsoir');
  });

  it('signale les nouvelles alertes de la nuit (delta depuis hier)', () => {
    const maintenant = Date.parse('2026-06-12T08:00:00Z');
    const b = brief({
      heure: 8,
      maintenant,
      donnees: donnees({
        alertes: [
          // créée il y a 3 h → comptée dans la veille
          {
            type: 'sante',
            titre: 'Varroa',
            message: null,
            priorite: 'haute',
            createdAt: '2026-06-12T05:00:00Z',
          },
          // créée il y a 5 jours → hors fenêtre
          {
            type: 'stock',
            titre: 'Vieux',
            message: null,
            priorite: 'basse',
            createdAt: '2026-06-07T08:00:00Z',
          },
        ],
      }),
    });
    expect(b.intro).toContain('1 nouvelle alerte depuis hier');
  });

  it('signale une gelée nocturne depuis la météo', () => {
    const meteoGel: MeteoResultat = {
      rucher: 'Rucher',
      previsions: [
        {
          date: '2026-02-01',
          conditions: 'Ciel dégagé',
          tempMax: 6,
          tempMin: -3,
          pluieMm: 0,
          ventMaxKmh: 10,
          scoreVisite: 20,
        },
      ],
    };
    const b = brief({ heure: 7, mois: 1, donnees: donnees({ meteo: meteoGel }) });
    expect(b.intro.toLowerCase()).toContain('gelée nocturne');
    expect(b.intro).toContain('-3');
  });
});

describe('le point du jour — ce qu’il montre', () => {
  it('ouvre sur la météo, puis les visites, la santé, les alertes et les stocks', () => {
    const b = brief({
      prenom: 'Antoine',
      heure: 8,
      maintenant: Date.parse('2026-06-11T08:00:00Z'),
      donnees: donnees({
        meteo: meteoFav,
        ruches: [
          ruche({
            numero: '1',
            scoreSante: 30,
            joursDepuisVisite: 40,
            derniereVisite: '2026-01-01',
          }),
          ruche({ numero: '2' }),
        ],
        alertes: [
          // Un type qu'AUCUNE proposition dédiée ne dit déjà : `sante_critique`
          // et `varroa_seuil` cèdent la place au constat chiffré, qui en dit
          // plus (cf. `ALERTES_DEJA_DITES`).
          {
            type: 'cellule_royale',
            titre: 'Cellules royales sur la ruche 1',
            message: null,
            priorite: 'critique',
            actionUrl: '/ruches/abc',
          },
        ],
        stocks: [
          {
            nom: 'Cadres',
            categorie: 'materiel',
            quantite: '2',
            unite: 'u',
            seuilAlerte: '10',
            sousLeSeuil: true,
          },
        ],
      }),
    });
    const textes = b.items.map((i) => i.texte);
    // La météo ouvre : c'est elle qui conditionne tout le reste de la journée.
    expect(textes[0]).toContain('vendredi 12 juin');
    // Puis chaque domaine, NOMMÉ — le reproche fait aux anciennes cartes était
    // précisément de compter sans dire de quoi il s'agissait.
    expect(textes.join(' | ')).toContain('ruche 1');
    expect(textes.join(' | ')).toContain('Cellules royales sur la ruche 1');
    expect(textes.join(' | ')).toContain('cadres');
    expect(textes[textes.length - 1]).toContain('En cette saison');
  });

  it('n’a jamais de perche — ce n’est pas une carte de page', () => {
    expect(brief().relance).toBeUndefined();
  });

  it('au singulier, l’espace n’est jamais mangée', () => {
    // « 1 ruche attend », pas « 1 rucheattend » : un pluriel construit par
    // concaténation avait déjà collé deux mots à l'écran.
    const b = brief({
      maintenant: Date.parse('2026-06-11T08:00:00Z'),
      donnees: donnees({
        ruches: [ruche({ joursDepuisVisite: 40, derniereVisite: '2026-01-01' })],
        stocks: [
          {
            nom: 'Sucre',
            categorie: 'nourrissement',
            quantite: '1',
            unite: 'kg',
            seuilAlerte: '5',
            sousLeSeuil: true,
          },
        ],
      }),
    });
    const textes = b.items.map((i) => i.texte).join(' | ');
    expect(textes).toContain('1 ruche attend');
    expect(textes).not.toMatch(/[a-zéèêà][A-ZÉÈ]/);
  });
});

describe('l’info du jour — une nouveauté expliquée en passant', () => {
  it('elle est TIRÉE de la note de version, pas d’un second catalogue', () => {
    /**
     * ⚠️ C'EST LE POINT ENTIER DE CE MÉCANISME. Un fichier d'annonces séparé
     * aurait divergé de `PATCH_NOTE` dès la mise à jour suivante — la note de
     * version est relue et tenue à jour à chaque livraison, un catalogue
     * parallèle ne l'est jamais. Une seule source, deux surfaces : la modale
     * une fois, la carte de temps en temps.
     *
     * Le banc l'exige en cherchant le texte de l'info DANS la note de version :
     * si quelqu'un rédige un jour l'info ailleurs, ce cas tombe.
     */
    const b = brief({ avecInfoDuJour: true });
    const info = b.items.find((i) => i.ecran?.to === '/guide');
    expect(info, 'aucune info du jour alors qu’elle est demandée').toBeDefined();
    expect(
      PATCH_NOTE.nouveautes.some(
        (n) => info!.texte.includes(n.titre) && info!.texte.includes(n.texte),
      ),
      `« ${info!.texte} » ne correspond à aucune nouveauté de la note de version`,
    ).toBe(true);
  });

  it('elle ne s’impose pas : le point du jour tient sans elle', () => {
    const b = brief({ avecInfoDuJour: false });
    expect(b.items.some((i) => i.ecran?.to === '/guide')).toBe(false);
    expect(b.items.length, 'la note de saison reste').toBeGreaterThan(0);
  });

  it('elle ne change pas selon l’état du rucher, seulement selon le jour', () => {
    /**
     * ⚠️ LE TIRAGE EST DÉTERMINISTE, MAIS SON RANG COMPTE. `choisir` AVANCE la
     * graine à chaque appel : si l'info du jour était tirée APRÈS la veille
     * nocturne, son rang dépendrait du nombre d'appels que celle-ci fait — or
     * `verdictVeille` n'appelle `voix('veilleRAS')` que s'il n'a rien à
     * signaler. Une alerte arrivée entre deux chargements aurait donc changé
     * l'info du jour à mi-journée, sans que rien ne l'explique.
     *
     * Elle est donc tirée EN PREMIER, avant tout appel dépendant des données.
     * Ce cas l'ancre : deux ruchers dans des états opposés, même graine, même
     * info. Déplacer le tirage après `verdictVeille` le fait rougir.
     */
    const avecInfo = (donneesUtilisees: DonneesBrief) => {
      seedVoix('apiculteur-1:2026-09-04');
      const b = brief({ donnees: donneesUtilisees, avecInfoDuJour: true });
      return b.items.find((i) => i.ecran?.to === '/guide')?.texte;
    };

    const calme = avecInfo(donnees());
    const agite = avecInfo(
      donnees({
        alertes: [
          {
            type: 'cellule_royale',
            titre: 'Cellules royales',
            message: null,
            priorite: 'critique',
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    );
    expect(calme, 'aucune info tirée : le cas ne mesure rien').toBeDefined();
    expect(agite, 'l’info du jour a changé parce qu’une alerte est arrivée').toBe(calme);
  });

  it('GARDE-FOU : la note de version porte bien des nouveautés', () => {
    // Sans ce cas, vider `PATCH_NOTE.nouveautes` rendrait l'info du jour
    // silencieusement impossible, et les deux cas ci-dessus resteraient verts.
    expect(PATCH_NOTE.nouveautes.length).toBeGreaterThan(3);
  });
});
