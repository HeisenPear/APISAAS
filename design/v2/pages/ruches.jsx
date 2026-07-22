/* PAGE — Ruches (data table dense) */
const ruStyles = {
  page: { display: 'flex', width: 1280, height: 880, background: 'var(--surface-primary)', overflow: 'hidden', fontFamily: 'var(--font-text)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  scroll: { flex: 1, overflow: 'auto', padding: '28px 40px 60px' },
  header: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 },
  h1: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' },
  hSub: { fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 6 },
  stats: { display: 'flex', gap: 28 },
  stat: { textAlign: 'right' },
  statN: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' },
  statL: { fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 },

  toolbar: { display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' },
  search: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', border: '1px solid var(--border-default)', background: 'var(--surface-card)', borderRadius: 8, fontSize: 13, color: 'var(--text-tertiary)', width: 280 },
  filter: { padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--surface-card)', fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 },
  spacer: { marginLeft: 'auto' },

  table: { width: '100%', background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden' },
  thead: { background: 'var(--surface-muted)', display: 'grid', gridTemplateColumns: '40px 110px 1.4fr 1fr 0.9fr 0.9fr 0.9fr 1fr 36px', padding: '11px 18px', fontSize: 10.5, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border-default)' },
  row: { display: 'grid', gridTemplateColumns: '40px 110px 1.4fr 1fr 0.9fr 0.9fr 0.9fr 1fr 36px', padding: '14px 18px', fontSize: 13, alignItems: 'center', borderTop: '1px solid var(--border-faint)' },
  rowFirst: { display: 'grid', gridTemplateColumns: '40px 110px 1.4fr 1fr 0.9fr 0.9fr 0.9fr 1fr 36px', padding: '14px 18px', fontSize: 13, alignItems: 'center' },
  cb: { width: 14, height: 14, borderRadius: 4, border: '1.5px solid var(--border-strong)' },
  rId: { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' },
  rName: { fontWeight: 500 },
  rNameSub: { fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 },
  rNum: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 },
  rNumSub: { fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 },
  rDot: (s) => ({ display:'inline-flex', alignItems:'center', gap:6, fontSize: 12, fontWeight: 500, color: s==='good'?'var(--sage-deep)': s==='warn'?'var(--status-warn)':'var(--status-bad)' }),
  rDotMark: (s) => ({ width: 7, height: 7, borderRadius: 99, background: s==='good'?'var(--sage)': s==='warn'?'var(--status-warn)':'var(--status-bad)' }),
  spark: { width: 60, height: 22 },
  more: { width: 28, height: 28, borderRadius: 6, display: 'grid', placeItems: 'center', color: 'var(--text-tertiary)' },
  pagin: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderTop: '1px solid var(--border-default)', fontSize: 12.5, color: 'var(--text-tertiary)' },
  pgBtns: { display: 'flex', gap: 4 },
  pgBtn: (active) => ({ width: 28, height: 28, borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', background: active ? '#1c1c1e' : 'transparent', color: active ? '#fff' : 'var(--text-secondary)' }),
};

/* Generate 18 ruches mock */
const RUCHES_MOCK = Array.from({length: 14}).map((_, i) => {
  const ruchers = ['Mont Ventoux Sud', 'Plaine Ouvèze', 'Garrigue Sault', 'Forêt Comtat', 'Coteaux Apt'];
  const types = ['Dadant 10c', 'Langstroth', 'Dadant 12c', 'Warré'];
  const reines = ['F1 Buckfast', 'Carnica', 'Locale', 'F2 Buckfast'];
  const sante = i === 2 || i === 8 ? 'warn' : i === 11 ? 'bad' : 'good';
  return {
    id: `V-${String(i+1).padStart(3,'0')}`,
    rucher: ruchers[i % 5],
    type: types[i % 4],
    reine: reines[i % 4],
    annee: 2022 + (i % 4),
    poids: 24 + (i*1.7 % 14),
    cadres: 6 + (i % 5),
    sante,
    derVisite: ['28 avr.', '25 avr.', '21 avr.', '30 avr.', '15 avr.'][i % 5],
  };
});

const Spark = ({ color = 'var(--sage)' }) => (
  <svg viewBox="0 0 60 22" style={ruStyles.spark}>
    <polyline fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      points="2,16 10,12 18,14 26,8 34,11 42,5 50,7 58,3" />
  </svg>
);

const Ruches2 = () => {
  return (
    <div style={ruStyles.page}>
      <window.Sidebar2 active="ruches" />
      <div style={ruStyles.main}>
        <window.Topbar2 crumb={['Cheptel', 'Ruches']} action="Nouvelle ruche" />
        <div style={ruStyles.scroll}>
          <div style={ruStyles.header}>
            <div>
              <h1 style={ruStyles.h1}>Ruches</h1>
              <p style={ruStyles.hSub}>248 ruches actives sur 7 ruchers · suivi individuel</p>
            </div>
            <div style={ruStyles.stats}>
              <div style={ruStyles.stat}><div style={ruStyles.statN}>231</div><div style={ruStyles.statL}>En forme</div></div>
              <div style={ruStyles.stat}><div style={{...ruStyles.statN, color:'var(--status-warn)'}}>14</div><div style={ruStyles.statL}>À surveiller</div></div>
              <div style={ruStyles.stat}><div style={{...ruStyles.statN, color:'var(--status-bad)'}}>3</div><div style={ruStyles.statL}>Préoccupantes</div></div>
            </div>
          </div>

          <div style={ruStyles.toolbar}>
            <div style={ruStyles.search}>
              {React.createElement(window.I.search, {size: 14})}
              <span>Rechercher par n° ou rucher…</span>
            </div>
            <button style={ruStyles.filter}>Rucher : Tous {React.createElement(window.I.chevronDown, {size: 12})}</button>
            <button style={ruStyles.filter}>Type {React.createElement(window.I.chevronDown, {size: 12})}</button>
            <button style={ruStyles.filter}>Année {React.createElement(window.I.chevronDown, {size: 12})}</button>
            <button style={ruStyles.filter}>Santé {React.createElement(window.I.chevronDown, {size: 12})}</button>
            <div style={ruStyles.spacer} />
            <button style={ruStyles.filter}>{React.createElement(window.I.download, {size: 13})} Exporter</button>
          </div>

          <div style={ruStyles.table}>
            <div style={ruStyles.thead}>
              <span></span>
              <span>Identifiant</span>
              <span>Rucher</span>
              <span>Type / Reine</span>
              <span>Poids</span>
              <span>Cadres</span>
              <span>Santé</span>
              <span>Tendance · 30 j</span>
              <span></span>
            </div>
            {RUCHES_MOCK.map((r, idx) => (
              <div key={r.id} style={idx === 0 ? ruStyles.rowFirst : ruStyles.row}>
                <span style={ruStyles.cb}></span>
                <span style={ruStyles.rId}>{r.id}</span>
                <div>
                  <div style={ruStyles.rName}>{r.rucher}</div>
                  <div style={ruStyles.rNameSub}>Visite : {r.derVisite}</div>
                </div>
                <div>
                  <div style={ruStyles.rName}>{r.type}</div>
                  <div style={ruStyles.rNameSub}>{r.reine} · {r.annee}</div>
                </div>
                <div>
                  <div style={ruStyles.rNum}>{r.poids.toFixed(1)} kg</div>
                  <div style={ruStyles.rNumSub}>+{(r.poids*0.04).toFixed(1)} / 7 j</div>
                </div>
                <div>
                  <div style={ruStyles.rNum}>{r.cadres}</div>
                  <div style={ruStyles.rNumSub}>de couvain</div>
                </div>
                <span style={ruStyles.rDot(r.sante)}>
                  <span style={ruStyles.rDotMark(r.sante)} />
                  {r.sante === 'good' ? 'Saine' : r.sante === 'warn' ? 'À surveiller' : 'Préoccupante'}
                </span>
                <Spark color={r.sante==='bad' ? 'var(--status-bad)' : r.sante==='warn' ? 'var(--status-warn)' : 'var(--sage)'} />
                <span style={ruStyles.more}>{React.createElement(window.I.more, {size: 14})}</span>
              </div>
            ))}
            <div style={ruStyles.pagin}>
              <span>1–14 sur 248 ruches</span>
              <div style={ruStyles.pgBtns}>
                <button style={ruStyles.pgBtn(true)}>1</button>
                <button style={ruStyles.pgBtn(false)}>2</button>
                <button style={ruStyles.pgBtn(false)}>3</button>
                <button style={ruStyles.pgBtn(false)}>…</button>
                <button style={ruStyles.pgBtn(false)}>18</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.Ruches2 = Ruches2;
