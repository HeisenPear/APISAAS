/** Domaines d'emails jetables connus — mis à jour régulièrement. */
export const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'guerrillamail.com',
  'yopmail.com',
  'throwam.com',
  'sharklasers.com',
  'guerrillamail.info',
  'spam4.me',
  'trashmail.com',
  'mailnull.com',
  'spamgourmet.com',
  'tempr.email',
  'dispostable.com',
  '10minutemail.com',
  'fakeinbox.com',
  'maildrop.cc',
  'spamex.com',
  'trashmail.me',
  'trashmail.at',
  'getnada.com',
  'mohmal.com',
  'mailnesia.com',
  'spamfree24.org',
  'mytempemail.com',
  'jetable.fr.nf',
  'spamgourmet.net',
  'discard.email',
  'mailexpire.com',
  'trashmail.io',
  'crap.email',
  'spam.la',
  'temp-mail.ru',
  'tempinbox.com',
  'tempomail.fr',
  'mintemail.com',
  'spamevader.com',
  'emailondeck.com',
  'mailsac.com',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'safetymail.info',
  'emailfake.com',
  'getairmail.com',
  'throwam.com',
  'yopmail.fr',
  'cool.fr.nf',
  'jetable.fr.nf',
  'nospam.ze.tc',
  'nomail.xl.cx',
  'mega.zik.dj',
  'speed.1s.fr',
  'courriel.fr.nf',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  // Matcher aussi les SOUS-DOMAINES (ex: « foo.mailinator.com ») — contournement
  // trivial de la blocklist par match exact. Reste best-effort : la vraie défense
  // est le double opt-in (vérification de propriété de l'email) + un CAPTCHA.
  for (const d of DISPOSABLE_DOMAINS) {
    if (domain.endsWith('.' + d)) return true;
  }
  return false;
}
