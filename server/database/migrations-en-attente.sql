-- ═══════════════════════════════════════════════════════════════════════════
-- LE SCHÉMA QUE CETTE BRANCHE AJOUTE — prêt à jouer, dans cet ordre.
--
-- POURQUOI CE FICHIER EXISTE
-- `npm run db:push` compare le schéma ENTIER et applique TOUT l'écart d'un
-- coup. C'est le bon geste au moment de la fusion, mais pas pour essayer une
-- correction sur le déploiement de préversion : la préversion tape la base de
-- PRODUCTION, et « tout l'écart » n'est pas ce qu'on veut y appliquer à
-- l'aveugle un mardi après-midi.
--
-- Ce fichier ne contient donc QUE les ajouts, un par un, chacun avec ce qu'il
-- répare. Il est IDEMPOTENT : tout est en `IF NOT EXISTS`, le rejouer ne change
-- rien. Aucune ligne existante n'est modifiée, aucune colonne n'est supprimée,
-- aucune valeur par défaut rétroactive n'est posée.
--
-- À jouer dans l'éditeur SQL de Supabase, d'une traite.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 1. LA TRACE D'ENVOI DES FACTURES ──────────────────────────────────────
--
-- CE QUE ÇA RÉPARE
-- « Est-ce que la facture est vraiment partie ? » n'avait aucune réponse dans
-- le logiciel. `sendFactureAuClient` faisait `await resend.emails.send(...)`
-- puis `return true`, sans condition — or le SDK Resend NE LÈVE JAMAIS
-- d'exception : il rend `{ data, error }`, et même une coupure réseau revient
-- en `{ data: null, error: {...} }`. Un domaine non vérifié, une adresse
-- rejetée, un quota dépassé, un 500 : tout remontait en succès.
--
-- Conséquence directe, sur de l'argent réel : la route gravait le NUMÉRO LÉGAL
-- de la facture et passait le brouillon en « envoyée » pendant que rien n'était
-- parti. L'apiculteur lisait « Facture envoyée à … » ; le client attendait une
-- facture qui n'existait pas ; et le numéro était consommé pour rien.
--
-- CE QUE LES COLONNES PORTENT
--   email_envoye_le      l'horodatage de l'envoi CONFIRMÉ (jamais tenté)
--   email_message_id     l'identifiant rendu par Resend — le seul moyen de
--                        retrouver le message chez le fournisseur
--   email_dernier_echec  le motif du dernier refus, pour le DIRE à l'apiculteur
--
-- Les trois sont nullables et sans défaut : une facture déjà envoyée avant ce
-- correctif reste à NULL, et l'écran dit « aucune trace d'envoi » plutôt que
-- d'inventer une date. On ne réécrit pas le passé.

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS email_envoye_le     timestamptz;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS email_message_id    text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS email_dernier_echec text;

-- Vérification (doit rendre 3 lignes) :
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_name = 'transactions' AND column_name LIKE 'email\_%';


-- ─── 2. LE NOM COMMERCIAL DE L'EXPLOITATION ────────────────────────────────
--
-- CE QUE ÇA APPORTE
-- « Le Rucher de Maël » plutôt que « Maël Dupont » en tête de facture. Le champ
-- est FACULTATIF et ne remplace jamais le nom légal : l'apiculteur exerce en
-- nom propre, la mention obligatoire d'identité du vendeur reste son nom
-- patronymique. Le document affiche le nom commercial en grand ET conserve le
-- nom légal en mention.
--
-- ⚠️ DANS LE FACTUR-X, BT-27 `<ram:Name>` GARDE LE NOM PATRONYMIQUE. Le nom
-- commercial va en BT-28 `<ram:SpecifiedTradeName>`. Une plateforme agréée
-- recoupe le SIREN avec l'annuaire des entreprises : un nom de fantaisie en
-- BT-27 s'y verrait, et ferait rejeter la facture.
--
-- Nullable, sans défaut : un compte existant reste exactement comme il est.

ALTER TABLE profils ADD COLUMN IF NOT EXISTS nom_commercial text;

-- Vérification :
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'profils' AND column_name = 'nom_commercial';
