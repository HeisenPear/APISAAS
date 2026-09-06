import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import {
  STATUTS_CA_REALISE,
  STATUTS_HORS_CA,
  compteDansLeCa,
} from '~~/server/utils/statutsFacture';
import { statutFactureEnum } from '~~/server/database/schema';
import { getFinances, getSerie12Mois } from '~~/server/utils/copilote-data';
import { creerFauxDb } from '../../../helpers/fauxDb';

/**
 * LE DÉFAUT QUE CE BANC VERROUILLE : LE DÉPÔT AVAIT CINQ RÉPONSES À LA QUESTION
 * « QU'EST-CE QUI COMPTE DANS MON CHIFFRE D'AFFAIRES ? », ET MAYA DONNAIT LA PIRE.
 *
 *   dashboard.get.ts     notInArray(statut, ['brouillon','annulee'])
 *   tresorerie.get.ts    ne(statut, 'brouillon')
 *   getFinances          AUCUN filtre de statut
 *   getSerie12Mois       AUCUN filtre de statut
 *   getClients           statut <> 'annulee'
 *
 * Vécu par l'apiculteur : il ouvre sa page Finances, il y lit un chiffre ; il
 * pose la même question à Maya, il en obtient un autre — gonflé de ses
 * brouillons et de ses factures annulées. Sur le nombre le plus regardé du
 * produit, et sur celui dont dépendra tout conseil financier.
 */
describe('une seule vérité sur ce qui compte dans le chiffre d’affaires', () => {
  it('la table couvre EXACTEMENT les statuts de la base (garde-fou)', () => {
    // ⚠️ SANS CE CAS, TOUT LE RESTE EST VIDE. Si la table décrivait trois
    // statuts sur cinq, les deux listes seraient cohérentes entre elles et le
    // banc serait vert en ne mesurant rien. On dérive de LA SOURCE : l'énum de
    // la base, celle qui contraint réellement les données.
    const declares = [...STATUTS_CA_REALISE, ...STATUTS_HORS_CA].sort();
    expect(declares, 'un statut de la base échappe à la décision').toEqual(
      [...statutFactureEnum.enumValues].sort(),
    );
    expect(statutFactureEnum.enumValues.length, 'la base ne décrit plus rien').toBeGreaterThan(1);
  });

  it('les deux listes ne se chevauchent pas', () => {
    for (const s of STATUTS_CA_REALISE) expect(STATUTS_HORS_CA, s).not.toContain(s);
  });

  it('un brouillon et une annulée ne sont PAS du chiffre d’affaires', () => {
    // Le cœur du défaut. Ces deux-là sont ceux que Maya comptait.
    expect(compteDansLeCa('brouillon'), 'jamais émise : elle n’engage personne').toBe(false);
    expect(compteDansLeCa('annulee'), 'retirée : elle ne sera jamais encaissée').toBe(false);
  });

  it('une facture émise compte, même impayée', () => {
    // Le sens inverse compte autant : une facture due EST du chiffre d'affaires.
    // L'exclure ferait dire à Maya « ton CA a chuté » à qui attend un règlement.
    for (const s of ['envoyee', 'payee', 'en_retard']) expect(compteDansLeCa(s), s).toBe(true);
  });

  it('un statut inconnu ne compte PAS — « inconnu » ne vaut jamais « laisse passer »', () => {
    for (const s of ['', 'nimportequoi', 'BROUILLON', 'payée']) {
      expect(compteDansLeCa(s), s).toBe(false);
    }
  });

  it('Maya donne la MÊME réponse que la page Finances', () => {
    /**
     * La règle de référence n'est pas inventée ici : c'est celle que le produit
     * applique déjà sur sa page Finances. On la lit dans sa source plutôt que
     * de la recopier — si elle change là-bas, ce cas le dit.
     */
    const dashboard = readFileSync('server/api/finances/dashboard.get.ts', 'utf-8');
    const m = dashboard.match(/notInArray\(\s*transactions\.statut,\s*\[([^\]]*)\]/);
    expect(m, 'la page Finances n’exclut plus de statut : la référence a bougé').not.toBeNull();
    const exclusDuDashboard = [...m![1]!.matchAll(/'([a-z_]+)'/g)].map((x) => x[1]!).sort();
    expect(
      [...STATUTS_HORS_CA].sort(),
      'Maya et la page Finances ne comptent plus la même chose',
    ).toEqual(exclusDuDashboard);
  });
});

describe('les lecteurs de Maya passent tous par la vérité partagée', () => {
  const SOURCE = readFileSync('server/utils/copilote-data.ts', 'utf-8');

  it('le balayage voit bien le fichier (garde-fou)', () => {
    expect(SOURCE.length, 'copilote-data.ts introuvable ou vide').toBeGreaterThan(10000);
  });

  it('getFinances lie VRAIMENT les trois statuts comptés (comportemental)', async () => {
    /**
     * ⚠️ LA PREMIÈRE VERSION DE CE CAS COMPTAIT DU TEXTE, ET ELLE AVAIT DU MOU.
     *
     * Elle comparait le nombre d'occurrences de `eq(transactions.type, 'vente')`
     * au nombre de `STATUTS_CA_REALISE`, en exigeant « au moins autant ». Or
     * `getClients` écrit son filtre en SQL BRUT, donc il comptait dans les
     * filtres sans compter dans les lectures : retirer le filtre de
     * `getFinances` laissait 2 >= 2, et le banc restait VERT. La mutation l'a
     * dit ; sans elle j'aurais cru garder ce que je ne gardais pas.
     *
     * On observe donc le COMPORTEMENT : le double de base n'interprète pas le
     * SQL, il enregistre les valeurs LIÉES. Si le filtre disparaît, « payee »
     * n'est plus lié nulle part — les deux autres survivraient dans la requête
     * des impayés, ce qui est précisément le piège qu'une assertion trop large
     * ne verrait pas.
     */
    const faux = creerFauxDb({});
    Object.assign(globalThis, { db: faux.db });
    await getFinances('11111111-1111-1111-1111-111111111111', 2026);

    const uneRequeteLesPorteTous = faux.requetes.some((r) =>
      STATUTS_CA_REALISE.every((s) => r.valeurs.includes(s)),
    );
    expect(
      uneRequeteLesPorteTous,
      'aucune requête ne lie les trois statuts comptés : le chiffre d’affaires ' +
        'de Maya inclut de nouveau les brouillons et les annulées',
    ).toBe(true);
  });

  it('aucun statut EXCLU n’est jamais lié dans un filtre de chiffre d’affaires', async () => {
    // Le sens inverse : si « brouillon » apparaissait dans un filtre, c'est
    // qu'une requête l'aurait réintroduit par une autre porte.
    const faux = creerFauxDb({});
    Object.assign(globalThis, { db: faux.db });
    await getFinances('11111111-1111-1111-1111-111111111111', 2026);
    for (const s of STATUTS_HORS_CA) {
      expect(faux.aFiltreSur(s), `« ${s} » est lié dans un filtre`).toBe(false);
    }
  });

  it('le double de base a bien observé des requêtes (garde-fou)', async () => {
    // Sans ce cas, un `getFinances` qui ne partirait plus en base rendrait les
    // deux cas ci-dessus vrais par vacuité : zéro requête, zéro contre-exemple.
    const faux = creerFauxDb({});
    Object.assign(globalThis, { db: faux.db });
    await getFinances('11111111-1111-1111-1111-111111111111', 2026);
    expect(faux.requetes.length, 'aucune requête observée').toBeGreaterThan(1);
    expect(faux.aFiltreLaColonne('statut'), 'aucune requête ne filtre sur le statut').toBe(true);
  });

  it('getSerie12Mois lie AUSSI les trois statuts comptés', async () => {
    /**
     * ⚠️ DEUXIÈME TROU TROUVÉ PAR MUTATION. Le cas ci-dessus n'exerçait que
     * `getFinances` : retirer le filtre de `getSerie12Mois` laissait le banc
     * VERT. Deux lecteurs, deux cas — on n'extrapole pas d'une fonction à
     * l'autre, c'est « la couverture qui s'arrête juste avant ».
     *
     * L'enjeu est réel : c'est la courbe que Maya montre quand on lui demande
     * l'évolution. Compter les brouillons y dessine une hausse là où rien n'a
     * été facturé.
     */
    const faux = creerFauxDb({});
    Object.assign(globalThis, { db: faux.db });
    await getSerie12Mois('11111111-1111-1111-1111-111111111111');

    const uneRequeteLesPorteTous = faux.requetes.some((r) =>
      STATUTS_CA_REALISE.every((st) => r.valeurs.includes(st)),
    );
    expect(
      uneRequeteLesPorteTous,
      'la courbe 12 mois ne filtre plus le statut : elle compte les brouillons',
    ).toBe(true);
    expect(faux.requetes.length, 'aucune requête observée (garde-fou)').toBeGreaterThan(0);
  });

  it('aucun lecteur ne rejuge les statuts lui-même', () => {
    // La règle vit dans statutsFacture.ts. Un `statut <> 'annulee'` recopié ici
    // serait la sixième copie — celle par laquelle la divergence revient.
    const sansCommentaires = SOURCE.replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((l) => !/^\s*(\/\/|\*)/.test(l))
      .join('\n');
    for (const motif of [/statut\s*<>\s*'annulee'/, /notInArray\(\s*transactions\.statut/]) {
      expect(sansCommentaires, `règle de statut recopiée : ${motif}`).not.toMatch(motif);
    }
  });
});

describe('ce qui reste divergent, compté plutôt que tu', () => {
  /**
   * ⚠️ CE BLOC NE CORRIGE RIEN, IL MESURE UNE DETTE — et c'est délibéré.
   *
   * Douze fichiers lisent les ventes. Les aligner tous d'un coup changerait des
   * chiffres affichés à des clients qui paient, sur des chemins que ce chantier
   * n'a pas étudiés : ce n'est pas ma décision. Ce qui EST à moi, c'est que la
   * dette soit chiffrée et qu'elle ne puisse pas grandir en silence.
   *
   * Le cliquet est un PLAFOND : il tombe si quelqu'un ajoute une lecture de
   * ventes sans filtre. Il ne tombe pas si on en corrige une — il faut alors le
   * resserrer, ce que le message dit.
   */
  const RESTANT_CONNU = 11;

  it('le nombre de lectures de ventes encore non alignées ne grandit pas', () => {
    const fichiers = execSync(
      "grep -rl \"transactions.type, 'vente'\" server --include='*.ts' | sort",
      { encoding: 'utf-8' },
    )
      .trim()
      .split('\n')
      .filter(Boolean);
    expect(fichiers.length, 'le balayage ne voit plus rien').toBeGreaterThan(3);

    const nonAlignes = fichiers.filter(
      (f) => !readFileSync(f, 'utf-8').includes('STATUTS_CA_REALISE'),
    );
    expect(
      nonAlignes.length,
      `${nonAlignes.length} fichier(s) lisent les ventes sans la vérité partagée :\n  ` +
        nonAlignes.join('\n  ') +
        `\n\nSi ce nombre a BAISSÉ, resserre RESTANT_CONNU (actuellement ${RESTANT_CONNU}) — ` +
        'un cliquet qu’on ne resserre pas laisse le progrès se reperdre. ' +
        'S’il a MONTÉ, une nouvelle lecture compte les brouillons.',
    ).toBeLessThanOrEqual(RESTANT_CONNU);
  });
});
