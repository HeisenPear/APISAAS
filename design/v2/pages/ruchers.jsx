/* PAGE — Ruchers (liste + détail) */
const rcStyles = {
  page: { display: 'flex', width: 1280, height: 880, background: 'var(--surface-primary)', overflow: 'hidden', fontFamily: 'var(--font-text)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  scroll: { flex: 1, overflow: 'auto', padding: '28px 40px 60px' },

  header: { marginBottom: 24 },
  h1: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' },
  hSub: { fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 6 },

  toolbar: { display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center' },
  filter: { padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--surface-card)', fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)' },
  filterActive: { padding: '7px 14px', borderRadius: 8, background: '#1c1c1e', color: '#fff', fontSize: 12.5, fontWeight: 600, border: 'none' },
  spacer: { marginLeft: 'auto', display: 'flex', gap: 8 },
  viewBtn: { width: 32, height: 32, borderRadius: 7, border: '1px solid var(--border-default)', background: 'var(--surface-card)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' },
  viewBtnActive: { width: 32, height: 32, borderRadius: 7, border: '1px solid var(--border-strong)', background: 'var(--surface-muted)', display: 'grid', placeItems: 'center', color: 'var(--text-primary)' },

  /* split layout */
  split: { display: 'grid', gridTemplateColumns: '1fr 460px', gap: 24, alignItems: 'flex-start' },

  /* list */
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: (active) => ({
    background: 'var(--surface-card)',
    border: active ? '1.5px solid var(--honey)' : '1px solid var(--border-default)',
    borderRadius: 14,
    padding: '18px 20px',
    display: 'grid', gridTemplateColumns: '1fr auto', gap: 18, alignItems: 'center',
    boxShadow: active ? '0 0 0 4px var(--honey-soft)' : 'none',
    cursor: 'pointer',
  }),
  cardLeft: {},
  cardName: { fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em', display: 'flex', alignItems: 'center', gap: 10 },
  cardId: { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--surface-muted)', padding: '1px 6px', borderRadius: 4 },
  cardMeta: { fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 },
  cardFlore: { fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, fontStyle: 'italic' },
  cardRight: { display: 'flex', gap: 22, alignItems: 'center' },
  metric: { textAlign: 'right' },
  metricN: { fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' },
  metricL: { fontSize: 10.5, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 },
  badge: (s) => ({
    fontSize: 11, fontWeight: 600, padding: '4px 9px', borderRadius: 99,
    color: s === 'good' ? 'var(--sage-deep)' : s === 'warn' ? 'var(--status-warn)' : 'var(--status-bad)',
    background: s === 'good' ? 'var(--sage-soft)' : s === 'warn' ? '#fdf3e3' : '#f8e8e8',
    display: 'inline-flex', alignItems: 'center', gap: 5,
  }),

  /* detail panel */
  detail: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 22, position: 'sticky', top: 0 },
  dHero: { paddingBottom: 18, borderBottom: '1px solid var(--border-default)' },
  dName: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' },
  dMeta: { fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 },
  dKpi: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 18 },
  dKpiBox: { background: 'var(--surface-muted)', borderRadius: 10, padding: '12px 14px' },
  dKpiL: { fontSize: 10.5, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 },
  dKpiV: { fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, marginTop: 4, letterSpacing: '-0.02em' },

  dSect: { marginTop: 22 },
  dSectTitle: { fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 },
  dRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border-faint)', fontSize: 13 },
  dLabel: { color: 'var(--text-secondary)' },
  dVal: { color: 'var(--text-primary)', fontWeight: 500 },

  miniMap: { marginTop: 22, height: 160, borderRadius: 10, background: 'linear-gradient(135deg, #eef2eb 0%, #f7eee7 50%, #fff3dc 100%)', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-faint)' },
  pin: { position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', width: 26, height: 26, borderRadius: 99, background: 'var(--clay)', border: '3px solid #fff', boxShadow: 'var(--shadow-md)' },
  mapNote: { position: 'absolute', bottom: 10, left: 12, fontSize: 11, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.7)', padding: '3px 8px', borderRadius: 6, backdropFilter: 'blur(4px)' },

  dActions: { display: 'flex', gap: 8, marginTop: 22 },
  bPrim: { flex: 1, height: 38, borderRadius: 9, background: '#1c1c1e', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  bSec: { flex: 1, height: 38, borderRadius: 9, background: 'var(--surface-card)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
};

const Ruchers2 = () => {
  const D = window.APIGO_DATA;
  const sel = D.RUCHERS[0];
  return (
    <div style={rcStyles.page}>
      <window.Sidebar2 active="ruchers" />
      <div style={rcStyles.main}>
        <window.Topbar2 crumb={['Cheptel', 'Ruchers']} action="Nouveau rucher" />
        <div style={rcStyles.scroll}>
          <div style={rcStyles.header}>
            <h1 style={rcStyles.h1}>Ruchers</h1>
            <p style={rcStyles.hSub}>7 emplacements actifs · 248 ruches au total · 6 740 kg récoltés en 2025</p>
          </div>

          <div style={rcStyles.toolbar}>
            <button style={rcStyles.filterActive}>Tous · 7</button>
            <button style={rcStyles.filter}>En forme · 5</button>
            <button style={rcStyles.filter}>À surveiller · 1</button>
            <button style={rcStyles.filter}>Préoccupants · 1</button>
            <div style={rcStyles.spacer}>
              <button style={rcStyles.viewBtnActive}>{React.createElement(window.I.layoutGrid, {size: 14})}</button>
              <button style={rcStyles.viewBtn}>{React.createElement(window.I.list, {size: 14})}</button>
              <button style={rcStyles.viewBtn}>{React.createElement(window.I.pin, {size: 14})}</button>
            </div>
          </div>

          <div style={rcStyles.split}>
            <div style={rcStyles.list}>
              {D.RUCHERS.map((r, idx) => (
                <div key={r.id} style={rcStyles.card(idx === 0)}>
                  <div style={rcStyles.cardLeft}>
                    <div style={rcStyles.cardName}>
                      {r.name}
                      <span style={rcStyles.cardId}>{r.id}</span>
                    </div>
                    <div style={rcStyles.cardMeta}>{r.commune} · {r.altitude} m · dernière visite {r.lastVisit}</div>
                    <div style={rcStyles.cardFlore}>{r.flore}</div>
                  </div>
                  <div style={rcStyles.cardRight}>
                    <div style={rcStyles.metric}>
                      <div style={rcStyles.metricN}>{r.ruches}</div>
                      <div style={rcStyles.metricL}>Ruches</div>
                    </div>
                    <div style={rcStyles.metric}>
                      <div style={rcStyles.metricN}>{r.prod2025}</div>
                      <div style={rcStyles.metricL}>kg 2025</div>
                    </div>
                    <span style={rcStyles.badge(r.sante)}>
                      <span style={{width:6, height:6, borderRadius:99, background:'currentColor'}} />
                      {r.sante === 'good' ? 'En forme' : r.sante === 'warn' ? 'À surveiller' : 'Préoccupant'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={rcStyles.detail}>
              <div style={rcStyles.dHero}>
                <div style={rcStyles.dName}>{sel.name}</div>
                <div style={rcStyles.dMeta}>{sel.commune} · {sel.altitude} m · GPS 44.18°N 5.27°E</div>
              </div>

              <div style={rcStyles.dKpi}>
                <div style={rcStyles.dKpiBox}>
                  <div style={rcStyles.dKpiL}>Ruches</div>
                  <div style={rcStyles.dKpiV}>{sel.ruches}</div>
                </div>
                <div style={rcStyles.dKpiBox}>
                  <div style={rcStyles.dKpiL}>Prod. 2025</div>
                  <div style={rcStyles.dKpiV}>{sel.prod2025} <span style={{fontSize: 12, color: 'var(--text-tertiary)'}}>kg</span></div>
                </div>
                <div style={rcStyles.dKpiBox}>
                  <div style={rcStyles.dKpiL}>Rendement</div>
                  <div style={rcStyles.dKpiV}>28<span style={{fontSize: 12, color: 'var(--text-tertiary)'}}> kg/r</span></div>
                </div>
              </div>

              <div style={rcStyles.miniMap}>
                <div style={rcStyles.pin}>{React.createElement(window.I.pin, {size: 12, style: {color:'#fff'}})}</div>
                <div style={rcStyles.mapNote}>Mont Ventoux Sud · Bédoin</div>
              </div>

              <div style={rcStyles.dSect}>
                <div style={rcStyles.dSectTitle}>Caractéristiques</div>
                <div style={rcStyles.dRow}><span style={rcStyles.dLabel}>Flore dominante</span><span style={rcStyles.dVal}>{sel.flore}</span></div>
                <div style={rcStyles.dRow}><span style={rcStyles.dLabel}>Type d'exposition</span><span style={rcStyles.dVal}>Sud-Est</span></div>
                <div style={rcStyles.dRow}><span style={rcStyles.dLabel}>Accès véhicule</span><span style={rcStyles.dVal}>4×4 conseillé</span></div>
                <div style={rcStyles.dRow}><span style={rcStyles.dLabel}>Propriétaire terrain</span><span style={rcStyles.dVal}>M. Faure</span></div>
              </div>

              <div style={rcStyles.dSect}>
                <div style={rcStyles.dSectTitle}>Activité récente</div>
                <div style={rcStyles.dRow}><span style={rcStyles.dLabel}>28 avr. — Récolte printemps</span><span style={rcStyles.dVal}>+420 kg</span></div>
                <div style={rcStyles.dRow}><span style={rcStyles.dLabel}>21 avr. — Visite sanitaire</span><span style={rcStyles.dVal}>42 ruches</span></div>
                <div style={rcStyles.dRow}><span style={rcStyles.dLabel}>14 avr. — Pose hausse</span><span style={rcStyles.dVal}>38 ruches</span></div>
              </div>

              <div style={rcStyles.dActions}>
                <button style={rcStyles.bPrim}>{React.createElement(window.I.plus, {size: 14})} Intervention</button>
                <button style={rcStyles.bSec}>{React.createElement(window.I.edit, {size: 14})} Modifier</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.Ruchers2 = Ruchers2;
