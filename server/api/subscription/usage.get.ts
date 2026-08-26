import { eq } from 'drizzle-orm';
import { profils } from '~~/server/database/schema';
import { compterRessource } from '~~/server/utils/compteursDePlan';
import { isAdminEmail } from '~~/app/config/admin';
import { getPlanConfig } from '~~/app/config/plans';
import type { Plan } from '~~/app/config/plans';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  // Multi-utilisateurs : la jauge reflète le plan ET les compteurs du
  // PROPRIÉTAIRE de l'espace (un membre opère sous l'abonnement du proprio).
  // ownerId === user.id pour un compte solo → inchangé.
  const ws = await resolveWorkspace(event);

  const profilRow = await db.query.profils.findFirst({
    where: eq(profils.id, ws.ownerId),
  });

  if (!profilRow) notFound('Profil introuvable');

  const isAdmin = isAdminEmail(user.email);
  const plan = profilRow.plan as Plan;
  const config = getPlanConfig(plan);

  // ⚠️ CETTE JAUGE AVAIT SES PROPRES COMPTEURS, ET C'EST LE PIRE ENDROIT POUR ÇA.
  // Six requêtes recopiées, dont la borne de mois des factures — la même que
  // celle de l'enforcement, à la virgule près, et fausse de la même façon
  // (calculée dans le fuseau du SERVEUR, UTC sur Vercel, au lieu de Paris).
  //
  // Une jauge qui compte autrement que la porte est un mensonge à retardement :
  // l'apiculteur lit « 8 / 10 factures » et se fait refuser la neuvième. Il ne
  // peut même pas comprendre pourquoi, puisque les deux chiffres viennent du
  // même écran. La jauge et la porte lisent donc les MÊMES compteurs
  // (`server/utils/compteursDePlan.ts`) — elles ne peuvent plus diverger.
  const [ruchersCount, ruchesCount, clientsCount, facturesMoisCount, membresCount, templatesCount] =
    await Promise.all(
      (
        [
          'ruchers',
          'ruches',
          'clients',
          'facturesParMois',
          'membresEquipe',
          'templatesIntervention',
        ] as const
      ).map(async (limite) => (await compterRessource(db, ws.ownerId, limite)) ?? 0),
    );

  const daysRemaining = profilRow.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(profilRow.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  // Limite illimitée (Infinity) → null : Infinity ne survit pas à la sérialisation
  // JSON (devient null), ce qui faisait retomber le client sur la limite Découverte.
  // NB : on NE force PAS null pour les admins ici — la jauge doit refléter la vraie
  // limite du plan (et suivre les changements de plan). Le bypass admin reste géré à
  // l'enforcement (isAtLimit côté client + middleware route-gates côté serveur).
  const cap = (n: number): number | null => (n === Infinity ? null : n);

  return {
    plan,
    isAdmin,
    // Contexte espace de travail : true si l'utilisateur agit comme membre
    // d'un autre espace ; nom du propriétaire pour l'afficher dans l'UI.
    isMember: ws.isMember,
    workspaceOwner: ws.isMember
      ? [profilRow.prenom, profilRow.nom].filter(Boolean).join(' ') || profilRow.email
      : null,
    planConfig: {
      id: config.id,
      label: config.label,
      prix: config.prix,
      badge: config.badge,
    },
    usage: {
      ruchers: { current: ruchersCount, max: cap(config.limites.ruchers) },
      ruches: { current: ruchesCount, max: cap(config.limites.ruches) },
      clients: { current: clientsCount, max: cap(config.limites.clients) },
      facturesParMois: { current: facturesMoisCount, max: cap(config.limites.facturesParMois) },
      membresEquipe: { current: membresCount, max: cap(config.limites.membresEquipe) },
      templatesIntervention: {
        current: templatesCount,
        max: cap(config.limites.templatesIntervention),
      },
    },
    trial: {
      active: profilRow.trialActive,
      endsAt: profilRow.trialEndsAt?.toISOString() ?? null,
      daysRemaining,
    },
  };
});
