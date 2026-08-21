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

    /**
     * ON DÉROULE COMME ON LIT, PAS COMME UNE MACHINE.
     *
     * ⚠️ Première version : vingt bonds instantanés d'un demi-écran, 160 ms
     * d'attente entre deux. Verte sur Chromium, ROUGE sur WebKit — et rouge
     * différemment à chaque fois : 32 éléments, puis 6, puis 4, jamais les
     * mêmes, et la page /maya finissait par passer d'elle-même à la reprise.
     * Un défaut structurel échouerait sur les MÊMES éléments à chaque tour ;
     * des ensembles différents signent une course.
     *
     * WebKit groupe la livraison des observateurs et ne suit pas une rafale de
     * sauts programmés — ce qu'aucun lecteur ne fait. Des pas plus courts et
     * une pause plus longue collent au geste réel.
     */
    const champ = await page.evaluate(() => window.innerHeight);
    let y = 0;
    for (let garde = 0; garde < 200; garde++) {
      const hauteur = await page.evaluate(() => document.body.scrollHeight);
      if (y > hauteur) break;
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(260);
      y += Math.floor(champ * 0.5);
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // De quoi laisser finir la plus longue transition (760 ms) et ses retards.
    await page.waitForTimeout(1800);

    /**
     * SECONDE CHANCE, ÉLÉMENT PAR ÉLÉMENT.
     *
     * Ce qui reste masqué après le parcours, on va le chercher : on l'amène
     * dans le champ et on attend. C'est le geste du lecteur qui s'arrête sur un
     * bloc — et c'est ce qui distingue « l'observateur n'a pas suivi ma
     * rafale » de « cet élément ne se révélera JAMAIS ».
     *
     * Le pouvoir du banc est intact : les deux défauts déjà rencontrés y
     * survivent. Une ligne poussée hors de son masque `overflow: hidden` a une
     * aire d'intersection nulle à TOUTE position de défilement — l'amener dans
     * le champ n'y change rien. Et une règle CSS qui bat `.rev-on` est prise par
     * le second filet, plus bas.
     */
    /**
     * ⚠️ On vise TOUJOURS le premier restant, jamais `nth(i)` sur un compteur
     * croissant : l'ensemble RÉTRÉCIT à mesure que les éléments se révèlent, et
     * les indices glissent sous les pieds de la boucle — elle en sauterait la
     * moitié. On borne le nombre de tours plutôt que de faire confiance à un
     * index, et on sort dès que plus rien ne bouge.
     */
    let bloques = 0;
    for (let tour = 0; tour < 60; tour++) {
      const restants = page.locator('.rev:not(.rev-on)');
      const avant = await restants.count();
      if (bloques >= avant) break; // tous les restants ont eu leur chance
      await restants
        .nth(bloques)
        .scrollIntoViewIfNeeded({ timeout: 5000 })
        .catch(() => {});
      await page.waitForTimeout(400);
      // Révélé → l'ensemble a rétréci et `nth(bloques)` désigne déjà le suivant.
      // Toujours là → on le laisse à l'assertion et on passe au suivant, sans
      // quoi un seul élément vraiment cassé priverait tous les autres de leur
      // seconde chance et gonflerait le rapport d'éléments parfaitement sains.
      if ((await restants.count()) === avant) bloques += 1;
    }

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
        'même après avoir été amenés dans le champ un par un. Invisibles pour le ' +
        'visiteur, sans erreur en console :\n' +
        restes.map((r) => `   <${r.balise} class="${r.classes}"> « ${r.texte} »`).join('\n'),
    ).toEqual([]);

    /**
     * Deuxième filet : rien de révélé ne doit rester transparent. Une règle CSS
     * plus spécifique que `.rev-on` passerait le contrôle ci-dessus — la classe
     * est bien là — tout en laissant le bloc invisible.
     *
     * ⚠️ ON ATTEND QUE LA TRANSITION SOIT FINIE, ON NE LA SUPPOSE PAS FINIE.
     *
     * Première version : une mesure sèche après 400 ms d'attente. Or la
     * transition d'opacité dure 760 ms, plus les retards en cascade. La CI
     * mobile attrapait donc régulièrement le DERNIER bloc révélé en plein
     * fondu — un `<h2>` différent à chaque reprise, ce qui est la signature
     * d'une course et non d'un défaut. `expect.poll` réinterroge jusqu'à ce que
     * la valeur se stabilise : plus de sommeil magique à régler, et le pouvoir
     * du filet est intact puisqu'un bloc réellement écrasé par une règle CSS ne
     * se stabilisera JAMAIS à 1.
     */
    await expect
      .poll(
        async () =>
          page.evaluate(() =>
            [...document.querySelectorAll('.rev-on')]
              .filter((el) => Number(getComputedStyle(el).opacity) < 0.99)
              .map((el) => `<${el.tagName.toLowerCase()} class="${el.className}">`),
          ),
        {
          timeout: 8000,
          message: 'révélés mais toujours transparents — une règle CSS bat probablement .rev-on',
        },
      )
      .toEqual([]);
  });
}
