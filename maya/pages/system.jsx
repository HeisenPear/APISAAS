/* PAGE — APIGO · Système : boutons & graphiques produit
   Deux planches de référence pour le handoff : la grammaire des boutons,
   et la bibliothèque de data-viz (jauges, courbes, barres, thème ECharts). */

const sysS = {
  page: { width: 1280, height: 880, background: '#faf7f0', fontFamily: 'var(--font-text)', overflow: 'auto', padding: '46px 56px' },
  kicker: { fontSize: 11.5, fontWeight: 700, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.16em' },
  h1: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 9, color: 'var(--text-primary)' },
  sub: { fontSize: 14, color: 'var(--text-secondary)', marginTop: 7, maxWidth: 680, lineHeight: 1.55 },
  sec: { fontSize: 11, fontWeight: 700, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' },
  card: { background: '#fff', border: '1px solid var(--border-default)', borderRadius: 18, padding: 24 },
  rowLbl: { width: 92, fontSize: 11.5, color: 'var(--text-tertiary)', fontWeight: 600, flexShrink: 0 },
  code: { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' },
};

/* boutons réutilisables */
const Btn = ({ kind = 'primary', size = 'lg', icon, children, disabled, loading }) => {
  const h = size === 'lg' ? 46 : size === 'md' ? 38 : 32;
  const fs = size === 'lg' ? 14 : size === 'md' ? 13.5 : 12.5;
  const base = { height: h, padding: `0 ${size === 'sm' ? 14 : 18}px`, borderRadius: size === 'sm' ? 8 : 11, fontSize: fs, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, transition: 'all .15s', border: '1.5px solid transparent' };
  const kinds = {
    primary: { background: '#1c1c1e', color: '#fff' },
    ghost: { background: 'var(--surface-card)', color: 'var(--text-secondary)', border: '1.5px solid var(--border-strong)' },
    honey: { background: 'var(--honey-soft)', color: 'var(--honey-deep)' },
    sage: { background: 'var(--sage-deep)', color: '#fff' },
    danger: { background: 'var(--surface-card)', color: 'var(--status-bad)', border: '1.5px solid #e6c2c2' },
  };
  return (
    <button style={{ ...base, ...kinds[kind] }}>
      {loading && <span style={{ width: 13, height: 13, borderRadius: 99, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', display: 'inline-block', animation: 'maya-spin 0.7s linear infinite' }} />}
      {icon && !loading && React.createElement(window.I[icon], { size: size === 'sm' ? 14 : 16, stroke: 2.1 })}
      {children}
    </button>
  );
};

const ButtonsBoard = () => (
  <div style={sysS.page}>
    <div style={sysS.kicker}>APIGO · Système</div>
    <div style={sysS.h1}>Boutons & contrôles</div>
    <div style={sysS.sub}>Trois variantes principales + deux sémantiques. Hauteur 46px sur le terrain, 38/32 en inline. Icône à gauche, gap 7–8px, poids 600. Hover : léger lift + ombre.</div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24, marginTop: 30 }}>
      <div style={sysS.card}>
        <div style={sysS.sec}>Variantes</div>
        {[['primary', 'Primary · ink', 'calendar', 'Planifier la tournée'], ['ghost', 'Ghost · secondaire', null, 'Modifier'], ['honey', 'Honey-link · action Maya', 'arrowUpRight', 'Ouvrir le briefing'], ['sage', 'Sage · validation (sémantique)', 'check', 'Confirmer l\u2019écriture'], ['danger', 'Danger · discret', 'trash', 'Supprimer']].map(([k, lbl, ic, txt], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '11px 0', borderTop: i ? '1px solid var(--border-faint)' : 'none' }}>
            <span style={sysS.rowLbl}>{lbl}</span>
            <Btn kind={k} icon={ic}>{txt}</Btn>
            <span style={{ ...sysS.code, marginLeft: 'auto' }}>kind="{k}"</span>
          </div>
        ))}
      </div>

      <div style={sysS.card}>
        <div style={sysS.sec}>Tailles</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
          <Btn kind="primary" size="lg" icon="plus">Large · 46</Btn>
          <Btn kind="primary" size="md" icon="plus">Medium · 38</Btn>
          <Btn kind="primary" size="sm" icon="plus">Small · 32</Btn>
        </div>
        <div style={sysS.sec}>États</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
          <Btn kind="primary">Défaut</Btn>
          <Btn kind="primary" loading>Enregistrement…</Btn>
          <Btn kind="primary" disabled>Désactivé</Btn>
        </div>
        <div style={sysS.sec}>Icône seule & FAB Maya</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--surface-card)', border: '1.5px solid var(--border-strong)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>{React.createElement(window.I.mic, { size: 18 })}</button>
          <button style={{ width: 44, height: 44, borderRadius: 11, background: '#1c1c1e', border: 'none', display: 'grid', placeItems: 'center', color: '#fff' }}>{React.createElement(window.I.arrowUp, { size: 18, stroke: 2.4 })}</button>
          <div style={{ width: 1, height: 36, background: 'var(--border-default)' }} />
          <button style={{ width: 56, height: 56, borderRadius: 18, background: '#1c1c1e', border: 'none', display: 'grid', placeItems: 'center', boxShadow: '0 10px 24px rgba(28,28,30,0.28)' }}>
            <window.MayaMark size={30} glow state="idle" />
          </button>
          <span style={sysS.code}>Launcher Maya</span>
        </div>
      </div>
    </div>

    <div style={{ ...sysS.card, marginTop: 24, background: '#1c1c1e', border: 'none' }}>
      <div style={{ ...sysS.sec, color: '#f0b454' }}>Sur fond sombre (capture vocale, moments)</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button style={{ height: 46, padding: '0 20px', borderRadius: 13, background: '#fff', color: '#1c1c1e', border: 'none', fontSize: 14, fontWeight: 600 }}>Action claire</button>
        <button style={{ height: 46, padding: '0 20px', borderRadius: 13, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 14, fontWeight: 600 }}>Secondaire</button>
        <button style={{ height: 46, padding: '0 20px', borderRadius: 13, background: 'rgba(245,166,35,0.18)', color: '#f0b454', border: '1px solid rgba(245,166,35,0.3)', fontSize: 14, fontWeight: 600 }}>Accent honey</button>
      </div>
    </div>
  </div>
);
window.ButtonsBoard = ButtonsBoard;

/* ── Graphiques produit ── */
const chartPalette = [['#f5a623', 'Honey · série 1'], ['#7a9676', 'Sage · série 2'], ['#b87959', 'Clay · série 3'], ['#5e7ba8', 'Info · série 4'], ['#c87f2a', 'Warn · série 5']];

const GraphicsBoard = () => (
  <div style={sysS.page}>
    <div style={sysS.kicker}>APIGO · Système</div>
    <div style={sysS.h1}>Graphiques produit</div>
    <div style={sysS.sub}>Deux niveaux : <b>micro</b> en SVG (jauge, courbe — légers, en carte) ; <b>macro</b> via ECharts (séries, comparaisons) sur le thème Warm Precision. Toujours tabular-nums, peu de grille, des coins arrondis.</div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 28 }}>
      {/* jauges */}
      <div style={sysS.card}>
        <div style={sysS.sec}>Jauge anneau · RingGauge</div>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <window.RingGauge value={92} size={92} stroke={10}><div><div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600 }}>92<span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>%</span></div><div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>butinage</div></div></window.RingGauge>
          <window.RingGauge value={84} size={76} stroke={8} color="var(--sage)"><div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--sage-deep)' }}>84%</div></window.RingGauge>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 14, lineHeight: 1.5 }}>Butinage, % d'objectif, force de colonie.</div>
      </div>
      {/* sparkline */}
      <div style={sysS.card}>
        <div style={sysS.sec}>Micro-courbe · Sparkline</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Récolte 2025</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, marginTop: 4 }}>6 740 <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>kg</span></div>
            <div style={{ fontSize: 12, color: 'var(--sage-deep)', fontWeight: 600, marginTop: 2 }}>↑ 12 %</div>
          </div>
          <window.Sparkline data={[420, 1180, 1840, 2150, 1320, 380]} width={110} height={56} />
        </div>
      </div>
      {/* KPI tile */}
      <div style={sysS.card}>
        <div style={sysS.sec}>Tuile KPI</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>{React.createElement(window.I.card, { size: 15, style: { color: 'var(--text-tertiary)' } })}<span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>Chiffre d'affaires</span></div>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--sage-deep)', background: 'var(--sage-soft)', padding: '2px 7px', borderRadius: 99 }}>+12 %</span>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 12, fontVariantNumeric: 'tabular-nums' }}>38,4 <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>k€</span></div>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginTop: 20 }}>
      {/* barres comparées */}
      <div style={sysS.card}>
        <div style={sysS.sec}>Barres comparées · ECharts (prévision hachurée)</div>
        <div style={{ display: 'flex', gap: 18, marginBottom: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
          <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 3, background: 'var(--surface-sunk)', marginRight: 6 }} />2024</span>
          <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 3, background: '#f5a623', marginRight: 6 }} />2025</span>
          <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 3, background: 'repeating-linear-gradient(45deg,#f0c982,#f0c982 3px,#fff7e8 3px,#fff7e8 6px)', marginRight: 6, border: '1px dashed var(--honey-dark)' }} />Prévision</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 150, borderBottom: '1px solid var(--border-default)' }}>
          {[['Avr', 320, 420], ['Mai', 980, 1180], ['Juin', 1620, 1840], ['Juil', 1980, 2150], ['Août', 1240, 1320, true], ['Sept', 360, 470, true]].map(([m, a, b, fc], i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 130, width: '100%', justifyContent: 'center' }}>
                <div style={{ width: 15, height: `${(a / 2300) * 130}px`, background: 'var(--surface-sunk)', borderRadius: '3px 3px 0 0' }} />
                <div style={{ width: 15, height: `${(b / 2300) * 130}px`, borderRadius: '3px 3px 0 0', background: fc ? 'repeating-linear-gradient(45deg,#f0c982,#f0c982 3px,#fff7e8 3px,#fff7e8 6px)' : 'linear-gradient(to top,#f5a623,#fbc56a)', border: fc ? '1px dashed var(--honey-dark)' : 'none' }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{m}</span>
            </div>
          ))}
        </div>
      </div>
      {/* palette charts */}
      <div style={sysS.card}>
        <div style={sysS.sec}>Palette de séries (echarts-theme.ts)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {chartPalette.map(([c, lbl], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ width: 26, height: 14, borderRadius: 4, background: c, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text-secondary)' }}>{lbl.split(' · ')[1]}</span>
              <span style={sysS.code}>{c}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 14, lineHeight: 1.5, paddingTop: 14, borderTop: '1px solid var(--border-faint)' }}>Grille minimale, axes en <code style={sysS.code}>--text-tertiary</code>, barres à coins arrondis, prévision en hachuré.</div>
      </div>
    </div>
  </div>
);
window.GraphicsBoard = GraphicsBoard;
