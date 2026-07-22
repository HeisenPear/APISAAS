/* APIGO — Mobile MINIMAL (variation 2)
   Approche : edge-to-edge utility. Pas de cartes, hairlines, texte-led.
   Honey uniquement sur : action principale, état actif, badge critique. */

const MM = {
  body: {
    height: '100%', width: '100%',
    background: '#ffffff',
    color: '#000',
    fontFamily: '-apple-system, "SF Pro Text", BlinkMacSystemFont, "Segoe UI", sans-serif',
    paddingTop: 56,
    paddingBottom: 80,
    overflow: 'auto', WebkitOverflowScrolling: 'touch',
  },

  /* NAV */
  nav: { padding: '6px 20px 14px' },
  navTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 36 },
  navBtn: {
    height: 32, padding: '0 12px', borderRadius: 99,
    background: 'transparent', border: 'none',
    color: '#000', fontSize: 14, fontWeight: 500,
    display: 'inline-flex', alignItems: 'center', gap: 4,
  },
  navIcon: {
    width: 32, height: 32, display: 'grid', placeItems: 'center',
    background: 'transparent', border: 'none', color: '#000',
  },
  navTitle: {
    fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em',
    marginTop: 14, lineHeight: 1.15,
  },
  navSub: { fontSize: 14, color: '#6b7280', marginTop: 4, lineHeight: 1.45 },

  /* Section heading — pas d'uppercase ni de tracking, juste un titre léger */
  sect: {
    padding: '24px 20px 10px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
  },
  sectT: { fontSize: 13, fontWeight: 600, color: '#000' },
  sectS: { fontSize: 12, color: '#9ca3af' },
  sectA: { fontSize: 13, color: '#a86a13', fontWeight: 500 },

  /* Row — edge-to-edge, hairline en bas */
  row: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 20px',
    borderBottom: '0.5px solid #e7e5e0',
    background: '#fff',
    minHeight: 56,
  },
  rowFirst: { borderTop: '0.5px solid #e7e5e0' },
  rowMain: { flex: 1, minWidth: 0 },
  rowT: { fontSize: 15, fontWeight: 500, color: '#000' },
  rowS: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  rowV: { fontSize: 14, color: '#6b7280' },
  chev: { color: '#c7c2b9' },

  /* Inline data strip (compact, type-led) */
  strip: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    padding: '14px 20px',
    borderTop: '0.5px solid #e7e5e0', borderBottom: '0.5px solid #e7e5e0',
  },
  stripCell: { display: 'flex', flexDirection: 'column' },
  stripCellSep: { borderLeft: '0.5px solid #e7e5e0', paddingLeft: 14 },
  stripL: { fontSize: 11, color: '#6b7280', fontWeight: 500 },
  stripV: { fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', marginTop: 4 },
  stripT: { fontSize: 11, color: '#6b7280', marginTop: 2 },

  /* Tab bar — text-led, no discs, honey indicator only */
  tabbar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 80, paddingTop: 8, paddingBottom: 30,
    background: '#fff',
    display: 'flex', alignItems: 'stretch',
    zIndex: 55,
  },
  tab: (active) => ({
    flex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
    color: active ? '#000' : '#9ca3af',
    background: 'transparent', border: 'none',
    fontSize: 10, fontWeight: 500, position: 'relative',
  }),
  tabActiveBar: {
    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
    width: 24, height: 2, borderRadius: 99, background: '#f5a623',
  },
  /* Tab item 'Saisir' — small black square with + */
  tabAddDisc: {
    width: 30, height: 30, borderRadius: 8,
    background: '#000', color: '#fff',
    display: 'grid', placeItems: 'center',
  },

  /* Inline chip (segmented filter) */
  chip: (on) => ({
    padding: '6px 12px', borderRadius: 7,
    fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
    background: on ? '#000' : '#f4f2ed',
    color: on ? '#fff' : '#6b7280',
    border: 'none',
  }),
};

const Si = {
  search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  back: <path d="m15 18-6-6 6-6"/>,
  chev: <path d="m9 18 6-6-6-6"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  more: <><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></>,
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/>,
  hex: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>,
  cal: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  filter: <path d="M3 5h18M6 12h12M10 19h4"/>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
};
const SIcon = ({ d, size = 18, stroke = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

/* ============================================================
   SCREEN 1 — Aujourd'hui
   ============================================================ */
const ScrMinToday = () => (
  <div style={MM.body}>
    <div style={MM.nav}>
      <div style={MM.navTop}>
        <button style={MM.navIcon}><SIcon d={Si.search} size={20}/></button>
        <button style={MM.navBtn}>
          Ventoux Sud
          <SIcon d={<path d="m6 9 6 6 6-6"/>} size={14} stroke={2}/>
        </button>
        <button style={MM.navIcon}>
          <div style={{position: 'relative'}}>
            <SIcon d={Si.bell} size={20}/>
            <span style={{position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 99, background: '#f5a623', border: '1.5px solid #fff'}} />
          </div>
        </button>
      </div>
      <div style={{...MM.navSub, fontSize: 13, marginTop: 12}}>Mercredi 27 mai</div>
      <div style={MM.navTitle}>Bonjour Marc</div>
      <div style={MM.navSub}>2 visites prévues · 1 alerte critique</div>
    </div>

    {/* Météo / conditions — strip de chiffres, pas de hero */}
    <div style={MM.strip}>
      <div style={MM.stripCell}>
        <div style={MM.stripL}>Température</div>
        <div style={MM.stripV}>19°</div>
        <div style={MM.stripT}>Ensoleillé</div>
      </div>
      <div style={{...MM.stripCell, ...MM.stripCellSep}}>
        <div style={MM.stripL}>Butinage</div>
        <div style={{...MM.stripV, color: '#a86a13'}}>92<span style={{fontSize: 11, color: '#9ca3af', marginLeft: 2, fontWeight: 500}}>/100</span></div>
        <div style={MM.stripT}>Excellent</div>
      </div>
      <div style={{...MM.stripCell, ...MM.stripCellSep}}>
        <div style={MM.stripL}>Pollen</div>
        <div style={MM.stripV}>+++</div>
        <div style={MM.stripT}>Lavande</div>
      </div>
    </div>

    {/* Alerte critique — ligne pure, pas de carte */}
    <div style={MM.sect}><span style={MM.sectT}>À traiter</span></div>
    <div style={{...MM.row, ...MM.rowFirst}}>
      <span style={{width: 4, height: 32, background: '#b54545', borderRadius: 99}} />
      <div style={MM.rowMain}>
        <div style={MM.rowT}>3 ruches affaiblies — Sorgue</div>
        <div style={MM.rowS}>V-141, V-148, V-152 · il y a 2 h</div>
      </div>
      <SIcon d={Si.chev} size={18}/>
    </div>
    <div style={MM.row}>
      <span style={{width: 4, height: 32, background: '#c87f2a', borderRadius: 99}} />
      <div style={MM.rowMain}>
        <div style={MM.rowT}>Stock cires gaufrées bas</div>
        <div style={MM.rowS}>8 plaques · seuil 20</div>
      </div>
      <SIcon d={Si.chev} size={18}/>
    </div>

    {/* Agenda */}
    <div style={MM.sect}><span style={MM.sectT}>Aujourd'hui</span><span style={MM.sectA}>Tout voir</span></div>
    {[
      {h: '06:30', t: 'Visite de printemps', s: 'V-014 · Mont Ventoux Sud'},
      {h: '07:15', t: 'Visite de printemps', s: 'V-018 · Mont Ventoux Sud'},
      {h: '14:00', t: 'Marché Bédoin', s: 'Vente directe · stand 12'},
    ].map((e, i, arr) => (
      <div key={i} style={{...MM.row, ...(i === 0 ? MM.rowFirst : {}), ...(i === arr.length - 1 ? {borderBottom: '0.5px solid #e7e5e0'} : {})}}>
        <span style={{width: 56, fontSize: 13, color: '#6b7280', fontVariantNumeric: 'tabular-nums'}}>{e.h}</span>
        <div style={MM.rowMain}>
          <div style={MM.rowT}>{e.t}</div>
          <div style={MM.rowS}>{e.s}</div>
        </div>
      </div>
    ))}

    {/* Stats */}
    <div style={MM.sect}><span style={MM.sectT}>Aperçu</span></div>
    {[
      {l: 'Production 2025', v: '6 740 kg', s: '+12 % vs 2024'},
      {l: 'Ruches actives', v: '248', s: 'Sur 7 ruchers'},
      {l: 'CA YTD', v: '38,4 k€', s: '4 factures en attente'},
    ].map((s, i, arr) => (
      <div key={s.l} style={{...MM.row, ...(i === 0 ? MM.rowFirst : {}), ...(i === arr.length - 1 ? {borderBottom: '0.5px solid #e7e5e0'} : {})}}>
        <div style={MM.rowMain}>
          <div style={MM.rowT}>{s.l}</div>
          <div style={MM.rowS}>{s.s}</div>
        </div>
        <div style={{fontSize: 15, fontWeight: 600, color: '#000', fontVariantNumeric: 'tabular-nums'}}>{s.v}</div>
        <SIcon d={Si.chev} size={16}/>
      </div>
    ))}
  </div>
);

/* ============================================================
   SCREEN 2 — Ruches
   ============================================================ */
const ScrMinRuches = () => (
  <div style={MM.body}>
    <div style={MM.nav}>
      <div style={MM.navTop}>
        <button style={MM.navIcon}><SIcon d={Si.filter} size={20}/></button>
        <span style={{fontSize: 12, color: '#6b7280'}}>248 ruches · 7 ruchers</span>
        <button style={MM.navIcon}><SIcon d={Si.more} size={20}/></button>
      </div>
      <div style={MM.navTitle}>Ruches</div>
      <div style={{marginTop: 12, height: 36, borderRadius: 8, background: '#f4f2ed', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px'}}>
        <SIcon d={Si.search} size={15} stroke={1.8}/>
        <span style={{fontSize: 14, color: '#9ca3af'}}>Rechercher par numéro…</span>
      </div>
      <div style={{marginTop: 14, display: 'flex', gap: 6, overflow: 'hidden'}}>
        <button style={MM.chip(true)}>Tous · 248</button>
        <button style={MM.chip(false)}>En forme · 231</button>
        <button style={MM.chip(false)}>À surveiller · 14</button>
      </div>
    </div>

    <div style={MM.sect}>
      <span style={MM.sectT}>Mont Ventoux Sud</span>
      <span style={MM.sectS}>42 ruches</span>
    </div>
    {[
      {id: 'V-014', sub: 'Dadant 10c · F1 Buckfast 2023', kg: 27.4, dlt: '+1.1', sante: 'En forme', c: '#4f6a4c'},
      {id: 'V-018', sub: 'Dadant 10c · Carnica 2024', kg: 31.2, dlt: '+1.2', sante: 'En forme', c: '#4f6a4c'},
      {id: 'V-021', sub: 'Langstroth · Locale 2022', kg: 24.6, dlt: '+0.4', sante: 'À surveiller', c: '#c87f2a'},
      {id: 'V-024', sub: 'Dadant 10c · F2 Buckfast 2025', kg: 22.1, dlt: '−0.3', sante: 'À surveiller', c: '#c87f2a'},
    ].map((r, i, arr) => (
      <div key={r.id} style={{...MM.row, ...(i === 0 ? MM.rowFirst : {})}}>
        <span style={{fontSize: 13, fontWeight: 600, color: '#000', width: 48, fontVariantNumeric: 'tabular-nums'}}>{r.id}</span>
        <div style={MM.rowMain}>
          <div style={MM.rowT}>
            <span style={{fontVariantNumeric: 'tabular-nums'}}>{r.kg.toFixed(1)} kg</span>
            <span style={{marginLeft: 8, fontSize: 13, color: '#9ca3af', fontWeight: 400, fontVariantNumeric: 'tabular-nums'}}>{r.dlt} kg / 7j</span>
          </div>
          <div style={MM.rowS}>{r.sub} · <span style={{color: r.c, fontWeight: 500}}>{r.sante}</span></div>
        </div>
        <SIcon d={Si.chev} size={18}/>
      </div>
    ))}

    <div style={MM.sect}>
      <span style={MM.sectT}>Garrigue de Sault</span>
      <span style={MM.sectS}>36 ruches</span>
    </div>
    {[
      {id: 'V-053', sub: 'Dadant 10c · Buckfast 2024', kg: 36.8, sante: 'En forme', c: '#4f6a4c'},
      {id: 'V-061', sub: 'Langstroth · Carnica 2023', kg: 28.4, sante: 'En forme', c: '#4f6a4c'},
      {id: 'V-070', sub: 'Dadant 12c · Locale 2022', kg: 19.2, sante: 'Préoccupante', c: '#b54545'},
    ].map((r, i) => (
      <div key={r.id} style={{...MM.row, ...(i === 0 ? MM.rowFirst : {})}}>
        <span style={{fontSize: 13, fontWeight: 600, color: '#000', width: 48, fontVariantNumeric: 'tabular-nums'}}>{r.id}</span>
        <div style={MM.rowMain}>
          <div style={MM.rowT}><span style={{fontVariantNumeric: 'tabular-nums'}}>{r.kg.toFixed(1)} kg</span></div>
          <div style={MM.rowS}>{r.sub} · <span style={{color: r.c, fontWeight: 500}}>{r.sante}</span></div>
        </div>
        <SIcon d={Si.chev} size={18}/>
      </div>
    ))}
  </div>
);

/* ============================================================
   SCREEN 3 — Détail ruche
   ============================================================ */
const ScrMinRucheDet = () => (
  <div style={MM.body}>
    <div style={MM.nav}>
      <div style={MM.navTop}>
        <button style={MM.navIcon}><SIcon d={Si.back} size={22}/></button>
        <button style={MM.navIcon}><SIcon d={Si.more} size={22}/></button>
      </div>
      <div style={{fontSize: 13, color: '#6b7280', marginTop: 8}}>Mont Ventoux Sud · Dadant 10c</div>
      <div style={MM.navTitle}>V-014</div>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13, color: '#4f6a4c', fontWeight: 500}}>
        <span style={{width: 6, height: 6, borderRadius: 99, background: '#4f6a4c'}}/>
        En forme · couvain compact
      </div>
    </div>

    <div style={MM.strip}>
      <div style={MM.stripCell}>
        <div style={MM.stripL}>Poids</div>
        <div style={MM.stripV}>27,4<span style={{fontSize: 11, color: '#9ca3af', marginLeft: 3, fontWeight: 500}}>kg</span></div>
        <div style={{...MM.stripT, color: '#4f6a4c', fontWeight: 500}}>+1,1 / 7j</div>
      </div>
      <div style={{...MM.stripCell, ...MM.stripCellSep}}>
        <div style={MM.stripL}>Cadres</div>
        <div style={MM.stripV}>8</div>
        <div style={MM.stripT}>de couvain</div>
      </div>
      <div style={{...MM.stripCell, ...MM.stripCellSep}}>
        <div style={MM.stripL}>Varroas</div>
        <div style={MM.stripV}>2,1</div>
        <div style={{...MM.stripT, color: '#4f6a4c', fontWeight: 500}}>sain</div>
      </div>
    </div>

    <div style={MM.sect}><span style={MM.sectT}>Poids · 90 jours</span><span style={MM.sectS}>kg</span></div>
    <div style={{padding: '0 20px 18px', borderBottom: '0.5px solid #e7e5e0'}}>
      <svg viewBox="0 0 320 80" width="100%" height="80" preserveAspectRatio="none">
        <polyline fill="none" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" points="0,55 25,52 50,58 75,48 100,42 125,40 150,35 175,30 200,32 225,26 250,22 275,18 300,14 320,12"/>
        <line x1="0" y1="80" x2="320" y2="80" stroke="#e7e5e0" strokeWidth="0.5"/>
      </svg>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginTop: 6}}>
        <span>15 mars</span><span>15 avr.</span><span>15 mai</span><span>auj.</span>
      </div>
    </div>

    <div style={MM.sect}><span style={MM.sectT}>Action rapide</span></div>
    {[
      {t: 'Saisir une visite'},
      {t: 'Poser une hausse'},
      {t: 'Récolter'},
      {t: 'Traitement varroa'},
    ].map((a, i, arr) => (
      <div key={a.t} style={{...MM.row, ...(i === 0 ? MM.rowFirst : {})}}>
        <div style={{...MM.rowMain, ...MM.rowT}}>{a.t}</div>
        <SIcon d={Si.chev} size={16}/>
      </div>
    ))}

    <div style={MM.sect}><span style={MM.sectT}>Historique</span><span style={MM.sectA}>Voir tout</span></div>
    {[
      {d: '28 avr.', t: 'Récolte miel printemps', m: '+14,2 kg · romarin'},
      {d: '21 avr.', t: 'Visite sanitaire', m: 'Couvain compact 8 cadres'},
      {d: '14 avr.', t: 'Pose de hausse', m: '1ère hausse Dadant'},
      {d: '08 avr.', t: 'Comptage varroas', m: '2,1 / 100 ab. · sain'},
    ].map((h, i) => (
      <div key={h.d} style={{...MM.row, ...(i === 0 ? MM.rowFirst : {})}}>
        <span style={{width: 56, fontSize: 12, color: '#6b7280', fontVariantNumeric: 'tabular-nums'}}>{h.d}</span>
        <div style={MM.rowMain}>
          <div style={MM.rowT}>{h.t}</div>
          <div style={MM.rowS}>{h.m}</div>
        </div>
      </div>
    ))}
  </div>
);

/* ============================================================
   SCREEN 4 — Saisie (sheet)
   ============================================================ */
const ScrMinSaisie = () => (
  <div style={{...MM.body, padding: 0, paddingTop: 0, paddingBottom: 0, background: 'rgba(0,0,0,0.4)', position: 'relative'}}>
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.55))'}}/>
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, top: 80,
      background: '#fff',
      borderTopLeftRadius: 18, borderTopRightRadius: 18,
      overflow: 'auto',
      boxShadow: '0 -10px 30px rgba(0,0,0,0.2)',
    }}>
      <div style={{position: 'sticky', top: 0, background: '#fff', zIndex: 5}}>
        <div style={{display: 'grid', placeItems: 'center', padding: '8px 0 10px'}}>
          <div style={{width: 36, height: 5, borderRadius: 99, background: '#d1d5db'}}/>
        </div>
        <div style={{padding: '0 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <button style={{fontSize: 15, color: '#6b7280', fontWeight: 500, background: 'none', border: 'none'}}>Annuler</button>
          <div style={{fontSize: 15, fontWeight: 600}}>Nouvelle visite</div>
          <button style={{fontSize: 15, color: '#a86a13', fontWeight: 700, background: 'none', border: 'none'}}>OK</button>
        </div>
      </div>

      <div style={MM.sect}><span style={MM.sectT}>Ruche</span></div>
      <div style={{...MM.row, ...MM.rowFirst}}>
        <div style={MM.rowMain}>
          <div style={MM.rowT}>V-014</div>
          <div style={MM.rowS}>Mont Ventoux Sud</div>
        </div>
        <span style={{fontSize: 14, color: '#a86a13', fontWeight: 500}}>Changer</span>
      </div>

      <div style={MM.sect}><span style={MM.sectT}>État du couvain</span></div>
      <div style={{padding: '4px 20px 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8}}>
        {['Absent', 'Faible', 'Moyen', 'Compact'].map((l, i) => (
          <button key={l} style={{
            padding: '14px 0', borderRadius: 10,
            background: i === 3 ? '#000' : '#f4f2ed',
            color: i === 3 ? '#fff' : '#6b7280',
            border: 'none', fontSize: 13, fontWeight: 500,
          }}>{l}</button>
        ))}
      </div>

      <div style={MM.sect}><span style={MM.sectT}>Cadres de couvain</span></div>
      <div style={{margin: '4px 20px 0', padding: '16px 18px', background: '#fff', border: '0.5px solid #e7e5e0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <button style={{width: 34, height: 34, borderRadius: 99, background: '#f4f2ed', border: 'none', fontSize: 20, color: '#6b7280'}}>−</button>
        <div style={{fontSize: 36, fontWeight: 600, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums'}}>8</div>
        <button style={{width: 34, height: 34, borderRadius: 99, background: '#000', color: '#fff', border: 'none', fontSize: 20}}>+</button>
      </div>

      <div style={MM.sect}><span style={MM.sectT}>Observations</span></div>
      {[
        {l: 'Reine vue', on: true},
        {l: 'Réserves miel suffisantes', on: true},
        {l: 'Cellules royales détectées', on: false},
        {l: 'Hausse à poser', on: false},
      ].map((o, i) => (
        <div key={o.l} style={{...MM.row, ...(i === 0 ? MM.rowFirst : {})}}>
          <div style={{...MM.rowMain, ...MM.rowT}}>{o.l}</div>
          <div style={{
            width: 44, height: 26, borderRadius: 99,
            background: o.on ? '#000' : '#e7e5e0',
            position: 'relative', flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', top: 2, left: o.on ? 20 : 2,
              width: 22, height: 22, borderRadius: 99, background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}/>
          </div>
        </div>
      ))}

      <div style={MM.sect}><span style={MM.sectT}>Note vocale</span></div>
      <div style={{margin: '4px 20px 40px', padding: '14px 18px', border: '0.5px solid #e7e5e0', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14}}>
        <div style={{width: 40, height: 40, borderRadius: 99, background: '#f4f2ed', display: 'grid', placeItems: 'center'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M19 11v1a7 7 0 0 1-14 0v-1M12 19v3"/></svg>
        </div>
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{fontSize: 14, fontWeight: 500}}>Maintenir pour parler</div>
          <div style={{fontSize: 12, color: '#9ca3af', marginTop: 1}}>Transcription auto en français</div>
        </div>
      </div>
    </div>
  </div>
);

/* ============================================================
   SCREEN 5 — Calendrier semaine
   ============================================================ */
const ScrMinCal = () => (
  <div style={MM.body}>
    <div style={MM.nav}>
      <div style={MM.navTop}>
        <button style={MM.navIcon}><SIcon d={Si.back} size={22}/></button>
        <span style={{fontSize: 15, fontWeight: 600}}>Mai 2026</span>
        <button style={MM.navIcon}><SIcon d={Si.plus} size={22}/></button>
      </div>
      <div style={{marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4}}>
        {[
          {d: 'L', n: 25}, {d: 'M', n: 26}, {d: 'M', n: 27, today: true}, {d: 'J', n: 28},
          {d: 'V', n: 29}, {d: 'S', n: 30}, {d: 'D', n: 31},
        ].map((d, i) => (
          <div key={i} style={{padding: '6px 0 8px', textAlign: 'center', cursor: 'pointer'}}>
            <div style={{fontSize: 10, color: d.today ? '#000' : '#9ca3af', fontWeight: 500, textTransform: 'uppercase'}}>{d.d}</div>
            <div style={{
              margin: '6px auto 0', width: 34, height: 34, borderRadius: 99,
              background: d.today ? '#000' : 'transparent',
              color: d.today ? '#fff' : '#000',
              display: 'grid', placeItems: 'center',
              fontSize: 16, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
            }}>{d.n}</div>
            {[true, false, true, false, true, false, false][i] && (
              <div style={{margin: '6px auto 0', width: 4, height: 4, borderRadius: 99, background: '#f5a623'}}/>
            )}
          </div>
        ))}
      </div>
    </div>

    <div style={MM.sect}><span style={MM.sectT}>Aujourd'hui · mer. 27</span><span style={MM.sectS}>3 événements</span></div>
    {[
      {h: '06:30', t: 'Visite de printemps', s: 'V-014 · Mont Ventoux Sud'},
      {h: '07:15', t: 'Visite de printemps', s: 'V-018 · Mont Ventoux Sud'},
      {h: '14:00', t: 'Marché Bédoin', s: 'Vente directe · stand 12'},
    ].map((e, i, arr) => (
      <div key={i} style={{...MM.row, ...(i === 0 ? MM.rowFirst : {})}}>
        <span style={{width: 50, fontSize: 12, color: '#000', fontWeight: 500, fontVariantNumeric: 'tabular-nums'}}>{e.h}</span>
        <div style={MM.rowMain}>
          <div style={MM.rowT}>{e.t}</div>
          <div style={MM.rowS}>{e.s}</div>
        </div>
      </div>
    ))}

    <div style={MM.sect}><span style={MM.sectT}>Demain · jeu. 28</span><span style={MM.sectS}>1 événement</span></div>
    <div style={{...MM.row, ...MM.rowFirst}}>
      <span style={{width: 50, fontSize: 12, color: '#000', fontWeight: 500, fontVariantNumeric: 'tabular-nums'}}>06:00</span>
      <div style={MM.rowMain}>
        <div style={MM.rowT}>Pose de hausses</div>
        <div style={MM.rowS}>Garrigue de Sault · 6 ruches</div>
      </div>
    </div>

    <div style={MM.sect}>
      <span style={MM.sectT}>Vendredi 29</span>
      <span style={{...MM.sectS, color: '#c87f2a', fontWeight: 500}}>Gel possible</span>
    </div>
    <div style={{...MM.row, ...MM.rowFirst, opacity: 0.65}}>
      <span style={{width: 50, fontSize: 12, color: '#6b7280', fontVariantNumeric: 'tabular-nums'}}>17:00</span>
      <div style={MM.rowMain}>
        <div style={MM.rowT}>Traitement varroa</div>
        <div style={{...MM.rowS, color: '#c87f2a'}}>R02 · suggéré de reporter</div>
      </div>
    </div>
  </div>
);

/* ============================================================
   SCREEN 6 — Alertes
   ============================================================ */
const ScrMinAlertes = () => (
  <div style={MM.body}>
    <div style={MM.nav}>
      <div style={MM.navTop}>
        <button style={MM.navIcon}><SIcon d={Si.back} size={22}/></button>
        <button style={MM.navBtn}>Tout marquer lu</button>
      </div>
      <div style={MM.navTitle}>Alertes</div>
      <div style={MM.navSub}>5 ouvertes · 1 critique</div>
    </div>

    <div style={MM.sect}><span style={{...MM.sectT, color: '#b54545'}}>Critique</span><span style={MM.sectS}>1</span></div>
    <div style={{...MM.row, ...MM.rowFirst, alignItems: 'flex-start', padding: '16px 20px 18px'}}>
      <span style={{width: 4, height: 60, background: '#b54545', borderRadius: 99, flexShrink: 0, marginTop: 2}}/>
      <div style={MM.rowMain}>
        <div style={{fontSize: 11, fontWeight: 600, color: '#b54545', marginBottom: 4}}>Sanitaire · il y a 2 h</div>
        <div style={MM.rowT}>3 ruches affaiblies à Sorgue</div>
        <div style={{...MM.rowS, marginTop: 4, lineHeight: 1.45}}>V-141, V-148, V-152 — population effondrée. Dernière visite il y a 17 j.</div>
        <div style={{display: 'flex', gap: 8, marginTop: 12}}>
          <button style={{height: 32, padding: '0 14px', borderRadius: 8, background: '#000', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600}}>Planifier visite</button>
          <button style={{height: 32, padding: '0 14px', borderRadius: 8, background: '#f4f2ed', color: '#000', border: 'none', fontSize: 13, fontWeight: 500}}>Reporter</button>
        </div>
      </div>
    </div>

    <div style={MM.sect}><span style={MM.sectT}>Importantes</span><span style={MM.sectS}>2</span></div>
    {[
      {sev: '#c87f2a', t: 'Stock cires gaufrées bas', s: '8 plaques · seuil 20 · 5 h'},
      {sev: '#c87f2a', t: 'Risque d\'essaimage', s: 'V-024 · 4 cellules royales · 1 j'},
    ].map((a, i) => (
      <div key={i} style={{...MM.row, ...(i === 0 ? MM.rowFirst : {})}}>
        <span style={{width: 4, height: 28, background: a.sev, borderRadius: 99, flexShrink: 0}}/>
        <div style={MM.rowMain}>
          <div style={MM.rowT}>{a.t}</div>
          <div style={MM.rowS}>{a.s}</div>
        </div>
        <SIcon d={Si.chev} size={16}/>
      </div>
    ))}

    <div style={MM.sect}><span style={MM.sectT}>À titre informatif</span><span style={MM.sectS}>2</span></div>
    {[
      {t: 'Gel possible vendredi nuit', s: 'Sault, Buoux · -2 °C · 1 j'},
      {t: 'Facture F-039 en retard', s: 'Boulangerie Augier · 216 € · 2 j'},
    ].map((a, i) => (
      <div key={i} style={{...MM.row, ...(i === 0 ? MM.rowFirst : {})}}>
        <span style={{width: 4, height: 28, background: '#e7e5e0', borderRadius: 99, flexShrink: 0}}/>
        <div style={MM.rowMain}>
          <div style={MM.rowT}>{a.t}</div>
          <div style={MM.rowS}>{a.s}</div>
        </div>
        <SIcon d={Si.chev} size={16}/>
      </div>
    ))}

    <div style={MM.sect}><span style={{...MM.sectT, color: '#9ca3af'}}>Résolues · 14</span><span style={MM.sectA}>Voir</span></div>
  </div>
);

/* ============================================================
   Tab bar — minimal, text-led
   ============================================================ */
const TabBarMin = ({ active }) => (
  <div style={MM.tabbar}>
    <button style={MM.tab(active === 'home')}>
      {active === 'home' && <span style={MM.tabActiveBar}/>}
      <SIcon d={Si.home} size={22} stroke={active === 'home' ? 2 : 1.6}/>
      <span>Aujourd'hui</span>
    </button>
    <button style={MM.tab(active === 'ruches')}>
      {active === 'ruches' && <span style={MM.tabActiveBar}/>}
      <SIcon d={Si.hex} size={22} stroke={active === 'ruches' ? 2 : 1.6}/>
      <span>Ruches</span>
    </button>
    <button style={{...MM.tab(false), color: '#000'}}>
      <div style={MM.tabAddDisc}><SIcon d={Si.plus} size={18} stroke={2.4}/></div>
      <span>Saisir</span>
    </button>
    <button style={MM.tab(active === 'cal')}>
      {active === 'cal' && <span style={MM.tabActiveBar}/>}
      <SIcon d={Si.cal} size={22} stroke={active === 'cal' ? 2 : 1.6}/>
      <span>Calendrier</span>
    </button>
    <button style={MM.tab(active === 'alertes')}>
      {active === 'alertes' && <span style={MM.tabActiveBar}/>}
      <div style={{position: 'relative'}}>
        <SIcon d={Si.bell} size={22} stroke={active === 'alertes' ? 2 : 1.6}/>
        <span style={{position: 'absolute', top: -1, right: -3, minWidth: 14, height: 14, padding: '0 4px', borderRadius: 99, background: '#b54545', color: '#fff', fontSize: 9, fontWeight: 700, display: 'grid', placeItems: 'center'}}>1</span>
      </div>
      <span>Alertes</span>
    </button>
  </div>
);

/* Frame variant */
const MinFrame = ({ children, withTab = true, activeTab = 'home' }) => (
  <div style={{position: 'relative', width: 402, height: 874}}>
    <window.IOSDevice width={402} height={874}>
      {children}
    </window.IOSDevice>
    {withTab && (
      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 60, pointerEvents: 'auto'}}>
        <TabBarMin active={activeTab}/>
      </div>
    )}
  </div>
);

const MinToday      = () => <MinFrame activeTab="home"><ScrMinToday/></MinFrame>;
const MinRuches     = () => <MinFrame activeTab="ruches"><ScrMinRuches/></MinFrame>;
const MinRucheDet   = () => <MinFrame activeTab="ruches"><ScrMinRucheDet/></MinFrame>;
const MinSaisie     = () => <MinFrame withTab={false}><ScrMinSaisie/></MinFrame>;
const MinCalendrier = () => <MinFrame activeTab="cal"><ScrMinCal/></MinFrame>;
const MinAlertes    = () => <MinFrame activeTab="alertes"><ScrMinAlertes/></MinFrame>;

Object.assign(window, { MinToday, MinRuches, MinRucheDet, MinSaisie, MinCalendrier, MinAlertes, MM, SIcon, Si, MinFrame });
