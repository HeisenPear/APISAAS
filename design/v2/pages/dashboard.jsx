/* PAGE — Dashboard v2 */
const dStyles = {
  page: { display: 'flex', width: 1280, height: 880, background: 'var(--surface-primary)', overflow: 'hidden', fontFamily: 'var(--font-text)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  scroll: { flex: 1, overflow: 'auto', padding: '32px 40px 60px' },
  hero: { marginBottom: 36 },
  greet: { fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1 },
  greetSub: { color: 'var(--text-secondary)', fontSize: 14.5, marginTop: 8, maxWidth: 580, lineHeight: 1.55 },

  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 },
  kpi: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '18px 20px' },
  kpiLabel: { fontSize: 11.5, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 },
  kpiVal: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 8 },
  kpiUnit: { fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 500, marginLeft: 4 },
  kpiHint: { fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 },

  twoCol: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 28 },
  section: { marginBottom: 36 },
  sectionLabel: { fontSize: 11, fontWeight: 600, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  more: { fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500 },

  /* Production chart */
  chart: { marginTop: 18, padding: '24px 22px', background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14 },
  chartTop: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 },
  chartVal: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em' },
  chartTrend: { color: 'var(--sage-deep)', fontSize: 12.5, fontWeight: 600, background: 'var(--sage-soft)', padding: '3px 8px', borderRadius: 99 },
  bars: { display: 'flex', alignItems: 'flex-end', gap: 18, height: 140, paddingTop: 8 },
  barWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  bar: { width: '100%', maxWidth: 38, background: 'linear-gradient(to top, var(--honey), var(--honey-light))', borderRadius: 4, position: 'relative' },
  barLabel: { fontSize: 11.5, color: 'var(--text-tertiary)' },

  /* Alerts list */
  alertCard: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, marginTop: 18, overflow: 'hidden' },
  alertRow: { display: 'flex', gap: 12, padding: '14px 18px', borderTop: '1px solid var(--border-default)', alignItems: 'flex-start' },
  alertDot: (sev) => ({ width: 8, height: 8, borderRadius: 99, marginTop: 6, background: sev === 'bad' ? 'var(--status-bad)' : sev === 'warn' ? 'var(--status-warn)' : 'var(--status-info)', flexShrink: 0 }),
  alertTitle: { fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)' },
  alertDesc: { fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 2 },
  alertAge: { fontSize: 11.5, color: 'var(--text-quaternary)', flexShrink: 0 },

  /* Today/agenda */
  agenda: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, marginTop: 18, padding: '6px 0' },
  agendaRow: { display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 14, padding: '13px 20px', alignItems: 'center', borderTop: '1px solid var(--border-default)' },
  hour: { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)' },
  intervTitle: { fontSize: 13.5, fontWeight: 500 },
  intervMeta: { fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 },
  pill: (color) => ({ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, color: color === 'sage' ? 'var(--sage-deep)' : 'var(--honey-deep)', background: color === 'sage' ? 'var(--sage-soft)' : 'var(--honey-soft)' }),

  /* Ruchers strip */
  rucherGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 18 },
  rucherCard: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 12, padding: 16 },
  rucherName: { fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-display)' },
  rucherCommune: { fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 },
  rucherStats: { display: 'flex', gap: 14, marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' },
  rucherStat: { display: 'flex', flexDirection: 'column' },
  statN: { fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' },
  statL: { fontSize: 10.5, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 },
  health: (s) => ({ marginTop: 10, fontSize: 11.5, fontWeight: 600, color: s === 'good' ? 'var(--sage-deep)' : s === 'warn' ? 'var(--status-warn)' : 'var(--status-bad)', display: 'flex', alignItems: 'center', gap: 5 }),
};
const Dashboard2 = () => {
  const D = window.APIGO_DATA;
  const maxKg = Math.max(...D.PROD_2025.map(p => p.kg));
  const today = D.INTERVENTIONS.filter(i => i.date === '2 mai');
  return (
    <div style={dStyles.page}>
      <window.Sidebar2 active="dashboard" />
      <div style={dStyles.main}>
        <window.Topbar2 crumb={['Tableau de bord']} action="Nouvelle intervention" />
        <div style={dStyles.scroll}>
          <div style={dStyles.hero}>
            <h1 style={dStyles.greet}>Bonjour Marc.</h1>
            <p style={dStyles.greetSub}>248 ruches surveillées sur 7 ruchers. <b style={{color:'var(--text-primary)'}}>4 alertes</b> à traiter et <b style={{color:'var(--text-primary)'}}>2 visites de printemps</b> prévues aujourd'hui sur le Mont Ventoux.</p>
          </div>

          <div style={dStyles.kpiRow}>
            <div style={dStyles.kpi}>
              <div style={dStyles.kpiLabel}>Production 2025</div>
              <div style={dStyles.kpiVal}>{D.STATS.prodAnnee.toLocaleString('fr-FR')}<span style={dStyles.kpiUnit}>kg</span></div>
              <div style={dStyles.kpiHint}><span style={{color:'var(--sage-deep)', fontWeight:600}}>+12 %</span> · objectif {D.STATS.prodObjectif} kg</div>
            </div>
            <div style={dStyles.kpi}>
              <div style={dStyles.kpiLabel}>Chiffre d'affaires</div>
              <div style={dStyles.kpiVal}>{(D.STATS.ca/1000).toFixed(1)}<span style={dStyles.kpiUnit}>k €</span></div>
              <div style={dStyles.kpiHint}><span style={{color:'var(--sage-deep)', fontWeight:600}}>+{D.STATS.caEvol} %</span> · vs 2024</div>
            </div>
            <div style={dStyles.kpi}>
              <div style={dStyles.kpiLabel}>Interventions</div>
              <div style={dStyles.kpiVal}>{D.STATS.intervSemaine}<span style={dStyles.kpiUnit}>cette semaine</span></div>
              <div style={dStyles.kpiHint}>4 planifiées aujourd'hui</div>
            </div>
            <div style={dStyles.kpi}>
              <div style={dStyles.kpiLabel}>Alertes ouvertes</div>
              <div style={{...dStyles.kpiVal, color: 'var(--status-warn)'}}>{D.STATS.alertes}</div>
              <div style={dStyles.kpiHint}>1 critique · 2 importantes</div>
            </div>
          </div>

          <div style={dStyles.twoCol}>
            <div>
              <div style={dStyles.section}>
                <div style={dStyles.sectionLabel}>01 — Production</div>
                <div style={dStyles.sectionTitle}>Récolte 2025 par mois<span style={dStyles.more}>Voir détail →</span></div>
                <div style={dStyles.chart}>
                  <div style={dStyles.chartTop}>
                    <div>
                      <div style={{fontSize:12, color:'var(--text-tertiary)'}}>Total saison</div>
                      <div style={dStyles.chartVal}>6 740 <span style={dStyles.kpiUnit}>kg</span></div>
                    </div>
                    <span style={dStyles.chartTrend}>↑ 12 % vs 2024</span>
                  </div>
                  <div style={dStyles.bars}>
                    {D.PROD_2025.map(p => (
                      <div key={p.m} style={dStyles.barWrap}>
                        <div style={{...dStyles.bar, height: `${(p.kg/maxKg)*120}px`}} />
                        <div style={dStyles.barLabel}>{p.m}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={dStyles.section}>
                <div style={dStyles.sectionLabel}>02 — Ruchers</div>
                <div style={dStyles.sectionTitle}>Vos 7 ruchers<span style={dStyles.more}>Tout voir →</span></div>
                <div style={dStyles.rucherGrid}>
                  {D.RUCHERS.slice(0,4).map(r => (
                    <div key={r.id} style={dStyles.rucherCard}>
                      <div style={dStyles.rucherName}>{r.name}</div>
                      <div style={dStyles.rucherCommune}>{r.commune} · {r.altitude} m</div>
                      <div style={dStyles.rucherStats}>
                        <div style={dStyles.rucherStat}><span style={dStyles.statN}>{r.ruches}</span><span style={dStyles.statL}>Ruches</span></div>
                        <div style={dStyles.rucherStat}><span style={dStyles.statN}>{r.prod2025}</span><span style={dStyles.statL}>kg 2025</span></div>
                      </div>
                      <div style={dStyles.health(r.sante)}>
                        <span style={{width:6,height:6,borderRadius:99,background:'currentColor'}} />
                        {r.sante === 'good' ? 'En forme' : r.sante === 'warn' ? 'À surveiller' : 'Préoccupant'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div style={dStyles.section}>
                <div style={dStyles.sectionLabel}>Aujourd'hui</div>
                <div style={dStyles.sectionTitle}>Agenda du 2 mai</div>
                <div style={dStyles.agenda}>
                  {today.map((i, idx) => (
                    <div key={i.id} style={{...dStyles.agendaRow, borderTop: idx === 0 ? 'none' : '1px solid var(--border-default)'}}>
                      <span style={dStyles.hour}>{i.heure}</span>
                      <div>
                        <div style={dStyles.intervTitle}>{i.type}</div>
                        <div style={dStyles.intervMeta}>{i.rucher} · ruche {i.ruche}</div>
                      </div>
                      <span style={dStyles.pill('honey')}>Planifiée</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={dStyles.section}>
                <div style={dStyles.sectionLabel}>Alertes</div>
                <div style={dStyles.sectionTitle}>À traiter<span style={dStyles.more}>Tout voir →</span></div>
                <div style={dStyles.alertCard}>
                  {D.ALERTES.map((a, i) => (
                    <div key={i} style={{...dStyles.alertRow, borderTop: i === 0 ? 'none' : '1px solid var(--border-default)'}}>
                      <span style={dStyles.alertDot(a.sev)} />
                      <div style={{flex: 1}}>
                        <div style={dStyles.alertTitle}>{a.t}</div>
                        <div style={dStyles.alertDesc}>{a.d}</div>
                      </div>
                      <span style={dStyles.alertAge}>il y a {a.age}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.Dashboard2 = Dashboard2;
