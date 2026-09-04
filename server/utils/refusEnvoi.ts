import type { ErrorResponse } from 'resend';

/**
 * CE QU'UN ENVOI D'EMAIL A VRAIMENT FAIT — et comment le DIRE.
 *
 * ⚠️ CE MODULE EXISTE PARCE QUE `return true` MENTAIT. Le SDK Resend **ne lève
 * jamais d'exception** : il rend `{ data, error }`, et même une coupure réseau
 * lui revient en `{ data: null, error: { name: 'application_error' } }`
 * (cf. `node_modules/resend/dist/index.mjs`, la fonction `post`). Un
 * `await resend.emails.send(...)` suivi d'un `return true` inconditionnel
 * annonce donc un succès sur un domaine non vérifié, une adresse rejetée, un
 * quota dépassé ou un 500 — sans qu'aucun `try/catch` ne puisse le rattraper.
 *
 * Sur la facture, ce mensonge coûtait cher : la route gravait le NUMÉRO LÉGAL
 * et passait le brouillon en « envoyée » pendant que rien n'était parti. Le
 * client attendait une facture qu'il ne recevrait jamais, et l'apiculteur
 * lisait « Facture envoyée à … ».
 */

/**
 * Les codes de refus, dérivés du SDK LUI-MÊME.
 *
 * ⚠️ `ErrorResponse['name']` N'EST PAS UNE COQUETTERIE DE TYPAGE. Recopier la
 * liste des vingt et un codes ici, c'est se garantir qu'elle divergera à la
 * prochaine version du paquet — et un code non traduit, c'est un apiculteur
 * devant « invalid_from_address ». En la dérivant, `npm run typecheck` REFUSE
 * de compiler tant qu'un nouveau code n'a pas sa phrase.
 *
 * `sans_service` est le seul code maison : il décrit la panne qu'on savait
 * déjà voir — la clé d'API absente, donc aucun appel émis du tout.
 */
export type CodeRefus = ErrorResponse['name'] | 'sans_service';

export type ResultatEnvoi =
  | { ok: true; messageId: string | null }
  | { ok: false; code: CodeRefus; technique: string };

/**
 * La phrase lue par l'apiculteur, par code.
 *
 * Trois exigences du dépôt s'appliquent ici, toutes apprises à la dure :
 * — **le refus est une PHRASE, jamais un code** : personne ne doit lire
 *   « daily_quota_exceeded » ;
 * — **jamais de refus sans porte de sortie** : chaque phrase dit ce qu'on peut
 *   faire maintenant — réessayer, corriger la fiche client, ou télécharger le
 *   PDF et l'envoyer soi-même ;
 * — **on ne fait pas porter à l'apiculteur ce qui n'est pas de son fait** : une
 *   clé d'API d'APIGO invalide n'est pas son problème, et le lui dire ainsi lui
 *   évite de chercher l'erreur dans sa fiche client.
 *
 * Le fil commun : la facture N'EST PAS PERDUE. Elle reste un brouillon
 * modifiable, sans numéro brûlé, et le PDF reste téléchargeable.
 */
const PHRASE: Record<CodeRefus, string> = {
  // ── Ce qui vient de notre côté ────────────────────────────────────────────
  sans_service:
    "L'envoi d'emails n'est pas configuré sur APIGO — rien n'est parti. " +
    'Ce n’est pas de votre fait : signalez-le nous. En attendant, téléchargez ' +
    'le PDF depuis cette page et envoyez-le depuis votre messagerie.',
  missing_api_key:
    "Le service d'envoi a refusé la connexion d'APIGO — rien n'est parti. " +
    'Ce n’est pas de votre fait : signalez-le nous. En attendant, téléchargez ' +
    'le PDF depuis cette page et envoyez-le depuis votre messagerie.',
  invalid_api_key:
    "Le service d'envoi a refusé la connexion d'APIGO — rien n'est parti. " +
    'Ce n’est pas de votre fait : signalez-le nous. En attendant, téléchargez ' +
    'le PDF depuis cette page et envoyez-le depuis votre messagerie.',
  restricted_api_key:
    "Le service d'envoi a refusé la connexion d'APIGO — rien n'est parti. " +
    'Ce n’est pas de votre fait : signalez-le nous. En attendant, téléchargez ' +
    'le PDF depuis cette page et envoyez-le depuis votre messagerie.',
  invalid_access:
    "Le service d'envoi a refusé la connexion d'APIGO — rien n'est parti. " +
    'Ce n’est pas de votre fait : signalez-le nous. En attendant, téléchargez ' +
    'le PDF depuis cette page et envoyez-le depuis votre messagerie.',
  security_error:
    "Le service d'envoi a bloqué le message pour raison de sécurité. " +
    'Ce n’est pas de votre fait : signalez-le nous. En attendant, téléchargez ' +
    'le PDF depuis cette page et envoyez-le depuis votre messagerie.',
  invalid_from_address:
    "L'adresse d'expédition d'APIGO a été refusée — rien n'est parti. " +
    'Ce n’est pas de votre fait : signalez-le nous. En attendant, téléchargez ' +
    'le PDF depuis cette page et envoyez-le depuis votre messagerie.',
  invalid_region:
    "Le service d'envoi a refusé la configuration d'APIGO — rien n'est parti. " +
    'Ce n’est pas de votre fait : signalez-le nous. En attendant, téléchargez ' +
    'le PDF depuis cette page et envoyez-le depuis votre messagerie.',
  not_found:
    "Le service d'envoi n'a pas reconnu la demande d'APIGO — rien n'est parti. " +
    'Ce n’est pas de votre fait : signalez-le nous. En attendant, téléchargez ' +
    'le PDF depuis cette page et envoyez-le depuis votre messagerie.',
  method_not_allowed:
    "Le service d'envoi a refusé la demande d'APIGO — rien n'est parti. " +
    'Ce n’est pas de votre fait : signalez-le nous. En attendant, téléchargez ' +
    'le PDF depuis cette page et envoyez-le depuis votre messagerie.',
  missing_required_field:
    "Le message était incomplet et n'a pas été envoyé. Vérifiez que la fiche " +
    'du client porte bien une adresse email, puis réessayez.',

  // ── Ce que l'apiculteur peut corriger ─────────────────────────────────────
  validation_error:
    "Le service d'envoi a refusé le message. Vérifiez l'adresse email du " +
    'client sur sa fiche — une faute de frappe suffit — puis réessayez.',
  invalid_parameter:
    "Le service d'envoi a refusé le message. Vérifiez l'adresse email du " +
    'client sur sa fiche — une faute de frappe suffit — puis réessayez.',
  invalid_attachment:
    'Le PDF joint a été refusé, sans doute parce qu’il est trop lourd. ' +
    'Réessayez ; si cela recommence, téléchargez-le depuis cette page et ' +
    'envoyez-le depuis votre messagerie.',

  // ── Ce qui passera tout seul ──────────────────────────────────────────────
  rate_limit_exceeded:
    'Trop d’envois en peu de temps. Patientez une minute et réessayez : la ' +
    'facture reste un brouillon, rien n’est perdu.',
  daily_quota_exceeded:
    'Le quota d’envois d’APIGO est atteint pour aujourd’hui — cela n’a rien à ' +
    'voir avec votre abonnement. Réessayez demain, ou téléchargez le PDF pour ' +
    'l’envoyer vous-même dès maintenant.',
  monthly_quota_exceeded:
    'Le quota d’envois d’APIGO est atteint pour ce mois — cela n’a rien à voir ' +
    'avec votre abonnement. Signalez-le nous, et téléchargez le PDF pour ' +
    'l’envoyer vous-même en attendant.',
  concurrent_idempotent_requests:
    'Un envoi identique est déjà en cours. Patientez quelques secondes avant ' + 'de réessayer.',
  invalid_idempotency_key:
    "Le service d'envoi a refusé la demande d'APIGO — rien n'est parti. " +
    'Réessayez ; si cela recommence, signalez-le nous.',
  invalid_idempotent_request:
    "Le service d'envoi a refusé la demande d'APIGO — rien n'est parti. " +
    'Réessayez ; si cela recommence, signalez-le nous.',
  application_error:
    'Le service d’envoi n’a pas répondu — rien n’est parti. La facture reste ' +
    'un brouillon : réessayez dans un moment.',
  internal_server_error:
    'Le service d’envoi est en panne de son côté — rien n’est parti. La ' +
    'facture reste un brouillon : réessayez dans un moment.',
};

/**
 * La phrase de secours, pour un code que le SDK aurait ajouté sans qu'on l'ait
 * traduit.
 *
 * ⚠️ ELLE REFUSE, elle ne laisse pas passer. « Inconnu » ne vaut jamais
 * « c'est parti » : devant une panne qu'on ne sait pas nommer, on le dit et on
 * donne la porte de sortie, plutôt que d'annoncer un succès imaginaire.
 */
const PHRASE_INCONNUE =
  'L’envoi a été refusé, et nous n’avons pas su traduire la raison. La facture ' +
  'reste un brouillon : réessayez, ou téléchargez le PDF depuis cette page pour ' +
  'l’envoyer depuis votre messagerie.';

/** Traduit un refus en phrase lisible. Jamais un code, jamais vide. */
export function phraseDeRefus(code: CodeRefus): string {
  return PHRASE[code] ?? PHRASE_INCONNUE;
}

/**
 * Traduit la réponse du SDK en résultat exploitable.
 *
 * `technique` garde le message d'origine (anglais, côté fournisseur) : il part
 * dans les journaux pour le diagnostic, jamais à l'écran.
 */
export function resultatDEnvoi(reponse: {
  data: { id: string } | null;
  error: { message?: string; name?: string } | null;
}): ResultatEnvoi {
  if (reponse.error) {
    return {
      ok: false,
      code: (reponse.error.name as CodeRefus | undefined) ?? 'application_error',
      technique: reponse.error.message || reponse.error.name || 'Refus sans motif',
    };
  }
  return { ok: true, messageId: reponse.data?.id ?? null };
}

/** Le refus posé quand la clé d'API manque : aucun appel n'a été émis. */
export const REFUS_SANS_SERVICE: ResultatEnvoi = {
  ok: false,
  code: 'sans_service',
  technique: 'NUXT_RESEND_API_KEY absente',
};
