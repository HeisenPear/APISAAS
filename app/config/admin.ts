/**
 * Helper admin — bypass total des restrictions de plan pour les emails whitelistés.
 * La liste d'emails n'est JAMAIS exposée au client, seul le flag booléen `isAdmin`
 * est retourné dans le profil par le serveur.
 */

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;

  // Côté serveur uniquement : lit la variable d'env
  if (import.meta.server) {
    const adminEmails = (process.env.NUXT_ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    return adminEmails.includes(email.toLowerCase());
  }

  // Côté client : ne jamais calculer ici — utiliser le flag `isAdmin` du profil
  return false;
}
