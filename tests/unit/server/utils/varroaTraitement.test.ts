import { describe, it, expect } from 'vitest';
import { classifierTour } from '~~/server/utils/copilote-local';
import { MEDICAMENTS_APICOLES } from '~~/app/config/medicaments-apicoles';
import { varroaSchema } from '~~/server/utils/validation/interventions';

/**
 * LE VARROA A DEUX GESTES, ET LA DICTÉE N'EN ATTEIGNAIT QU'UN.
 *
 * Mesuré avant correction, sur le moteur réel :
 *
 *   « j'ai traité la ruche 3 à l'Apivar »        → fiche de cours sur l'Apivar
 *   « j'ai traité la ruche 3 contre le varroa »  → « Combien de varroas ? »
 *   « note un traitement varroa sur toutes mes ruches »
 *        → plan proposant nombreVarroas:1 sur CHAQUE ruche du cheptel
 *
 * Le dernier est le pire : le « un » de « un traitement » lu comme une
 * quantité, et le comptage varroa alimente le score de santé. De la donnée
 * fausse, à l'échelle du cheptel.
 *
 * ⚠️ CE BANC GARDE LES DEUX SENS. Un correctif qui ferait passer le traitement
 * en cassant le comptage — ou en rendant les fiches inatteignables — serait une
 * amputation, pas un rangement. Les cas « doit survivre » sont donc aussi
 * importants que les cas « doit marcher ».
 */

/** Le verdict de Maya sur un tour, réduit à ce qu'on veut affirmer. */
function lire(...tours: string[]) {
  const c = classifierTour(tours.map((content) => ({ role: 'user' as const, content })));
  if (c.kind === 'ecriture' && c.ecriture.action === 'intervention') {
    return { kind: 'ecriture' as const, parse: c.ecriture.parse };
  }
  if (c.kind === 'lot') return { kind: 'lot' as const, parse: c.template };
  return { kind: c.kind, parse: undefined };
}

describe('le traitement varroa est dictable, et le comptage n’a pas bougé', () => {
  it('un produit du référentiel suffit à désigner le geste', () => {
    // On ne pose de l'Apivar que contre le varroa : le nom du produit EST le
    // geste. Avant, ni « traité » ni « Apivar » n'étaient reconnus, donc la
    // phrase n'atteignait jamais l'analyseur d'écriture.
    const r = lire("j'ai traité la ruche 3 à l'Apivar");
    expect(r.kind, 'la phrase n’atteint pas l’écriture').toBe('ecriture');
    expect(r.parse?.type).toBe('varroa');
    expect(r.parse?.donnees.sousAction, 'le traitement est redevenu un comptage').toBe(
      'traitement',
    );
    expect(r.parse?.donnees.typeTraitement, 'le produit n’est pas lu du référentiel').toBe(
      'Apivar',
    );
    expect(r.parse?.rucheNumero).toBe('3');
  });

  it('le verbe seul suffit, sans produit nommé', () => {
    const r = lire("j'ai traité la ruche 3 contre le varroa");
    expect(r.parse?.donnees.sousAction).toBe('traitement');
    expect(r.parse?.manque, 'Maya doit DEMANDER le produit, pas l’inventer').toContain(
      'typeTraitement',
    );
  });

  it('les formes galéniques comptent comme des traitements', () => {
    // « j'ai posé les lanières » est la phrase d'août la plus fréquente, et elle
    // ne contient ni « varroa » ni un nom de marque.
    for (const phrase of [
      "j'ai posé les lanières sur la ruche 5",
      'traitement par dégouttement ruche 5',
      'sublimation ruche 5',
    ]) {
      expect(lire(phrase).parse?.donnees.sousAction, phrase).toBe('traitement');
    }
  });

  it('EN LOT, plus aucun varroa fantôme n’est compté', () => {
    /**
     * LE CAS QUI COMPTE LE PLUS. Avant : nombreVarroas:1 sur toutes les ruches,
     * parce que « un traitement » contient « un ». Le score de santé s'en
     * nourrissait.
     */
    const r = lire('note un traitement varroa sur toutes mes ruches');
    expect(r.kind).toBe('lot');
    expect(r.parse?.donnees.sousAction).toBe('traitement');
    expect(
      r.parse?.donnees.nombreVarroas,
      'un comptage fantôme est de nouveau proposé sur tout le cheptel',
    ).toBeUndefined();
  });

  it('LE COMPTAGE DOIT SURVIVRE — dicté d’un bloc', () => {
    const r = lire("j'ai compté 12 varroas sur la ruche 4");
    expect(r.parse?.donnees.sousAction, 'le comptage a été amputé').toBe('comptage_plancher');
    expect(r.parse?.donnees.nombreVarroas).toBe(12);
    expect(r.parse?.manque, 'un comptage complet ne doit plus rien demander').toEqual([]);
  });

  it('LE COMPTAGE DOIT SURVIVRE — en remplissage guidé', () => {
    const r = lire('comptage varroa ruche 4', '12');
    expect(r.parse?.donnees.sousAction).toBe('comptage_plancher');
    expect(r.parse?.donnees.nombreVarroas).toBe(12);
  });

  it('LES FICHES DOIVENT RESTER ATTEIGNABLES — on n’a retiré aucun savoir', () => {
    // Le correctif change l'ORDRE, pas le contenu. Poser la question doit
    // toujours rendre le cours.
    expect(lire("c'est quoi l'Apivar ?").kind).toBe('savoir');
    expect(lire('comment traiter le varroa ?').kind).toBe('savoir');
  });

  it('L’ANTI-ORDRE TIENT — une question n’écrit jamais', () => {
    // Le danger de tout élargissement de vocabulaire d'écriture. « Faut-il
    // traiter ? » demande un conseil, pas un enregistrement.
    for (const q of [
      'faut-il traiter contre le varroa chaque année ?',
      'quand traiter le varroa ?',
      'est-ce que je dois traiter mes ruches ?',
    ]) {
      expect(lire(q).kind, q).not.toBe('ecriture');
    }
  });
});

describe('le remplissage guidé du traitement', () => {
  it('produit puis numéro de lot se répondent l’un après l’autre', () => {
    const r = lire("j'ai traité la ruche 3 contre le varroa", 'Apiguard', 'LOT-2026-08');
    expect(r.parse?.donnees.typeTraitement).toBe('Apiguard');
    expect(r.parse?.donnees.numeroLotProduit).toBe('LOT-2026-08');
  });

  it('un champ LIBRE n’avale jamais la phrase du geste', () => {
    /**
     * ⚠️ DÉFAUT INTRODUIT PAR LA PREMIÈRE VERSION DE CE CHANTIER, ET RATTRAPÉ
     * PAR LA MESURE. Les trois champs du traitement sont du texte libre : ils
     * acceptaient la phrase entière au pré-remplissage, donc
     * `numeroLotProduit` valait « j'ai traité la ruche 3 à l'Apivar ».
     */
    const r = lire("j'ai traité la ruche 3 à l'Apivar");
    expect(r.parse?.donnees.numeroLotProduit, 'le numéro de lot a mangé la phrase').toBeUndefined();
    expect(r.parse?.donnees.dosage, 'le dosage a mangé la phrase').toBeUndefined();
    expect(r.parse?.manque).toContain('numeroLotProduit');
  });

  it('un champ LIBRE ne vole pas la réponse destinée à son voisin', () => {
    // Maya demande le produit, l'apiculteur répond « Apivar ». Le numéro de lot
    // ne doit pas se servir au passage.
    const r = lire("j'ai traité la ruche 3 contre le varroa", 'Apivar');
    expect(r.parse?.donnees.typeTraitement).toBe('Apivar');
    expect(
      r.parse?.donnees.numeroLotProduit,
      'le lot a volé la réponse du produit',
    ).toBeUndefined();
  });
});

describe('les deux tables dérivent de leur source', () => {
  it('les sous-actions dictables existent toutes dans le schéma Zod', () => {
    // Dériver, jamais recopier : une sous-action que la dictée produirait sans
    // que Zod la connaisse serait rejetée à l'écriture, après la confirmation
    // de l'apiculteur — le pire moment pour échouer.
    const connuesDeZod = varroaSchema.options.map(
      (o) => (o.shape.sousAction as { value: string }).value,
    );
    for (const s of ['comptage_plancher', 'traitement']) {
      expect(connuesDeZod, `${s} n’est pas validable`).toContain(s);
    }
  });

  it('les produits proposés dérivent du référentiel, et rien que les varroacides', () => {
    /**
     * Le Tylan soigne la loque américaine : le proposer contre le varroa serait
     * un conseil sanitaire faux. La liste se filtre sur l'indication, elle ne
     * se recopie pas — un banc qui citerait dix noms diverger ait au premier ajout.
     */
    const varroacides = MEDICAMENTS_APICOLES.filter((m) => m.indication === 'Varroase');
    expect(varroacides.length, 'le référentiel ne porte plus de varroacide').toBeGreaterThan(3);

    for (const m of varroacides.slice(0, 4)) {
      const r = lire(`j'ai traité la ruche 2 au ${m.nom}`);
      expect(r.parse?.donnees.typeTraitement, `${m.nom} n’est pas reconnu`).toBe(m.nom);
    }
    // Et le contrôle négatif : un médicament d'une AUTRE indication ne doit pas
    // déclencher un traitement varroa.
    const autre = MEDICAMENTS_APICOLES.find((m) => m.indication !== 'Varroase');
    expect(autre, 'le référentiel n’a plus qu’une indication').toBeDefined();
    const r = lire(`j'ai donné du ${autre!.nom} à la ruche 2`);
    expect(
      r.parse?.donnees.sousAction,
      `${autre!.nom} (${autre!.indication}) déclenche un traitement VARROA`,
    ).not.toBe('traitement');
  });
});
