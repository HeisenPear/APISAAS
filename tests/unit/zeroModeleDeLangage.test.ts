import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'node:fs';
import { sansCommentaires } from '~~/tests/helpers/sansCommentaires';

/**
 * « 0 · APPEL À UN MODÈLE DE LANGAGE » — L'ENGAGEMENT LE PLUS FORT DU PRODUIT,
 * ET RIEN NE LE GARDAIT.
 *
 * `/maya` l'affiche en chiffre géant, à côté de « 100 % de vos données restent
 * chez vous ». `MayaLimites` en fait un chapitre entier. C'est ce qui sépare
 * Maya d'un agent conversationnel du commerce, c'est ce qui la rend
 * reproductible, auditable et gratuite à l'usage — et c'est ce qu'un
 * apiculteur RGPD-inquiet retient de la page.
 *
 * Or il suffisait d'un `npm install openai` et de trois lignes dans un handler
 * pour que la page devienne fausse, sans que rien ne sonne. Une promesse de
 * cette force qui n'est gardée par personne finit toujours par se perdre : ce
 * n'est pas de la mauvaise foi, c'est une pente. Quelqu'un voudra « juste
 * améliorer la reformulation », et la phrase géante de la page d'accueil
 * deviendra un mensonge en un après-midi.
 *
 * Ce banc ferme les deux portes : la DÉPENDANCE et l'APPEL SORTANT.
 *
 * ⚠️ CE QU'IL NE PRÉTEND PAS FAIRE. Il ne prouve pas qu'aucun octet ne sort
 * jamais — un serveur peut appeler n'importe quoi à l'exécution. Il prouve que
 * le dépôt ne contient ni le client, ni l'adresse. C'est la barrière qu'un test
 * statique peut tenir, et elle suffit à rendre la dérive VOLONTAIRE au lieu
 * d'accidentelle : pour la franchir, il faudra supprimer ce fichier, et donc
 * décider de le faire.
 */

const PAQUET = JSON.parse(readFileSync('package.json', 'utf-8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

/** Les clients de modèles de langage les plus courants, par nom de paquet. */
const CLIENTS =
  /^(openai|@?anthropic(-ai)?(\/.*)?|@mistralai\/.*|mistralai|cohere(-ai)?|@google\/gener|@google-cloud\/aiplatform|@huggingface\/.*|ollama|replicate|langchain|@langchain\/.*|@ai-sdk\/.*|ai)$/i;

/** Les points d'entrée HTTP de ces services. */
const ADRESSES = [
  'api.openai.com',
  'api.anthropic.com',
  'generativelanguage.googleapis.com',
  'api.mistral.ai',
  'api.cohere.ai',
  'api.cohere.com',
  'openrouter.ai',
  'api.groq.com',
  'api.together.xyz',
  'api-inference.huggingface.co',
  'api.perplexity.ai',
  'api.deepseek.com',
  'api.x.ai',
];

const SOURCES = [
  ...globSync('server/**/*.ts'),
  ...globSync('app/**/*.ts'),
  ...globSync('app/**/*.vue'),
].sort();

describe('« 0 appel à un modèle de langage » — la promesse la plus forte de la page', () => {
  it('le balayage voit bien les sources (garde-fou du banc)', () => {
    // Sans ce contrôle, un chemin erroné rendrait les deux cas suivants verts :
    // le banc affirmerait une conformité qu'il n'a jamais mesurée.
    expect(SOURCES.length).toBeGreaterThan(300);
    expect(Object.keys(PAQUET.dependencies ?? {}).length).toBeGreaterThan(5);
  });

  it('la page affiche bien cet engagement (sinon ce banc n’a plus d’objet)', () => {
    /**
     * Ce cas est l'INVERSE des autres : il vérifie que la promesse existe
     * toujours. Si quelqu'un la retire de la page, ce banc devient une règle
     * orpheline qui interdit sans raison — et il doit alors le dire, pour
     * qu'on décide, plutôt que de continuer à garder un engagement qu'on ne
     * prend plus.
     */
    /**
     * ⚠️ ON VISE LE CHIFFRE, PAS LA PHRASE — et c'est la mutation qui l'a
     * appris. Une première version cherchait « appel à un modèle de langage »
     * n'importe où dans la page : en retirant le compteur géant, le banc restait
     * VERT, parce que la même formule survivait dans la description SEO. Il
     * gardait un mot, pas une promesse. On exige donc la paire valeur/libellé du
     * compteur, celui que le visiteur voit en grand.
     */
    const page = sansCommentaires(readFileSync('app/pages/maya.vue', 'utf-8'));
    const compteur = page.match(
      /\{\s*valeur:\s*'0',\s*libelle:\s*'appel à un modèle de langage'\s*\}/,
    );
    expect(
      compteur,
      'le compteur « 0 · appel à un modèle de langage » a disparu de /maya : ce banc garde alors un engagement qu’on ne prend plus',
    ).not.toBeNull();
  });

  it('aucun client de modèle de langage n’est installé', () => {
    const toutes = { ...PAQUET.dependencies, ...PAQUET.devDependencies };
    const trouves = Object.keys(toutes).filter((nom) => CLIENTS.test(nom));
    expect(
      trouves,
      'installer ce paquet rend fausse la promesse affichée en grand sur /maya',
    ).toEqual([]);
  });

  it('aucune source n’appelle l’adresse d’un modèle de langage', () => {
    /**
     * On blanchit les commentaires : ce fichier-ci, `MayaLimites.vue` et
     * `LandingFeatures.vue` CITENT ces noms pour expliquer qu'on ne les appelle
     * pas. Une règle qui interdit un mot interdit aussi d'expliquer pourquoi ce
     * mot est absent — le dépôt s'est déjà fait prendre cinq fois par là.
     */
    const fautes: string[] = [];
    for (const f of SOURCES) {
      const code = sansCommentaires(readFileSync(f, 'utf-8'));
      for (const adresse of ADRESSES) {
        if (code.includes(adresse)) fautes.push(`${f} — ${adresse}`);
      }
    }
    expect(fautes, 'Maya est déterministe : elle ne consulte aucun modèle').toEqual([]);
  });

  it('le moteur de Maya reste local et sans réseau sortant', () => {
    /**
     * Le cœur nommé sur la page : `copilote-local.ts`. On vérifie qu'il ne fait
     * aucun appel sortant du tout — pas seulement « pas vers un LLM ». C'est
     * plus fort, et c'est ce que « local » veut dire.
     */
    const moteur = sansCommentaires(readFileSync('server/utils/copilote-local.ts', 'utf-8'));
    expect(moteur.length, 'le moteur est introuvable ou vide').toBeGreaterThan(1000);
    for (const appel of ['fetch(', '$fetch(', 'axios.', 'https.request', 'XMLHttpRequest']) {
      expect(moteur, `« local » veut dire sans appel sortant — trouvé : ${appel}`).not.toContain(
        appel,
      );
    }
  });
});
