import { anneeParis, dateParis } from '~~/server/utils/horloge';
import { echapperHtml } from '~~/server/utils/echapperHtml';
import { nomLegal } from '~~/app/config/identite-emetteur';

/**
 * ⚠️ CE DOCUMENT PART EN `text/html` SUR L'ORIGINE DE L'APPLICATION, et il
 * interpolait BRUT le nom, l'adresse, la ville, le téléphone et les NOMS DE
 * RUCHERS — du texte libre, qui peut venir d'un membre de l'équipe. Tout ce qui
 * vient de la base passe désormais par `champ()`.
 *
 * Second rôle de `champ()` : ne plus rendre une case VIDE en silence. Le Cerfa
 * 13995*07 est une déclaration réglementaire ; une case d'identification qui ne
 * contient qu'une espace ne se voit pas à la relecture et se découvre au
 * guichet. `prefill.get.ts` calcule pourtant déjà la liste des manques — la
 * route ne la lisait jamais.
 */
function champ(valeur: unknown, quoi: string): string {
  const texte = String(valeur ?? '').trim();
  if (texte) return echapperHtml(texte);
  return `<em class="manque">À compléter — ${echapperHtml(quoi)}</em>`;
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  // Récupérer les données de pré-remplissage
  const prefillData = await $fetch(`/api/declarations/napi/prefill`, {
    headers: getHeaders(event) as Record<string, string>,
  });

  const annee = anneeParis(new Date());
  const periodeDecl = getQuery(event).annee ? Number(getQuery(event).annee) : annee;

  // Générer un HTML simple qui sera imprimé en PDF
  const {
    profil,
    cheptel,
    ruchers: ruchersList,
  } = (
    prefillData as {
      data: {
        profil: Record<string, string>;
        cheptel: Record<string, number>;
        ruchers: Array<Record<string, unknown>>;
      };
    }
  ).data;

  /**
   * Le nom du détenteur DÉRIVE de la règle partagée : c'est la même identité
   * que sur la facture et le Factur-X. Ici c'est bien le nom LÉGAL qui est
   * demandé — le Cerfa identifie une personne devant l'administration, pas une
   * enseigne commerciale.
   */
  const nomComplet = nomLegal(profil as Parameters<typeof nomLegal>[0]);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Déclaration NAPI ${periodeDecl}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 10pt; padding: 20mm; color: #000; }
    h1 { font-size: 14pt; text-align: center; text-transform: uppercase; border: 2px solid #000; padding: 8px; margin-bottom: 20px; }
    h2 { font-size: 11pt; background: #ddd; padding: 4px 8px; margin: 16px 0 8px; border: 1px solid #999; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    td, th { border: 1px solid #999; padding: 4px 8px; font-size: 9pt; }
    .manque { color: #b45309; font-style: italic; font-weight: 600; }
    th { background: #eee; font-weight: bold; }
    .row { display: flex; gap: 16px; margin-bottom: 8px; }
    .field { flex: 1; }
    .field label { font-size: 8pt; color: #666; display: block; }
    .field span { border-bottom: 1px solid #999; display: block; min-height: 20px; padding: 2px 0; }
    .footer { margin-top: 30px; font-size: 8pt; color: #666; text-align: center; border-top: 1px solid #ccc; padding-top: 8px; }
    .cerfa-ref { font-size: 8pt; color: #666; text-align: right; margin-bottom: 8px; }
    @media print { body { padding: 15mm; } }
  </style>
</head>
<body>
  <p class="cerfa-ref">Cerfa n°13995*07 — Pré-rempli par APIGO</p>
  <h1>Déclaration de détention et d'emplacement de ruches<br>Année ${periodeDecl}</h1>

  <h2>Section 1 — Identification du détenteur</h2>
  <div class="row">
    <div class="field"><label>Numéro NAPI</label><span>${champ(profil.napi, 'votre numéro NAPI')}</span></div>
    <div class="field"><label>Nom et prénom</label><span>${champ(nomComplet, 'votre nom et prénom')}</span></div>
  </div>
  <div class="row">
    <div class="field"><label>Adresse</label><span>${champ(profil.adresse, 'votre adresse')}</span></div>
    <div class="field"><label>Code postal / Ville</label><span>${champ([profil.codePostal, profil.ville].filter(Boolean).join(' '), 'votre code postal et votre ville')}</span></div>
  </div>
  <div class="row">
    <div class="field"><label>Email</label><span>${champ(profil.email, 'votre email')}</span></div>
    <div class="field"><label>Téléphone</label><span>${champ(profil.telephone, 'votre téléphone')}</span></div>
  </div>

  <h2>Section 2 — Effectif du cheptel apicole</h2>
  <table>
    <tr>
      <th>Type</th>
      <th>Nombre</th>
    </tr>
    <tr><td>Ruches de production</td><td>${cheptel.nbProduction}</td></tr>
    <tr><td>Ruchettes</td><td>${cheptel.nbRuchettes}</td></tr>
    <tr><td>Nuclei</td><td>${cheptel.nbNuclei}</td></tr>
    <tr><th>TOTAL</th><th>${cheptel.total}</th></tr>
  </table>

  <h2>Section 3 — Emplacements des ruches</h2>
  <table>
    <tr>
      <th>Rucher</th>
      <th>Commune</th>
      <th>Nb colonies</th>
    </tr>
    ${(ruchersList as Array<{ nom: string; commune: string; nbColonies: number }>).map((r) => `<tr><td>${echapperHtml(r.nom)}</td><td>${champ(r.commune, 'la commune')}</td><td>${r.nbColonies}</td></tr>`).join('')}
  </table>

  <div class="footer">
    Document pré-rempli par APIGO (apigo.fr) — ${dateParis(new Date())}<br>
    La déclaration officielle s'effectue sur <strong>agriculture-portail.6tzen.fr</strong> entre le 1er septembre et le 31 décembre.
  </div>
</body>
</html>`;

  // satisfy TS: user is required for auth check
  void user;

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8');
  setHeader(event, 'Content-Disposition', `inline; filename="cerfa-napi-${periodeDecl}.html"`);
  return html;
});
