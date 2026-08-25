import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'node:fs';
import { parse, NodeTypes } from '@vue/compiler-dom';
import type { TemplateChildNode } from '@vue/compiler-dom';

/**
 * DEUX MOTS COLLÉS SUR UN TÉLÉPHONE, ET PERSONNE POUR LE VOIR.
 *
 * Signalé par l'apiculteur : la page d'accueil affichait « Votre rucher**dans**
 * votre poche » sous 640 px. Ce n'était pas une coquille — aucune relecture du
 * texte ne pouvait la trouver, parce que l'espace EST écrit dans le gabarit :
 *
 *     Votre rucher<br class="hidden sm:block" />
 *     <span style="color: var(--honey)">dans votre poche.</span>
 *
 * Le compilateur Vue tourne en `whitespace: 'condense'`. Sa règle : un nœud de
 * texte PUREMENT BLANC situé ENTRE DEUX ÉLÉMENTS et contenant un saut de ligne
 * est SUPPRIMÉ — pas condensé en espace. Le retour à la ligne entre le `<br>` et
 * le `<span>` tombe exactement là. Puis `hidden` met le `<br>` en `display:none`
 * sous 640 px : il ne produit ni saut, ni séparation. Les deux textes se
 * touchent.
 *
 * ⚠️ CE BANC NE DEVINE PAS — IL COMPILE. Une expression régulière sur la source
 * se tromperait dans les deux sens : elle accuserait `LandingPwaInstall`, où le
 * `<br>` est suivi de TEXTE et où l'espace survit très bien, et elle raterait
 * les variantes d'écriture. On demande donc au vrai compilateur ce qu'il
 * produit, et on regarde les nœuds voisins du `<br>`.
 *
 * Les trois formes, telles que le compilateur les rend :
 *
 *   CASSÉ    TEXT("Votre rucher") · EL(br) · EL(span)
 *   CORRIGÉ  TEXT("Votre rucher") · INTERP(' ') · EL(br) · EL(span)
 *   SAIN     TEXT("APIGO,")       · EL(br) · TEXT(" même au rucher")
 */

const FICHIERS = [...globSync('app/**/*.vue')].sort();

/** Le nœud porte-t-il un espace utilisable comme séparation ? */
function porteUnEspace(n: TemplateChildNode | undefined, cote: 'avant' | 'apres'): boolean {
  if (!n) return false;
  if (n.type === NodeTypes.TEXT) {
    return cote === 'avant' ? /\s$/.test(n.content) : /^\s/.test(n.content);
  }
  // `{{ ' ' }}` : une interpolation crée TOUJOURS un vrai nœud de texte, elle
  // est donc immunisée contre la condensation. C'est le correctif employé.
  if (n.type === NodeTypes.INTERPOLATION) {
    const brut = n.content.type === NodeTypes.SIMPLE_EXPRESSION ? n.content.content : '';
    return /^['"`]\s+['"`]$/.test(brut.trim());
  }
  return false;
}

interface Collision {
  fichier: string;
  extrait: string;
}

function collisions(): Collision[] {
  const trouvees: Collision[] = [];
  for (const fichier of FICHIERS) {
    const source = readFileSync(fichier, 'utf-8');
    const debut = source.indexOf('<template>');
    const fin = source.lastIndexOf('</template>');
    if (debut < 0 || fin <= debut) continue;

    const racine = parse(source.slice(debut, fin + '</template>'.length), {
      whitespace: 'condense',
    });

    const parcourir = (noeud: { children?: TemplateChildNode[] }): void => {
      const enfants = noeud.children;
      if (!enfants) return;
      for (let i = 0; i < enfants.length; i++) {
        const n = enfants[i]!;
        parcourir(n as { children?: TemplateChildNode[] });
        if (n.type !== NodeTypes.ELEMENT || n.tag !== 'br') continue;

        const apres = enfants[i + 1];
        // Rien après : le `<br>` finit la ligne, il ne colle rien.
        if (!apres) continue;
        // Du texte après : son espace de tête survit à la condensation.
        if (apres.type !== NodeTypes.ELEMENT) {
          if (porteUnEspace(apres, 'apres')) continue;
          // Une interpolation collée juste après sépare aussi.
          if (porteUnEspace(apres, 'avant')) continue;
        }
        if (porteUnEspace(enfants[i - 1], 'avant')) continue;

        const voisin =
          apres.type === NodeTypes.ELEMENT
            ? `<${apres.tag}>`
            : JSON.stringify('content' in apres ? String(apres.content).slice(0, 30) : '');
        const precedent = enfants[i - 1];
        const gauche =
          precedent && precedent.type === NodeTypes.TEXT
            ? precedent.content.trim().slice(-30)
            : precedent && precedent.type === NodeTypes.ELEMENT
              ? `<${precedent.tag}>`
              : '';
        trouvees.push({ fichier, extrait: `…${gauche}<br> ${voisin}` });
      }
    };
    parcourir(racine);
  }
  return trouvees;
}

describe('un <br> ne doit jamais coller deux mots', () => {
  it('le balayage voit bien les gabarits (garde-fou du banc)', () => {
    // Sans ce contrôle, un chemin erroné rendrait la liste vide et le cas
    // suivant vert : le banc affirmerait une conformité qu'il n'a pas mesurée.
    expect(FICHIERS.length).toBeGreaterThan(150);
    const avecBr = FICHIERS.filter((f) => readFileSync(f, 'utf-8').includes('<br'));
    expect(avecBr.length).toBeGreaterThan(5);
  });

  it('aucun <br> n’est suivi d’un élément sans espace explicite', () => {
    /**
     * Pourquoi refuser AUSSI les cas où le `<br>` n'est pas masqué : ils ne se
     * voient pas aujourd'hui — le saut de ligne cache l'absence d'espace — mais
     * ils cassent à l'identique le jour où quelqu'un leur ajoute une classe
     * responsive. Trois d'entre eux dormaient dans le dépôt (deux dans le hero,
     * un dans l'appel à l'action final) quand celui de la section mobile, lui,
     * était déjà visible de tous.
     */
    const trouvees = collisions();
    expect(
      trouvees.map((c) => `${c.fichier} — ${c.extrait}`),
      "ajoute {{ ' ' }} avant le <br> : une interpolation résiste à la condensation",
    ).toEqual([]);
  });
});
