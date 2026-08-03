import type { DestinataireCampagne } from './types';
import { esc } from '~~/server/utils/email';
import { blocApercuProduction } from './bloc-apercu';

/**
 * Segment C — cheptel réel (2 ruches et plus) sur le plan gratuit, essai
 * JAMAIS utilisé. Le segment qui porte le chiffre d'affaires.
 *
 * Ces apiculteurs ont fait le travail long : le dry-run du 03/08 a trouvé 12,
 * 35 et 80 colonies saisies. Et ZÉRO récolte — non par négligence, mais parce
 * que `POST /api/production/recoltes` est gaté sur la capacité `production`,
 * absente de Découverte (cf. app/config/route-gates.ts). Ils sont bloqués
 * exactement au moment de l'année qui compte : c'est là-dessus que porte
 * l'argument.
 *
 * ⚠️ NE JAMAIS écrire qu'ils ont saisi des récoltes. Une version antérieure le
 * faisait (« les colonies y sont, les récoltes aussi ») : faux pour deux des
 * trois destinataires, et immédiatement visible par eux.
 *
 * L'accroche repose sur un fait vérifié en base plutôt que sur une promesse :
 * `NOT trial_used` est dans le segment, donc « vos 60 jours n'ont jamais été
 * utilisés » est vrai pour CHAQUE destinataire. Si ce filtre disparaissait du
 * registre, le mail deviendrait mensonger — un banc le verrouille.
 *
 * Conditions de l'essai dites franchement (carte demandée, rien débité avant) :
 * les taire coûterait plus en réclamations que ça ne rapporterait en clics.
 */
export function rendreCheptelReel(dest: DestinataireCampagne, lienDesinscription: string): string {
  const salutation = dest.prenom ? ` ${esc(dest.prenom)}` : '';
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>APIGO — Quand la dernière hausse sera rentrée</title></head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">

  <!-- ══ DÉBUT DE L'EMAIL ══ -->
  <div style="max-width:600px;margin:40px auto;padding:0 16px">
    <div style="margin-bottom:24px;text-align:center">
      <span style="font-size:22px;font-weight:700;color:#1c1c1e;letter-spacing:-0.02em">🐝 APIGO</span>
    </div>
    <div style="background:#fff;border-radius:16px;border:1px solid rgba(214,211,209,0.6);padding:32px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#a86a13">Vos 60 jours de Pro</p>
      <h1 style="margin:0 0 22px;font-size:23px;font-weight:700;letter-spacing:-0.02em;line-height:1.3;color:#1c1c1e">Ils n'ont jamais été utilisés</h1>

      <p style="margin:0 0 18px;color:#57534e;line-height:1.7">Bonjour${salutation},</p>
      <p style="margin:0 0 18px;color:#57534e;line-height:1.7">
        Vous faites partie des rares à avoir vraiment installé leur rucher dans
        APIGO&nbsp;: vos colonies y sont, une par une. C'est le plus long du
        travail, et vous l'avez fait.
      </p>
      <p style="margin:0 0 22px;color:#57534e;line-height:1.7">
        Sauf qu'ensuite, Découverte vous arrête net&nbsp;: sur le plan gratuit,
        <strong style="color:#1c1c1e">enregistrer une récolte n'est pas possible</strong>.
        Vous avez saisi votre cheptel, et l'outil ne vous laisse pas noter ce
        qu'il donne — au moment de l'année où c'est justement la seule chose
        qui compte.
      </p>

${blocApercuProduction()}

      <p style="margin:0 0 18px;color:#57534e;line-height:1.7">
        Voilà ce que le plan gratuit vous ferme. La production par rucher s'ouvre
        à 4,99&nbsp;€ par mois, la rentabilité et la comparaison entre saisons
        avec Pro.
      </p>
      <p style="margin:0 0 18px;color:#57534e;line-height:1.7">
        Et <strong style="color:#1c1c1e">vos 60 jours de Pro n'ont jamais été
        utilisés</strong>. Ils vous attendent toujours&nbsp;: deux mois pour voir votre
        saison en entier, précisément au moment où elle se termine. Si ça ne vous
        sert pas, vous ne payez rien — et vos données restent intactes dans tous
        les cas.
      </p>
      <p style="margin:0;font-size:12px;line-height:1.55;color:#a8a29e">
        La carte est demandée à l'activation, rien n'est débité avant les 60 jours,
        et l'essai s'arrête en un clic depuis vos paramètres.
      </p>
      <div style="text-align:center;margin:26px 0 0">
        <a href="https://apigo.fr/activer-essai" style="display:inline-block;padding:12px 26px;background:#f5a623;color:#fff;border-radius:10px;font-weight:600;font-size:14.5px;text-decoration:none">Activer mes 60 jours</a>
      </div>

      <hr style="margin:30px 0 22px;border:none;border-top:1px solid rgba(214,211,209,0.6)">
      <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#78716c">
        Rien d'urgent&nbsp;: l'essai vous attendra aussi bien en septembre.
        Et si vous avez une question — ou si la récolte a été rude cette année —
        répondez simplement, c'est un humain qui lit.
      </p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#57534e">
        Bonne fin de saison,<br>
        <strong style="color:#1c1c1e">Antoine</strong><br>
        <span style="color:#a8a29e">APIGO</span>
      </p>
    </div>
    <p style="margin-top:20px;text-align:center;font-size:12px;color:#a8a29e">
      APIGO · <a href="https://apigo.fr/politique-confidentialite" style="color:#a8a29e">Confidentialité</a> ·
      <a href="https://apigo.fr/parametres" style="color:#a8a29e">Paramètres</a><br>
      <a href="${lienDesinscription}" style="color:#a8a29e;text-decoration:underline">Ne plus recevoir ce type d'email</a>
    </p>
  </div>
  <!-- ══ FIN DE L'EMAIL ══ -->

</body>
</html>
`;
}
