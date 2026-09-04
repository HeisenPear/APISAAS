// ═══════════════════════════════════════════════════════════════════════════
// UN TOUR QUI DÉSIGNE UN ÉLÉMENT INEXISTANT NE SIGNALE RIEN — IL S'AFFICHE VIDE.
//
// ─── LE DÉFAUT ─────────────────────────────────────────────────────────────
// Chaque étape d'un tour interactif vise un élément par son ancre
// `data-tutorial="…"`. Quand l'élément n'existe pas, `TutorialOverlay` met
// simplement `targetRect = null` : plus de surlignage, et la carte d'explication
// flotte au milieu de l'écran en montrant… rien. Aucune erreur, aucun message.
//
// TROIS ancres étaient DÉCLARÉES sans être POSÉES nulle part :
//
//     dashboard-kpis              (Premiers pas, Pilotage)
//     production-nouvelle-recolte (Production)
//     production-recoltes-liste   (Production)
//
// Conséquence : le tour « Production » était ENTIÈREMENT creux — pas une seule
// étape qui montrait quoi que ce soit. L'apiculteur lançait la visite guidée et
// regardait des cartes flotter dans le vide.
//
// ⚠️ CET EN-TÊTE A DIT « QUATRE », ET ACCUSAIT `nav-pilotage`. C'était faux :
// la barre latérale la pose par une LIAISON ternaire, invisible à toute
// recherche de la forme littérale. Le cas « CONTRÔLE POSITIF » plus bas existe
// pour cette raison précise — et le fait qu'il ait coexisté avec un en-tête qui
// le contredisait montre qu'un commentaire faux survit très bien à côté de sa
// propre réfutation.
//
// ⚠️ ET RIEN NE POUVAIT LE VOIR. Le lien entre une étape et son ancre est une
// CHAÎNE dans un sélecteur CSS : ni le typecheck, ni le lint, ni aucun banc ne
// rapproche les deux côtés. Il faut aller chercher les ancres dans les gabarits.
//
// ─── MUTATION QUI DOIT FAIRE ROUGIR ────────────────────────────────────────
// Retirer un `data-tutorial="…"` d'une page → rouge, en nommant l'ancre ET le
// tour qui la réclame.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_TUTORIALS } from '~~/app/config/tutorials';
import { NAV_SECTIONS } from '~~/app/config/navigation';

/** Tous les gabarits où une ancre peut vivre. */
function fichiersVue(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...fichiersVue(p));
    else if (e.endsWith('.vue')) out.push(p);
  }
  return out;
}

const SOURCES = fichiersVue('app');

/**
 * Les ancres POSÉES, avec le fichier qui les porte.
 *
 * ⚠️ LA FORME LIÉE COMPTE AUTANT QUE LA FORME LITTÉRALE, ET CE BANC A FAILLI
 * ACCUSER À TORT. Sa première version ne cherchait que
 * `data-tutorial="nav-pilotage"` ; la barre latérale, elle, écrit
 * `:data-tutorial="section.key === 'pilotage' ? 'nav-pilotage' : undefined"`.
 * L'ancre est bel et bien posée, et le banc la déclarait morte — il aurait fait
 * supprimer une étape parfaitement valide. C'est « la sonde aveugle à une
 * majuscule » de CLAUDE.md, en version guillemets.
 *
 * On lit donc AUSSI les littéraux de chaîne à l'intérieur d'une liaison, et les
 * préfixes d'une concaténation (`'nav-' + section.key`).
 */
const posees = new Map<string, string>();
const prefixesCalcules: { prefixe: string; fichier: string }[] = [];

for (const f of SOURCES) {
  const src = readFileSync(f, 'utf8');

  // Forme littérale : data-tutorial="quelque-chose"
  for (const m of src.matchAll(/(?<!:)data-tutorial="([a-z0-9-]+)"/g)) {
    if (!posees.has(m[1]!)) posees.set(m[1]!, f);
  }

  // Forme liée : :data-tutorial="…expression…" — on prend tout ce qu'elle cite.
  for (const m of src.matchAll(/:data-tutorial="([^"]*)"/g)) {
    const expr = m[1]!;
    for (const lit of expr.matchAll(/'([a-z0-9-]+)'/g)) {
      if (!posees.has(lit[1]!)) posees.set(lit[1]!, f);
    }
    // Concaténation : 'nav-' + section.key → tout ce qui commence par `nav-`.
    for (const pre of expr.matchAll(/'([a-z0-9-]*-)'\s*\+/g)) {
      prefixesCalcules.push({ prefixe: pre[1]!, fichier: f });
    }
    /**
     * Gabarit littéral : `nav-item-${item.to…}`.
     *
     * ⚠️ TROISIÈME ÉCRITURE, ET LE BANC L'A REFUSÉE AVANT DE LA CONNAÎTRE. Il
     * reconnaissait la forme littérale et la concaténation ; les ancres de
     * module, elles, sont calculées par un gabarit. Il a donc déclaré mortes
     * une trentaine d'ancres parfaitement posées. Une sonde qui ne voit qu'une
     * partie des écritures produit des faux positifs — et un faux positif fait
     * supprimer du code juste.
     */
    for (const pre of expr.matchAll(/`([a-z0-9-]*-)\$\{/g)) {
      prefixesCalcules.push({ prefixe: pre[1]!, fichier: f });
    }
  }
}

/** L'ancre visée par une étape, extraite de son sélecteur. */
function ancreDe(target: string): string | null {
  return target.match(/data-tutorial="([a-z0-9-]+)"/)?.[1] ?? null;
}

const ETAPES = ALL_TUTORIALS.flatMap((t) =>
  t.steps.map((s) => ({ tour: t.id, etape: s.id, ancre: ancreDe(s.target), target: s.target })),
);

describe('toute ancre déclarée par un tour existe vraiment', () => {
  it('GARDE-FOU : le balayage voit les gabarits, les tours et les ancres', () => {
    // « Le balayage vide » de CLAUDE.md : un chemin erroné rendrait des listes
    // vides, et la conformité serait « vérifiée » sur rien.
    expect(SOURCES.length, 'des gabarits').toBeGreaterThan(100);
    expect(ALL_TUTORIALS.length, 'des tours').toBeGreaterThanOrEqual(5);
    expect(ETAPES.length, 'des étapes').toBeGreaterThanOrEqual(15);
    expect(posees.size, 'des ancres posées').toBeGreaterThan(10);
  });

  it('CONTRÔLE POSITIF : le collecteur voit les DEUX formes d’ancre', () => {
    /**
     * ⚠️ SANS CE CAS, LE BANC AURAIT ACCUSÉ À TORT. Sa première version ne
     * reconnaissait que la forme littérale et déclarait `nav-pilotage` morte,
     * alors que la barre latérale la pose par une liaison conditionnelle. Une
     * sonde qui ne voit qu'une des deux écritures produit des faux positifs
     * aussi coûteux que des faux négatifs : on aurait supprimé une étape juste.
     */
    expect(posees.has('sidebar'), 'forme littérale').toBe(true);
    expect(posees.get('nav-pilotage'), 'forme liée, dans une ternaire').toContain('AppSidebar');
    expect(
      prefixesCalcules.some((p) => p.prefixe === 'nav-item-'),
      'forme calculée, dans un gabarit littéral',
    ).toBe(true);
  });

  it('chaque étape vise bien une ancre `data-tutorial`', () => {
    // Un sélecteur d'une autre forme (classe, id) échapperait au contrôle
    // ci-dessous sans que personne ne le remarque.
    const bizarres = ETAPES.filter((e) => !e.ancre).map((e) => `${e.tour}/${e.etape}: ${e.target}`);
    expect(bizarres).toEqual([]);
  });

  /**
   * LES ANCRES DE MODULE RÉELLEMENT ATTEIGNABLES, dérivées de `NAV_SECTIONS`.
   *
   * ⚠️ SANS CETTE LISTE, LE BANC ABSOLVAIT N'IMPORTE QUOI. Sa règle de forme
   * calculée était `ancre.startsWith('nav-item-')` : toute chaîne portant ce
   * préfixe était réputée posée, qu'un module de ce nom existe ou non — donc
   * QUARANTE-HUIT étapes sur cinquante et une échappaient au contrôle.
   * Vérifié par mutation : remplacer `nav-item-exports` par
   * `nav-item-ce-module-nexiste-pas` laissait tout vert.
   *
   * C'est « la couverture qui s'arrête juste avant » de CLAUDE.md : le banc
   * gardait les deux formes marginales et laissait passer la forme principale.
   */
  const ancresDeModule = new Set(
    NAV_SECTIONS.flatMap((sec) =>
      sec.items.map((i) => `nav-item-${i.to.replace(/^\//, '').replace(/\//g, '-')}`),
    ),
  );

  it('GARDE-FOU : les ancres de module sont bien dérivées de la navigation', () => {
    expect(ancresDeModule.size, 'un module par entrée de menu').toBeGreaterThan(20);
    expect(ancresDeModule.has('nav-item-dashboard')).toBe(true);
    expect(ancresDeModule.has('nav-item-ce-module-nexiste-pas')).toBe(false);
  });

  it('LA RÈGLE : aucune ancre déclarée n’est absente des gabarits', () => {
    const mortes = ETAPES.filter((e) => {
      if (posees.has(e.ancre!)) return false;
      // Ancre de module : elle n'est valable que si le MODULE existe.
      if (e.ancre!.startsWith('nav-item-')) return !ancresDeModule.has(e.ancre!);
      // Autres formes calculées (`'nav-' + section.key`).
      return !prefixesCalcules.some((p) => e.ancre!.startsWith(p.prefixe));
    }).map((e) => `${e.ancre}  (tour « ${e.tour} », étape « ${e.etape} »)`);

    expect(
      mortes,
      'Ces ancres sont visées par un tour et posées NULLE PART. `TutorialOverlay`\n' +
        'met alors `targetRect = null` : la carte flotte au milieu de l’écran et ne\n' +
        'montre rien, sans la moindre erreur. Posez `data-tutorial="…"` sur\n' +
        'l’élément concerné, ou retirez l’étape.',
    ).toEqual([]);
  });

  it('une ancre derrière une PORTE DE PLAN n’est visée que par une étape gatée', () => {
    /**
     * ⚠️ UNE ANCRE PEUT EXISTER DANS LE GABARIT ET N'ÊTRE JAMAIS RENDUE.
     *
     * Les ancres du thème « Équipe » vivent à l'intérieur d'un
     * `<UiFeatureGate feature="multiUsers" blur>` qui fournit AUSSI un
     * `#preview`. Or `FeatureGate` rend `<slot name="preview"><slot /></slot>` :
     * dès qu'une page fournit `#preview`, le slot par défaut — celui qui porte
     * les ancres — n'est jamais rendu. Sans la fonctionnalité, elles n'existent
     * pas dans le DOM.
     *
     * Le balayage de fichiers ne peut pas le voir : le texte `data-tutorial` est
     * bien là. La règle est donc : si une ancre vit derrière une porte de plan,
     * l'étape qui la vise doit porter la MÊME fonctionnalité — sans quoi elle
     * sera montrée à des comptes qui ne la verront jamais, et la visite guidée
     * affichera des cartes flottant dans le vide.
     */
    const gates: { feature: string; ancres: string[] }[] = [];
    for (const f of SOURCES) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/<UiFeatureGate[^>]*feature="([a-zA-Z]+)"[^>]*>/g)) {
        const debut = m.index! + m[0].length;
        const fin = src.indexOf('</UiFeatureGate>', debut);
        if (fin < 0) continue;
        const ancres = [...src.slice(debut, fin).matchAll(/data-tutorial="([a-z0-9-]+)"/g)].map(
          (a) => a[1]!,
        );
        if (ancres.length) gates.push({ feature: m[1]!, ancres });
      }
    }

    expect(gates.length, 'le balayage voit bien des ancres derrière une porte').toBeGreaterThan(0);

    const parAncre = new Map<string, string>();
    for (const g of gates) for (const a of g.ancres) parAncre.set(a, g.feature);

    const decouvertes = ALL_TUTORIALS.flatMap((t) =>
      t.steps.map((s) => ({
        tour: t.id,
        etape: s.id,
        ancre: ancreDe(s.target),
        feature: s.feature,
      })),
    ).filter((e) => e.ancre && parAncre.has(e.ancre) && e.feature !== parAncre.get(e.ancre!));

    expect(
      decouvertes.map(
        (e) =>
          `${e.tour}/${e.etape} vise « ${e.ancre} » (porte : ${parAncre.get(e.ancre!)}) sans la même feature`,
      ),
    ).toEqual([]);
  });

  it('aucun TOUR n’est entièrement creux', () => {
    // La règle précédente prise par le bon bout : même si une ancre isolée
    // pouvait se justifier, un tour dont AUCUNE étape ne montre quoi que ce
    // soit n'est pas une visite guidée — c'est une suite de cartes vides.
    const creux = ALL_TUTORIALS.filter((t) => {
      const vivantes = t.steps.filter((s) => {
        const a = ancreDe(s.target);
        if (!a) return false;
        if (posees.has(a)) return true;
        if (a.startsWith('nav-item-')) return ancresDeModule.has(a);
        return prefixesCalcules.some((p) => a.startsWith(p.prefixe));
      });
      return t.steps.length > 0 && vivantes.length === 0;
    }).map((t) => `« ${t.name} » (${t.id}) — ${t.steps.length} étapes, aucune ancre vivante`);

    expect(creux).toEqual([]);
  });
});
