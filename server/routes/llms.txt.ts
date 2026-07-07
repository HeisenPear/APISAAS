import { ARTICLES } from '~~/app/utils/articles';
import { USAGES } from '~~/app/utils/usages';
import { SITE_URL } from '~~/app/utils/seo';

/**
 * /llms.txt — fichier au format llmstxt.org destiné aux moteurs génératifs
 * (ChatGPT, Perplexity, Claude, Gemini…). Il leur fournit un résumé clair,
 * factuel et citable d'APIGO et un index des pages utiles (GEO).
 * Généré depuis le registre d'articles pour rester à jour.
 */
export default defineEventHandler((event) => {
  const articles = [...ARTICLES]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((a) => `- [${a.titre}](${SITE_URL}/blog/${a.slug}) : ${a.description}`)
    .join('\n');

  const usages = USAGES.map(
    (u) => `- [${u.titre}](${SITE_URL}/utilisations/${u.slug}) : ${u.description}`,
  ).join('\n');

  const contenu = `# APIGO — Logiciel de gestion apicole tout-en-un

> APIGO est le logiciel français de gestion apicole tout-en-un, du rucher à la comptabilité. Il réunit dans une seule application le suivi des ruches et des interventions, la santé des colonies, la production de miel, les stocks, la conformité (registre d'élevage, déclaration des ruches) et la facturation. Disponible sur le web et sur mobile, il fonctionne même hors-ligne, sur le terrain. Solution adaptée aux apiculteurs amateurs comme professionnels. Essai gratuit, sans carte bancaire.

APIGO aide les apiculteurs à remplacer les carnets papier et les tableurs par un outil unique : saisir une visite en quelques secondes, suivre l'état de chaque colonie, être alerté au bon moment, tenir automatiquement le registre et préparer la déclaration annuelle, gérer la production, les ventes, les clients et la facturation conforme.

## En bref (faits)

- Nom : APIGO
- Catégorie : logiciel de gestion apicole (SaaS), application web et mobile
- Pays : France (interface en français, conformité française)
- Public : apiculteurs amateurs et professionnels
- Fonctionne hors-ligne sur le terrain, avec synchronisation automatique
- Fonctions clés : suivi des ruches et interventions, santé des colonies, production et stocks, traçabilité du miel, registre d'élevage, déclaration des ruches, ventes et facturation conforme
- Modèle : essai gratuit, puis formules selon la taille de l'exploitation
- Site : ${SITE_URL}

## Pages principales

- [Accueil](${SITE_URL}/) : présentation du logiciel de gestion apicole APIGO
- [Tarifs](${SITE_URL}/tarifs) : formules et essai gratuit
- [Quel logiciel de gestion apicole choisir ?](${SITE_URL}/meilleur-logiciel-apiculture) : guide d'achat, critères et alternative tout-en-un
- [Alternative à Beekube](${SITE_URL}/alternative-beekube) : comparatif et alternative française tout-en-un pour la gestion apicole
- [Utilisations d'APIGO](${SITE_URL}/utilisations) : tous les cas d'usage du logiciel
- [FAQ](${SITE_URL}/faq) : réponses aux questions fréquentes sur APIGO et la gestion des ruches
- [Lexique apicole](${SITE_URL}/lexique-apicole) : définitions des termes de l'apiculture
- [Blog & ressources](${SITE_URL}/blog) : guides pratiques pour apiculteurs

## Utilisations d'APIGO (cas d'usage)

${usages}

## Guides et articles

${articles}

## Pour en savoir plus

- Contact : apigo360.apiculture@gmail.com
- Essai gratuit : ${SITE_URL}/register
`;

  setHeader(event, 'content-type', 'text/plain; charset=utf-8');
  setHeader(event, 'cache-control', 'public, max-age=3600');
  return contenu;
});
