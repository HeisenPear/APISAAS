import { test, expect } from '@playwright/test';

/**
 * AUCUN CONTENU RÉVÉLÉ NE DOIT RESTER CACHÉ.
 *
 * `v-reveal` met l'opacité à zéro et compte sur un IntersectionObserver pour la
 * rendre. Le pari est bon tant qu'il est tenu — et quand il ne l'est pas, la
 * panne est MUETTE : pas d'erreur, pas d'avertissement, juste un bloc qui n'a
 * jamais existé pour le visiteur. On l'a déjà vu deux fois dans ce dépôt :
 *
 *  · une directive posée dans un masque `overflow: hidden`, poussée hors du
 *    champ par le masquage même qu'elle applique — jamais vue par l'observateur ;
 *  · une règle CSS plus spécifique que `.rev-on`, qui gagne et fige l'état caché.
 *
 * La révélation est désormais posée sur une douzaine de sections. La lire une
 * par une ne prouverait rien : on déroule la page pour de bon, et on compte.
 *
 * ⚠️ Ce banc doit rester GÉNÉRIQUE. Il ne liste aucune section : toute
 * révélation ajoutée demain est couverte sans qu'on y pense — ce qui est
 * exactement la propriété qu'on veut, puisque personne ne pense à ce défaut.
 */
test.use({ reducedMotion: 'no-preference' });

const PAGES = ['/', '/maya'];

for (const chemin of PAGES) {
  test(`${chemin} — tout ce qui est masqué finit par être révélé`, async ({ page }) => {
    await page.goto(chemin);
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

    // On déroule la page par écrans successifs : l'observateur ne se déclenche
    // que sur ce qui entre réellement dans le champ.
    const hauteur = await page.evaluate(() => document.body.scrollHeight);
    const champ = await page.evaluate(() => window.innerHeight);
    for (let y = 0; y < hauteur; y += Math.floor(champ * 0.7)) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(160);
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // De quoi laisser finir la plus longue transition (760 ms) et ses retards.
    await page.waitForTimeout(1800);

    const restes = await page.evaluate(() =>
      [...document.querySelectorAll('.rev:not(.rev-on)')]
        // Un élément SANS boîte de mise en page est caché pour une autre raison
        // — une rangée `lg:hidden`, un onglet replié. `.rev` ne pose qu'une
        // opacité : ce qu'elle masque occupe toujours sa place. Ce n'est donc
        // pas le défaut qu'on traque, et le signaler ferait crier ce banc au
        // loup jusqu'à ce que quelqu'un le désactive.
        .filter((el) => (el as HTMLElement).offsetParent !== null || el.getClientRects().length > 0)
        .map((el) => ({
          balise: el.tagName.toLowerCase(),
          classes: el.className,
          texte: (el.textContent ?? '').trim().slice(0, 60),
        })),
    );

    expect(
      restes,
      `${restes.length} élément(s) masqué(s) par v-reveal ne se sont JAMAIS révélés — ` +
        'invisibles pour le visiteur, sans erreur en console :\n' +
        restes.map((r) => `   <${r.balise} class="${r.classes}"> « ${r.texte} »`).join('\n'),
    ).toEqual([]);

    // Deuxième filet : rien de révélé ne doit rester transparent. Une règle CSS
    // plus spécifique que `.rev-on` passerait le contrôle ci-dessus (la classe
    // est là) tout en laissant le bloc invisible.
    const transparents = await page.evaluate(() =>
      [...document.querySelectorAll('.rev-on')]
        .filter((el) => Number(getComputedStyle(el).opacity) < 0.99)
        .map((el) => `<${el.tagName.toLowerCase()} class="${el.className}">`),
    );
    expect(
      transparents,
      'révélés mais toujours transparents — une règle CSS bat probablement .rev-on',
    ).toEqual([]);
  });
}
