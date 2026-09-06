import { describe, it, expect } from 'vitest';
import { analyserIntervention, estVisitePlanifiee } from '~~/server/utils/copilote-actions';
import { classifierTour } from '~~/server/utils/copilote-local';

// ═══════════════════════════════════════════════════════════════════════════
// PLANIFIER N'EST PAS INVENTER.
//
// Le moteur refusait toute écriture sur une phrase au futur — à raison pour
// « il faut acheter du candi », qui fabriquerait une dépense inexistante. Mais
// il confondait deux choses :
//
//   · un FAIT qui n'a pas eu lieu       → ne rien écrire
//   · un PLAN qu'on veut CONSIGNER      → écrire le rendez-vous
//
// ⚠️ CE BANC TESTE LES DEUX SENS, ET C'EST LA MOITIÉ QUI COMPTE LE PLUS. Ne
// vérifier que « la visite passe » laisserait rouvrir le trou de la dépense
// fantôme au premier élargissement du motif — c'est « le gating marche dans
// les DEUX sens » du dépôt, appliqué à une porte de langage.
//
// Mesuré AVANT le correctif :
//   « programme une visite demain sur le rucher des tilleuls » → navigation
//   « planifie une visite la semaine prochaine »               → incompris
//   « prévois une visite jeudi »                               → incompris
//   « cale une visite mardi sur la ruche 5 »  → écriture, mais SANS DATE,
//        donc posée AUJOURD'HUI — et réclamant cinq observations d'une visite
//        qui n'a pas eu lieu.
// ═══════════════════════════════════════════════════════════════════════════

const MARDI = new Date('2026-03-10T09:00:00Z'); // un mardi
const jour = (d?: Date) => d?.toISOString().slice(0, 10);

describe('garde-fou', () => {
  it('la règle distingue bien quelque chose', () => {
    // Sans ce cas, une fonction qui rendrait toujours `true` (ou `false`)
    // rendrait vertes la moitié des règles ci-dessous.
    expect(estVisitePlanifiee('programme une visite demain')).toBe(true);
    expect(estVisitePlanifiee('bonjour')).toBe(false);
  });
});

describe('CE QUI DOIT PASSER — inscrire un rendez-vous', () => {
  const PHRASES = [
    'programme une visite demain sur le rucher des tilleuls',
    'planifie une visite la semaine prochaine',
    'cale une visite mardi sur la ruche 5',
    'prevois une visite jeudi',
    'organise un controle vendredi',
  ];

  for (const phrase of PHRASES) {
    it(`« ${phrase} » devient une écriture d’intervention`, () => {
      const d = classifierTour([{ role: 'user', content: phrase }]);
      expect(
        d.kind,
        'La phrase n’est pas comprise comme une écriture : l’apiculteur demande à ' +
          'consigner un rendez-vous et Maya lui répond autre chose.',
      ).toBe('ecriture');
      if (d.kind === 'ecriture') expect(d.ecriture.action).toBe('intervention');
    });
  }
});

describe('CE QUI NE DOIT PAS PASSER — un fait qui n’a pas eu lieu', () => {
  /**
   * ⚠️ LE TROU QU'ON NE DOIT PAS ROUVRIR. Enregistrer une charge sur une phrase
   * au futur fabrique une dépense qui n'existe pas : la trésorerie ment, et le
   * bilan avec elle. Ces phrases portent toutes un verbe d'intention — c'est
   * exactement ce qui rend la distinction fragile.
   */
  const PHRASES = [
    'il faut acheter du candi',
    'rappel acheter des cadres',
    'je dois payer l assurance',
    'pense a commander des hausses',
    /**
     * ⚠️ CELLE-CI VIT ICI ET PAS AU CORPUS, ET LA RAISON COMPTE. Le corpus
     * mesure ce que Maya COMPREND : sa famille `anti-ordre` ne contient que des
     * QUESTIONS, dont le verdict attendu est `savoir`. « Il faudrait vendre les
     * pots » n'est pas une question — c'est un pense-bête. Maya répond « je
     * n'ai pas compris », ce qui est honnête : il n'y a rien à expliquer.
     *
     * L'y inscrire en attendant `savoir` aurait été truquer le corpus pour
     * faire tenir un cas dont la vraie propriété est ailleurs : elle ne doit
     * RIEN ÉCRIRE. C'est cette propriété-là qui est mesurée ici, et elle a
     * trouvé un défaut réel — la vente s'enregistrait.
     */
    'il faudrait vendre les pots de printemps',
    'je prevois d acheter un extracteur',
  ];

  for (const phrase of PHRASES) {
    it(`« ${phrase} » n’écrit RIEN`, () => {
      expect(
        estVisitePlanifiee(phrase),
        'Cette phrase franchit la porte des visites planifiées alors qu’elle ne parle ' +
          'd’aucune visite : le motif est trop large, et une dépense inexistante peut ' +
          'de nouveau être écrite.',
      ).toBe(false);

      const d = classifierTour([{ role: 'user', content: phrase }]);
      expect(d.kind, `« ${phrase} » a produit une écriture`).not.toBe('ecriture');
    });
  }

  it('une QUESTION sur la planification n’écrit rien non plus', () => {
    // « comment planifier une visite ? » demande la marche à suivre.
    expect(estVisitePlanifiee('comment planifier une visite ?')).toBe(false);
    expect(estVisitePlanifiee('est-ce que je peux programmer une visite ?')).toBe(false);
  });
});

describe('la DATE part avec l’écriture', () => {
  it('« demain » pose la visite demain, pas aujourd’hui', () => {
    /**
     * ⚠️ LE DÉFAUT D'ORIGINE. `analyserIntervention` ne rendait aucun champ de
     * date : `dateVisite: body.date ?? new Date()` reposait donc la visite le
     * jour même. Une visite calée pour demain apparaissait dans le calendrier
     * d'aujourd'hui, et jamais demain — l'apiculteur ne s'en aperçoit qu'en ne
     * se déplaçant pas.
     */
    const p = analyserIntervention(
      'cale une visite demain sur la ruche 5',
      'cale une visite demain sur la ruche 5',
      MARDI,
    );
    expect(jour(p.date), 'aucune date, ou la mauvaise : la visite retombe aujourd’hui').toBe(
      '2026-03-11',
    );
  });

  it('un jour nommé vise le prochain', () => {
    const p = analyserIntervention('visite jeudi ruche 3', 'visite jeudi ruche 3', MARDI);
    expect(jour(p.date)).toBe('2026-03-12');
  });

  it('une phrase SANS date n’en invente pas', () => {
    const p = analyserIntervention(
      'note un controle ruche 5 reine vue',
      'note un controle ruche 5 reine vue',
      MARDI,
    );
    expect(p.date, 'une date est apparue là où l’apiculteur n’en a dit aucune').toBeUndefined();
  });
});

describe('une visite À VENIR ne se fait pas interroger sur ce qu’elle aurait vu', () => {
  it('ne réclame que la ruche, jamais les observations', () => {
    /**
     * ⚠️ C'EST CE QUI RENDAIT LA PLANIFICATION INUTILISABLE LÀ MÊME OÙ ELLE
     * ÉTAIT COMPRISE. « Cale une visite mardi » produisait une intervention
     * dont il manquait `reineVue`, `couvainPresent`, `reserves`,
     * `forceColonie`, `comportement` — cinq questions sur une visite qui n'a
     * pas eu lieu. Le flux guidé les posait une à une, et n'aboutissait
     * jamais : personne ne peut dire si la reine était là mardi prochain.
     */
    const p = analyserIntervention(
      'programme une visite demain',
      'programme une visite demain',
      MARDI,
    );
    expect(p.planifiee).toBe(true);
    expect(
      p.manque.filter((k) => k !== 'ruche'),
      'Maya demande des observations sur une visite à venir : le flux ne peut pas aboutir.',
    ).toEqual([]);
  });

  it('une visite RACONTÉE garde ses observations', () => {
    /**
     * L'autre bord, et il compte autant : « note la visite d'aujourd'hui »
     * raconte un fait. Lui retirer ses questions ferait perdre les
     * observations que l'apiculteur a justement voulu consigner.
     */
    const p = analyserIntervention(
      "note la visite d'aujourd'hui sur la ruche 5",
      "note la visite d'aujourd'hui sur la ruche 5",
      MARDI,
    );
    expect(p.planifiee, 'une visite du jour est prise pour une visite à venir').toBeFalsy();
    expect(
      p.manque.length,
      'les observations d’une visite RACONTÉE ne sont plus demandées',
    ).toBeGreaterThan(0);
  });

  it('une date FUTURE suffit, même sans verbe de planification', () => {
    // « visite jeudi ruche 3 » ne dit pas « programme », mais jeudi est devant.
    const p = analyserIntervention('visite jeudi ruche 3', 'visite jeudi ruche 3', MARDI);
    expect(p.planifiee).toBe(true);
  });
});
