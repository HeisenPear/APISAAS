/* PAGE — Interventions (timeline + cards) */
const inStyles = {
  page: { display: 'flex', width: 1280, height: 880, background: 'var(--surface-primary)', overflow: 'hidden', fontFamily: 'var(--font-text)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  scroll: { flex: 1, overflow: 'auto', padding: '28px 40px 60px' },
  header: { marginBottom: 24 },
  h1: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' },
  hSub: { fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 6 },

  tabs: { display: 'flex', gap: 4, marginBottom: 22, borderBottom: '1px solid var(--border-default)' },
  tab: (active) => ({ padding: '10px 14px', fontSize: 13.5, fontWeight: active ? 600 : 500, color: active ? 'var(--text-primary)' : 'var(--text-tertiary)', borderBottom: active ? '2px solid var(--honey)' : '2px solid transparent', marginBottom: -1 }),

  layout: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28 },

  /* Timeline column */
  daySection: { marginBottom: 32 },
  dayHead: { display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 },
  dayDate: { fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em' },
  dayMeta: { fontSize: 12.5, color: 'var(--text-tertiary)' },
  dayPill: { fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: 'var(--honey-soft)', color: 'var(--honey-deep)' },

  cards: { display: 'flex', flexDirection: 'column', gap: 10 },
  iCard: (state) => ({
    background: 'var(--surface-card)',
    border: '1px solid var(--border-default)',
    borderLeft: state === 'done' ? '3px solid var(--sage)' : state === 'planned' ? '3px solid var(--honey)' : '3px solid var(--text-quaternary)',
    borderRadius: 12,
    padding: '16px 20px',
    display: 'grid', gridTemplateColumns: '70px 1fr auto', gap: 16, alignItems: 'center',
  }),
  iHour: { fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 },
  iType: { fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' },
  iMeta: { fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 3 },
  iNotes: { fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic' },
  iState: (s) => ({ fontSize: 11, fontWeight: 600, padding: '4px 9px', borderRadius: 99, color: s === 'done' ? 'var(--sage-deep)' : 'var(--honey-deep)', background: s === 'done' ? 'var(--sage-soft)' : 'var(--honey-soft)' }),

  /* Sidebar — types + raccourcis */
  side: { display: 'flex', flexDirection: 'column', gap: 22 },
  panel: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 18 },
  pTitle: { fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 },
  typeRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: 13 },
  typeIcon: (c) => ({ width: 28, height: 28, borderRadius: 8, background: c, display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }),
  typeName: { flex: 1, fontWeight: 500 },
  typeCount: { fontSize: 12, color: 'var(--text-tertiary)' },

  quick: { display: 'flex', flexDirection: 'column', gap: 8 },
  qBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, background: 'var(--surface-muted)', border: 'none', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' },
};

const Interventions2 = () => {
  const D = window.APIGO_DATA;
  const planned = D.INTERVENTIONS.filter(i => i.etat === 'planned');
  const done = D.INTERVENTIONS.filter(i => i.etat === 'done');
  return (
    <div style={inStyles.page}>
      <window.Sidebar2 active="interventions" />
      <div style={inStyles.main}>
        <window.Topbar2 crumb={['Cheptel', 'Interventions']} action="Planifier" />
        <div style={inStyles.scroll}>
          <div style={inStyles.header}>
            <h1 style={inStyles.h1}>Interventions</h1>
            <p style={inStyles.hSub}>4 planifiées sur 7 jours · 12 réalisées ce mois-ci</p>
          </div>

          <div style={inStyles.tabs}>
            <span style={inStyles.tab(true)}>À venir</span>
            <span style={inStyles.tab(false)}>Réalisées</span>
            <span style={inStyles.tab(false)}>Toutes</span>
            <span style={inStyles.tab(false)}>Brouillons</span>
          </div>

          <div style={inStyles.layout}>
            <div>
              <div style={inStyles.daySection}>
                <div style={inStyles.dayHead}>
                  <span style={inStyles.dayDate}>Samedi 2 mai</span>
                  <span style={inStyles.dayMeta}>Aujourd'hui · Mont Ventoux</span>
                  <span style={{...inStyles.dayPill, marginLeft: 'auto'}}>2 visites</span>
                </div>
                <div style={inStyles.cards}>
                  {planned.filter(i => i.date === '2 mai').map(i => (
                    <div key={i.id} style={inStyles.iCard('planned')}>
                      <span style={inStyles.iHour}>{i.heure}</span>
                      <div>
                        <div style={inStyles.iType}>{i.type}</div>
                        <div style={inStyles.iMeta}>{i.rucher} · ruche {i.ruche} · 35 min estimées</div>
                      </div>
                      <span style={inStyles.iState('planned')}>Planifiée</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={inStyles.daySection}>
                <div style={inStyles.dayHead}>
                  <span style={inStyles.dayDate}>Dimanche 3 mai</span>
                  <span style={inStyles.dayMeta}>Garrigue de Sault</span>
                </div>
                <div style={inStyles.cards}>
                  <div style={inStyles.iCard('planned')}>
                    <span style={inStyles.iHour}>06:00</span>
                    <div>
                      <div style={inStyles.iType}>Pose de hausse</div>
                      <div style={inStyles.iMeta}>R03 · ruche V-021 · première miellée lavande</div>
                    </div>
                    <span style={inStyles.iState('planned')}>Planifiée</span>
                  </div>
                </div>
              </div>

              <div style={inStyles.daySection}>
                <div style={inStyles.dayHead}>
                  <span style={inStyles.dayDate}>Lundi 4 mai</span>
                  <span style={inStyles.dayMeta}>Plaine de l'Ouvèze · ⚠ gel possible</span>
                </div>
                <div style={inStyles.cards}>
                  <div style={inStyles.iCard('planned')}>
                    <span style={inStyles.iHour}>17:00</span>
                    <div>
                      <div style={inStyles.iType}>Traitement varroa printemps</div>
                      <div style={inStyles.iMeta}>R02 · 38 ruches · acide oxalique sublimé</div>
                    </div>
                    <span style={inStyles.iState('planned')}>Planifiée</span>
                  </div>
                </div>
              </div>

              <div style={inStyles.daySection}>
                <div style={inStyles.dayHead}>
                  <span style={inStyles.dayDate}>Récentes</span>
                  <span style={inStyles.dayMeta}>30 avril → 28 avril</span>
                </div>
                <div style={inStyles.cards}>
                  {done.map(i => (
                    <div key={i.id} style={inStyles.iCard('done')}>
                      <span style={inStyles.iHour}>{i.date}</span>
                      <div>
                        <div style={inStyles.iType}>{i.type}</div>
                        <div style={inStyles.iMeta}>{i.rucher} · ruche {i.ruche}</div>
                        {i.notes && <div style={inStyles.iNotes}>« {i.notes} »</div>}
                      </div>
                      <span style={inStyles.iState('done')}>Réalisée</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={inStyles.side}>
              <div style={inStyles.panel}>
                <div style={inStyles.pTitle}>Types — ce mois</div>
                <div style={inStyles.typeRow}>
                  <span style={inStyles.typeIcon('var(--honey)')}>{React.createElement(window.I.eye, {size: 14})}</span>
                  <span style={inStyles.typeName}>Visites sanitaires</span>
                  <span style={inStyles.typeCount}>14</span>
                </div>
                <div style={inStyles.typeRow}>
                  <span style={inStyles.typeIcon('var(--sage)')}>{React.createElement(window.I.package, {size: 14})}</span>
                  <span style={inStyles.typeName}>Pose de hausses</span>
                  <span style={inStyles.typeCount}>8</span>
                </div>
                <div style={inStyles.typeRow}>
                  <span style={inStyles.typeIcon('var(--clay)')}>{React.createElement(window.I.database, {size: 14})}</span>
                  <span style={inStyles.typeName}>Récoltes</span>
                  <span style={inStyles.typeCount}>3</span>
                </div>
                <div style={inStyles.typeRow}>
                  <span style={inStyles.typeIcon('var(--status-info)')}>{React.createElement(window.I.shield, {size: 14})}</span>
                  <span style={inStyles.typeName}>Traitements</span>
                  <span style={inStyles.typeCount}>2</span>
                </div>
              </div>

              <div style={inStyles.panel}>
                <div style={inStyles.pTitle}>Raccourcis</div>
                <div style={inStyles.quick}>
                  <button style={inStyles.qBtn}>{React.createElement(window.I.eye, {size: 14})} Visite express</button>
                  <button style={inStyles.qBtn}>{React.createElement(window.I.package, {size: 14})} Pose hausse</button>
                  <button style={inStyles.qBtn}>{React.createElement(window.I.database, {size: 14})} Récolte miel</button>
                  <button style={inStyles.qBtn}>{React.createElement(window.I.shield, {size: 14})} Traitement</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.Interventions2 = Interventions2;
