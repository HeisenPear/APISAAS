/* PAGE — Finances (factures + CA + dépenses) */
const fiStyles = {
  page: { display: 'flex', width: 1280, height: 880, background: 'var(--surface-primary)', overflow: 'hidden', fontFamily: 'var(--font-text)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  scroll: { flex: 1, overflow: 'auto', padding: '28px 40px 60px' },
  header: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 },
  h1: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' },
  hSub: { fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 6 },
  periodBtn: { display: 'flex', gap: 0, border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden', background: 'var(--surface-card)' },
  pBtn: (a) => ({ padding: '8px 14px', fontSize: 12.5, fontWeight: 600, background: a ? '#1c1c1e' : 'transparent', color: a ? '#fff' : 'var(--text-secondary)', border: 'none' }),

  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 },
  kpi: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '18px 20px' },
  kpiL: { fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 },
  kpiV: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 8 },
  kpiU: { fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500, marginLeft: 4 },
  kpiTrend: { fontSize: 12, marginTop: 6, fontWeight: 600 },

  /* CA chart */
  twoColTop: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 },
  panel: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14 },
  pHead: { padding: '18px 22px 0' },
  pTitle: { fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em' },
  pSub: { fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 },

  caChart: { padding: '22px', height: 240, position: 'relative' },
  axisY: { position: 'absolute', left: 22, top: 22, bottom: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-tertiary)' },
  chartArea: { position: 'absolute', left: 60, right: 22, top: 22, bottom: 40 },
  axisX: { position: 'absolute', left: 60, right: 22, bottom: 16, display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-tertiary)' },

  /* Donut */
  donutWrap: { padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  donut: { position: 'relative', width: 160, height: 160, marginTop: 14 },
  donutCenter: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' },
  donutVal: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600 },
  donutLab: { fontSize: 11, color: 'var(--text-tertiary)' },
  donutLeg: { width: '100%', marginTop: 18 },
  legRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', fontSize: 12.5, borderTop: '1px solid var(--border-faint)' },
  legL: { display: 'flex', alignItems: 'center', gap: 8 },
  legD: (c) => ({ width: 9, height: 9, borderRadius: 99, background: c }),

  /* Factures */
  facHead: { padding: '18px 22px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  facFilters: { display: 'flex', gap: 6 },
  facF: (a) => ({ padding: '5px 10px', fontSize: 12, fontWeight: 600, borderRadius: 6, color: a ? 'var(--text-primary)' : 'var(--text-tertiary)', background: a ? 'var(--surface-muted)' : 'transparent', border: 'none' }),

  facTh: { display: 'grid', gridTemplateColumns: '110px 90px 1.4fr 1fr 90px 100px 36px', padding: '10px 22px', fontSize: 10.5, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--surface-muted)' },
  facRow: { display: 'grid', gridTemplateColumns: '110px 90px 1.4fr 1fr 90px 100px 36px', padding: '13px 22px', fontSize: 13, alignItems: 'center', borderTop: '1px solid var(--border-faint)' },
  facNum: { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' },
  facDate: { fontSize: 12, color: 'var(--text-tertiary)' },
  facClient: { fontWeight: 500 },
  facLib: { fontSize: 12.5, color: 'var(--text-secondary)' },
  facMt: { textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 600 },
  facStatus: (s) => ({ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, color: s === 'paid' ? 'var(--sage-deep)' : s === 'late' ? 'var(--status-bad)' : 'var(--honey-deep)', background: s === 'paid' ? 'var(--sage-soft)' : s === 'late' ? '#f8e8e8' : 'var(--honey-soft)', display: 'inline-block' }),
};

const FACTURES = [
  { num: 'F-2025-042', d: '28 avr.', client: 'Épicerie La Récolte', lib: 'Miel lavande 250 g × 60', mt: 720, s: 'pending' },
  { num: 'F-2025-041', d: '24 avr.', client: 'Restaurant Les Florets', lib: 'Miel toutes fleurs 500 g × 24', mt: 384, s: 'paid' },
  { num: 'F-2025-040', d: '20 avr.', client: 'Marché de Bédoin (mars)', lib: 'Vente directe consolidée', mt: 1240, s: 'paid' },
  { num: 'F-2025-039', d: '15 avr.', client: 'Boulangerie Augier', lib: 'Miel romarin 1 kg × 12', mt: 216, s: 'late' },
  { num: 'F-2025-038', d: '08 avr.', client: 'Coopérative Provence', lib: 'Vrac romarin 80 kg', mt: 880, s: 'paid' },
  { num: 'F-2025-037', d: '02 avr.', client: 'Hôtel Crillon-le-Brave', lib: 'Pots 250 g personnalisés × 80', mt: 920, s: 'paid' },
];

const Donut = () => {
  const segs = [
    { c: '#a584b5', v: 38, l: 'Lavande' },
    { c: 'var(--sage)', v: 24, l: 'Romarin' },
    { c: 'var(--honey)', v: 18, l: 'Multifloral' },
    { c: 'var(--clay)', v: 12, l: 'Châtaignier' },
    { c: 'var(--text-quaternary)', v: 8, l: 'Autre' },
  ];
  const r = 60, c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div style={fiStyles.donutWrap}>
      <div style={{textAlign:'center'}}>
        <div style={fiStyles.kpiL}>Répartition CA 2025</div>
      </div>
      <div style={fiStyles.donut}>
        <svg viewBox="0 0 160 160" width="160" height="160" style={{transform: 'rotate(-90deg)'}}>
          {segs.map((s, i) => {
            const len = (s.v / 100) * c;
            const dash = `${len} ${c - len}`;
            const el = <circle key={i} cx="80" cy="80" r={r} fill="none" stroke={s.c} strokeWidth="22" strokeDasharray={dash} strokeDashoffset={-off} />;
            off += len;
            return el;
          })}
        </svg>
        <div style={fiStyles.donutCenter}>
          <div>
            <div style={fiStyles.donutVal}>38,4 k€</div>
            <div style={fiStyles.donutLab}>Total YTD</div>
          </div>
        </div>
      </div>
      <div style={fiStyles.donutLeg}>
        {segs.map(s => (
          <div key={s.l} style={fiStyles.legRow}>
            <span style={fiStyles.legL}><span style={fiStyles.legD(s.c)} />{s.l}</span>
            <span style={{fontWeight: 600}}>{s.v} %</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Finances2 = () => {
  /* Polyline points for CA chart, 12 mois */
  const ca = [1.8, 2.1, 2.6, 3.4, 4.1, 5.2, 5.8, 4.6, 3.1, 2.4, 2.0, 1.7]; // k€
  const max = 6.5;
  const w = 580, h = 180;
  const pts = ca.map((v, i) => `${(i/(ca.length-1)) * w},${h - (v/max) * h}`).join(' ');
  const ptsArea = `0,${h} ${pts} ${w},${h}`;
  return (
    <div style={fiStyles.page}>
      <window.Sidebar2 active="finances" />
      <div style={fiStyles.main}>
        <window.Topbar2 crumb={['Affaires', 'Finances']} action="Nouvelle facture" />
        <div style={fiStyles.scroll}>
          <div style={fiStyles.header}>
            <div>
              <h1 style={fiStyles.h1}>Finances</h1>
              <p style={fiStyles.hSub}>Chiffre d'affaires, factures et dépenses · année 2025</p>
            </div>
            <div style={fiStyles.periodBtn}>
              <button style={fiStyles.pBtn(false)}>Mois</button>
              <button style={fiStyles.pBtn(false)}>Trimestre</button>
              <button style={fiStyles.pBtn(true)}>Année</button>
            </div>
          </div>

          <div style={fiStyles.kpiRow}>
            <div style={fiStyles.kpi}>
              <div style={fiStyles.kpiL}>CA 2025 YTD</div>
              <div style={fiStyles.kpiV}>38,4<span style={fiStyles.kpiU}>k€</span></div>
              <div style={{...fiStyles.kpiTrend, color: 'var(--sage-deep)'}}>+12 % vs 2024</div>
            </div>
            <div style={fiStyles.kpi}>
              <div style={fiStyles.kpiL}>En attente</div>
              <div style={{...fiStyles.kpiV, color: 'var(--honey-deep)'}}>3 240<span style={fiStyles.kpiU}>€</span></div>
              <div style={{...fiStyles.kpiTrend, color: 'var(--text-tertiary)'}}>4 factures dues</div>
            </div>
            <div style={fiStyles.kpi}>
              <div style={fiStyles.kpiL}>Retards</div>
              <div style={{...fiStyles.kpiV, color: 'var(--status-bad)'}}>216<span style={fiStyles.kpiU}>€</span></div>
              <div style={{...fiStyles.kpiTrend, color: 'var(--status-bad)'}}>1 facture · 12 j</div>
            </div>
            <div style={fiStyles.kpi}>
              <div style={fiStyles.kpiL}>Dépenses 2025</div>
              <div style={fiStyles.kpiV}>14,7<span style={fiStyles.kpiU}>k€</span></div>
              <div style={{...fiStyles.kpiTrend, color: 'var(--text-tertiary)'}}>Marge nette 62 %</div>
            </div>
          </div>

          <div style={fiStyles.twoColTop}>
            <div style={fiStyles.panel}>
              <div style={fiStyles.pHead}>
                <div style={fiStyles.kpiL}>Évolution mensuelle</div>
                <div style={fiStyles.pTitle}>Chiffre d'affaires 2025</div>
              </div>
              <div style={fiStyles.caChart}>
                <div style={fiStyles.axisY}>
                  <span>6 k€</span><span>4 k€</span><span>2 k€</span><span>0</span>
                </div>
                <div style={fiStyles.chartArea}>
                  <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(245,166,35,0.30)" />
                        <stop offset="100%" stopColor="rgba(245,166,35,0)" />
                      </linearGradient>
                    </defs>
                    <polygon points={ptsArea} fill="url(#caGrad)" />
                    <polyline points={pts} fill="none" stroke="var(--honey)" strokeWidth="2.5" strokeLinejoin="round" />
                    {ca.map((v, i) => (
                      <circle key={i} cx={(i/(ca.length-1)) * w} cy={h - (v/max) * h} r="3" fill="var(--honey)" />
                    ))}
                  </svg>
                </div>
                <div style={fiStyles.axisX}>
                  {['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'].map(m => <span key={m}>{m}</span>)}
                </div>
              </div>
            </div>
            <div style={fiStyles.panel}><Donut /></div>
          </div>

          <div style={fiStyles.panel}>
            <div style={fiStyles.facHead}>
              <div>
                <div style={fiStyles.pTitle}>Factures</div>
                <div style={fiStyles.pSub}>6 dernières · 38 sur l'année</div>
              </div>
              <div style={fiStyles.facFilters}>
                <button style={fiStyles.facF(true)}>Toutes</button>
                <button style={fiStyles.facF(false)}>Payées</button>
                <button style={fiStyles.facF(false)}>En attente</button>
                <button style={fiStyles.facF(false)}>En retard</button>
              </div>
            </div>
            <div style={fiStyles.facTh}>
              <span>N°</span><span>Date</span><span>Client</span><span>Libellé</span>
              <span style={{textAlign:'right'}}>Montant</span><span>Statut</span><span></span>
            </div>
            {FACTURES.map(f => (
              <div key={f.num} style={fiStyles.facRow}>
                <span style={fiStyles.facNum}>{f.num}</span>
                <span style={fiStyles.facDate}>{f.d}</span>
                <span style={fiStyles.facClient}>{f.client}</span>
                <span style={fiStyles.facLib}>{f.lib}</span>
                <span style={fiStyles.facMt}>{f.mt.toLocaleString('fr-FR')} €</span>
                <span><span style={fiStyles.facStatus(f.s)}>{f.s === 'paid' ? 'Payée' : f.s === 'late' ? 'En retard' : 'En attente'}</span></span>
                <span style={{color: 'var(--text-tertiary)', textAlign: 'right'}}>{React.createElement(window.I.more, {size: 14})}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
window.Finances2 = Finances2;
