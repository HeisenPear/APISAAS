import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PATCH_NOTE } from '~/config/patchNotes';

/**
 * La note de patch est vue UNE fois par apiculteur, à la première connexion qui
 * suit une mise à jour. Personne ne la relira pour corriger une coquille : ce
 * banc verrouille ce qui, s'il cassait, casserait en silence pour tout le monde
 * en même temps.
 */
describe('note de patch', () => {
  it('porte un identifiant de version exploitable', () => {
    // C'est LUI qui décide de re-montrer l'annonce (usePatchNotes compare la
    // valeur stockée). Vide ou avec une espace parasite, la comparaison se
    // décale et l'annonce se remontre à chaque connexion.
    expect(PATCH_NOTE.id.trim()).toBe(PATCH_NOTE.id);
    expect(PATCH_NOTE.id.length).toBeGreaterThan(0);
  });

  it('n’annonce pas plus d’entrées que la cascade n’en sait décaler', () => {
    // Le plafond n'est pas une opinion : `.animate-stagger` de main.css donne
    // son retard par `nth-child`, un par un. Au-delà du dernier rang écrit, les
    // entrées surgissent toutes ensemble, en décalage avec les premières.
    //
    // On LIT donc le plafond dans le CSS au lieu de le recopier ici. Recopié, il
    // aurait dérivé le jour où la liste s'allonge — c'est exactement ce qui est
    // arrivé : la note est passée à dix entrées alors que la cascade s'arrêtait
    // à huit.
    const css = readFileSync('app/assets/css/main.css', 'utf-8');
    const rangs = [...css.matchAll(/\.animate-stagger > \*:nth-child\((\d+)\)/g)].map((m) =>
      Number(m[1]),
    );
    expect(rangs.length, 'cascade introuvable dans main.css').toBeGreaterThan(0);

    // Le bloc « sécurité » est un enfant de plus dans le même conteneur.
    const enfants = PATCH_NOTE.nouveautes.length + (PATCH_NOTE.securite ? 1 : 0);
    expect(PATCH_NOTE.nouveautes.length).toBeGreaterThanOrEqual(3);
    expect(
      enfants,
      `La note rend ${enfants} blocs, la cascade n'en décale que ${Math.max(...rangs)}. ` +
        'Ajoute les rangs manquants dans main.css, ou raccourcis la note.',
    ).toBeLessThanOrEqual(Math.max(...rangs));
  });

  it('n’utilise que des icônes lucide réellement chargeables', () => {
    // Le bundle d'icônes est en mode `local` et ne contient QUE lucide : un
    // préfixe d'une autre collection rend un carré vide en production.
    for (const n of PATCH_NOTE.nouveautes) {
      expect(n.icone).toMatch(/^i-lucide-[a-z0-9-]+$/);
    }
  });

  it('ne répète ni une icône ni un titre', () => {
    const icones = PATCH_NOTE.nouveautes.map((n) => n.icone);
    const titres = PATCH_NOTE.nouveautes.map((n) => n.titre);
    expect(new Set(icones).size).toBe(icones.length);
    expect(new Set(titres).size).toBe(titres.length);
  });

  it('n’affiche aucun libellé vide ou mal détouré', () => {
    const textes = [
      PATCH_NOTE.badge,
      PATCH_NOTE.titre,
      PATCH_NOTE.sousTitre,
      PATCH_NOTE.cta,
      ...(PATCH_NOTE.pied ? [PATCH_NOTE.pied] : []),
      ...PATCH_NOTE.nouveautes.flatMap((n) => [n.titre, n.texte]),
      // Le bloc « Sous le capot » était absent de cette liste : ses six puces
      // étaient les seules chaînes AFFICHÉES du fichier qu'aucun banc ne
      // regardait — et ce sont précisément celles qui ont dû être réécrites.
      ...(PATCH_NOTE.securite
        ? [
            PATCH_NOTE.securite.titre,
            PATCH_NOTE.securite.texte,
            ...(PATCH_NOTE.securite.details ?? []),
          ]
        : []),
    ];
    for (const t of textes) {
      expect(t.length).toBeGreaterThan(0);
      expect(t.trim()).toBe(t);
    }
  });

  it('« Sous le capot » se rédige au PRÉSENT, jamais en aveu', () => {
    /**
     * LE DÉFAUT COMMERCIAL QUE CE BANC EXISTE POUR EMPÊCHER.
     *
     * Ce bloc est lu par des PROSPECTS. Sa première version décrivait six
     * réparations — « ne conserve plus », « étaient servies en fichier
     * statique », « au lieu de faire croire que vous n'avez rien ». Chaque
     * énoncé était exact, et l'ensemble se lisait « ce logiciel n'était pas
     * fiable ». On se tirait une balle dans le pied avec des phrases vraies.
     *
     * Le fond était même meilleur que l'aveu : le traitement d'un prélèvement
     * qui échoue PROTÈGE le client (rien n'est coupé pendant les relances), et
     * la rédaction le cachait derrière un « ne conserve plus ».
     *
     * La règle n'est pas d'embellir mais de décrire l'ÉTAT, pas l'historique.
     * Ces tournures sont les marqueurs de l'aveu : elles supposent toutes un
     * « avant » défaillant.
     */
    const AVEUX = [
      /\bne (?:conserve|conservent|sont|est|le sont|garde|gardent) plus\b/i,
      /\bdésormais\b/i,
      /\bau lieu de faire croire\b/i,
      /\bétai(?:t|ent)\b/i,
      /\benfin\b/i,
      /\bre(?:vérifié|vérifiés|paré|parés)\b/i,
    ];
    const puces = [PATCH_NOTE.securite?.texte ?? '', ...(PATCH_NOTE.securite?.details ?? [])];
    for (const puce of puces) {
      for (const aveu of AVEUX) {
        expect(aveu.test(puce), `aveu dans « ${puce.slice(0, 70)}… »`).toBe(false);
      }
    }
  });

  it('les chiffres annoncés sous le capot ne dérivent pas', () => {
    /**
     * Le bloc annonçait « 1 408 vérifications » alors que la suite en comptait
     * bien davantage. Un chiffre faux dans le sens de la MODESTIE reste un
     * chiffre faux — et le jour où quelqu'un le vérifie, c'est tout le bloc
     * qui perd son crédit. On ne peut pas compter les tests depuis un test
     * sans boucle, mais on peut exiger que le chiffre soit PLAUSIBLE et
     * qu'aucun autre nombre ne traîne sans unité.
     *
     * ⚠️ ET LE CHIFFRE S'ANNONCE COMME UN PLANCHER, PAS COMME UN COMPTE EXACT.
     * J'avais d'abord écrit « 1 789 vérifications » — le compte du jour. Deux
     * bancs ajoutés dans le même commit (ceux-ci) l'ont fait dériver
     * immédiatement à 1 791. Un compte exact dans une page commerciale est un
     * piège d'entretien : il est faux le lendemain, et personne ne pense à le
     * relire. « Plus de 1 700 » reste vrai en grandissant.
     */
    const puces = PATCH_NOTE.securite?.details ?? [];
    const chiffres = puces.join(' ').match(/\d[\d\u202f\u00a0 ]*\d|\d/g) ?? [];
    expect(chiffres.length, 'aucun chiffre annoncé : le bloc a perdu sa substance').toBeGreaterThan(
      0,
    );
    const compteDeTests = puces.find((p) => /vérification/i.test(p)) ?? '';
    expect(
      compteDeTests,
      'le nombre de vérifications doit être un PLANCHER (« plus de … »), sinon il dérive au commit suivant',
    ).toMatch(/plus de/i);
    for (const c of chiffres) {
      const n = Number(c.replace(/[\u202f\u00a0 ]/g, ''));
      expect(Number.isFinite(n), `nombre illisible : ${c}`).toBe(true);
      expect(n, `${c} : un compte à zéro ne s’annonce pas`).toBeGreaterThan(0);
    }
  });

  it('garde un badge et un bouton assez courts pour ne pas déborder', () => {
    // Le badge est une pastille d'en-tête et le bouton fait toute la largeur
    // d'une modale de 420 px : au-delà, ça se coupe sur un téléphone.
    expect(PATCH_NOTE.badge.length).toBeLessThanOrEqual(18);
    expect(PATCH_NOTE.cta.length).toBeLessThanOrEqual(28);
  });
});
