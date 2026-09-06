import type { DestinataireCampagne } from './types';
import { esc } from '~~/server/utils/email';

/**
 * Segment A — compte ouvert, RIEN saisi (0 ruche).
 *
 * Ces gens n'ont jamais utilisé le produit : leur réclamer de l'argent serait
 * absurde, et l'aperçu d'un tableau de bord riche leur promettrait un écran
 * qu'ils ne peuvent pas atteindre. D'où un mail court, sans aucun prix et sans
 * aperçu — une seule question, facile à répondre. L'objectif est la RÉPONSE,
 * pas le clic : sur une liste de cette taille, une ligne de retour vaut plus
 * que n'importe quel taux de conversion.
 *
 * La clôture invite explicitement à se désinscrire si le besoin a disparu :
 * une liste propre vaut mieux qu'une liste large.
 */
export function rendreCompteVide(dest: DestinataireCampagne, lienDesinscription: string): string {
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
      <h1 style="margin:0 0 22px;font-size:23px;font-weight:700;letter-spacing:-0.02em;line-height:1.3;color:#1c1c1e">On a dû rater quelque chose</h1>

      <p style="margin:0 0 18px;color:#57534e;line-height:1.7">Bonjour${salutation},</p>
      <p style="margin:0 0 18px;color:#57534e;line-height:1.7">
        Vous avez ouvert un compte APIGO, et vous n'y êtes pas revenu. C'est un
        signal, et il est pour nous&nbsp;: quelque chose n'a pas accroché.
      </p>
      <p style="margin:0 0 18px;color:#57534e;line-height:1.7">
        On aimerait simplement savoir quoi. Trop long à remplir&nbsp;? Pas le bon
        moment, en pleine saison&nbsp;? Pas ce que vous cherchiez&nbsp;?
      </p>
      <p style="margin:0 0 18px;color:#57534e;line-height:1.7">
        Répondez à ce mail en une ligne, même sèche. C'est un humain qui lit, et
        ça nous sert bien plus que n'importe quelle statistique.
      </p>
      <p style="margin:0;color:#57534e;line-height:1.7">
        Et si vous voulez lui laisser une seconde chance&nbsp;: une seule ruche
        suffit pour voir ce que ça donne. Deux minutes, et le carnet commence à
        vivre — vous ne payez rien pour ça.
      </p>
      <div style="text-align:center;margin:26px 0 0">
        <a href="https://apigo.fr/ruchers" style="display:inline-block;padding:12px 26px;background:#f5a623;color:#fff;border-radius:10px;font-weight:600;font-size:14.5px;text-decoration:none">Reprendre où j'en étais</a>
      </div>

      <hr style="margin:30px 0 22px;border:none;border-top:1px solid rgba(214,211,209,0.6)">
      <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#78716c">
        Et si la réponse est «&nbsp;je n'en ai plus besoin&nbsp;», dites-le aussi&nbsp;:
        on préfère une désinscription franche à un mail de plus.
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
