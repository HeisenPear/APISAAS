// html2pdf.js n'expose pas de types. Import dynamique côté client uniquement
// (génération de PDF de facture). Shim minimal pour satisfaire `tsc`.
declare module 'html2pdf.js';
