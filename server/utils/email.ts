import { Resend } from 'resend';

let client: Resend | null = null;

function getClient(): Resend | null {
  if (client) return client;
  const key = process.env.NUXT_RESEND_API_KEY || useRuntimeConfig().resendApiKey;
  if (!key) return null;
  client = new Resend(key as string);
  return client;
}

// Expéditeur : doit rester sur un domaine vérifié dans Resend (SPF/DKIM) —
// une adresse @gmail.com en From serait rejetée par DMARC. L'adresse Gmail
// officielle reçoit les réponses via replyTo.
const FROM = process.env.NUXT_EMAIL_FROM || 'APIGO <noreply@apigo.fr>';
const REPLY_TO = process.env.NUXT_EMAIL_REPLY_TO || 'apigo360.apiculture@gmail.com';
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

/**
 * Email de bienvenue — envoyé par le cron welcome-emails ~1-2 h après
 * l'inscription. Ton chaleureux, valeur d'APIGO mise en avant, touche
 * commerciale volontairement légère (un seul CTA vers les tarifs).
 */
export async function sendWelcomeEmail(to: string, prenom: string): Promise<void> {
  const resend = getClient();
  if (!resend) return;

  const piliers = [
    [
      '🐝',
      'Sur le terrain',
      'Visites, traitements et récoltes saisis en 30 secondes — même sans réseau.',
    ],
    [
      '📋',
      'En règle, sans y penser',
      "Registre d'élevage, traçabilité des lots et déclaration NUI générés automatiquement.",
    ],
    [
      '📈',
      'Des décisions éclairées',
      'Production, rentabilité et santé de vos colonies, lisibles en un coup d’œil.',
    ],
  ]
    .map(
      ([icon, titre, texte]) => `
      <td width="33%" valign="top" style="padding:0 6px">
        <div style="background:#fafaf8;border-radius:12px;padding:14px 12px;text-align:center">
          <div style="font-size:20px;line-height:1">${icon}</div>
          <p style="margin:8px 0 4px;font-size:13px;font-weight:700;color:#1c1c1e">${titre}</p>
          <p style="margin:0;font-size:11.5px;line-height:1.5;color:#78716c">${texte}</p>
        </div>
      </td>`,
    )
    .join('');

  await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to,
    subject: `Bienvenue dans la ruche, ${prenom} 🐝`,
    html: layout(`
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#a86a13">Bienvenue sur APIGO</p>
      <h1 style="margin:0 0 12px;font-size:23px;font-weight:700;letter-spacing:-0.02em;color:#1c1c1e">Ravis de vous compter parmi nous, ${prenom} !</h1>
      <p style="margin:0 0 20px;color:#57534e;line-height:1.65">
        APIGO est né d'une idée simple : un apiculteur devrait passer son temps
        auprès de ses abeilles, pas dans la paperasse. Du rucher à la comptabilité,
        tout votre quotidien apicole tient désormais dans un seul outil.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
        <tr>${piliers}</tr>
      </table>
      <div style="background:linear-gradient(135deg,#1c1c1e,#2c2c30);border-radius:14px;padding:24px;text-align:center">
        <p style="margin:0 0 4px;font-size:17px;font-weight:700;color:#fff;letter-spacing:-0.01em">
          Qu'attendez-vous pour déployer vos ruches à pleine puissance&nbsp;?
        </p>
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6)">
          Découvrez le plan taillé pour votre exploitation — sans engagement, à votre rythme.
        </p>
        <a href="${BASE_URL}/tarifs" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#f5a623;color:#fff;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none">Me lancer 🚀</a>
      </div>
      <hr style="margin:28px 0;border:none;border-top:1px solid rgba(214,211,209,0.6)">
      <p style="margin:0;font-size:13px;color:#a8a29e">
        Une question, une idée ? Répondez simplement à cet email — c'est un humain
        qui lit. Et pour bien démarrer : <a href="${BASE_URL}/guide" style="color:#f5a623">le guide pas à pas</a>.
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
    replyTo: REPLY_TO,
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
    replyTo: REPLY_TO,
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
    replyTo: REPLY_TO,
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
    replyTo: REPLY_TO,
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

/**
 * Envoi de la facture AU CLIENT (acheteur), avec le PDF (et éventuellement le
 * Factur-X) en pièce jointe. `replyTo` = email du vendeur, pour que le client
 * puisse lui répondre directement. Renvoie false si Resend n'est pas configuré.
 */
export async function sendFactureAuClient(opts: {
  to: string;
  replyTo?: string;
  vendeurNom: string;
  numeroFacture: string;
  montantTtc: number;
  attachments: { filename: string; content: string }[];
}): Promise<boolean> {
  const resend = getClient();
  if (!resend) return false;

  const montant = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    opts.montantTtc,
  );

  await resend.emails.send({
    from: FROM,
    replyTo: opts.replyTo || REPLY_TO,
    to: opts.to,
    subject: `Votre facture ${opts.numeroFacture} — ${opts.vendeurNom}`,
    html: layout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1c1c1e">Votre facture ${opts.numeroFacture}</h1>
      <p style="margin:0 0 16px;color:#57534e;line-height:1.6">
        Bonjour,<br><br>
        Veuillez trouver ci-joint votre facture <strong>${opts.numeroFacture}</strong>
        d'un montant de <strong>${montant} TTC</strong>, émise par <strong>${opts.vendeurNom}</strong>.
      </p>
      <p style="margin:0;color:#57534e;line-height:1.6">
        Merci de votre confiance. Pour toute question, répondez simplement à cet email.
      </p>
    `),
    attachments: opts.attachments,
  });
  return true;
}
