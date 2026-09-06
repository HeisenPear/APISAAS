import { describe, it, expect } from 'vitest';
import { dateDite } from '~~/server/utils/dateDite';

/**
 * « Demain », « mardi », « le 15 mars » — et les deux pièges du fuseau.
 *
 * Ce banc existe parce qu'une visite mal datée NE SE VOIT PAS. Elle est
 * enregistrée, confirmée, elle apparaît dans le calendrier — juste pas le bon
 * jour. L'apiculteur ne s'en aperçoit qu'en ne se déplaçant pas.
 */

/** Un instant lisible : `iso` en UTC. */
const a = (iso: string) => new Date(iso);
/** Le jour d'un résultat, en `AAAA-MM-JJ`. */
const jour = (r: { jour: Date } | null) => r?.jour.toISOString().slice(0, 10) ?? null;

describe('garde-fou', () => {
  it('une phrase sans date ne rend rien', () => {
    // Sans ce cas, une fonction qui rendrait TOUJOURS une date passerait tout
    // le reste — et daterait au hasard chaque visite sans date dite.
    expect(dateDite('note un controle sur la ruche 5', a('2026-03-10T09:00:00Z'))).toBeNull();
    expect(dateDite('', a('2026-03-10T09:00:00Z'))).toBeNull();
  });

  it('reconnaît la forme la plus simple', () => {
    expect(jour(dateDite('demain', a('2026-03-10T09:00:00Z')))).toBe('2026-03-11');
  });
});

describe('le jour de L’APICULTEUR, pas celui du serveur', () => {
  /**
   * ⚠️ LE PIÈGE CENTRAL DE CE FICHIER, ET IL NE SE VOIT QU'À CERTAINES HEURES.
   * Les lambdas Vercel tournent en UTC. À 00 h 30 à Paris (heure d'hiver), il
   * est 23 h 30 la VEILLE en UTC. Un « demain » calculé sur l'horloge du
   * serveur donnerait donc le jour même pour l'apiculteur — une visite calée
   * pour demain, posée aujourd'hui.
   *
   * Le défaut ne se produit qu'entre minuit et 1 h (ou 2 h en été) : jamais
   * reproduit à la demande, vu de temps en temps. C'est exactement la
   * proportion que CLAUDE.md décrit comme la pire.
   */
  it('après minuit à Paris, « demain » suit le jour PARISIEN', () => {
    // 23 h 30 UTC le 10 mars = 00 h 30 à Paris le 11 mars.
    const instant = a('2026-03-10T23:30:00Z');
    expect(
      jour(dateDite('demain', instant)),
      'Le jour de référence est celui du serveur (UTC), pas celui de l’apiculteur : ' +
        'entre minuit et 1 h, toute visite calée « demain » tombe aujourd’hui.',
    ).toBe('2026-03-12');
  });

  it('avant minuit à Paris, le jour est celui qu’on croit', () => {
    // 22 h 30 UTC = 23 h 30 à Paris, même jour civil des deux côtés.
    expect(jour(dateDite('demain', a('2026-03-10T22:30:00Z')))).toBe('2026-03-11');
  });

  it('en heure d’été, le décalage est de deux heures', () => {
    // 22 h 30 UTC le 15 juillet = 00 h 30 à Paris le 16 juillet.
    expect(jour(dateDite('demain', a('2026-07-15T22:30:00Z')))).toBe('2026-07-17');
  });
});

describe('la valeur stockée est à minuit UTC, jamais à minuit à Paris', () => {
  /**
   * ⚠️ UNE ÉCHÉANCE POSÉE À MINUIT À PARIS SE RELIT « JOUR J−1 » EN UTC. Le
   * dépôt a déjà payé ce défaut : une échéance du 1er du mois se retrouvait
   * projetée dans le mois PRÉCÉDENT. `jourUtc` pour ce qu'on écrit,
   * `minuitParis` pour ce qui borne une requête — et ce sont deux questions.
   */
  it('le jour rendu est exactement minuit UTC', () => {
    const r = dateDite('demain', a('2026-03-10T09:00:00Z'));
    expect(r!.jour.toISOString()).toBe('2026-03-11T00:00:00.000Z');
  });

  it('même en été, où Paris est à UTC+2', () => {
    const r = dateDite('demain', a('2026-07-15T09:00:00Z'));
    expect(r!.jour.toISOString()).toBe('2026-07-16T00:00:00.000Z');
  });
});

describe('les expressions relatives', () => {
  const MARDI = a('2026-03-10T09:00:00Z'); // le 10 mars 2026 est un mardi

  it('« après-demain » n’est pas lu comme « demain »', () => {
    // L'ordre des motifs compte : « après-demain » contient « demain ».
    expect(jour(dateDite('apres-demain', MARDI))).toBe('2026-03-12');
    expect(jour(dateDite('après demain', MARDI))).toBe('2026-03-12');
  });

  it('« aujourd’hui » rend le jour même', () => {
    expect(jour(dateDite("aujourd'hui", MARDI))).toBe('2026-03-10');
    expect(jour(dateDite('aujourd hui', MARDI))).toBe('2026-03-10');
  });

  it('« dans N jours » compte N jours', () => {
    expect(jour(dateDite('dans 3 jours', MARDI))).toBe('2026-03-13');
    expect(jour(dateDite('dans 1 jour', MARDI))).toBe('2026-03-11');
  });

  it('« la semaine prochaine » vaut sept jours, et ne devine pas le lundi', () => {
    /**
     * Transformer une intention floue en date précise afficherait une
     * exactitude que l'apiculteur n'a pas voulue — il découvrirait un
     * rendez-vous là où il pensait avoir dit « bientôt ».
     */
    expect(jour(dateDite('la semaine prochaine', MARDI))).toBe('2026-03-17');
  });

  it('franchit un changement de mois sans inventer de jour', () => {
    // Le 31 janvier + 1 jour = 1er février. `setMonth` aurait produit « le
    // 31 février », reporté au 2 ou 3 mars selon l'année.
    expect(jour(dateDite('demain', a('2026-01-31T09:00:00Z')))).toBe('2026-02-01');
    expect(jour(dateDite('dans 2 jours', a('2026-12-30T09:00:00Z')))).toBe('2027-01-01');
  });
});

describe('les jours de la semaine — le PROCHAIN, jamais celui qui passe', () => {
  const MARDI = a('2026-03-10T09:00:00Z'); // mardi

  it('un jour à venir dans la semaine tombe cette semaine', () => {
    expect(jour(dateDite('jeudi', MARDI))).toBe('2026-03-12');
  });

  it('un jour déjà passé bascule à la semaine suivante', () => {
    // Lundi est la veille : « lundi » veut dire le lundi PROCHAIN.
    expect(jour(dateDite('lundi', MARDI))).toBe('2026-03-16');
  });

  it('LE JOUR MÊME renvoie à la semaine suivante, pas à aujourd’hui', () => {
    /**
     * ⚠️ SANS LE `|| 7`, L'ÉCART VAUT 0 ET LA VISITE TOMBE LE JOUR MÊME.
     * « Cale une visite mardi », dit un mardi, ne veut pas dire « maintenant » :
     * ce serait enregistrer une visite qu'on est en train de faire, pas en
     * planifier une. Qui veut aujourd'hui dit « aujourd'hui ».
     */
    expect(
      jour(dateDite('mardi', MARDI)),
      'Un jour de semaine prononcé le jour même pose la visite AUJOURD’HUI : ' +
        'planifier devient enregistrer.',
    ).toBe('2026-03-17');
  });

  it('reconnaît tous les jours de la semaine', () => {
    const attendus: Record<string, string> = {
      lundi: '2026-03-16',
      mardi: '2026-03-17',
      mercredi: '2026-03-11',
      jeudi: '2026-03-12',
      vendredi: '2026-03-13',
      samedi: '2026-03-14',
      dimanche: '2026-03-15',
    };
    for (const [nom, attendu] of Object.entries(attendus)) {
      expect(jour(dateDite(nom, MARDI)), `« ${nom} » mal placé`).toBe(attendu);
    }
  });
});

describe('les dates nommées', () => {
  it('« le 15 mars » en janvier vise l’année en cours', () => {
    expect(jour(dateDite('le 15 mars', a('2026-01-05T09:00:00Z')))).toBe('2026-03-15');
  });

  it('« le 15 mars » en novembre vise l’année SUIVANTE', () => {
    /**
     * Un apiculteur qui parle du 15 mars en novembre parle du printemps qui
     * vient. Poser la visite huit mois en arrière la rendrait invisible dans
     * le calendrier, et elle serait comptée comme une visite manquée.
     */
    expect(jour(dateDite('le 15 mars', a('2026-11-20T09:00:00Z')))).toBe('2027-03-15');
  });

  it('accepte les accents et l’absence de « le »', () => {
    expect(jour(dateDite('3 fevrier', a('2026-01-05T09:00:00Z')))).toBe('2026-02-03');
    expect(jour(dateDite('le 3 février', a('2026-01-05T09:00:00Z')))).toBe('2026-02-03');
  });

  it('REFUSE un jour qui n’existe pas plutôt que de le reporter', () => {
    /**
     * ⚠️ `Date.UTC(2026, 1, 31)` REND LE 3 MARS, EN SILENCE. Une date
     * fabriquée est pire qu'une phrase non comprise : Maya redemande sur une
     * phrase non comprise, alors qu'une visite mal datée passe inaperçue.
     */
    expect(dateDite('le 31 fevrier', a('2026-01-05T09:00:00Z'))).toBeNull();
    expect(dateDite('le 31 avril', a('2026-01-05T09:00:00Z'))).toBeNull();
    expect(dateDite('le 0 mars', a('2026-01-05T09:00:00Z'))).toBeNull();
  });

  it('le 29 février existe une année bissextile, pas les autres', () => {
    // 2028 est bissextile, 2027 ne l'est pas.
    expect(jour(dateDite('le 29 fevrier', a('2028-01-05T09:00:00Z')))).toBe('2028-02-29');
    expect(dateDite('le 29 fevrier', a('2027-01-05T09:00:00Z'))).toBeNull();
  });
});

describe('dans une vraie phrase', () => {
  const MARDI = a('2026-03-10T09:00:00Z');

  it('trouve la date au milieu du reste', () => {
    expect(jour(dateDite('cale une visite jeudi sur la ruche 5', MARDI))).toBe('2026-03-12');
    expect(jour(dateDite('programme une visite demain au rucher des tilleuls', MARDI))).toBe(
      '2026-03-11',
    );
  });

  it('ne prend pas un numéro de ruche pour une date', () => {
    // « ruche 15 » ne doit pas devenir « le 15 » de quelque chose : sans nom
    // de mois, il n'y a pas de date.
    expect(dateDite('note un controle sur la ruche 15', MARDI)).toBeNull();
  });
});
