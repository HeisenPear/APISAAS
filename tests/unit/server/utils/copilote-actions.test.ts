import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  estActionAuto,
  memeNumero,
  extraireRuche,
  extraireRucheSeule,
  estActionEcriture,
  analyserIntervention,
  resoudreFluxIntervention,
} from '../../../../server/utils/copilote-actions';
import { normaliser } from '../../../../server/utils/copilote-local';

/** Raccourci : prépare l'entrée comme le fait la route (normalisée). */
const n = (s: string) => normaliser(s);

describe('estActionAuto — autonomie hybride', () => {
  /**
   * ⚠️ CE BANC A CHANGÉ DE VERDICT, ET IL FAUT DIRE POURQUOI. Il exigeait
   * `estActionAuto('intervention') === true`, sans regarder le TYPE. C'était
   * fidèle au code, et le code se trompait : l'autonomie se justifiait par une
   * promesse — « écritures faciles à défaire » — que la moitié des types
   * d'intervention ne tenaient pas. Un varroa dicté écrivait tout seul dans
   * `comptages_varroa`, une récolte dans `recoltes`, et « Annuler » ne savait
   * retirer que le hub.
   *
   * Le banc gardait donc la LETTRE de la règle (« intervention est auto ») en
   * laissant filer son ESPRIT (« auto ⟹ annulable »). C'est la forme de faux
   * vert la plus coûteuse : elle protège la ligne de code qui a le défaut.
   */
  it('les trois types réversibles s’exécutent en autonomie', () => {
    for (const type of ['controle', 'nourrissement', 'commentaire']) {
      expect(estActionAuto('intervention', type), type).toBe(true);
    }
  });

  it('un type qui écrit ailleurs repasse par « Confirmer »', () => {
    // Chacun de ces types remplit une table satellite que l'undo ne défait pas.
    for (const type of ['varroa', 'recolte', 'pesee', 'division', 'deplacement']) {
      expect(estActionAuto('intervention', type), type).toBe(false);
    }
  });

  it('⚠️ un contrôle qui LÈVE UNE ALERTE repasse par « Confirmer »', () => {
    /**
     * ⚠️ « auto ⟹ annulable » NE TENAIT PLUS, et il ne tenait plus pour une
     * raison que le type seul ne pouvait pas voir. Le gestionnaire de contrôle
     * lève une alerte selon son CONTENU — cellules royales, colonie à 1/4 — et
     * cette alerte vit hors du hub : `annulationAutorisee` la refuse désormais.
     * Laisser Maya écrire ça toute seule reviendrait à lui faire proposer
     * « Annuler » sur ce qu'elle ne sait pas défaire, exactement le défaut que
     * la règle d'autonomie existe pour fermer.
     *
     * Et « ruche 3, j'ai vu des cellules royales » est une phrase DICTABLE :
     * ce n'est pas un cas d'école.
     */
    expect(estActionAuto('intervention', 'controle', { celluleRoyale: true })).toBe(false);
    expect(estActionAuto('intervention', 'controle', { forceColonie: 1 })).toBe(false);
  });

  it('un contrôle ORDINAIRE reste auto, données à l’appui', () => {
    // Le contre-test : sans lui, refuser TOUS les contrôles satisferait le cas
    // ci-dessus tout en faisant repasser par « Confirmer » le geste le plus
    // fréquent de la saison (« ruche 3, tout va bien »).
    expect(estActionAuto('intervention', 'controle', {})).toBe(true);
    expect(
      estActionAuto('intervention', 'controle', { celluleRoyale: false, forceColonie: 4 }),
    ).toBe(true);
    expect(estActionAuto('intervention', 'controle')).toBe(true);
  });

  it('une intervention SANS type n’est jamais auto', () => {
    // On refuse par défaut : un type inconnu ne peut pas être déclaré réversible.
    expect(estActionAuto('intervention')).toBe(false);
    expect(estActionAuto('intervention', null)).toBe(false);
    expect(estActionAuto('intervention', 'type_invente')).toBe(false);
  });

  it('le sensible reste en confirmation — TOUTES les actions, pas quatre', async () => {
    /**
     * ⚠️ CETTE LISTE ÉTAIT RECOPIÉE, ET ELLE S'ARRÊTAIT JUSTE AVANT. Quatre
     * noms — vente, client, stock, recolte — sur huit actions créatrices hors
     * intervention : `achat`, `rucher`, `ruche` et `mortalite` n'étaient
     * testées par personne.
     *
     * Une ligne `if (actionId === 'achat') return true;` glissée dans
     * `estActionAuto` laissait les 2 538 bancs du dépôt au VERT. À l'écran :
     * « j'ai acheté 200 euros de candi » écrit directement en comptabilité,
     * sans bouton « Confirmer » — de l'argent engagé sans accord — puis un
     * « Annuler » qui répond « Cette action ne peut pas être annulée ainsi ».
     *
     * On itère donc le CATALOGUE. Une action ajoutée demain est couverte sans
     * qu'on touche à ce fichier.
     */
    const { ACTIONS_IDS } = await import('../../../../app/config/maya-actions');
    let examinees = 0;
    for (const id of ACTIONS_IDS) {
      if (id === 'intervention') continue; // son autonomie dépend du TYPE, cf. plus haut
      examinees++;
      expect(
        estActionAuto(id),
        `« ${id} » s’écrirait sans confirmation — et sans que rien ne le dise`,
      ).toBe(false);
    }
    /**
     * ⚠️ LE GARDE DU BALAYAGE. Rétrécir la boucle à quatre noms ne fait tomber
     * aucune assertion — le dépôt étant correct, moins regarder donne le même
     * vert. C'est exactement ce qui a laissé passer le défaut. On exige donc
     * que TOUTES les actions du catalogue, moins `intervention`, soient
     * réellement passées.
     */
    expect(examinees, 'le balayage n’a pas vu tout le catalogue').toBe(ACTIONS_IDS.length - 1);
  });

  it('AUTO ⟹ ANNULABLE, pour toute action — lu sur le SWITCH d’annulation', async () => {
    /**
     * ⚠️ L'INVARIANT NE COUVRAIT QUE `intervention`. Il itérait
     * `CATEGORIES_INTERVENTION`, donc il ne regardait qu'une action sur neuf.
     * Les huit autres pouvaient devenir « auto » sans que personne ne vérifie
     * qu'on sache les défaire.
     *
     * Et on ne lit PAS une liste d'actions annulables recopiée à côté : on lit
     * les `case` du `switch` de `annulerAction`, c'est-à-dire ce que le code
     * sait RÉELLEMENT défaire. Une liste écrite en face aurait divergé à son
     * tour — c'est exactement le défaut qu'on répare.
     */
    const { ACTIONS_IDS } = await import('../../../../app/config/maya-actions');
    const source = readFileSync('server/utils/copilote-actions.ts', 'utf-8');

    const corps = source.slice(source.indexOf('export function annulerAction('));
    const fin = corps.indexOf('\n}');
    const savoirDefaire = new Set(
      [...corps.slice(0, fin).matchAll(/case '([a-z]+)':/g)].map((m) => m[1]!),
    );

    expect(
      savoirDefaire.size,
      'aucun `case` lu — le switch a changé de forme et ce banc ne mesure plus rien',
    ).toBeGreaterThan(0);
    /**
     * ⚠️ ET LA LECTURE DOIT RESTER UNE LECTURE. Remplacer le relevé des `case`
     * par une liste écrite en face — même juste — rendrait l'invariant
     * tautologique : il ne mesurerait plus que sa propre recopie. Le `switch`
     * porte un `default:` précisément parce qu'il ne couvre PAS tout ; une
     * lecture qui prétend le contraire est une recopie déguisée.
     */
    expect(
      savoirDefaire.size,
      'le switch prétend tout savoir défaire — c’est une liste recopiée, pas une lecture',
    ).toBeLessThan(ACTIONS_IDS.length);
    expect(corps.slice(0, fin), 'le switch doit garder son `default:`').toContain('default:');

    for (const id of ACTIONS_IDS) {
      // `intervention` dépend du type : traitée par le cas dédié ci-dessous.
      if (id === 'intervention') continue;
      if (estActionAuto(id)) {
        expect(
          savoirDefaire.has(id),
          `« ${id} » s’écrit seule mais « Annuler » retombe sur le default: — le bouton MENT`,
        ).toBe(true);
      }
    }
  });

  it('AUTO ⟹ ANNULABLE : la règle, pas un cas particulier', async () => {
    /**
     * L'invariant qui ferme le sujet. Tout type que Maya s'autorise à écrire
     * seule doit figurer dans la liste blanche de l'annulation — sinon elle
     * écrit ce qu'elle ne sait pas retirer, et le bouton « Annuler » ment.
     */
    const { TYPES_ANNULABLES } = await import('../../../../server/utils/annulationRegle');
    const { CATEGORIES_INTERVENTION } = await import('../../../../app/types/interventions');
    for (const type of CATEGORIES_INTERVENTION) {
      if (estActionAuto('intervention', type)) {
        expect(TYPES_ANNULABLES.has(type), `${type} est auto mais pas annulable`).toBe(true);
      }
    }
  });
});

describe('memeNumero — tolérance de numéro de ruche', () => {
  it('égalité stricte', () => expect(memeNumero('7', '7')).toBe(true));
  it('zéros de tête : « 012 » = « 12 »', () => expect(memeNumero('012', '12')).toBe(true));
  it('préfixe lettre : « R5 » = « 5 »', () => expect(memeNumero('R5', '5')).toBe(true));
  it('numéros différents', () => expect(memeNumero('7', '8')).toBe(false));
});

describe('extraireRuche — référence de ruche tolérante', () => {
  it('« ruche 12 »', () => expect(extraireRuche('ruche 12')).toBe('12'));
  it('« la 12 »', () => expect(extraireRuche('sur la 12')).toBe('12'));
  it('« ruche n°7 »', () => expect(extraireRuche('ruche n°7')).toBe('7'));
  it('nombre en lettres : « ruche douze »', () => expect(extraireRuche('ruche douze')).toBe('12'));
  it('forme compacte « r12 »', () => expect(extraireRuche('r12 reine vue')).toBe('12'));
});

describe('estActionEcriture — ordre d’écriture vs question', () => {
  it('verbe + ruche → écriture', () => {
    expect(estActionEcriture(n('note ruche 12 reine vue, couvain'))).toBe(true);
  });
  it('ruche + observations sans verbe → écriture implicite', () => {
    expect(estActionEcriture(n('ruche 12 reine vue, couvain operculé'), false)).toBe(true);
  });
  it('une question n’est pas un ordre', () => {
    expect(estActionEcriture(n('comment va la reine de la 12 ?'), true)).toBe(false);
  });
});

describe('analyserIntervention — détection du type', () => {
  it('contrôle : observations → type controle + ruche résolue', () => {
    const p = analyserIntervention(
      n('ruche 12 reine vue, couvain operculé'),
      'ruche 12 reine vue, couvain operculé',
    );
    expect(p.type).toBe('controle');
    expect(p.rucheNumero).toBe('12');
    expect(p.manque).not.toContain('ruche');
    expect(p.donnees.reineVue).toBe(true);
    expect(p.donnees.couvainPresent).toBe(true);
  });

  it('note libre sans ruche → type commentaire + ruche manquante', () => {
    const p = analyserIntervention(n('rappel acheter des cadres'), 'rappel acheter des cadres');
    expect(p.type).toBe('commentaire');
    expect(p.manque).toContain('ruche');
  });

  it('contrôle explicite avec varroa comme SEULE observation → reste un contrôle', () => {
    // Régression : « varroa » seul faisait basculer en comptage varroa malgré le
    // mot-clé explicite « contrôle » (le garde de branche 2 épargne désormais le
    // contexte de contrôle explicite).
    const p = analyserIntervention(
      n('note un controle pas de varroa ruche 5'),
      'note un controle pas de varroa ruche 5',
    );
    expect(p.type).toBe('controle');
    expect(p.rucheNumero).toBe('5');
  });

  it('nourrissement', () => {
    const p = analyserIntervention(
      n('nourri la 5 avec 1,5 litre de sirop'),
      'nourri la 5 avec 1,5 litre de sirop',
    );
    expect(p.type).toBe('nourrissement');
    expect(p.rucheNumero).toBe('5');
  });

  it('comptage varroa', () => {
    const p = analyserIntervention(
      n('comptage varroa ruche 3 : 12 varroas'),
      'comptage varroa ruche 3 : 12 varroas',
    );
    expect(p.type).toBe('varroa');
    expect(p.rucheNumero).toBe('3');
  });

  it('pesée', () => {
    const p = analyserIntervention(n('pesée ruche 7 : 37,5 kg'), 'pesée ruche 7 : 37,5 kg');
    expect(p.type).toBe('pesee');
    expect(p.rucheNumero).toBe('7');
  });

  it('négation prioritaire : « pas de couvain » → couvain absent', () => {
    const p = analyserIntervention(
      n('ruche 4 reine vue mais pas de couvain'),
      'ruche 4 reine vue mais pas de couvain',
    );
    expect(p.type).toBe('controle');
    expect(p.donnees.couvainPresent).toBe(false);
  });
});

describe('extraireRucheSeule — slot-filling (réponse « la 12 »)', () => {
  it('« la 12 » → 12', () => expect(extraireRucheSeule('la 12')).toBe('12'));
  it('« ruche 7 » → 7', () => expect(extraireRucheSeule('ruche 7')).toBe('7'));
  it('un message qui n’est pas une ruche → undefined', () => {
    expect(extraireRucheSeule('merci beaucoup')).toBeUndefined();
  });
});

describe('resoudreFluxIntervention — désambiguïsation de rucher', () => {
  it('consomme « Ruche 1 — Rucher X » après un numéro ambigu (ne casse plus le flux)', () => {
    const flux = resoudreFluxIntervention([
      'note un controle ruche 1 : reine vue, force 3, calme, couvain present, reserves ok',
      'Ruche 1 — Rucher Grand père',
    ]);
    expect(flux?.etat).toBe('ecriture');
    if (flux?.etat === 'ecriture') {
      expect(flux.parse.rucherIndice).toContain('grand');
      expect(flux.parse.manque).toHaveLength(0);
    }
  });

  it('non-régression : une réponse « Ruche 7 » simple reste consommée', () => {
    const flux = resoudreFluxIntervention(['fais une intervention', 'controle', 'Ruche 7']);
    // Le flux avance (soit demande le champ suivant, soit finalise) — jamais null.
    expect(flux).not.toBeNull();
  });
});
