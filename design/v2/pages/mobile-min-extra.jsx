/* APIGO — Mobile MINIMAL — pages complémentaires
   Menu, Paramètres, Production, Stocks, Finances, Météo
   Réutilise les helpers MM / SIcon / Si depuis mobile-min.jsx */

const { MM, SIcon, Si, MinFrame } = window;

const Xi = {
  ...Si,
  honey: <path d="M12 2 4 7v10l8 5 8-5V7z"/>,
  package: <><path d="m7.5 4.27 9 5.15M21 8 12 13 3 8m9 14V13"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  zap: <path d="M13 2 3 14h9l-1 8 10-12h-9z"/>,
  cloud: <path d="M17.5 19a4.5 4.5 0 1 0-1.5-8.75 6 6 0 1 0-11 3.75 3.5 3.5 0 0 0 1 6.86h11.5z"/>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>,
  download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>,
  user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  database: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0"/></>,
  inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/></>,
  help: <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></>,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>,
  pin: <><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
  trend: <><path d="m23 6-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></>,
  cog: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  scale: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
  alert: <><path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4M12 17h.01"/></>,
  snow: <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/>,
};

/* small icon row helper */
const RowLink = ({ icon, title, sub, value, badge }) => (
  <div style={MM.row}>
    {icon && <div style={{width: 28, height: 28, display: 'grid', placeItems: 'center', color: '#000', flexShrink: 0}}><SIcon d={Xi[icon]} size={20} stroke={1.7}/></div>}
    <div style={MM.rowMain}>
      <div style={MM.rowT}>{title}</div>
      {sub && <div style={MM.rowS}>{sub}</div>}
    </div>
    {value && <div style={{fontSize: 14, color: '#6b7280', fontVariantNumeric: 'tabular-nums'}}>{value}</div>}
    {badge && <span style={{fontSize: 11, fontWeight: 600, color: '#fff', background: '#b54545', padding: '2px 7px', borderRadius: 99}}>{badge}</span>}
    <SIcon d={Xi.chev} size={16}/>
  </div>
);

/* ============================================================
   MENU — point d'entrée au reste des pages
   Accès : tap sur l'avatar en haut à droite de "Aujourd'hui"
   ============================================================ */
const ScrMinMenu = () => (
  <div style={MM.body}>
    <div style={MM.nav}>
      <div style={MM.navTop}>
        <button style={MM.navIcon}><SIcon d={Xi.back} size={22}/></button>
        <button style={MM.navBtn}>Aide</button>
      </div>
    </div>

    {/* Profil — pas de carte, juste un bloc texte */}
    <div style={{padding: '0 20px 22px', borderBottom: '0.5px solid #e7e5e0', display: 'flex', alignItems: 'center', gap: 14}}>
      <div style={{width: 56, height: 56, borderRadius: 99, background: '#000', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em'}}>ML</div>
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontSize: 18, fontWeight: 600, letterSpacing: '-0.005em'}}>Marc Lefèvre</div>
        <div style={{fontSize: 13, color: '#6b7280', marginTop: 2}}>Miellerie du Mont Ventoux · Plan Pro</div>
      </div>
    </div>

    <div style={MM.sect}><span style={MM.sectT}>Gestion</span></div>
    <RowLink icon="honey"   title="Production"      sub="6 740 kg · 2025" value=""/>
    <RowLink icon="package" title="Stocks & matériel" sub="3 sous le seuil" badge="3"/>

    <div style={MM.sect}><span style={MM.sectT}>Affaires</span></div>
    <RowLink icon="card"  title="Finances"          sub="38,4 k€ YTD"/>
    <RowLink icon="users" title="Clients & vente"   sub="62 actifs"/>
    <RowLink icon="zap"   title="Analytics"         sub="Tableaux détaillés"/>

    <div style={MM.sect}><span style={MM.sectT}>Outils</span></div>
    <RowLink icon="cloud"    title="Météo apicole"    sub="Butinage 92/100 aujourd'hui"/>
    <RowLink icon="download" title="Exports"          sub="CSV · PDF · comptable"/>

    <div style={MM.sect}><span style={MM.sectT}>Compte</span></div>
    <RowLink icon="cog"    title="Paramètres"/>
    <RowLink icon="shield" title="Sécurité & 2FA"/>
    <RowLink icon="help"   title="Centre d'aide"/>

    <div style={{...MM.row, ...MM.rowFirst, marginTop: 24, borderBottom: '0.5px solid #e7e5e0'}}>
      <div style={{width: 28, height: 28, display: 'grid', placeItems: 'center', color: '#b54545'}}><SIcon d={Xi.logout} size={20} stroke={1.7}/></div>
      <div style={{...MM.rowMain, ...MM.rowT, color: '#b54545'}}>Se déconnecter</div>
    </div>

    <div style={{padding: '20px', textAlign: 'center', fontSize: 11, color: '#9ca3af'}}>
      APIGO v2.4.1 · données hébergées en France
    </div>
  </div>
);

/* ============================================================
   PARAMÈTRES — édition profil + préférences
   ============================================================ */
const ScrMinParametres = () => (
  <div style={MM.body}>
    <div style={MM.nav}>
      <div style={MM.navTop}>
        <button style={MM.navIcon}><SIcon d={Xi.back} size={22}/></button>
        <button style={MM.navBtn}>Aide</button>
      </div>
      <div style={MM.navTitle}>Paramètres</div>
      <div style={MM.navSub}>Profil, préférences et notifications</div>
    </div>

    <div style={MM.sect}><span style={MM.sectT}>Identité</span></div>
    <RowLink title="Prénom"   value="Marc"/>
    <RowLink title="Nom"      value="Lefèvre"/>
    <RowLink title="Email"    value="marc.lefevre@apigo.fr"/>
    <RowLink title="Téléphone" value="06 24 18 73 92"/>

    <div style={MM.sect}><span style={MM.sectT}>Exploitation</span></div>
    <RowLink title="Raison sociale" value="Miellerie du Ventoux"/>
    <RowLink title="Adresse"        value="Bédoin (84)"/>
    <RowLink title="NAPI"           value="84-219"/>
    <RowLink title="SIRET"          value="832 174 096"/>

    <div style={MM.sect}><span style={MM.sectT}>Notifications</span></div>
    {[
      {l: 'Stocks bas', on: true},
      {l: 'Interventions à venir', on: true},
      {l: 'Météo critique', on: true},
      {l: "Risque d'essaimage", on: true},
      {l: 'Push mobile', on: true},
      {l: 'Digest hebdomadaire', on: false},
    ].map((n, i) => (
      <div key={n.l} style={{...MM.row, ...(i === 0 ? MM.rowFirst : {})}}>
        <div style={{...MM.rowMain, ...MM.rowT}}>{n.l}</div>
        <div style={{width: 44, height: 26, borderRadius: 99, background: n.on ? '#000' : '#e7e5e0', position: 'relative', flexShrink: 0}}>
          <div style={{position: 'absolute', top: 2, left: n.on ? 20 : 2, width: 22, height: 22, borderRadius: 99, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)'}}/>
        </div>
      </div>
    ))}

    <div style={MM.sect}><span style={MM.sectT}>Abonnement</span></div>
    <RowLink icon="card" title="Plan Pro" sub="29 € HT / mois · prochaine facture 14 juin"/>
    <RowLink icon="download" title="Historique de factures" sub="14 factures"/>

    <div style={MM.sect}><span style={MM.sectT}>Données</span></div>
    <RowLink icon="download" title="Exporter mes données" sub="Archive CSV (RGPD)"/>
    <RowLink icon="shield"   title="Politique de confidentialité"/>

    <div style={{padding: '24px 20px 0'}}>
      <button style={{width: '100%', height: 50, borderRadius: 12, background: '#fff', border: '0.5px solid #e7c5c5', color: '#b54545', fontSize: 15, fontWeight: 500}}>Supprimer mon compte</button>
    </div>
  </div>
);

/* ============================================================
   PRODUCTION
   ============================================================ */
const ScrMinProduction = () => (
  <div style={MM.body}>
    <div style={MM.nav}>
      <div style={MM.navTop}>
        <button style={MM.navIcon}><SIcon d={Xi.back} size={22}/></button>
        <button style={MM.navBtn}>2025 <SIcon d={<path d="m6 9 6 6 6-6"/>} size={14} stroke={2}/></button>
      </div>
      <div style={MM.navTitle}>Production</div>
      <div style={MM.navSub}>Saison en cours · récoltes saisies</div>
    </div>

    <div style={MM.strip}>
      <div style={MM.stripCell}>
        <div style={MM.stripL}>Récolté</div>
        <div style={MM.stripV}>6 740<span style={{fontSize: 11, color: '#9ca3af', marginLeft: 3, fontWeight: 500}}>kg</span></div>
        <div style={{...MM.stripT, color: '#4f6a4c', fontWeight: 500}}>+12 % vs 2024</div>
      </div>
      <div style={{...MM.stripCell, ...MM.stripCellSep}}>
        <div style={MM.stripL}>Rendement</div>
        <div style={MM.stripV}>27,2<span style={{fontSize: 11, color: '#9ca3af', marginLeft: 3, fontWeight: 500}}>kg/r</span></div>
        <div style={MM.stripT}>+3,1 kg</div>
      </div>
      <div style={{...MM.stripCell, ...MM.stripCellSep}}>
        <div style={MM.stripL}>Stocks</div>
        <div style={MM.stripV}>2 180<span style={{fontSize: 11, color: '#9ca3af', marginLeft: 3, fontWeight: 500}}>kg</span></div>
        <div style={MM.stripT}>en miellerie</div>
      </div>
    </div>

    {/* Mini chart */}
    <div style={MM.sect}><span style={MM.sectT}>Récolte par mois</span><span style={MM.sectS}>kg</span></div>
    <div style={{padding: '4px 20px 18px', borderBottom: '0.5px solid #e7e5e0'}}>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 8, height: 90, marginTop: 4}}>
        {[
          {m: 'Mar', v: 14},  {m: 'Avr', v: 30},  {m: 'Mai', v: 60},  {m: 'Juin', v: 88},
          {m: 'Juil', v: 100}, {m: 'Août', v: 56}, {m: 'Sept', v: 14},
        ].map(b => (
          <div key={b.m} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
            <div style={{width: '100%', height: `${b.v}%`, background: '#000', borderRadius: 2}}/>
            <div style={{fontSize: 10, color: '#6b7280'}}>{b.m}</div>
          </div>
        ))}
      </div>
    </div>

    <div style={MM.sect}><span style={MM.sectT}>Récoltes récentes</span><span style={MM.sectA}>Voir tout</span></div>
    {[
      {d: '28 avr.', t: 'Mont Ventoux Sud', m: 'romarin', kg: 420},
      {d: '26 avr.', t: "Coteaux d'Apt", m: 'romarin', kg: 280},
      {d: '22 avr.', t: "Plaine de l'Ouvèze", m: 'multifloral', kg: 180},
      {d: '12 mar.', t: 'Garrigue de Sault', m: 'romarin', kg: 340},
    ].map((r, i) => (
      <div key={i} style={{...MM.row, ...(i === 0 ? MM.rowFirst : {})}}>
        <span style={{width: 56, fontSize: 12, color: '#6b7280', fontVariantNumeric: 'tabular-nums'}}>{r.d}</span>
        <div style={MM.rowMain}>
          <div style={MM.rowT}>{r.t}</div>
          <div style={MM.rowS}>{r.m}</div>
        </div>
        <div style={{fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>{r.kg} kg</div>
      </div>
    ))}

    <div style={MM.sect}><span style={MM.sectT}>Par rucher</span></div>
    {[
      {n: 'Mont Ventoux Sud', kg: 1180, pct: 88},
      {n: 'Garrigue de Sault', kg: 1340, pct: 100},
      {n: 'Coteaux d\'Apt', kg: 860, pct: 64},
      {n: 'Forêt du Comtat', kg: 780, pct: 58},
      {n: "Plaine de l'Ouvèze", kg: 920, pct: 69},
    ].map((r, i) => (
      <div key={r.n} style={{...MM.row, ...(i === 0 ? MM.rowFirst : {})}}>
        <div style={{...MM.rowMain}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
            <span style={MM.rowT}>{r.n}</span>
            <span style={{fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>{r.kg} kg</span>
          </div>
          <div style={{marginTop: 8, height: 3, background: '#f4f2ed', borderRadius: 99, overflow: 'hidden'}}>
            <div style={{width: `${r.pct}%`, height: '100%', background: '#000', borderRadius: 99}}/>
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* ============================================================
   STOCKS
   ============================================================ */
const ScrMinStocks = () => (
  <div style={MM.body}>
    <div style={MM.nav}>
      <div style={MM.navTop}>
        <button style={MM.navIcon}><SIcon d={Xi.back} size={22}/></button>
        <button style={MM.navIcon}><SIcon d={Xi.plus} size={22}/></button>
      </div>
      <div style={MM.navTitle}>Stocks</div>
      <div style={MM.navSub}>12 articles suivis · 3 sous le seuil</div>
      <div style={{marginTop: 14, display: 'flex', gap: 6, overflow: 'hidden'}}>
        <button style={MM.chip(true)}>Tous · 12</button>
        <button style={MM.chip(false)}>Matériel · 4</button>
        <button style={MM.chip(false)}>Consommables · 4</button>
        <button style={MM.chip(false)}>Conditionnement · 4</button>
      </div>
    </div>

    <div style={MM.sect}><span style={{...MM.sectT, color: '#c87f2a'}}>Sous le seuil</span><span style={MM.sectS}>3 articles</span></div>
    {[
      {n: 'Cires gaufrées Dadant', sub: 'plaques · seuil 20', q: 8, t: 20, low: true},
      {n: 'Cadres filés', sub: 'à monter · seuil 40', q: 12, t: 40, low: true},
      {n: 'Étiquettes Lavande IGP', sub: 'imprimées · seuil 200', q: 110, t: 200, low: true},
    ].map((it, i) => (
      <div key={it.n} style={{...MM.row, ...(i === 0 ? MM.rowFirst : {})}}>
        <span style={{width: 4, height: 36, borderRadius: 99, background: '#c87f2a', flexShrink: 0}}/>
        <div style={MM.rowMain}>
          <div style={MM.rowT}>{it.n}</div>
          <div style={MM.rowS}>{it.sub}</div>
        </div>
        <div style={{textAlign: 'right'}}>
          <div style={{fontSize: 15, fontWeight: 600, color: '#c87f2a', fontVariantNumeric: 'tabular-nums'}}>{it.q}</div>
          <div style={{fontSize: 11, color: '#9ca3af', fontVariantNumeric: 'tabular-nums'}}>/ {it.t}</div>
        </div>
      </div>
    ))}

    <div style={MM.sect}><span style={MM.sectT}>Matériel ruche</span></div>
    {[
      {n: 'Corps Dadant 10c', sub: 'bois cèdre', q: 32, t: 20},
      {n: 'Hausses Dadant', sub: 'bois sapin', q: 64, t: 40},
      {n: 'Toits chalet', sub: 'tôle galva', q: 18, t: 10},
    ].map((it, i) => (
      <div key={it.n} style={{...MM.row, ...(i === 0 ? MM.rowFirst : {})}}>
        <div style={MM.rowMain}>
          <div style={MM.rowT}>{it.n}</div>
          <div style={MM.rowS}>{it.sub}</div>
        </div>
        <div style={{fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>{it.q}</div>
        <SIcon d={Xi.chev} size={16}/>
      </div>
    ))}

    <div style={MM.sect}><span style={MM.sectT}>Commandes en cours</span><span style={MM.sectS}>2</span></div>
    {[
      {n: 'Apiculture du Comtat', sub: 'Cires + cadres · 320 €', s: 'Expédiée'},
      {n: 'Étiquettes Provence', sub: '500 étiquettes · 78 €', s: 'Préparation'},
    ].map((c, i) => (
      <div key={i} style={{...MM.row, ...(i === 0 ? MM.rowFirst : {})}}>
        <div style={MM.rowMain}>
          <div style={MM.rowT}>{c.n}</div>
          <div style={MM.rowS}>{c.sub}</div>
        </div>
        <span style={{fontSize: 11, fontWeight: 600, color: c.s === 'Expédiée' ? '#4f6a4c' : '#a86a13'}}>{c.s}</span>
      </div>
    ))}
  </div>
);

/* ============================================================
   FINANCES
   ============================================================ */
const ScrMinFinances = () => (
  <div style={MM.body}>
    <div style={MM.nav}>
      <div style={MM.navTop}>
        <button style={MM.navIcon}><SIcon d={Xi.back} size={22}/></button>
        <button style={MM.navBtn}>2025 <SIcon d={<path d="m6 9 6 6 6-6"/>} size={14} stroke={2}/></button>
      </div>
      <div style={MM.navTitle}>Finances</div>
      <div style={MM.navSub}>CA, factures et dépenses</div>
    </div>

    <div style={MM.strip}>
      <div style={MM.stripCell}>
        <div style={MM.stripL}>CA YTD</div>
        <div style={MM.stripV}>38,4<span style={{fontSize: 11, color: '#9ca3af', marginLeft: 3, fontWeight: 500}}>k€</span></div>
        <div style={{...MM.stripT, color: '#4f6a4c', fontWeight: 500}}>+12 %</div>
      </div>
      <div style={{...MM.stripCell, ...MM.stripCellSep}}>
        <div style={MM.stripL}>En attente</div>
        <div style={{...MM.stripV, color: '#a86a13'}}>3 240<span style={{fontSize: 11, color: '#9ca3af', marginLeft: 3, fontWeight: 500}}>€</span></div>
        <div style={MM.stripT}>4 factures</div>
      </div>
      <div style={{...MM.stripCell, ...MM.stripCellSep}}>
        <div style={MM.stripL}>Marge</div>
        <div style={MM.stripV}>62<span style={{fontSize: 11, color: '#9ca3af', marginLeft: 3, fontWeight: 500}}>%</span></div>
        <div style={MM.stripT}>Dépenses 14,7 k€</div>
      </div>
    </div>

    <div style={MM.sect}><span style={MM.sectT}>Évolution mensuelle</span><span style={MM.sectS}>k€</span></div>
    <div style={{padding: '4px 20px 18px', borderBottom: '0.5px solid #e7e5e0'}}>
      <svg viewBox="0 0 320 90" width="100%" height="90" preserveAspectRatio="none">
        <polyline fill="none" stroke="#000" strokeWidth="1.5" strokeLinejoin="round"
          points="0,72 27,68 53,60 80,50 107,38 133,24 160,18 187,30 213,52 240,62 267,68 293,74 320,76"/>
        <line x1="0" y1="90" x2="320" y2="90" stroke="#e7e5e0" strokeWidth="0.5"/>
      </svg>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginTop: 4}}>
        <span>Jan</span><span>Mar</span><span>Mai</span><span>Juil</span><span>Sept</span><span>Nov</span>
      </div>
    </div>

    <div style={MM.sect}><span style={MM.sectT}>Factures récentes</span><span style={MM.sectA}>Tout voir</span></div>
    {[
      {n: 'F-042', d: '28 avr.', c: 'Épicerie La Récolte', mt: 720, s: 'pending'},
      {n: 'F-041', d: '24 avr.', c: 'Restaurant Les Florets', mt: 384, s: 'paid'},
      {n: 'F-040', d: '20 avr.', c: 'Marché Bédoin (mars)', mt: 1240, s: 'paid'},
      {n: 'F-039', d: '15 avr.', c: 'Boulangerie Augier', mt: 216, s: 'late'},
      {n: 'F-038', d: '08 avr.', c: 'Coopérative Provence', mt: 880, s: 'paid'},
    ].map((f, i) => (
      <div key={f.n} style={{...MM.row, ...(i === 0 ? MM.rowFirst : {})}}>
        <span style={{width: 50, fontSize: 11, color: '#6b7280', fontVariantNumeric: 'tabular-nums'}}>{f.d}</span>
        <div style={MM.rowMain}>
          <div style={MM.rowT}>{f.c}</div>
          <div style={MM.rowS}>{f.n}</div>
        </div>
        <div style={{textAlign: 'right'}}>
          <div style={{fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>{f.mt} €</div>
          <div style={{fontSize: 11, marginTop: 2, fontWeight: 500, color: f.s === 'paid' ? '#4f6a4c' : f.s === 'late' ? '#b54545' : '#a86a13'}}>
            {f.s === 'paid' ? 'Payée' : f.s === 'late' ? 'En retard' : 'En attente'}
          </div>
        </div>
      </div>
    ))}
  </div>
);

/* ============================================================
   MÉTÉO
   ============================================================ */
const ScrMinMeteo = () => (
  <div style={MM.body}>
    <div style={MM.nav}>
      <div style={MM.navTop}>
        <button style={MM.navIcon}><SIcon d={Xi.back} size={22}/></button>
        <button style={MM.navBtn}>Ventoux Sud <SIcon d={<path d="m6 9 6 6 6-6"/>} size={14} stroke={2}/></button>
      </div>
      <div style={{fontSize: 13, color: '#6b7280', marginTop: 10}}>Mercredi 27 mai · 14h</div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4}}>
        <span style={{fontSize: 52, fontWeight: 500, letterSpacing: '-0.015em', lineHeight: 1}}>19°</span>
        <span style={{fontSize: 15, color: '#6b7280', fontWeight: 500}}>Ensoleillé</span>
      </div>
      <div style={MM.navSub}>Vent NE 8 km/h · humidité 52 % · UV 7</div>
    </div>

    <div style={MM.strip}>
      <div style={MM.stripCell}>
        <div style={MM.stripL}>Butinage</div>
        <div style={{...MM.stripV, color: '#a86a13'}}>92<span style={{fontSize: 11, color: '#9ca3af', marginLeft: 2, fontWeight: 500}}>/100</span></div>
        <div style={{...MM.stripT, color: '#4f6a4c', fontWeight: 500}}>Excellent</div>
      </div>
      <div style={{...MM.stripCell, ...MM.stripCellSep}}>
        <div style={MM.stripL}>Pollen</div>
        <div style={MM.stripV}>+++</div>
        <div style={MM.stripT}>Lavande</div>
      </div>
      <div style={{...MM.stripCell, ...MM.stripCellSep}}>
        <div style={MM.stripL}>Pression</div>
        <div style={MM.stripV}>1018<span style={{fontSize: 11, color: '#9ca3af', marginLeft: 2, fontWeight: 500}}>hPa</span></div>
        <div style={MM.stripT}>stable</div>
      </div>
    </div>

    <div style={MM.sect}><span style={MM.sectT}>7 prochains jours</span></div>
    <div style={{...MM.row, ...MM.rowFirst, padding: '12px 20px', display: 'grid', gridTemplateColumns: '46px 28px 1fr 50px 50px', gap: 8, alignItems: 'center'}}>
      <span style={{fontSize: 11, color: '#9ca3af', fontWeight: 600}}>JOUR</span>
      <span/>
      <span/>
      <span style={{fontSize: 10, color: '#9ca3af', textAlign: 'right'}}>MIN/MAX</span>
      <span style={{fontSize: 10, color: '#9ca3af', textAlign: 'right'}}>BUTI.</span>
    </div>
    {[
      {j: 'Auj.', d: '27', i: 'sun',   min: 8,  max: 19, b: 92},
      {j: 'Jeu',  d: '28', i: 'cloud', min: 7,  max: 17, b: 78},
      {j: 'Ven',  d: '29', i: 'snow',  min: -1, max: 14, b: 38, alert: true},
      {j: 'Sam',  d: '30', i: 'cloud', min: 4,  max: 16, b: 55},
      {j: 'Dim',  d: '31', i: 'sun',   min: 9,  max: 21, b: 95},
      {j: 'Lun',  d: '01', i: 'sun',   min: 11, max: 24, b: 98},
      {j: 'Mar',  d: '02', i: 'cloud', min: 12, max: 22, b: 60},
    ].map((d, i) => (
      <div key={i} style={{...MM.row, display: 'grid', gridTemplateColumns: '46px 28px 1fr 80px 50px', gap: 8, alignItems: 'center', padding: '14px 20px'}}>
        <div>
          <div style={{fontSize: 13, fontWeight: 600}}>{d.j}</div>
          <div style={{fontSize: 11, color: '#9ca3af', fontVariantNumeric: 'tabular-nums'}}>{d.d} mai</div>
        </div>
        <div style={{color: d.alert ? '#5e7ba8' : '#6b7280'}}>
          <SIcon d={Xi[d.i]} size={20} stroke={1.5}/>
        </div>
        <div style={{position: 'relative', height: 4, background: '#f4f2ed', borderRadius: 99, margin: '0 4px'}}>
          <div style={{position: 'absolute', left: `${((d.min + 5) / 35) * 100}%`, right: `${100 - ((d.max + 5) / 35) * 100}%`, top: 0, bottom: 0, background: '#000', borderRadius: 99}}/>
        </div>
        <div style={{textAlign: 'right', fontSize: 13, fontVariantNumeric: 'tabular-nums'}}>
          <span style={{color: '#9ca3af'}}>{d.min}°</span>
          <span style={{color: '#000', fontWeight: 600, marginLeft: 6}}>{d.max}°</span>
        </div>
        <div style={{textAlign: 'right', fontSize: 13, fontWeight: 600, color: d.b >= 80 ? '#4f6a4c' : d.b >= 50 ? '#a86a13' : '#b54545', fontVariantNumeric: 'tabular-nums'}}>{d.b}</div>
      </div>
    ))}

    <div style={MM.sect}><span style={MM.sectT}>Recommandations</span></div>
    {[
      {sev: '#4f6a4c', t: 'Posez les hausses', s: 'Conditions optimales pour Ventoux et Apt'},
      {sev: '#c87f2a', t: 'Gel possible vendredi', s: 'Sault et Buoux · -2 °C en fin de nuit'},
      {sev: '#6b7280', t: "Surveillez l'essaimage", s: 'Météo très favorable jeudi-vendredi'},
    ].map((r, i) => (
      <div key={i} style={{...MM.row, ...(i === 0 ? MM.rowFirst : {})}}>
        <span style={{width: 4, height: 32, background: r.sev, borderRadius: 99, flexShrink: 0}}/>
        <div style={MM.rowMain}>
          <div style={MM.rowT}>{r.t}</div>
          <div style={MM.rowS}>{r.s}</div>
        </div>
      </div>
    ))}
  </div>
);

const MinMenu       = () => <MinFrame activeTab="home"><ScrMinMenu/></MinFrame>;
const MinParametres = () => <MinFrame activeTab="home"><ScrMinParametres/></MinFrame>;
const MinProduction = () => <MinFrame activeTab="home"><ScrMinProduction/></MinFrame>;
const MinStocks     = () => <MinFrame activeTab="home"><ScrMinStocks/></MinFrame>;
const MinFinances   = () => <MinFrame activeTab="home"><ScrMinFinances/></MinFrame>;
const MinMeteo      = () => <MinFrame activeTab="home"><ScrMinMeteo/></MinFrame>;

Object.assign(window, { MinMenu, MinParametres, MinProduction, MinStocks, MinFinances, MinMeteo });
