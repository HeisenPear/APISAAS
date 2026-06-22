export default defineEventHandler(async (event) => {
  const user = await requireWorkspace(event);

  // Récupérer les données de pré-remplissage
  const prefillData = await $fetch(`/api/declarations/napi/prefill`, {
    headers: getHeaders(event) as Record<string, string>,
  });

  const annee = new Date().getFullYear();
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
    <div class="field"><label>Numéro NAPI</label><span>${profil.napi}</span></div>
    <div class="field"><label>Nom et prénom</label><span>${profil.prenom} ${profil.nom}</span></div>
  </div>
  <div class="row">
    <div class="field"><label>Adresse</label><span>${profil.adresse}</span></div>
    <div class="field"><label>Code postal / Ville</label><span>${profil.codePostal} ${profil.ville}</span></div>
  </div>
  <div class="row">
    <div class="field"><label>Email</label><span>${profil.email}</span></div>
    <div class="field"><label>Téléphone</label><span>${profil.telephone}</span></div>
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
    ${(ruchersList as Array<{ nom: string; commune: string; nbColonies: number }>).map((r) => `<tr><td>${r.nom}</td><td>${r.commune}</td><td>${r.nbColonies}</td></tr>`).join('')}
  </table>

  <div class="footer">
    Document pré-rempli par APIGO (apigo.fr) — ${new Date().toLocaleDateString('fr-FR')}<br>
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
