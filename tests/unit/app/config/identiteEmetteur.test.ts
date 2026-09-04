// ═══════════════════════════════════════════════════════════════════════════
// QUI SIGNE LA FACTURE — et pourquoi ce n'est JAMAIS « APIGO ».
//
// ─── LE DÉFAUT ─────────────────────────────────────────────────────────────
// Trois endroits composaient le nom de l'émetteur, chacun de son côté :
//
//     app/pages/finances/facture/[id].vue   [e.prenom, e.nom].join(' ') || 'APIGO'
//     server/api/…/facturx.get.ts           idem
//     server/api/…/email.post.ts            idem
//
// Trois copies de la même règle, donc trois occasions de diverger — la source
// de la majorité des défauts de ce dépôt. Le nom commercial allait en être la
// quatrième.
//
// Et le repli lui-même était une anomalie : APIGO édite le logiciel, il ne vend
// pas le miel. Un compte au profil vide émettait des factures signées du nom de
// l'ÉDITEUR, avec le SIRET de l'apiculteur juste en dessous — et l'email au
// client s'intitulait « Votre facture FA-2026-0007 — APIGO ». Une plateforme
// agréée recoupe le SIREN avec l'annuaire des entreprises : la facture
// électronique aurait été rejetée, à juste titre.
//
// ─── MUTATIONS QUI DOIVENT FAIRE ROUGIR ────────────────────────────────────
//   · remettre `|| 'APIGO'` dans `identiteEmetteur` ;
//   · faire rendre `null` à `refusIdentiteEmetteur` quel que soit le profil ;
//   · faire passer le nom commercial en BT-27 (mention légale) ;
//   · recopier `[prenom, nom].join` dans une des trois routes.
// ═══════════════════════════════════════════════════════════════════════════

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  identiteEmetteur,
  nomLegal,
  refusIdentiteEmetteur,
  type ProfilEmetteur,
} from '~~/app/config/identite-emetteur';
import { corpsDuComposant } from '../../../helpers/corpsDuComposant';

// ─── Le produit cartésien ──────────────────────────────────────────────────

const AVEC_NOM = { prenom: 'Maël', nom: 'Dupont' };
const SANS_NOM = { prenom: null, nom: null };
const AVEC_COMMERCE = { nomCommercial: 'Le Rucher de Maël' };
const SANS_COMMERCE = { nomCommercial: null };

const CAS: { titre: string; profil: ProfilEmetteur }[] = [
  { titre: 'nom légal + nom commercial', profil: { ...AVEC_NOM, ...AVEC_COMMERCE } },
  { titre: 'nom légal seul', profil: { ...AVEC_NOM, ...SANS_COMMERCE } },
  { titre: 'nom commercial seul', profil: { ...SANS_NOM, ...AVEC_COMMERCE } },
  { titre: 'profil vide', profil: { ...SANS_NOM, ...SANS_COMMERCE } },
  { titre: 'profil absent', profil: null as unknown as ProfilEmetteur },
  { titre: 'champs à blanc', profil: { prenom: '  ', nom: '', nomCommercial: '   ' } },
];

describe('identiteEmetteur — le produit cartésien complet', () => {
  it('GARDE-FOU : le balayage couvre bien les quatre combinaisons', () => {
    expect(CAS.length).toBeGreaterThanOrEqual(4);
  });

  it.each(CAS)('« $titre » ne produit JAMAIS « APIGO »', ({ profil }) => {
    const i = identiteEmetteur(profil);
    expect(i.affichage).not.toContain('APIGO');
    expect(i.legal).not.toContain('APIGO');
  });

  it('nom légal + nom commercial : le commercial s’affiche, le légal reste en mention', () => {
    const i = identiteEmetteur({ ...AVEC_NOM, ...AVEC_COMMERCE });
    expect(i.affichage).toBe('Le Rucher de Maël');
    expect(i.legal).toBe('Maël Dupont');
    expect(i.mentionLegaleNecessaire, 'les deux noms diffèrent : montrer les deux').toBe(true);
  });

  it('nom légal seul : il sert aux deux, sans se répéter à l’écran', () => {
    const i = identiteEmetteur({ ...AVEC_NOM, ...SANS_COMMERCE });
    expect(i.affichage).toBe('Maël Dupont');
    expect(i.legal).toBe('Maël Dupont');
    expect(i.mentionLegaleNecessaire, 'répéter le même nom deux fois n’apporte rien').toBe(false);
  });

  it('un nom commercial IDENTIQUE au nom légal ne se répète pas non plus', () => {
    const i = identiteEmetteur({ ...AVEC_NOM, nomCommercial: 'Maël Dupont' });
    expect(i.mentionLegaleNecessaire).toBe(false);
  });

  it('profil vide : chaîne VIDE, pas un nom inventé', () => {
    const i = identiteEmetteur({ ...SANS_NOM, ...SANS_COMMERCE });
    expect(i.affichage).toBe('');
    expect(i.legal).toBe('');
  });

  it('les blancs ne comptent pas pour un nom', () => {
    // « prenom: '  ' » remplissait la condition `|| 'APIGO'` sans être un nom :
    // la facture s'intitulait « " " » et personne ne le voyait à la relecture.
    expect(nomLegal({ prenom: '  ', nom: '  ' })).toBe('');
  });

  it('le logo suit la même normalisation', () => {
    expect(identiteEmetteur({ logoUrl: '  ' }).logoUrl).toBeNull();
    expect(identiteEmetteur({ logoUrl: 'https://x/logo.png' }).logoUrl).toBe('https://x/logo.png');
  });
});

describe('refusIdentiteEmetteur — un refus, et une sortie', () => {
  it('GARDE-FOU : un profil complet n’est PAS refusé', () => {
    // Sans lui, un refus systématique passerait pour un correctif — et plus
    // aucune facture ne pourrait être émise.
    expect(refusIdentiteEmetteur({ ...AVEC_NOM })).toBeNull();
  });

  it('le nom COMMERCIAL seul ne suffit pas : le nom légal est obligatoire', () => {
    // Sur une facture française, l'identité du vendeur est une mention
    // obligatoire. Un nom de fantaisie ne la remplace pas.
    expect(refusIdentiteEmetteur({ ...SANS_NOM, ...AVEC_COMMERCE })).not.toBeNull();
  });

  it.each([
    ['profil vide', { ...SANS_NOM, ...SANS_COMMERCE }],
    ['profil absent', null],
    ['champs à blanc', { prenom: ' ', nom: ' ' }],
  ])('« %s » : le refus est une PHRASE qui dit où aller', (_titre, profil) => {
    const refus = refusIdentiteEmetteur(profil as ProfilEmetteur);
    expect(refus).not.toBeNull();
    expect(refus!.length, 'une phrase, pas un code').toBeGreaterThan(60);
    expect(refus!, 'la porte de sortie doit être nommée').toContain('Réglages');
    expect(refus!, 'jamais un identifiant technique').not.toMatch(/[a-z]+[A-Z][a-z]+/);
  });
});

// ─── La règle structurelle : plus aucune recopie ───────────────────────────

/**
 * ⚠️ SANS LES COMMENTAIRES, PARCE QUE C'EST TOMBÉ SEPT FOIS DANS CE DÉPÔT. Le
 * commentaire qui EXPLIQUE un correctif cite forcément le code corrigé : ceux
 * d'`identite-emetteur.ts`, de la route d'envoi et du générateur Factur-X
 * contiennent tous les trois la chaîne `[prenom, nom].join(' ') || 'APIGO'`
 * dans la phrase qui raconte pourquoi elle a disparu.
 *
 * ⚠️ ET PAR `corpsDuComposant`, PAS PAR `sansCommentaires` — LA HUITIÈME FOIS,
 * ARRIVÉE EN ÉCRIVANT CE BANC. `sansCommentaires` est un analyseur JS : lâché
 * sur un `.vue` entier, il prend les apostrophes du texte français du gabarit
 * pour des ouvertures de chaîne et cesse de reconnaître les commentaires. Le
 * banc accusait alors `EtiquetteLot.vue` pour une occurrence vivant dans le
 * commentaire qui explique justement sa correction. `corpsDuComposant` découpe
 * par section et traite chacune avec l'outil qui la comprend — et il blanchit
 * un `.ts` pur tel quel, donc il convient aux deux.
 */
function fichiers(dir: string, ext: string[]): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === '.nuxt' || e === '.output') continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...fichiers(p, ext));
    else if (ext.some((x) => e.endsWith(x))) out.push(p);
  }
  return out;
}

describe('la règle ne se recopie plus', () => {
  const SOURCES = [...fichiers('app', ['.ts', '.vue']), ...fichiers('server', ['.ts'])].filter(
    (f) => !f.endsWith('app/config/identite-emetteur.ts'),
  );

  it('GARDE-FOU : le balayage voit bien les fichiers', () => {
    // « Le balayage vide » de CLAUDE.md : un chemin erroné rend la liste vide,
    // donc la conformité « vérifiée ».
    expect(SOURCES.length).toBeGreaterThan(300);
    expect(SOURCES).toContain('server/api/finances/factures/[id]/email.post.ts');
  });

  it('plus aucun fichier ne signe un document « APIGO »', () => {
    const coupables = SOURCES.filter((f) => {
      const src = corpsDuComposant(f);
      // Le motif exact du défaut : un repli sur 'APIGO' derrière un `||`.
      return /\|\|\s*'APIGO'/.test(src);
    });
    expect(
      coupables,
      'APIGO édite le logiciel, il ne vend pas le miel : une facture signée de ' +
        'son nom désigne le mauvais vendeur sur une pièce comptable.',
    ).toEqual([]);
  });

  /**
   * ⚠️ LES DISPENSES SONT PAR MOTIF, JAMAIS PAR FICHIER — la règle de CLAUDE.md,
   * apprise sur une dispense « pour son découpage hebdomadaire » qui couvrait
   * aussi un défaut corrigeable trois lignes plus haut.
   *
   * Ce qui se dispense ici n'est PAS « ce fichier », c'est un CONCEPT DIFFÉRENT :
   * composer le nom d'affichage d'une PERSONNE (dans une interface, un email,
   * une fiche client, un compte Stripe) n'est pas signer un DOCUMENT au nom du
   * vendeur. Les deux s'écrivent pareil et n'obéissent pas à la même règle : le
   * premier peut se replier sur l'email, le second ne peut se replier sur rien.
   *
   * Chaque entrée porte donc son motif, et un cas ci-dessous exige que chaque
   * dispense soit ENCORE NÉCESSAIRE : une dispense qui ne correspond plus à
   * rien doit être supprimée, sans quoi la liste enfle en silence et finit par
   * couvrir un vrai défaut.
   */
  const DISPENSES: { fichier: string; motif: string }[] = [
    {
      fichier: 'app/stores/auth.ts',
      motif: 'nom d’affichage de l’utilisateur CONNECTÉ dans l’interface, repli sur son email',
    },
    {
      fichier: 'app/pages/admin/analytics.vue',
      motif: 'liste d’utilisateurs côté administration — des personnes, pas un émetteur',
    },
    {
      fichier: 'server/api/auth/me.get.ts',
      motif: 'nom du propriétaire de l’espace de travail, affiché dans le bandeau d’équipe',
    },
    {
      fichier: 'server/api/subscription/usage.get.ts',
      motif: 'idem — le propriétaire de l’espace, pas l’émetteur d’un document',
    },
    {
      fichier: 'server/api/membres/inviter.post.ts',
      motif: 'nom de l’INVITANT dans un email d’invitation, repli « Un apiculteur »',
    },
    {
      fichier: 'server/api/membres/[id]/relancer.post.ts',
      motif: 'idem, dans la relance d’invitation',
    },
    {
      fichier: 'server/api/stripe/trial-checkout.post.ts',
      motif: 'nom du CLIENT Stripe (état civil du payeur), pas l’en-tête d’un document',
    },
    {
      fichier: 'server/api/finances/banque/factures-ouvertes.get.ts',
      motif: 'nom du TIERS d’un mouvement bancaire — le client, jamais le vendeur',
    },
    {
      fichier: 'server/api/finances/banque/suggestions.get.ts',
      motif: 'idem — rapprochement bancaire, c’est la contrepartie qui est nommée',
    },
  ];

  /** `[prenom, nom].join` et ses variantes préfixées (`profil.prenom`, `e.prenom`). */
  const RECOPIE = /\[\s*[\w.?]*\bprenom\b[^\]]*,[^\]]*\bnom\b[^\]]*\]\s*\n?\s*\.?\s*(filter|join)/;

  const recopie = (f: string) => RECOPIE.test(corpsDuComposant(f));

  it('plus aucun DOCUMENT ne recompose le nom de l’émetteur à la main', () => {
    const dispenses = new Set(DISPENSES.map((d) => d.fichier));
    const coupables = SOURCES.filter((f) => !dispenses.has(f) && recopie(f));
    expect(
      coupables,
      'la composition du nom de l’émetteur vit dans `app/config/identite-emetteur.ts` ' +
        'et nulle part ailleurs : deux copies de la même règle finissent toujours par ' +
        'diverger. Si ce fichier nomme une PERSONNE et non un vendeur, ajoutez-lui une ' +
        'dispense AVEC SON MOTIF dans ce banc.',
    ).toEqual([]);
  });

  it('chaque dispense est ENCORE nécessaire, et porte son motif', () => {
    // Une dispense périmée est une porte laissée ouverte : le jour où le
    // fichier revient au motif interdit, plus personne ne le voit.
    for (const { fichier, motif } of DISPENSES) {
      expect(SOURCES, `${fichier} n’existe plus : retirez sa dispense`).toContain(fichier);
      expect(recopie(fichier), `${fichier} ne recopie plus rien : retirez sa dispense`).toBe(true);
      expect(motif.length, `${fichier} doit porter un motif écrit`).toBeGreaterThan(30);
    }
  });

  it('l’étiquette de pot EST un document, et elle en dérive', () => {
    // Elle était la quatrième copie, celle qu'aucune des trois autres n'avait
    // vue : la mention « producteur » est obligatoire (Règ. INCO 1169/2011), et
    // c'est le pot que le consommateur tient dans la main.
    const src = corpsDuComposant('app/components/production/EtiquetteLot.vue');
    expect(src).toMatch(/identiteEmetteur\s*\(/);
  });

  it('les trois consommateurs passent bien par la fonction partagée', () => {
    // L'autre moitié de la règle : ne pas recopier ne suffit pas, encore
    // faut-il DÉRIVER. Un fichier qui n'appellerait plus rien passerait le cas
    // précédent sans afficher aucun nom.
    for (const f of [
      'app/pages/finances/facture/[id].vue',
      'server/api/finances/factures/[id]/facturx.get.ts',
      'server/api/finances/factures/[id]/email.post.ts',
    ]) {
      const src = corpsDuComposant(f);
      expect(src, `${f} doit appeler identiteEmetteur()`).toMatch(/identiteEmetteur\s*\(/);
    }
  });
});
