import type { DestinataireCampagne } from './types';
import { esc } from '~~/server/utils/email';
import { blocApercuProduction } from './bloc-apercu';

/**
 * Segment B — exactement 1 ruche : le cas nominal de Découverte.
 *
 * Campagne « mémorisation », pas conversion. L'apiculteur la reçoit en pleine
 * extraction, où il n'arbitrera rien : le mail dépose un repère qui remonte
 * tout seul fin août, quand les fûts sont pleins et qu'on s'assoit devant ses
 * comptes. L'objet fait lire MAINTENANT tout en ancrant le moment d'après —
 * un objet qui reporte la lecture parie sur un retour qui n'arrive jamais.
 *
 * ⚠️ NE RIEN AFFIRMER SUR LE CHEPTEL. Même sur ce segment où « une ruche »
 * serait exact, la formulation reste fondée sur ce que le PLAN ouvre : le
 * segment se mesure au moment du claim, et un apiculteur peut avoir ajouté
 * une colonie entre-temps.
 */
export function rendreUneRuche(dest: DestinataireCampagne, lienDesinscription: string): string {
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
      <h1 style="margin:0 0 22px;font-size:23px;font-weight:700;letter-spacing:-0.02em;line-height:1.3;color:#1c1c1e">Quand la dernière hausse sera rentrée</h1>

      <p style="margin:0 0 18px;color:#57534e;line-height:1.7">Bonjour${salutation},</p>
      <p style="margin:0 0 18px;color:#57534e;line-height:1.7">
        Vous êtes dans les hausses et l'extracteur — un mail n'a rien à faire là.
        Celui-ci ne demande rien.
      </p>
      <p style="margin:0 0 22px;color:#57534e;line-height:1.7">
        Juste un repère pour fin août. Quand les fûts seront pleins et l'extracteur
        lavé, il y a toujours ce moment où l'on s'assoit et où l'on se demande&nbsp;:
        <strong style="color:#1c1c1e">ça a donné quoi, cette année&nbsp;?</strong> On répond
        en kilos. Voilà à quoi ressemble la réponse entière.
      </p>

${blocApercuProduction()}

      <p style="margin:0 0 24px;font-size:13px;color:#a8a29e;line-height:1.6">
        Et tant qu'à faire, la déclaration annuelle de ruches déjà pré-remplie —
        elle ouvre le 1ᵉʳ septembre.
      </p>

      <p style="margin:0 0 18px;color:#57534e;line-height:1.7">
        Votre compte est en Découverte&nbsp;: il tient le carnet, mais il ne fait pas
        les comptes. L'écran que vous venez de voir n'y figure pas — la production
        par rucher s'ouvre à <strong style="color:#1c1c1e">4,99&nbsp;€ par mois</strong>,
        la rentabilité et la comparaison entre saisons avec Pro.
      </p>
      <p style="margin:0;color:#57534e;line-height:1.7">Mais encore une fois&nbsp;: ce n'est pas le sujet aujourd'hui.</p>
      <div style="text-align:center;margin:26px 0 0">
        <a href="https://apigo.fr/fonctionnalites" style="display:inline-block;padding:12px 26px;background:#f5a623;color:#fff;border-radius:10px;font-weight:600;font-size:14.5px;text-decoration:none">Voir à quoi ressemble un bilan de saison</a>
      </div>

      <hr style="margin:30px 0 22px;border:none;border-top:1px solid rgba(214,211,209,0.6)">
      <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#78716c">
        Rien à décider aujourd'hui&nbsp;: gardez juste ça dans un coin. Quand
        l'extracteur sera lavé, vous saurez où regarder. Et s'il y a une question
        d'ici là — ou si la récolte a été rude — répondez, c'est un humain qui lit.
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
