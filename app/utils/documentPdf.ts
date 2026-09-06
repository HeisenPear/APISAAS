/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UN DOCUMENT EN PDF — UNE SEULE FABRIQUE, POUR LA FACTURE ET POUR LE BON.
 *
 * ⚠️ CES RÉGLAGES DÉCIDENT SI UN ENVOI PASSE OU NON, ET ILS ÉTAIENT RECOPIÉS.
 *
 * `facture/[id].vue` portait son `optionsPdf()` en local. Le bon de livraison
 * n'avait rien du tout : il ne savait que `window.print()`. Recopier les
 * quinze lignes était la solution évidente — et c'est ainsi qu'on obtient deux
 * documents d'une même vente rendus à des échelles différentes, dont un seul
 * passe sous le plafond de l'envoi.
 *
 * ⚠️ `scale` ET `quality` NE SONT PAS DES RÉGLAGES DE CONFORT. Le PDF part en
 * base64 dans le corps d'une requête, et le base64 gonfle de ~33 %. Vercel
 * rejette au-delà de ~4,5 Mo AVANT que la moindre ligne d'APIGO ne s'exécute :
 * ni le middleware de taille, ni la route, ni aucun `catch` ne le voient.
 * Alourdir le rendu ici, c'est rendre l'envoi impossible sans message.
 *
 * ⚠️ `useCORS` EST INDISPENSABLE. html2canvas rend sur un canevas ; une image
 * tierce sans en-tête CORS le « souille », et le PDF sort VIDE, sans la
 * moindre erreur. C'est le logo de l'exploitation qui est concerné.
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function optionsPdf(nomFichier: string) {
  return {
    filename: nomFichier.endsWith('.pdf') ? nomFichier : `${nomFichier}.pdf`,
    margin: [8, 8, 8, 8] as [number, number, number, number],
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
  };
}

/** Enregistre le document sur le disque de l'apiculteur. */
export async function telechargerPdf(element: HTMLElement, nomFichier: string): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default;
  await html2pdf().set(optionsPdf(nomFichier)).from(element).save();
}

/**
 * Le document en `data:` base64, prêt à partir dans un corps de requête.
 *
 * ⚠️ ON REND LA CHAÎNE COMPLÈTE, PRÉFIXE COMPRIS. Les routes d'envoi la
 * découpent elles-mêmes, et le plafond (`app/config/tailles-envoi.ts`) se
 * mesure sur cette longueur-là — celle qui voyage.
 */
export async function pdfEnBase64(element: HTMLElement, nomFichier: string): Promise<string> {
  const html2pdf = (await import('html2pdf.js')).default;
  const blob = (await html2pdf()
    .set(optionsPdf(nomFichier))
    .from(element)
    .outputPdf('blob')) as Blob;

  return new Promise<string>((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onloadend = () => resolve(String(lecteur.result));
    lecteur.onerror = () => reject(new Error('Lecture PDF impossible'));
    lecteur.readAsDataURL(blob);
  });
}
