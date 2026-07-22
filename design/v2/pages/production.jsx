/* PAGE — Production miel */
const prStyles = {
  page: { display: 'flex', width: 1280, height: 880, background: 'var(--surface-primary)', overflow: 'hidden', fontFamily: 'var(--font-text)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  scroll: { flex: 1, overflow: 'auto', padding: '28px 40px 60px' },
  header: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 },
  h1: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' },
  hSub: { fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 6 },
  yearSwitch: { display: 'flex', gap: 0, border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden', background: 'var(--surface-card)' },
  yBtn: (a) => ({ padding: '8px 14px', fontSize: 12.5, fontWeight: 600, background: a ? '#1c1c1e' : 'transparent', color: a ? '#fff' : 'var(--text-secondary)', border: 'none' }),

  topRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 },
  bigKpi: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '20px 22px' },
  kpiL: { fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 },
  kpiV: { fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 10 },
  kpiU: { fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 500, marginLeft: 6 },
  progress: { marginTop: 12, height: 6, borderRadius: 99, background: 'var(--surface-muted)', overflow: 'hidden' },
  pFill: (v, c) => ({ height: '100%', width: `${v}%`, background: c, borderRadius: 99 }),
  kpiHint: { fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 },

  /* Stack chart */
  chartCard: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 24, marginBottom: 24 },
  chartHead: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 },
  chartTitle: { fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em' },
  legend: { display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-secondary)' },
  legDot: (c) => ({ width: 9, height: 9, borderRadius: 99, background: c, display: 'inline-block', marginRight: 5 }),
  bars: { display: 'flex', alignItems: 'flex-end', gap: 14, height: 200, paddingTop: 8, marginTop: 8 },
  stackCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  stack: { width: '100%', maxWidth: 50, display: 'flex', flexDirection: 'column-reverse', borderRadius: 4, overflow: 'hidden' },
  seg: (h, c) => ({ height: h, background: c }),
  cLabel: { fontSize: 11, color: 'var(--text-tertiary)' },

  /* Récoltes table */
  twoCol: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 },
  panel: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, overflow: 'hidden' },
  pHead: { padding: '18px 22px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pTitle: { fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em' },
  pMore: { fontSize: 12.5, color: 'var(--text-tertiary)' },
  recTh: { display: 'grid', gridTemplateColumns: '90px 1fr 1fr 90px 90px', padding: '11px 22px', fontSize: 10.5, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--surface-muted)' },
  recTr: { display: 'grid', gridTemplateColumns: '90px 1fr 1fr 90px 90px', padding: '14px 22px', fontSize: 13, alignItems: 'center', borderTop: '1px solid var(--border-faint)' },
  recDate: { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' },
  recRucher: { fontWeight: 500 },
  pillFloral: (c) => ({ fontSize: 11, padding: '3px 8px', borderRadius: 99, fontWeight: 500, background: c === 'lavande' ? '#e8e1ec' : c === 'romarin' ? 'var(--sage-soft)' : c === 'tilleul' ? '#fff3dc' : 'var(--clay-soft)', color: c === 'lavande' ? '#6b4f7a' : c === 'romarin' ? 'var(--sage-deep)' : c === 'tilleul' ? 'var(--honey-deep)' : 'var(--clay-deep)' }),
  recKg: { fontFamily: 'var(--font-display)', fontWeight: 600, textAlign: 'right' },
  recCa: { fontFamily: 'var(--font-display)', fontWeight: 600, textAlign: 'right', color: 'var(--text-secondary)' },

  /* By rucher */
  rucherRow: { padding: '14px 22px', borderTop: '1px solid var(--border-faint)' },
  rucherTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  rucherN: { fontSize: 13.5, fontWeight: 600 },
  rucherKg: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 },
  rucherBar: { height: 5, borderRadius: 99, background: 'var(--surface-muted)', overflow: 'hidden' },
  rucherFill: (v) => ({ height: '100%', width: `${v}%`, background: 'linear-gradient(90deg, var(--honey), var(--honey-light))', borderRadius: 99 }),
};

const RECOLTES = [
  { d: '28 avr.', r: 'Mont Ventoux Sud', f: 'romarin', kg: 420, ca: 4620 },
  { d: '26 avr.', r: 'Coteaux d\'Apt', f: 'romarin', kg: 280, ca: 3080 },
  { d: '22 avr.', r: 'Plaine de l\'Ouvèze', f: 'multiflorale', kg: 180, ca: 1620 },
  { d: '12 mar.', r: 'Garrigue de Sault', f: 'romarin', kg: 340, ca: 3740 },
];

const Production2 = () => {
  return (
    <div style={prStyles.page}>
      <window.Sidebar2 active="production" />
      <div style={prStyles.main}>
        <window.Topbar2 crumb={['Cheptel', 'Production']} action="Saisir une récolte" />
        <div style={prStyles.scroll}>
          <div style={prStyles.header}>
            <div>
              <h1 style={prStyles.h1}>Production miel</h1>
              <p style={prStyles.hSub}>Récoltes saisies, mielleries et stocks par variété florale</p>
            </div>
            <div style={prStyles.yearSwitch}>
              <button style={prStyles.yBtn(false)}>2023</button>
              <button style={prStyles.yBtn(false)}>2024</button>
              <button style={prStyles.yBtn(true)}>2025</button>
            </div>
          </div>

          <div style={prStyles.topRow}>
            <div style={prStyles.bigKpi}>
              <div style={prStyles.kpiL}>Récolté 2025</div>
              <div style={prStyles.kpiV}>6 740<span style={prStyles.kpiU}>kg</span></div>
              <div style={prStyles.progress}><div style={prStyles.pFill(84, 'linear-gradient(90deg, var(--honey), var(--honey-light))')} /></div>
              <div style={prStyles.kpiHint}>84 % de l'objectif 8 000 kg · récolte d'été à venir</div>
            </div>
            <div style={prStyles.bigKpi}>
              <div style={prStyles.kpiL}>Rendement moyen</div>
              <div style={prStyles.kpiV}>27,2<span style={prStyles.kpiU}>kg / ruche</span></div>
              <div style={prStyles.progress}><div style={prStyles.pFill(68, 'linear-gradient(90deg, var(--sage), var(--sage-soft))')} /></div>
              <div style={prStyles.kpiHint}>+3,1 kg vs 2024 · top : Sault 37 kg</div>
            </div>
            <div style={prStyles.bigKpi}>
              <div style={prStyles.kpiL}>Stocks miellerie</div>
              <div style={prStyles.kpiV}>2 180<span style={prStyles.kpiU}>kg</span></div>
              <div style={prStyles.progress}><div style={prStyles.pFill(45, 'linear-gradient(90deg, var(--clay), var(--clay-soft))')} /></div>
              <div style={prStyles.kpiHint}>4 fûts · 3 cuves · prêts à conditionner</div>
            </div>
          </div>

          <div style={prStyles.chartCard}>
            <div style={prStyles.chartHead}>
              <div>
                <div style={prStyles.kpiL}>Production par variété — 2025</div>
                <div style={prStyles.chartTitle}>Saison par saison, kg récoltés</div>
              </div>
              <div style={prStyles.legend}>
                <span><span style={prStyles.legDot('#a584b5')} />Lavande</span>
                <span><span style={prStyles.legDot('var(--sage)')} />Romarin / thym</span>
                <span><span style={prStyles.legDot('var(--honey)')} />Tilleul / acacia</span>
                <span><span style={prStyles.legDot('var(--clay)')} />Châtaignier</span>
                <span><span style={prStyles.legDot('var(--text-quaternary)')} />Multiflorale</span>
              </div>
            </div>
            <div style={prStyles.bars}>
              {[
                { m: 'Mar', segs: [{c:'var(--sage)', h: 28}, {c:'var(--text-quaternary)', h: 8}]},
                { m: 'Avr', segs: [{c:'var(--sage)', h: 70}, {c:'var(--text-quaternary)', h: 22}]},
                { m: 'Mai', segs: [{c:'var(--sage)', h: 40}, {c:'var(--honey)', h: 50}, {c:'#a584b5', h: 40}]},
                { m: 'Juin', segs: [{c:'#a584b5', h: 110}, {c:'var(--honey)', h: 30}]},
                { m: 'Juil', segs: [{c:'#a584b5', h: 90}, {c:'var(--clay)', h: 60}]},
                { m: 'Août', segs: [{c:'var(--clay)', h: 80}, {c:'var(--text-quaternary)', h: 30}]},
                { m: 'Sept', segs: [{c:'var(--text-quaternary)', h: 28}]},
              ].map(b => (
                <div key={b.m} style={prStyles.stackCol}>
                  <div style={prStyles.stack}>
                    {b.segs.map((s, i) => <div key={i} style={prStyles.seg(s.h, s.c)} />)}
                  </div>
                  <div style={prStyles.cLabel}>{b.m}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={prStyles.twoCol}>
            <div style={prStyles.panel}>
              <div style={prStyles.pHead}>
                <div style={prStyles.pTitle}>Récoltes récentes</div>
                <span style={prStyles.pMore}>Tout voir →</span>
              </div>
              <div style={prStyles.recTh}>
                <span>Date</span><span>Rucher</span><span>Variété</span>
                <span style={{textAlign:'right'}}>Quantité</span><span style={{textAlign:'right'}}>CA estimé</span>
              </div>
              {RECOLTES.map((r, i) => (
                <div key={i} style={prStyles.recTr}>
                  <span style={prStyles.recDate}>{r.d}</span>
                  <span style={prStyles.recRucher}>{r.r}</span>
                  <span><span style={prStyles.pillFloral(r.f)}>{r.f}</span></span>
                  <span style={prStyles.recKg}>{r.kg} kg</span>
                  <span style={prStyles.recCa}>{r.ca.toLocaleString('fr-FR')} €</span>
                </div>
              ))}
            </div>

            <div style={prStyles.panel}>
              <div style={prStyles.pHead}>
                <div style={prStyles.pTitle}>Production par rucher</div>
                <span style={prStyles.pMore}>2025</span>
              </div>
              {window.APIGO_DATA.RUCHERS.map(r => (
                <div key={r.id} style={prStyles.rucherRow}>
                  <div style={prStyles.rucherTop}>
                    <span style={prStyles.rucherN}>{r.name}</span>
                    <span style={prStyles.rucherKg}>{r.prod2025} kg</span>
                  </div>
                  <div style={prStyles.rucherBar}><div style={prStyles.rucherFill((r.prod2025/1340)*100)} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.Production2 = Production2;
