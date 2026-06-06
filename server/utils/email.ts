import { Resend } from 'resend';

let client: Resend | null = null;

function getClient(): Resend | null {
  if (client) return client;
  const key = process.env.NUXT_RESEND_API_KEY || useRuntimeConfig().resendApiKey;
  if (!key) return null;
  client = new Resend(key as string);
  return client;
}

const FROM = 'APIGO <noreply@apigo.fr>';
const BASE_URL = process.env.NUXT_PUBLIC_BASE_URL || 'https://apigo.fr';

// ─── Templates HTML ──────────────────────────────────────────────────────────

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:40px auto;padding:0 16px">
    <div style="margin-bottom:24px;text-align:center">
      <span style="font-size:22px;font-weight:700;color:#1c1c1e;letter-spacing:-0.02em">🐝 APIGO</span>
    </div>
    <div style="background:#fff;border-radius:16px;border:1px solid rgba(214,211,209,0.6);padding:32px">
      ${content}
    </div>
    <p style="margin-top:20px;text-align:center;font-size:12px;color:#a8a29e">
      APIGO · <a href="${BASE_URL}/politique-confidentialite" style="color:#a8a29e">Confidentialité</a> ·
      <a href="${BASE_URL}/parametres" style="color:#a8a29e">Paramètres</a>
    </p>
  </div>
</body>
</html>`;
}

function btn(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#f5a623;color:#fff;border-radius:10px;font-weight:600;font-size:15px;text-decoration:none">${text}</a>`;
}

// ─── Envois ──────────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, prenom: string): Promise<void> {
  const resend = getClient();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Bienvenue sur APIGO, ${prenom} 🐝`,
    html: layout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1c1e">Bienvenue, ${prenom} !</h1>
      <p style="margin:0 0 16px;color:#57534e;line-height:1.6">
        Votre compte APIGO est prêt. Vous pouvez maintenant gérer vos ruches,
        suivre vos interventions et piloter votre activité apicole au quotidien.
      </p>
      <p style="margin:0 0 8px;color:#57534e;line-height:1.6">
        Pour démarrer, créez votre premier rucher et ajoutez vos ruches :
      </p>
      ${btn('Accéder à mon espace', `${BASE_URL}/dashboard`)}
      <hr style="margin:28px 0;border:none;border-top:1px solid rgba(214,211,209,0.6)">
      <p style="margin:0;font-size:13px;color:#a8a29e">
        Des questions ? Répondez directement à cet email ou consultez le <a href="${BASE_URL}/guide" style="color:#f5a623">guide de démarrage</a>.
      </p>
    `),
  });
}

export async function sendTrialEndingSoonEmail(
  to: string,
  prenom: string,
  joursRestants: number,
  trialEndsAt: Date,
): Promise<void> {
  const resend = getClient();
  if (!resend) return;

  const dateStr = trialEndsAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Votre essai Pro se termine dans ${joursRestants} jour${joursRestants > 1 ? 's' : ''}`,
    html: layout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1c1e">Encore ${joursRestants} jour${joursRestants > 1 ? 's' : ''} d'essai</h1>
      <p style="margin:0 0 16px;color:#57534e;line-height:1.6">
        Bonjour ${prenom},<br><br>
        Votre essai Pro gratuit se termine le <strong>${dateStr}</strong>.
        Pour continuer à profiter de toutes les fonctionnalités, souscrivez avant cette date.
      </p>
      <div style="background:#fef6e4;border-radius:10px;padding:16px;margin-bottom:16px">
        <p style="margin:0;font-size:14px;color:#a86a13;font-weight:600">✅ Vos données sont préservées quoi qu'il arrive</p>
        <p style="margin:4px 0 0;font-size:13px;color:#a86a13">Même si vous ne continuez pas, tout votre historique reste accessible.</p>
      </div>
      ${btn('Choisir un plan', `${BASE_URL}/tarifs`)}
      <p style="margin:16px 0 0;font-size:13px;color:#a8a29e">
        Pas prêt ? Pas de problème — vous pouvez annuler depuis
        <a href="${BASE_URL}/parametres/facturation" style="color:#f5a623">vos paramètres</a> à tout moment.
      </p>
    `),
  });
}

export async function sendTrialExpiredEmail(to: string, prenom: string): Promise<void> {
  const resend = getClient();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Votre essai Pro APIGO est terminé',
    html: layout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1c1e">Votre essai est terminé</h1>
      <p style="margin:0 0 16px;color:#57534e;line-height:1.6">
        Bonjour ${prenom},<br><br>
        Votre essai Pro de 60 jours est arrivé à son terme. Votre compte est repassé
        au plan Découverte gratuit. <strong>Toutes vos données sont intactes.</strong>
      </p>
      <p style="margin:0 0 16px;color:#57534e;line-height:1.6">
        Pour retrouver l'accès complet à vos ruches, interventions et à la facturation, choisissez le plan qui vous correspond :
      </p>
      ${btn('Voir les plans', `${BASE_URL}/tarifs`)}
      <hr style="margin:28px 0;border:none;border-top:1px solid rgba(214,211,209,0.6)">
      <p style="margin:0;font-size:13px;color:#a8a29e">
        Besoin d'aide pour choisir ? Répondez à cet email, on est là.
      </p>
    `),
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const resend = getClient();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Réinitialisation de votre mot de passe APIGO',
    html: layout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1c1e">Réinitialisez votre mot de passe</h1>
      <p style="margin:0 0 16px;color:#57534e;line-height:1.6">
        Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous.
        Ce lien expire dans <strong>1 heure</strong>.
      </p>
      ${btn('Réinitialiser mon mot de passe', resetUrl)}
      <p style="margin:20px 0 0;font-size:13px;color:#a8a29e">
        Si vous n'avez pas fait cette demande, ignorez cet email — votre compte est en sécurité.
      </p>
    `),
  });
}

export async function sendInvoiceCreatedEmail(
  to: string,
  prenomNom: string,
  numeroFacture: string,
  montantTtc: number,
  downloadUrl?: string,
): Promise<void> {
  const resend = getClient();
  if (!resend) return;

  const montant = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    montantTtc,
  );

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Facture ${numeroFacture} — ${montant}`,
    html: layout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1c1e">Nouvelle facture créée</h1>
      <p style="margin:0 0 16px;color:#57534e;line-height:1.6">
        Bonjour ${prenomNom},<br><br>
        La facture <strong>${numeroFacture}</strong> d'un montant de <strong>${montant} TTC</strong> a été générée.
      </p>
      ${
        downloadUrl
          ? btn('Télécharger la facture PDF', downloadUrl)
          : btn('Voir mes factures', `${BASE_URL}/finances`)
      }
      <hr style="margin:28px 0;border:none;border-top:1px solid rgba(214,211,209,0.6)">
      <p style="margin:0;font-size:13px;color:#a8a29e">
        Cet email confirme la création de la facture dans votre espace APIGO.
      </p>
    `),
  });
}
