/**
 * Aperçu produit partagé par les campagnes — un fragment du tableau de bord
 * Production rendu en HTML pur.
 *
 * Zéro image, et ce n'est pas un détail : près d'un client mail sur deux les
 * bloque, et cet aperçu EST l'argument central du mail. Les captures de
 * `public/screens/` sont par ailleurs antérieures à la purge du vert — elles
 * montrent une interface qui n'existe plus.
 *
 * Les chiffres sont fictifs et étiquetés « Exemple » dans le pied du bloc.
 * La rentabilité (4,10 €/kg, 62 % de marge) est un ordre de grandeur de vente
 * directe VALIDÉ PAR ANTOINE : la changer engage la crédibilité de l'ensemble.
 *
 * Rappel d'exactitude (cf. app/config/plans.ts) : ce bloc montre à la fois de
 * la production par rucher (ouverte dès Starter) ET de la rentabilité avec
 * comparaison inter-saisons (réservées à Pro). Toute copie qui l'accompagne
 * doit distinguer les deux, sous peine de vendre du Pro au tarif Starter.
 */
export function blocApercuProduction(): string {
  return `      <!-- ══════ APERÇU PRODUIT — 100 % HTML, aucune image ══════ -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px">
        <tr>
          <td style="background:#fff;border:1px solid rgba(214,211,209,0.9);border-radius:14px;padding:0">

            <!-- Barre de titre -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:15px 18px 13px;border-bottom:1px solid rgba(214,211,209,0.55)">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0;font-size:14.5px;font-weight:700;color:#1c1c1e;letter-spacing:-0.01em">Production</p>
                      </td>
                      <td align="right">
                        <p style="margin:0;font-size:12px;font-weight:600;color:#a8a29e">Saison 2026</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- KPI -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:16px 12px 14px;border-bottom:1px solid rgba(214,211,209,0.55)">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="28%" align="center" style="padding:0 4px">
                        <p style="margin:0 0 3px;font-size:17px;font-weight:700;color:#1c1c1e;letter-spacing:-0.02em">1&nbsp;194<span style="font-size:10.5px;color:#a8a29e"> kg</span></p>
                        <p style="margin:0;font-size:9.5px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#a8a29e">Récolté</p>
                      </td>
                      <td width="24%" align="center" style="padding:0 4px;border-left:1px solid rgba(214,211,209,0.55)">
                        <p style="margin:0 0 3px;font-size:17px;font-weight:700;color:#1c1c1e;letter-spacing:-0.02em">3</p>
                        <p style="margin:0;font-size:9.5px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#a8a29e">Récoltes</p>
                      </td>
                      <td width="24%" align="center" style="padding:0 4px;border-left:1px solid rgba(214,211,209,0.55)">
                        <p style="margin:0 0 3px;font-size:17px;font-weight:700;color:#1c1c1e;letter-spacing:-0.02em">6</p>
                        <p style="margin:0;font-size:9.5px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#a8a29e">Lots tracés</p>
                      </td>
                      <td width="24%" align="center" style="padding:0 4px;border-left:1px solid rgba(214,211,209,0.55)">
                        <p style="margin:0 0 3px;font-size:17px;font-weight:700;color:#a86a13;letter-spacing:-0.02em">+18<span style="font-size:11px">%</span></p>
                        <p style="margin:0;font-size:9.5px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#a8a29e">vs 2025</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Courbe de saison -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:16px 18px 12px;border-bottom:1px solid rgba(214,211,209,0.55)">
                  <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a8a29e">Le rythme de la saison</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="height:52px">
                    <tr>
                      <td valign="bottom" width="8.33%" align="center" style="padding:0 2px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="3" bgcolor="#ede9e3" style="border-radius:2px;font-size:0;line-height:3px">&nbsp;</td></tr></table></td>
                      <td valign="bottom" width="8.33%" align="center" style="padding:0 2px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="3" bgcolor="#ede9e3" style="border-radius:2px;font-size:0;line-height:3px">&nbsp;</td></tr></table></td>
                      <td valign="bottom" width="8.33%" align="center" style="padding:0 2px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="5" bgcolor="#f0d9a8" style="border-radius:2px;font-size:0;line-height:5px">&nbsp;</td></tr></table></td>
                      <td valign="bottom" width="8.33%" align="center" style="padding:0 2px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="14" bgcolor="#f5cd7e" style="border-radius:2px;font-size:0;line-height:14px">&nbsp;</td></tr></table></td>
                      <td valign="bottom" width="8.33%" align="center" style="padding:0 2px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="46" bgcolor="#f5a623" style="border-radius:2px;font-size:0;line-height:46px">&nbsp;</td></tr></table></td>
                      <td valign="bottom" width="8.33%" align="center" style="padding:0 2px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="38" bgcolor="#f5a623" style="border-radius:2px;font-size:0;line-height:38px">&nbsp;</td></tr></table></td>
                      <td valign="bottom" width="8.33%" align="center" style="padding:0 2px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="26" bgcolor="#f5a623" style="border-radius:2px;font-size:0;line-height:26px">&nbsp;</td></tr></table></td>
                      <td valign="bottom" width="8.33%" align="center" style="padding:0 2px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="11" bgcolor="#f5cd7e" style="border-radius:2px;font-size:0;line-height:11px">&nbsp;</td></tr></table></td>
                      <td valign="bottom" width="8.33%" align="center" style="padding:0 2px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="3" bgcolor="#ede9e3" style="border-radius:2px;font-size:0;line-height:3px">&nbsp;</td></tr></table></td>
                      <td valign="bottom" width="8.33%" align="center" style="padding:0 2px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="3" bgcolor="#ede9e3" style="border-radius:2px;font-size:0;line-height:3px">&nbsp;</td></tr></table></td>
                      <td valign="bottom" width="8.33%" align="center" style="padding:0 2px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="3" bgcolor="#ede9e3" style="border-radius:2px;font-size:0;line-height:3px">&nbsp;</td></tr></table></td>
                      <td valign="bottom" width="8.33%" align="center" style="padding:0 2px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="3" bgcolor="#ede9e3" style="border-radius:2px;font-size:0;line-height:3px">&nbsp;</td></tr></table></td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top:6px;font-size:9px;color:#c4beb6">J</td>
                      <td align="center" style="padding-top:6px;font-size:9px;color:#c4beb6">F</td>
                      <td align="center" style="padding-top:6px;font-size:9px;color:#c4beb6">M</td>
                      <td align="center" style="padding-top:6px;font-size:9px;color:#c4beb6">A</td>
                      <td align="center" style="padding-top:6px;font-size:9px;color:#a8a29e;font-weight:700">M</td>
                      <td align="center" style="padding-top:6px;font-size:9px;color:#a8a29e;font-weight:700">J</td>
                      <td align="center" style="padding-top:6px;font-size:9px;color:#a8a29e;font-weight:700">J</td>
                      <td align="center" style="padding-top:6px;font-size:9px;color:#c4beb6">A</td>
                      <td align="center" style="padding-top:6px;font-size:9px;color:#c4beb6">S</td>
                      <td align="center" style="padding-top:6px;font-size:9px;color:#c4beb6">O</td>
                      <td align="center" style="padding-top:6px;font-size:9px;color:#c4beb6">N</td>
                      <td align="center" style="padding-top:6px;font-size:9px;color:#c4beb6">D</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Production par rucher -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:16px 18px 14px;border-bottom:1px solid rgba(214,211,209,0.55)">
                  <p style="margin:0 0 13px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a8a29e">Par rucher</p>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 11px">
                    <tr><td colspan="2" style="padding-bottom:4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:12.5px;color:#57534e">Rucher des Tilleuls</td>
                      <td align="right" style="font-size:12.5px;font-weight:700;color:#1c1c1e">612 kg</td>
                    </tr></table></td></tr>
                    <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f0ede8" style="border-radius:5px"><tr>
                      <td width="100%" bgcolor="#f5a623" style="border-radius:5px;font-size:0;line-height:8px;height:8px">&nbsp;</td>
                    </tr></table></td></tr>
                  </table>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 11px">
                    <tr><td colspan="2" style="padding-bottom:4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:12.5px;color:#57534e">Rucher du Coteau</td>
                      <td align="right" style="font-size:12.5px;font-weight:700;color:#1c1c1e">388 kg</td>
                    </tr></table></td></tr>
                    <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f0ede8" style="border-radius:5px"><tr>
                      <td width="63%" bgcolor="#f5a623" style="border-radius:5px;font-size:0;line-height:8px;height:8px">&nbsp;</td>
                      <td width="37%" style="font-size:0;line-height:8px">&nbsp;</td>
                    </tr></table></td></tr>
                  </table>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr><td colspan="2" style="padding-bottom:4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                      <td style="font-size:12.5px;color:#57534e">Rucher de la Combe</td>
                      <td align="right" style="font-size:12.5px;font-weight:700;color:#1c1c1e">194 kg</td>
                    </tr></table></td></tr>
                    <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f0ede8" style="border-radius:5px"><tr>
                      <td width="32%" bgcolor="#dba94f" style="border-radius:5px;font-size:0;line-height:8px;height:8px">&nbsp;</td>
                      <td width="68%" style="font-size:0;line-height:8px">&nbsp;</td>
                    </tr></table></td></tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Répartition par miel + rentabilité -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="52%" valign="top" style="padding:16px 10px 16px 18px">
                  <p style="margin:0 0 11px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a8a29e">Par miel</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom:6px;font-size:12px;color:#57534e"><span style="color:#f5a623">●</span>&nbsp; Acacia</td>
                      <td align="right" style="padding-bottom:6px;font-size:12px;font-weight:600;color:#1c1c1e">520&nbsp;kg</td>
                    </tr>
                    <tr>
                      <td style="padding-bottom:6px;font-size:12px;color:#57534e"><span style="color:#a86a13">●</span>&nbsp; Châtaignier</td>
                      <td align="right" style="padding-bottom:6px;font-size:12px;font-weight:600;color:#1c1c1e">400&nbsp;kg</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;color:#57534e"><span style="color:#e8c887">●</span>&nbsp; Toutes fleurs</td>
                      <td align="right" style="font-size:12px;font-weight:600;color:#1c1c1e">274&nbsp;kg</td>
                    </tr>
                  </table>
                </td>
                <td width="48%" valign="top" style="padding:16px 18px 16px 10px;border-left:1px solid rgba(214,211,209,0.55)">
                  <p style="margin:0 0 11px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a8a29e">Rentabilité</p>
                  <p style="margin:0 0 3px;font-size:19px;font-weight:700;color:#1c1c1e;letter-spacing:-0.02em">4,10&nbsp;<span style="font-size:12px;color:#a8a29e">€/kg</span></p>
                  <p style="margin:0;font-size:12px;color:#78716c">Marge nette 62&nbsp;% · coûts déduits</p>
                </td>
              </tr>
            </table>

            <!-- Pied -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td bgcolor="#fef6e4" style="padding:13px 18px;border-radius:0 0 13px 13px">
                  <p style="margin:0;font-size:12px;line-height:1.55;color:#8a5a10">
                    <strong style="color:#a86a13">Exemple.</strong> La Combe a produit trois fois moins que
                    les Tilleuls, et l'acacia porte 44&nbsp;% de la saison — deux choses
                    qu'un chiffre global ne dit jamais.
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>`;
}
