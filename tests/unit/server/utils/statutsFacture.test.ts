import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import {
  STATUTS_CA_REALISE,
  STATUTS_HORS_CA,
  compteDansLeCa,
} from '~~/server/utils/statutsFacture';
import { statutFactureEnum } from '~~/server/database/schema';

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

  it('les trois lectures de ventes filtrent le statut', () => {
    /**
     * On compte les requêtes sur les ventes, et on exige autant de filtres.
     * Compter plutôt que citer : une quatrième lecture ajoutée demain fera
     * tomber ce cas au lieu de passer inaperçue.
     */
    const requetesVentes = [...SOURCE.matchAll(/eq\(\s*transactions\.type,\s*'vente'\s*\)/g)]
      .length;
    const filtres = [...SOURCE.matchAll(/STATUTS_CA_REALISE/g)].length;
    expect(requetesVentes, 'plus aucune lecture de ventes : le balayage est vide').toBeGreaterThan(
      0,
    );
    expect(
      filtres,
      `${requetesVentes} lecture(s) de ventes pour ${filtres} filtre(s) de statut : ` +
        'une lecture compte encore les brouillons',
    ).toBeGreaterThanOrEqual(requetesVentes);
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
