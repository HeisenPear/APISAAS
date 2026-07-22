/* APIGO — Mobile screens (PWA-first, Apple HIG inspired)
   Width 402, height 874. Honey reserved for *primary action* and *meaningful state*.
   Bottom tab bar standardisé.  Toutes les listes : grouped inset (style iOS Settings/Health). */

const M = {
  /* CANVAS */
  body: {
    height: '100%', width: '100%',
    background: '#f2f0ec',
    fontFamily: '-apple-system, "SF Pro Text", BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: '#1c1c1e',
    paddingTop: 56,             /* under status bar */
    paddingBottom: 88,          /* above tab bar */
    overflow: 'auto', WebkitOverflowScrolling: 'touch',
  },
  bodyDark: {
    background: '#000',
    color: '#fff',
    paddingTop: 56, paddingBottom: 88,
    height: '100%', width: '100%',
  },

  /* NAV HEADER */
  navWrap: { padding: '8px 20px 18px' },
  navTopRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 36 },
  navAction: {
    width: 36, height: 36, borderRadius: 99,
    display: 'grid', placeItems: 'center',
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(0,0,0,0.04)',
    color: '#1c1c1e',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  navActionPrim: {
    width: 36, height: 36, borderRadius: 99,
    background: '#f5a623', color: '#1c1c1e',
    display: 'grid', placeItems: 'center',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
  },
  navEyebrow: {
    fontSize: 13, color: 'rgba(60,60,67,0.6)',
    fontWeight: 500, marginTop: 8,
  },
  navLargeTitle: {
    fontSize: 28, fontWeight: 600, letterSpacing: '-0.005em', lineHeight: 1.15,
    marginTop: 2,
  },

  /* SECTION HEADERS (iOS-style) */
  secHead: {
    padding: '20px 20px 6px',
    fontSize: 12.5, fontWeight: 600,
    color: 'rgba(60,60,67,0.6)',
    textTransform: 'uppercase', letterSpacing: '0.04em',
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
  },
  secLink: { fontSize: 13, color: '#a86a13', fontWeight: 600, textTransform: 'none', letterSpacing: 0 },

  /* GROUPED INSET CARD */
  group: {
    margin: '0 16px',
    background: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 0.5px 0 rgba(0,0,0,0.04)',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px',
    minHeight: 52,
  },
  rowSep: { borderTop: '0.5px solid rgba(60,60,67,0.18)', marginLeft: 16 },
  rowIcon: (bg) => ({
    width: 30, height: 30, borderRadius: 7,
    background: bg, color: '#fff',
    display: 'grid', placeItems: 'center', flexShrink: 0,
  }),
  rowMain: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 16, fontWeight: 500 },
  rowSub: { fontSize: 13, color: 'rgba(60,60,67,0.6)', marginTop: 2 },
  rowTrail: { fontSize: 16, color: 'rgba(60,60,67,0.4)', display: 'flex', alignItems: 'center', gap: 4 },
  rowVal: { fontSize: 16, color: 'rgba(60,60,67,0.6)' },
  chev: { color: 'rgba(60,60,67,0.3)' },

  /* HERO weather */
  weather: {
    margin: '0 16px',
    borderRadius: 22,
    padding: '20px 22px 22px',
    background: 'linear-gradient(160deg, #1c1c1e 0%, #2a2725 100%)',
    color: '#fff', position: 'relative', overflow: 'hidden',
  },
  weatherEyebrow: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' },
  weatherTemp: { fontSize: 54, fontWeight: 500, letterSpacing: '-0.015em', lineHeight: 1, marginTop: 6 },
  weatherLabel: { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  weatherStat: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  weatherButinage: { marginTop: 18, paddingTop: 16, borderTop: '0.5px solid rgba(255,255,255,0.15)' },
  butL: { fontSize: 11.5, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 },
  butVal: { fontSize: 28, fontWeight: 600, letterSpacing: '-0.01em', color: '#f5a623', marginTop: 4 },
  butBar: { marginTop: 10, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.12)' },
  butFill: (v) => ({ height: '100%', width: `${v}%`, background: '#f5a623', borderRadius: 99 }),

  /* CTA */
  cta: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 14, width: '100%',
    background: '#1c1c1e', color: '#fff',
    fontSize: 17, fontWeight: 600, border: 'none',
  },
  ctaHoney: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 14, width: '100%',
    background: '#f5a623', color: '#1c1c1e',
    fontSize: 17, fontWeight: 600, border: 'none',
  },

  /* TAB BAR — flat, edge-to-edge, sans bords sombres */
  tabbar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 83, paddingTop: 8, paddingBottom: 30,
    background: 'rgba(252,251,248,0.96)',
    backdropFilter: 'blur(28px) saturate(180%)',
    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
    display: 'flex', alignItems: 'stretch',
    zIndex: 55,
  },
  tab: (active) => ({
    flex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
    color: active ? '#f5a623' : 'rgba(60,60,67,0.55)',
    background: 'transparent', border: 'none',
    fontSize: 10, fontWeight: 500, letterSpacing: '0.01em',
  }),
  tabAdd: {
    flex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
    background: 'transparent', border: 'none',
    fontSize: 10, fontWeight: 600, letterSpacing: '0.01em',
    color: '#a86a13',
  },
  tabAddDisc: {
    width: 36, height: 36, borderRadius: 11,
    background: '#f5a623',
    display: 'grid', placeItems: 'center',
    color: '#1c1c1e',
  },
};

/* ===== shared bits ===== */
const MIcon = ({ d, size = 22, stroke = 1.6, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const Mi = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/>,
  hex: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>,
  cal: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  more: <><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
  back: <path d="m15 18-6-6 6-6"/>,
  chev: <path d="m9 18 6-6-6-6"/>,
  close: <path d="M18 6 6 18M6 6l12 12"/>,
  share: <><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4M12 2v13"/></>,
  pin: <><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>,
  cloud: <path d="M17.5 19a4.5 4.5 0 1 0-1.5-8.75 6 6 0 1 0-11 3.75 3.5 3.5 0 0 0 1 6.86h11.5z"/>,
  snow: <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/>,
  alert: <><path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4M12 17h.01"/></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
  package: <><path d="m7.5 4.27 9 5.15M21 8 12 13 3 8m9 14V13"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>,
  trend: <><path d="m23 6-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></>,
  scale: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
  drop: <path d="M12 2.5s7 7.6 7 12.5a7 7 0 1 1-14 0c0-4.9 7-12.5 7-12.5z"/>,
  thermo: <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4 4 0 1 0 5 0z"/>,
  mic: <><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M19 11v1a7 7 0 0 1-14 0v-1M12 19v3"/></>,
  camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
  edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></>,
  filter: <path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>,
  zap: <path d="M13 2 3 14h9l-1 8 10-12h-9z"/>,
  honey: <path d="M12 2 4 7v10l8 5 8-5V7z"/>,
};

/* ============================================================ */
/* SCREEN 1 — Aujourd'hui                                       */
/* ============================================================ */
const ScrToday = () => (
  <div style={M.body}>
    <div style={M.navWrap}>
      <div style={M.navTopRow}>
        <button style={M.navAction}><MIcon d={Mi.search} size={18} /></button>
        <button style={{...M.navAction, gap: 4, display: 'flex', alignItems: 'center', width: 'auto', padding: '0 12px', borderRadius: 99}}>
          <span style={{fontSize: 13, fontWeight: 500}}>Mont Ventoux Sud</span>
          <MIcon d={<path d="m6 9 6 6 6-6"/>} size={14} stroke={2} color="rgba(60,60,67,0.5)"/>
        </button>
        <button style={M.navAction}><MIcon d={Mi.bell} size={18} /></button>
      </div>
      <div style={M.navEyebrow}>Mercredi 27 mai · 9:41</div>
      <div style={M.navLargeTitle}>Bonjour Marc.</div>
      <div style={{fontSize: 15, color: 'rgba(60,60,67,0.6)', marginTop: 8, lineHeight: 1.4}}>
        2 visites prévues aujourd'hui et 1 alerte critique à traiter avant 12 h.
      </div>
    </div>

    {/* Météo hero */}
    <div style={M.weather}>
      <div style={M.weatherEyebrow}>Conditions de butinage</div>
      <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between'}}>
        <div>
          <div style={M.weatherTemp}>19°</div>
          <div style={M.weatherLabel}>Ensoleillé · vent NE faible</div>
          <div style={M.weatherStat}>Humidité 52 % · UV 7</div>
        </div>
        <div style={{textAlign: 'right'}}>
          <MIcon d={Mi.sun} size={56} stroke={1.2} color="#f5a623" />
        </div>
      </div>
      <div style={M.weatherButinage}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
          <div>
            <div style={M.butL}>Indice de butinage</div>
            <div style={M.butVal}>92<span style={{fontSize: 14, color: 'rgba(255,255,255,0.45)', marginLeft: 4}}>/100</span></div>
          </div>
          <div style={{fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'right', maxWidth: 130, lineHeight: 1.35}}>
            Conditions excellentes jusqu'à 16 h
          </div>
        </div>
        <div style={M.butBar}><div style={M.butFill(92)} /></div>
      </div>
    </div>

    {/* Alerte critique inline */}
    <div style={{margin: '14px 16px 0', padding: '14px 16px', background: '#fff', border: '1px solid rgba(181,69,69,0.15)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12}}>
      <div style={{width: 36, height: 36, borderRadius: 10, background: '#fce8e8', display: 'grid', placeItems: 'center', flexShrink: 0}}>
        <MIcon d={Mi.alert} size={18} color="#b54545" />
      </div>
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontSize: 15, fontWeight: 600}}>3 ruches affaiblies · Sorgue</div>
        <div style={{fontSize: 13, color: 'rgba(60,60,67,0.6)', marginTop: 1}}>V-141, V-148, V-152 · à visiter</div>
      </div>
      <MIcon d={Mi.chev} size={20} color="rgba(60,60,67,0.35)" />
    </div>

    {/* Agenda */}
    <div style={M.secHead}><span>Aujourd'hui</span><span style={M.secLink}>Tout voir</span></div>
    <div style={M.group}>
      <div style={M.row}>
        <div style={{width: 56, textAlign: 'center'}}>
          <div style={{fontSize: 11, color: 'rgba(60,60,67,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600}}>06h</div>
          <div style={{fontFamily: '-apple-system, "SF Pro Display"', fontSize: 22, fontWeight: 600, lineHeight: 1}}>30</div>
        </div>
        <div style={{width: 0.5, height: 38, background: 'rgba(60,60,67,0.18)'}} />
        <div style={M.rowMain}>
          <div style={M.rowTitle}>Visite de printemps</div>
          <div style={M.rowSub}>Mont Ventoux Sud · ruche V-014</div>
        </div>
        <span style={{fontSize: 11, fontWeight: 700, color: '#a86a13', background: '#fef6e4', padding: '4px 8px', borderRadius: 6}}>35 min</span>
      </div>
      <div style={M.rowSep} />
      <div style={M.row}>
        <div style={{width: 56, textAlign: 'center'}}>
          <div style={{fontSize: 11, color: 'rgba(60,60,67,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600}}>07h</div>
          <div style={{fontFamily: '-apple-system, "SF Pro Display"', fontSize: 22, fontWeight: 600, lineHeight: 1}}>15</div>
        </div>
        <div style={{width: 0.5, height: 38, background: 'rgba(60,60,67,0.18)'}} />
        <div style={M.rowMain}>
          <div style={M.rowTitle}>Visite de printemps</div>
          <div style={M.rowSub}>Mont Ventoux Sud · ruche V-018</div>
        </div>
        <span style={{fontSize: 11, fontWeight: 700, color: '#a86a13', background: '#fef6e4', padding: '4px 8px', borderRadius: 6}}>35 min</span>
      </div>
    </div>

    {/* Stats du jour */}
    <div style={M.secHead}>Aperçu</div>
    <div style={M.group}>
      <div style={M.row}>
        <div style={M.rowIcon('#7a9676')}><MIcon d={Mi.honey} size={16} /></div>
        <div style={M.rowMain}>
          <div style={M.rowTitle}>Production 2025</div>
          <div style={M.rowSub}>+12 % vs l'année dernière</div>
        </div>
        <div style={{...M.rowVal, fontWeight: 600, color: '#1c1c1e'}}>6 740 kg</div>
        <MIcon d={Mi.chev} size={16} color="rgba(60,60,67,0.3)" />
      </div>
      <div style={M.rowSep} />
      <div style={M.row}>
        <div style={M.rowIcon('#b87959')}><MIcon d={Mi.package} size={16} /></div>
        <div style={M.rowMain}>
          <div style={M.rowTitle}>Ruches actives</div>
          <div style={M.rowSub}>Sur 7 ruchers</div>
        </div>
        <div style={{...M.rowVal, fontWeight: 600, color: '#1c1c1e'}}>248</div>
        <MIcon d={Mi.chev} size={16} color="rgba(60,60,67,0.3)" />
      </div>
      <div style={M.rowSep} />
      <div style={M.row}>
        <div style={M.rowIcon('#5e7ba8')}><MIcon d={Mi.trend} size={16} /></div>
        <div style={M.rowMain}>
          <div style={M.rowTitle}>CA YTD</div>
          <div style={M.rowSub}>4 factures en attente</div>
        </div>
        <div style={{...M.rowVal, fontWeight: 600, color: '#1c1c1e'}}>38,4 k€</div>
        <MIcon d={Mi.chev} size={16} color="rgba(60,60,67,0.3)" />
      </div>
    </div>
  </div>
);

/* ============================================================ */
/* SCREEN 2 — Ruches (liste)                                    */
/* ============================================================ */
const ScrRuches = () => (
  <div style={M.body}>
    <div style={M.navWrap}>
      <div style={M.navTopRow}>
        <button style={M.navAction}><MIcon d={Mi.filter} size={18} /></button>
        <span style={{fontSize: 13, color: 'rgba(60,60,67,0.6)', fontWeight: 500}}>248 ruches · 7 ruchers</span>
        <button style={M.navAction}><MIcon d={Mi.more} size={18} /></button>
      </div>
      <div style={M.navLargeTitle}>Ruches</div>

      {/* search */}
      <div style={{marginTop: 12, height: 36, borderRadius: 10, background: 'rgba(118,118,128,0.12)', display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px'}}>
        <MIcon d={Mi.search} size={16} color="rgba(60,60,67,0.5)" />
        <span style={{fontSize: 16, color: 'rgba(60,60,67,0.5)'}}>Rechercher par numéro…</span>
      </div>

      {/* segmented */}
      <div style={{marginTop: 14, display: 'flex', gap: 8, overflow: 'hidden'}}>
        {[
          {l: 'Tous', n: 248, on: true},
          {l: 'En forme', n: 231},
          {l: 'À surveiller', n: 14},
          {l: 'Préoccupantes', n: 3},
        ].map(s => (
          <span key={s.l} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 99,
            fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
            background: s.on ? '#1c1c1e' : 'rgba(118,118,128,0.12)',
            color: s.on ? '#fff' : 'rgba(60,60,67,0.7)',
          }}>{s.l}<span style={{opacity: 0.55, fontWeight: 500}}>{s.n}</span></span>
        ))}
      </div>
    </div>

    <div style={M.secHead}>Mont Ventoux Sud — 42</div>
    <div style={M.group}>
      {[
        {id: 'V-014', sub: 'Dadant 10c · F1 Buckfast 2023', kg: 27.4, sante: 'good'},
        {id: 'V-018', sub: 'Dadant 10c · Carnica 2024', kg: 31.2, sante: 'good'},
        {id: 'V-021', sub: 'Langstroth · Locale 2022', kg: 24.6, sante: 'warn'},
        {id: 'V-024', sub: 'Dadant 10c · F2 Buckfast 2025', kg: 22.1, sante: 'warn'},
      ].map((r, i, arr) => (
        <React.Fragment key={r.id}>
          <div style={M.row}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: r.sante === 'good' ? '#eef2eb' : r.sante === 'warn' ? '#fdf3e3' : '#fce8e8',
              display: 'grid', placeItems: 'center',
              color: r.sante === 'good' ? '#4f6a4c' : r.sante === 'warn' ? '#c87f2a' : '#b54545',
            }}>
              <span style={{fontFamily: '-apple-system, "SF Pro Display"', fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em'}}>{r.id}</span>
            </div>
            <div style={M.rowMain}>
              <div style={M.rowTitle}>{r.kg.toFixed(1)} kg <span style={{fontSize: 13, color: 'rgba(60,60,67,0.5)', fontWeight: 400}}>+{(r.kg * 0.04).toFixed(1)} / 7 j</span></div>
              <div style={M.rowSub}>{r.sub}</div>
            </div>
            <MIcon d={Mi.chev} size={18} color="rgba(60,60,67,0.3)" />
          </div>
          {i < arr.length - 1 && <div style={M.rowSep} />}
        </React.Fragment>
      ))}
    </div>

    <div style={M.secHead}>Garrigue de Sault — 36</div>
    <div style={M.group}>
      {[
        {id: 'V-053', sub: 'Dadant 10c · Buckfast 2024', kg: 36.8, sante: 'good'},
        {id: 'V-061', sub: 'Langstroth · Carnica 2023', kg: 28.4, sante: 'good'},
        {id: 'V-070', sub: 'Dadant 12c · Locale 2022', kg: 19.2, sante: 'bad'},
      ].map((r, i, arr) => (
        <React.Fragment key={r.id}>
          <div style={M.row}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: r.sante === 'good' ? '#eef2eb' : r.sante === 'warn' ? '#fdf3e3' : '#fce8e8',
              display: 'grid', placeItems: 'center',
              color: r.sante === 'good' ? '#4f6a4c' : r.sante === 'warn' ? '#c87f2a' : '#b54545',
            }}>
              <span style={{fontFamily: '-apple-system, "SF Pro Display"', fontSize: 13, fontWeight: 700}}>{r.id}</span>
            </div>
            <div style={M.rowMain}>
              <div style={M.rowTitle}>{r.kg.toFixed(1)} kg</div>
              <div style={M.rowSub}>{r.sub}</div>
            </div>
            <MIcon d={Mi.chev} size={18} color="rgba(60,60,67,0.3)" />
          </div>
          {i < arr.length - 1 && <div style={M.rowSep} />}
        </React.Fragment>
      ))}
    </div>
  </div>
);

/* ============================================================ */
/* SCREEN 3 — Détail ruche                                      */
/* ============================================================ */
const ScrRucheDetail = () => (
  <div style={M.body}>
    <div style={M.navWrap}>
      <div style={M.navTopRow}>
        <button style={M.navAction}><MIcon d={Mi.back} size={18} /></button>
        <button style={M.navAction}><MIcon d={Mi.share} size={18} /></button>
      </div>
      <div style={M.navEyebrow}>Mont Ventoux Sud · Dadant 10c</div>
      <div style={M.navLargeTitle}>V-014</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 6, marginTop: 6}}>
        <span style={{width: 8, height: 8, borderRadius: 99, background: '#5a8a5e'}} />
        <span style={{fontSize: 15, fontWeight: 500, color: '#4f6a4c'}}>En forme · couvain compact</span>
      </div>
    </div>

    {/* Hero metrics */}
    <div style={{margin: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8}}>
      {[
        {l: 'Poids', v: '27,4', u: 'kg', t: '+1,1 / 7j', c: '#5a8a5e'},
        {l: 'Cadres', v: '8', u: 'de couvain', t: 'fort', c: '#1c1c1e'},
        {l: 'Varroas', v: '2,1', u: '/100 ab.', t: 'sain', c: '#5a8a5e'},
      ].map(s => (
        <div key={s.l} style={{padding: '14px 12px', background: '#fff', borderRadius: 14}}>
          <div style={{fontSize: 11.5, color: 'rgba(60,60,67,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em'}}>{s.l}</div>
          <div style={{fontFamily: '-apple-system, "SF Pro Display"', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 6}}>{s.v}<span style={{fontSize: 11, color: 'rgba(60,60,67,0.5)', fontWeight: 500, marginLeft: 3}}>{s.u}</span></div>
          <div style={{fontSize: 11, color: s.c, marginTop: 4, fontWeight: 600}}>{s.t}</div>
        </div>
      ))}
    </div>

    {/* Sparkline 90 jours */}
    <div style={{margin: '12px 16px 0', padding: 16, background: '#fff', borderRadius: 14}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4}}>
        <div style={{fontSize: 14, fontWeight: 600}}>Poids · 90 derniers jours</div>
        <span style={{fontSize: 12, color: 'rgba(60,60,67,0.5)'}}>kg</span>
      </div>
      <svg viewBox="0 0 320 80" width="100%" height="76" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkRuche" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(245,166,35,0.30)" />
            <stop offset="1" stopColor="rgba(245,166,35,0)" />
          </linearGradient>
        </defs>
        <polygon fill="url(#sparkRuche)" points="0,70 0,55 25,52 50,58 75,48 100,42 125,40 150,35 175,30 200,32 225,26 250,22 275,18 300,14 320,12 320,80" />
        <polyline fill="none" stroke="#f5a623" strokeWidth="2.2" strokeLinejoin="round" points="0,55 25,52 50,58 75,48 100,42 125,40 150,35 175,30 200,32 225,26 250,22 275,18 300,14 320,12"/>
      </svg>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(60,60,67,0.5)', marginTop: 4}}>
        <span>15 mars</span><span>15 avr.</span><span>15 mai</span><span>auj.</span>
      </div>
    </div>

    {/* Quick actions */}
    <div style={M.secHead}>Action rapide</div>
    <div style={M.group}>
      <div style={M.row}>
        <div style={M.rowIcon('#f5a623')}><MIcon d={Mi.eye} size={16} /></div>
        <div style={{...M.rowMain, ...M.rowTitle}}>Saisir une visite</div>
        <MIcon d={Mi.chev} size={16} color="rgba(60,60,67,0.3)" />
      </div>
      <div style={M.rowSep} />
      <div style={M.row}>
        <div style={M.rowIcon('#7a9676')}><MIcon d={Mi.package} size={16} /></div>
        <div style={{...M.rowMain, ...M.rowTitle}}>Poser une hausse</div>
        <MIcon d={Mi.chev} size={16} color="rgba(60,60,67,0.3)" />
      </div>
      <div style={M.rowSep} />
      <div style={M.row}>
        <div style={M.rowIcon('#b87959')}><MIcon d={Mi.honey} size={16} /></div>
        <div style={{...M.rowMain, ...M.rowTitle}}>Récolter</div>
        <MIcon d={Mi.chev} size={16} color="rgba(60,60,67,0.3)" />
      </div>
    </div>

    {/* Historique */}
    <div style={M.secHead}>Historique récent</div>
    <div style={M.group}>
      {[
        {d: '28 avr.', t: 'Récolte miel printemps', m: '+14,2 kg · romarin'},
        {d: '21 avr.', t: 'Visite sanitaire', m: 'Couvain compact 8 cadres'},
        {d: '14 avr.', t: 'Pose de hausse', m: '1ère hausse Dadant'},
        {d: '08 avr.', t: 'Comptage varroas', m: '2,1 / 100 abeilles · sain'},
      ].map((h, i, arr) => (
        <React.Fragment key={h.d}>
          <div style={M.row}>
            <div style={{width: 48, fontSize: 12, color: 'rgba(60,60,67,0.5)', fontWeight: 500, fontFamily: '-apple-system, "SF Mono"'}}>{h.d}</div>
            <div style={M.rowMain}>
              <div style={M.rowTitle}>{h.t}</div>
              <div style={M.rowSub}>{h.m}</div>
            </div>
            <MIcon d={Mi.chev} size={16} color="rgba(60,60,67,0.25)" />
          </div>
          {i < arr.length - 1 && <div style={M.rowSep} />}
        </React.Fragment>
      ))}
    </div>
  </div>
);

/* ============================================================ */
/* SCREEN 4 — Saisir une visite (sheet)                         */
/* ============================================================ */
const ScrSaisie = () => (
  <div style={{...M.body, background: 'rgba(0,0,0,0.4)', padding: 0, paddingTop: 0, paddingBottom: 0, position: 'relative'}}>
    {/* dim backdrop with previous screen suggestion */}
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%)'}} />

    {/* Sheet */}
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, top: 80,
      background: '#f2f0ec',
      borderTopLeftRadius: 22, borderTopRightRadius: 22,
      overflow: 'auto',
      boxShadow: '0 -10px 30px rgba(0,0,0,0.2)',
    }}>
      {/* Grabber + header */}
      <div style={{position: 'sticky', top: 0, background: '#f2f0ec', zIndex: 5, paddingBottom: 6}}>
        <div style={{display: 'grid', placeItems: 'center', padding: '8px 0 12px'}}>
          <div style={{width: 36, height: 5, borderRadius: 99, background: 'rgba(60,60,67,0.3)'}} />
        </div>
        <div style={{padding: '0 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <button style={{fontSize: 17, color: '#a86a13', fontWeight: 500, background: 'none', border: 'none'}}>Annuler</button>
          <div style={{fontFamily: '-apple-system, "SF Pro Display"', fontSize: 17, fontWeight: 600}}>Nouvelle visite</div>
          <button style={{fontSize: 17, color: '#a86a13', fontWeight: 700, background: 'none', border: 'none'}}>OK</button>
        </div>
      </div>

      <div style={{padding: '4px 0 40px'}}>
        <div style={M.secHead}>Ruche</div>
        <div style={M.group}>
          <div style={M.row}>
            <div style={M.rowIcon('#1c1c1e')}><MIcon d={Mi.hex} size={16} /></div>
            <div style={M.rowMain}>
              <div style={M.rowTitle}>V-014</div>
              <div style={M.rowSub}>Mont Ventoux Sud</div>
            </div>
            <span style={{fontSize: 15, color: '#a86a13', fontWeight: 500}}>Changer</span>
          </div>
        </div>

        <div style={M.secHead}>État du couvain</div>
        <div style={{margin: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8}}>
          {['Absent', 'Faible', 'Moyen', 'Compact'].map((l, i) => (
            <button key={l} style={{
              padding: '14px 0', borderRadius: 14,
              background: i === 3 ? '#1c1c1e' : '#fff',
              color: i === 3 ? '#fff' : '#1c1c1e',
              border: 'none', fontSize: 13, fontWeight: 600,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: i === 3 ? '#f5a623' : i === 0 ? '#f2f0ec' : i === 1 ? '#fff3dc' : '#fce4a3',
                opacity: i === 3 ? 1 : 0.7 + i * 0.1,
              }} />
              {l}
            </button>
          ))}
        </div>

        <div style={M.secHead}>Cadres de couvain</div>
        <div style={{margin: '0 16px', padding: '20px 18px', background: '#fff', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <button style={{width: 36, height: 36, borderRadius: 99, background: '#f2f0ec', border: 'none', fontSize: 22, fontWeight: 400, color: '#1c1c1e'}}>−</button>
          <div style={{fontFamily: '-apple-system, "SF Pro Display"', fontSize: 42, fontWeight: 700, letterSpacing: '-0.02em'}}>8</div>
          <button style={{width: 36, height: 36, borderRadius: 99, background: '#1c1c1e', color: '#fff', border: 'none', fontSize: 22, fontWeight: 400}}>+</button>
        </div>

        <div style={M.secHead}>Observations</div>
        <div style={M.group}>
          {[
            {i: 'eye', l: 'Reine vue', on: true, bg: '#7a9676'},
            {i: 'honey', l: 'Réserves miel suffisantes', on: true, bg: '#f5a623'},
            {i: 'alert', l: 'Cellules royales', on: false, bg: '#b54545'},
            {i: 'package', l: 'Hausse à poser', on: false, bg: '#7a9676'},
          ].map((o, i, arr) => (
            <React.Fragment key={o.l}>
              <div style={M.row}>
                <div style={M.rowIcon(o.bg)}><MIcon d={Mi[o.i]} size={16} /></div>
                <div style={{...M.rowMain, ...M.rowTitle}}>{o.l}</div>
                <div style={{
                  width: 51, height: 31, borderRadius: 99,
                  background: o.on ? '#7a9676' : 'rgba(120,120,128,0.16)',
                  position: 'relative', flexShrink: 0,
                }}>
                  <div style={{
                    position: 'absolute', top: 2, left: o.on ? 22 : 2,
                    width: 27, height: 27, borderRadius: 99, background: '#fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  }} />
                </div>
              </div>
              {i < arr.length - 1 && <div style={M.rowSep} />}
            </React.Fragment>
          ))}
        </div>

        <div style={M.secHead}>Note vocale</div>
        <div style={{margin: '0 16px', padding: '16px 18px', background: '#fff', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14}}>
          <div style={{width: 44, height: 44, borderRadius: 99, background: '#f5a623', display: 'grid', placeItems: 'center', flexShrink: 0}}>
            <MIcon d={Mi.mic} size={18} color="#1c1c1e" />
          </div>
          <div style={{flex: 1, minWidth: 0}}>
            <div style={{fontSize: 15, fontWeight: 600}}>Maintenir pour parler</div>
            <div style={{fontSize: 13, color: 'rgba(60,60,67,0.6)', marginTop: 1}}>Transcription auto en français</div>
          </div>
          <button style={{width: 36, height: 36, borderRadius: 8, background: '#f2f0ec', border: 'none', display: 'grid', placeItems: 'center'}}>
            <MIcon d={Mi.camera} size={18} color="rgba(60,60,67,0.6)" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ============================================================ */
/* SCREEN 5 — Calendrier semaine                                */
/* ============================================================ */
const ScrCalendrier = () => (
  <div style={M.body}>
    <div style={M.navWrap}>
      <div style={M.navTopRow}>
        <button style={M.navAction}><MIcon d={Mi.back} size={18} /></button>
        <span style={{fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em'}}>Mai 2026</span>
        <button style={M.navActionPrim}><MIcon d={Mi.plus} size={18} /></button>
      </div>

      {/* week strip */}
      <div style={{marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4}}>
        {[
          {d: 'L', n: 25}, {d: 'M', n: 26}, {d: 'M', n: 27, today: true}, {d: 'J', n: 28},
          {d: 'V', n: 29}, {d: 'S', n: 30}, {d: 'D', n: 31},
        ].map((d, i) => (
          <div key={i} style={{
            padding: '10px 0 12px', borderRadius: 14, textAlign: 'center',
            background: d.today ? '#1c1c1e' : 'transparent',
            color: d.today ? '#fff' : '#1c1c1e',
          }}>
            <div style={{fontSize: 11, fontWeight: 500, opacity: d.today ? 0.6 : 0.5, textTransform: 'uppercase'}}>{d.d}</div>
            <div style={{fontFamily: '-apple-system, "SF Pro Display"', fontSize: 22, fontWeight: 700, marginTop: 4}}>{d.n}</div>
            {[true, false, true, false, true, false, false][i] && (
              <div style={{display: 'flex', gap: 3, justifyContent: 'center', marginTop: 6}}>
                <div style={{width: 4, height: 4, borderRadius: 99, background: d.today ? '#f5a623' : '#f5a623'}} />
                {[true, true, false][i % 3] && <div style={{width: 4, height: 4, borderRadius: 99, background: d.today ? 'rgba(255,255,255,0.4)' : '#7a9676'}} />}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    <div style={M.secHead}><span>Aujourd'hui · Mer. 27</span><span style={M.secLink}>Voir le mois</span></div>
    <div style={M.group}>
      {[
        {h: '06:30', t: 'Visite de printemps', s: 'V-014 · Mont Ventoux Sud', c: '#f5a623'},
        {h: '07:15', t: 'Visite de printemps', s: 'V-018 · Mont Ventoux Sud', c: '#f5a623'},
        {h: '14:00', t: 'Marché Bédoin', s: 'Vente directe · stand 12', c: '#5e7ba8'},
      ].map((e, i, arr) => (
        <React.Fragment key={i}>
          <div style={{...M.row, gap: 14}}>
            <div style={{
              width: 4, height: 38, borderRadius: 99, background: e.c, flexShrink: 0,
            }} />
            <div style={{width: 50, fontFamily: '-apple-system, "SF Mono"', fontSize: 13, color: 'rgba(60,60,67,0.7)', fontWeight: 500}}>{e.h}</div>
            <div style={M.rowMain}>
              <div style={M.rowTitle}>{e.t}</div>
              <div style={M.rowSub}>{e.s}</div>
            </div>
          </div>
          {i < arr.length - 1 && <div style={{...M.rowSep, marginLeft: 86}} />}
        </React.Fragment>
      ))}
    </div>

    <div style={M.secHead}>Demain · Jeu. 28</div>
    <div style={M.group}>
      <div style={{...M.row, gap: 14}}>
        <div style={{width: 4, height: 38, borderRadius: 99, background: '#7a9676', flexShrink: 0}} />
        <div style={{width: 50, fontFamily: '-apple-system, "SF Mono"', fontSize: 13, color: 'rgba(60,60,67,0.7)', fontWeight: 500}}>06:00</div>
        <div style={M.rowMain}>
          <div style={M.rowTitle}>Pose de hausses</div>
          <div style={M.rowSub}>Garrigue de Sault · 6 ruches</div>
        </div>
      </div>
    </div>

    <div style={M.secHead}>Vendredi 29 · ⚠ Gel possible</div>
    <div style={M.group}>
      <div style={{...M.row, gap: 14}}>
        <div style={{width: 4, height: 38, borderRadius: 99, background: 'rgba(60,60,67,0.3)', flexShrink: 0}} />
        <div style={{width: 50, fontFamily: '-apple-system, "SF Mono"', fontSize: 13, color: 'rgba(60,60,67,0.7)', fontWeight: 500}}>17:00</div>
        <div style={M.rowMain}>
          <div style={{...M.rowTitle, color: 'rgba(60,60,67,0.5)'}}>Traitement varroa</div>
          <div style={M.rowSub}>R02 · suggéré de reporter</div>
        </div>
      </div>
    </div>
  </div>
);

/* ============================================================ */
/* SCREEN 6 — Notifications / Alertes                           */
/* ============================================================ */
const ScrAlertes = () => (
  <div style={M.body}>
    <div style={M.navWrap}>
      <div style={M.navTopRow}>
        <button style={M.navAction}><MIcon d={Mi.back} size={18} /></button>
        <button style={{...M.navAction, width: 'auto', padding: '0 12px', borderRadius: 99}}>
          <span style={{fontSize: 13, fontWeight: 500}}>Tout marquer lu</span>
        </button>
      </div>
      <div style={M.navEyebrow}>5 ouvertes · 1 critique</div>
      <div style={M.navLargeTitle}>Alertes</div>
    </div>

    <div style={M.secHead}>Critique</div>
    <div style={{margin: '0 16px', borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 0 0 1px rgba(181,69,69,0.15)'}}>
      <div style={{padding: '16px 16px 14px', background: 'linear-gradient(180deg, #fdf0f0, #fff)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10}}>
          <div style={{width: 30, height: 30, borderRadius: 8, background: '#fce8e8', display: 'grid', placeItems: 'center'}}>
            <MIcon d={Mi.alert} size={16} color="#b54545" />
          </div>
          <div style={{flex: 1, minWidth: 0}}>
            <div style={{fontSize: 11, fontWeight: 700, color: '#b54545', textTransform: 'uppercase', letterSpacing: '0.04em'}}>Sanitaire · il y a 2 h</div>
            <div style={{fontSize: 16, fontWeight: 600, marginTop: 2, fontFamily: '-apple-system, "SF Pro Display"', letterSpacing: '-0.01em'}}>3 ruches affaiblies à Sorgue</div>
          </div>
        </div>
        <div style={{fontSize: 14, color: 'rgba(60,60,67,0.7)', lineHeight: 1.45, marginLeft: 40}}>V-141, V-148, V-152 — population effondrée. Dernière visite il y a 17 j. Risque vol massif.</div>
        <div style={{display: 'flex', gap: 8, marginTop: 14, marginLeft: 40}}>
          <button style={{height: 36, padding: '0 14px', borderRadius: 10, background: '#1c1c1e', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, flex: 1}}>Planifier visite</button>
          <button style={{height: 36, padding: '0 14px', borderRadius: 10, background: 'rgba(118,118,128,0.12)', color: '#1c1c1e', border: 'none', fontSize: 14, fontWeight: 500}}>Reporter</button>
        </div>
      </div>
    </div>

    <div style={M.secHead}>Importantes</div>
    <div style={M.group}>
      <div style={M.row}>
        <div style={M.rowIcon('#c87f2a')}><MIcon d={Mi.package} size={16} /></div>
        <div style={M.rowMain}>
          <div style={M.rowTitle}>Stock cires gaufrées bas</div>
          <div style={M.rowSub}>8 plaques · seuil 20 · il y a 5 h</div>
        </div>
        <MIcon d={Mi.chev} size={16} color="rgba(60,60,67,0.3)" />
      </div>
      <div style={M.rowSep} />
      <div style={M.row}>
        <div style={M.rowIcon('#c87f2a')}><MIcon d={Mi.zap} size={16} /></div>
        <div style={M.rowMain}>
          <div style={M.rowTitle}>Risque d'essaimage</div>
          <div style={M.rowSub}>V-024 · 4 cellules royales · 1 j</div>
        </div>
        <MIcon d={Mi.chev} size={16} color="rgba(60,60,67,0.3)" />
      </div>
    </div>

    <div style={M.secHead}>À titre informatif</div>
    <div style={M.group}>
      <div style={M.row}>
        <div style={M.rowIcon('#5e7ba8')}><MIcon d={Mi.snow} size={16} /></div>
        <div style={M.rowMain}>
          <div style={M.rowTitle}>Gel possible vendredi nuit</div>
          <div style={M.rowSub}>Sault, Buoux · -2 °C · 1 j</div>
        </div>
        <MIcon d={Mi.chev} size={16} color="rgba(60,60,67,0.3)" />
      </div>
      <div style={M.rowSep} />
      <div style={M.row}>
        <div style={M.rowIcon('#5e7ba8')}><MIcon d={Mi.trend} size={16} /></div>
        <div style={M.rowMain}>
          <div style={M.rowTitle}>Facture F-039 en retard</div>
          <div style={M.rowSub}>Boulangerie Augier · 216 € · 2 j</div>
        </div>
        <MIcon d={Mi.chev} size={16} color="rgba(60,60,67,0.3)" />
      </div>
    </div>

    <div style={M.secHead}>Résolues récemment · 14</div>
    <div style={M.group}>
      <div style={{...M.row, opacity: 0.55}}>
        <div style={M.rowIcon('#7a9676')}><MIcon d={Mi.eye} size={16} /></div>
        <div style={M.rowMain}>
          <div style={M.rowTitle}>Couvain reine — V-009</div>
          <div style={M.rowSub}>Résolu il y a 3 j · couvain compact</div>
        </div>
      </div>
    </div>
  </div>
);

/* ============================================================ */
/* TAB BAR (rendu par dessus, sauf saisie)                      */
/* ============================================================ */
const MobileTabBar = ({ active = 'home' }) => (
  <div style={M.tabbar}>
    <button style={M.tab(active === 'home')}>
      <MIcon d={Mi.home} size={24} stroke={active === 'home' ? 2.2 : 1.7} />
      <span>Aujourd'hui</span>
    </button>
    <button style={M.tab(active === 'ruches')}>
      <MIcon d={Mi.hex} size={24} stroke={active === 'ruches' ? 2.2 : 1.7} />
      <span>Ruches</span>
    </button>
    <button style={M.tabAdd}>
      <div style={M.tabAddDisc}><MIcon d={Mi.plus} size={20} stroke={2.4} color="#1c1c1e" /></div>
      <span>Saisir</span>
    </button>
    <button style={M.tab(active === 'cal')}>
      <MIcon d={Mi.cal} size={24} stroke={active === 'cal' ? 2.2 : 1.7} />
      <span>Calendrier</span>
    </button>
    <button style={M.tab(active === 'alertes')}>
      <div style={{position: 'relative'}}>
        <MIcon d={Mi.bell} size={24} stroke={active === 'alertes' ? 2.2 : 1.7} />
        <span style={{position: 'absolute', top: -2, right: -4, minWidth: 14, height: 14, padding: '0 4px', borderRadius: 99, background: '#b54545', color: '#fff', border: '1.5px solid rgba(252,251,248,0.96)', fontSize: 9, fontWeight: 700, display: 'grid', placeItems: 'center'}}>1</span>
      </div>
      <span>Alertes</span>
    </button>
  </div>
);

/* ============================================================ */
/* Each mobile screen wrapped in an iPhone frame                */
/* ============================================================ */
const MobileFrame = ({ children, withTab = true, activeTab = 'home' }) => (
  <div style={{position: 'relative', width: 402, height: 874}}>
    <window.IOSDevice width={402} height={874}>
      {children}
    </window.IOSDevice>
    {withTab && (
      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'none', zIndex: 60}}>
        <div style={{position: 'relative', pointerEvents: 'auto'}}><MobileTabBar active={activeTab} /></div>
      </div>
    )}
  </div>
);

const MobToday      = () => <MobileFrame activeTab="home"><ScrToday /></MobileFrame>;
const MobRuches     = () => <MobileFrame activeTab="ruches"><ScrRuches /></MobileFrame>;
const MobRucheDet   = () => <MobileFrame activeTab="ruches"><ScrRucheDetail /></MobileFrame>;
const MobSaisie     = () => <MobileFrame withTab={false}><ScrSaisie /></MobileFrame>;
const MobCalendrier = () => <MobileFrame activeTab="cal"><ScrCalendrier /></MobileFrame>;
const MobAlertes    = () => <MobileFrame activeTab="alertes"><ScrAlertes /></MobileFrame>;

Object.assign(window, { MobToday, MobRuches, MobRucheDet, MobSaisie, MobCalendrier, MobAlertes });
