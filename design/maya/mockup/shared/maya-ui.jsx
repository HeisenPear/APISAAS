/* Maya — shared UI primitives for the APIGO copilot
   Identité : hexagone dégradé honey→sage, halo doux, ton chaleureux. */

(function injectMaya() {
  if (typeof document === 'undefined') return;
  if (!document.getElementById('maya-defs')) {
    const w = document.createElement('div');
    w.id = 'maya-defs';
    w.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    w.innerHTML =
      '<svg width="0" height="0"><defs>' +
      '<radialGradient id="maya-cell-grad" cx="0.36" cy="0.28" r="0.9">' +
      '<stop offset="0" stop-color="#ffd98a"/><stop offset="0.55" stop-color="#f6b552"/><stop offset="1" stop-color="#e89a2c"/>' +
      '</radialGradient>' +
      '<radialGradient id="maya-base-grad" cx="0.4" cy="0.3" r="0.95">' +
      '<stop offset="0" stop-color="#dd9226"/><stop offset="1" stop-color="#c47c1b"/>' +
      '</radialGradient>' +
      '</defs></svg>';
    document.body.appendChild(w);
  }
  if (!document.getElementById('maya-anim')) {
    const s = document.createElement('style');
    s.id = 'maya-anim';
    s.textContent = [
      '@keyframes maya-blink{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-2px)}}',
      '@keyframes maya-halo{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:.85;transform:scale(1.08)}}',
      '@keyframes maya-wave{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}',
      '@keyframes maya-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}',
      '@keyframes maya-rise{0%{transform:translateY(8px)}100%{transform:none}}',
      '@keyframes maya-spin{to{transform:rotate(360deg)}}',
      '@keyframes maya-float{0%,100%{transform:translate(0,0)}50%{transform:translate(7px,-6px)}}',
      '@keyframes maya-pop-in{0%{opacity:0;transform:scale(.9) translateY(10px)}60%{opacity:1;transform:scale(1.02) translateY(-2px)}100%{opacity:1;transform:scale(1) translateY(0)}}',
      '@keyframes maya-chip-in{0%{opacity:0;transform:translateY(9px) scale(.96)}100%{opacity:1;transform:none}}',
      '@keyframes maya-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}',
      '@keyframes maya-glow-pulse{0%,100%{box-shadow:0 0 0 0 rgba(90,138,94,0)}50%{box-shadow:0 0 0 5px rgba(90,138,94,0.18)}}',
      '.maya-chip-in{animation:maya-chip-in .42s cubic-bezier(.2,.8,.3,1.1) both}',
      '@keyframes maya-sprout{0%{opacity:.4;transform:scale(.11)}26%{opacity:1}62%{transform:scale(1.015)}100%{opacity:1;transform:scale(1)}}',
      '@keyframes maya-bloom-in{0%{opacity:0;transform:scale(.2)}55%{opacity:1;transform:scale(1.16)}100%{opacity:1;transform:scale(1)}}',
      '@keyframes maya-content-in{0%{opacity:0}52%{opacity:0}100%{opacity:1}}',
      /* survol/clic du bouton : les alvéoles ondulent (ripple centre → couronne), sans rebond du logo */
      '@keyframes maya-c-tap{0%{transform:scale(1)}42%{transform:scale(1.24)}100%{transform:scale(1)}}',
      '.maya-launch{cursor:pointer}',
      '.maya-launch:hover .maya-cell,.maya-launch:active .maya-cell{animation:maya-c-tap .5s ease both}',
      '.maya-launch:hover .maya-cell:nth-child(2),.maya-launch:active .maya-cell:nth-child(2){animation-delay:0s}',
      '.maya-launch:hover .maya-cell:nth-child(3),.maya-launch:active .maya-cell:nth-child(3){animation-delay:.05s}',
      '.maya-launch:hover .maya-cell:nth-child(4),.maya-launch:active .maya-cell:nth-child(4){animation-delay:.1s}',
      '.maya-launch:hover .maya-cell:nth-child(5),.maya-launch:active .maya-cell:nth-child(5){animation-delay:.15s}',
      '.maya-launch:hover .maya-cell:nth-child(6),.maya-launch:active .maya-cell:nth-child(6){animation-delay:.2s}',
      '.maya-launch:hover .maya-cell:nth-child(7),.maya-launch:active .maya-cell:nth-child(7){animation-delay:.25s}',
      '.maya-launch:hover .maya-cell:nth-child(8),.maya-launch:active .maya-cell:nth-child(8){animation-delay:.3s}',
      '.maya-msg-in{animation:maya-rise .4s cubic-bezier(.2,.7,.3,1) both}',
      /* ── Logo vivant : le rayon de miel. 7 alvéoles = nth-child 2..8 (2=centre) ── */
      '.maya-cell{transform-box:fill-box;transform-origin:center}',
      '@keyframes maya-breathe{0%,100%{transform:scale(1) rotate(0deg)}50%{transform:scale(1.035) rotate(0.5deg)}}',
      '@keyframes maya-c-shimmer{0%,100%{opacity:.64;transform:scale(.93)}50%{opacity:1;transform:scale(1.02)}}',
      '@keyframes maya-c-wave{0%{opacity:.28;transform:scale(.8)}22%{opacity:1;transform:scale(1.09)}50%{opacity:.5;transform:scale(.9)}100%{opacity:.28;transform:scale(.8)}}',
      '@keyframes maya-c-listen{0%,100%{opacity:.5;transform:scale(.86)}50%{opacity:1;transform:scale(1.07)}}',
      '@keyframes maya-c-flare{0%,100%{opacity:.6;transform:scale(.96);fill:#f6b552}45%{opacity:1;transform:scale(1.14);fill:#d8742a}}',
      '@keyframes maya-c-orbit{0%,100%{opacity:.32;transform:scale(.9)}12%{opacity:1;transform:scale(1.07)}}',
      '@keyframes maya-c-rise{0%{opacity:.3;transform:translateY(1.4px) scale(.82)}35%{opacity:1;transform:translateY(0) scale(1.1)}55%{transform:scale(1)}82%{opacity:1}100%{opacity:.3;transform:translateY(1.4px) scale(.82)}}',
      /* Repos */
      '.maya-state-idle{animation:maya-breathe 6.5s ease-in-out infinite}',
      '.maya-state-idle .maya-cell{animation:maya-c-shimmer 4.6s ease-in-out infinite}',
      '.maya-state-idle .maya-cell:nth-child(2){animation-delay:0s}.maya-state-idle .maya-cell:nth-child(3){animation-delay:.62s}.maya-state-idle .maya-cell:nth-child(4){animation-delay:1.15s}.maya-state-idle .maya-cell:nth-child(5){animation-delay:.32s}.maya-state-idle .maya-cell:nth-child(6){animation-delay:.9s}.maya-state-idle .maya-cell:nth-child(7){animation-delay:.5s}.maya-state-idle .maya-cell:nth-child(8){animation-delay:1.4s}',
      /* Réflexion : vague en spirale centre → tour */
      '.maya-state-think .maya-cell{animation:maya-c-wave 1.9s ease-in-out infinite}',
      '.maya-state-think .maya-cell:nth-child(2){animation-delay:0s}.maya-state-think .maya-cell:nth-child(3){animation-delay:.1s}.maya-state-think .maya-cell:nth-child(4){animation-delay:.2s}.maya-state-think .maya-cell:nth-child(5){animation-delay:.3s}.maya-state-think .maya-cell:nth-child(6){animation-delay:.4s}.maya-state-think .maya-cell:nth-child(7){animation-delay:.5s}.maya-state-think .maya-cell:nth-child(8){animation-delay:.6s}',
      /* Écoute : onde concentrique, le centre puis la couronne */
      '.maya-state-listen .maya-cell{animation:maya-c-listen 1.15s ease-in-out infinite}',
      '.maya-state-listen .maya-cell:nth-child(2){animation-delay:0s}.maya-state-listen .maya-cell:nth-child(n+3){animation-delay:.22s}',
      /* Alerte : une seule alvéole s\'embrase, les autres restent calmes */
      '.maya-state-alert .maya-cell{opacity:.38}',
      '.maya-state-alert .maya-cell:nth-child(2){opacity:.5}',
      '.maya-state-alert .maya-cell:nth-child(7){animation:maya-c-flare 1.3s ease-in-out infinite;opacity:1}',
      /* Chargement : une lueur tourne autour de la couronne (l\'abeille fait le tour) */
      '.maya-state-loading .maya-cell{opacity:.34}',
      '.maya-state-loading .maya-cell:nth-child(2){opacity:.5}',
      '.maya-state-loading .maya-cell:nth-child(n+3){animation:maya-c-orbit 1.35s linear infinite}',
      '.maya-state-loading .maya-cell:nth-child(3){animation-delay:0s}.maya-state-loading .maya-cell:nth-child(4){animation-delay:.225s}.maya-state-loading .maya-cell:nth-child(5){animation-delay:.45s}.maya-state-loading .maya-cell:nth-child(6){animation-delay:.675s}.maya-state-loading .maya-cell:nth-child(7){animation-delay:.9s}.maya-state-loading .maya-cell:nth-child(8){animation-delay:1.125s}',
      /* Récolte : le miel monte du bas vers le haut puis se maintient */
      '.maya-state-success .maya-cell{animation:maya-c-rise 2.6s ease-in-out infinite}',
      '.maya-state-success .maya-cell:nth-child(4){animation-delay:0s}.maya-state-success .maya-cell:nth-child(5){animation-delay:0s}.maya-state-success .maya-cell:nth-child(2){animation-delay:.22s}.maya-state-success .maya-cell:nth-child(3){animation-delay:.22s}.maya-state-success .maya-cell:nth-child(6){animation-delay:.22s}.maya-state-success .maya-cell:nth-child(7){animation-delay:.44s}.maya-state-success .maya-cell:nth-child(8){animation-delay:.44s}',
      '@media (prefers-reduced-motion: reduce){[class*="maya-state-"],[class*="maya-state-"] .maya-cell{animation:none!important;opacity:1!important}}',
      '.maya-paused,.maya-paused *{animation-play-state:paused!important}',
    ].join('\n');
    document.head.appendChild(s);
  }
  /* Perf : suspend les animations Maya hors écran (canvas dense, terrain mobile) */
  if (typeof IntersectionObserver !== 'undefined' && !window.__mayaIO) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('maya-paused', !e.isIntersecting));
    }, { rootMargin: '120px' });
    const scan = () => document.querySelectorAll('[class*="maya-state-"]').forEach((el) => {
      if (!el.__mayaObs) { el.__mayaObs = true; io.observe(el); }
    });
    window.__mayaIO = io;
    setInterval(scan, 1200);
    setTimeout(scan, 300);
  }
})();

const MAYA = {
  honey: '#e6982c',
  honeyDeep: '#b9781c',
  wall: '#cf8420',
  cell: '#f7bd57',
  cream: '#fdf5e6',
  ink: '#1c1c1e',
  /* rétro-compat : accent plein & calme. Fini le dégradé orange-vert. */
  grad: '#e6982c',
  halo: 'radial-gradient(circle, rgba(230,152,44,0.40), rgba(230,152,44,0.12) 55%, transparent 72%)',
};

/* ── Géométrie du rayon : un hexagone-base + 7 alvéoles (fleur de comb) ── */
const _hexPts = (cx, cy, r) => {
  const a = [-90, -30, 30, 90, 150, 210];
  return a.map(d => { const t = d * Math.PI / 180; return `${(cx + r * Math.cos(t)).toFixed(2)},${(cy + r * Math.sin(t)).toFixed(2)}`; }).join(' ');
};
const _S = 3.75, _DC = _S * 1.732;
const MAYA_BASE = _hexPts(12, 12, 10.6);
const MAYA_CELLS = [[12, 12]];
for (let k = 0; k < 6; k++) { const t = k * 60 * Math.PI / 180; MAYA_CELLS.push([12 + _DC * Math.cos(t), 12 + _DC * Math.sin(t)]); }
const MAYA_CELL_PTS = MAYA_CELLS.map(([x, y]) => _hexPts(x, y, _S * 0.74));

/* ── Marque / logo Maya : un rayon de miel vivant & organique ──
   state: 'static' | 'idle' | 'think' | 'listen' | 'alert' | 'loading' | 'success' */
const MayaMark = ({ size = 28, glow = false, state = 'static', cells = true, style }) => {
  const showCells = cells && size >= 18;
  const animated = state !== 'static';
  return (
    <div className={animated ? `maya-state-${state}` : undefined}
      style={{ position: 'relative', width: size, height: size, flexShrink: 0, ...style }}>
      {glow && (
        <div style={{
          position: 'absolute', inset: -size * 0.3, borderRadius: '50%',
          background: MAYA.halo, animation: 'maya-halo 3.6s ease-in-out infinite',
        }} />
      )}
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'relative', display: 'block', overflow: 'visible' }}>
        <polygon points={MAYA_BASE} fill={showCells ? 'url(#maya-base-grad)' : MAYA.honey}
          stroke={showCells ? MAYA.wall : MAYA.honey} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {showCells && MAYA_CELL_PTS.map((p, i) => (
          <polygon key={i} className="maya-cell" points={p} fill="url(#maya-cell-grad)"
            stroke="#f3ad44" strokeWidth="1.3" strokeLinejoin="round" />
        ))}
      </svg>
    </div>
  );
};

/* ── En-tête d'un message Maya : avatar + nom + horodatage ── */
const MayaName = ({ time, glow = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
    <MayaMark size={26} glow={glow} />
    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Maya</span>
    {time && <span style={{ fontSize: 11.5, color: 'var(--text-quaternary)' }}>{time}</span>}
  </div>
);

/* ── Points de réflexion ── */
const TypingDots = ({ label = 'Maya analyse votre cheptel' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-tertiary)', fontSize: 13 }}>
    <div style={{ display: 'flex', gap: 4 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: 99,
          background: '#e6982c',
          animation: `maya-blink 1.2s ${i * 0.16}s ease-in-out infinite`,
        }} />
      ))}
    </div>
    <span style={{ background: 'linear-gradient(90deg,#a8a29e,#1c1c1e,#a8a29e)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'maya-shimmer 2.4s linear infinite' }}>{label}…</span>
  </div>
);

/* ── Puces de source : d'où Maya tire l'info ── */
const SourceChips = ({ items = [] }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
    <span style={{ fontSize: 11, color: 'var(--text-quaternary)', alignSelf: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sources</span>
    {items.map((s, i) => (
      <span key={i} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500,
        background: 'var(--surface-muted)', border: '1px solid var(--border-faint)',
        padding: '3px 9px', borderRadius: 99,
      }}>
        {s.icon && React.createElement(window.I[s.icon], { size: 12, stroke: 1.9, style: { color: 'var(--text-tertiary)' } })}
        {s.label}
      </span>
    ))}
  </div>
);

/* ── Mini graphe à barres (réutilise la grammaire dashboard) ── */
const MiniBars = ({ data = [], unit = 'kg', accent = 'honey', height = 86 }) => {
  const max = Math.max(...data.map(d => d.v));
  const fill = accent === 'sage'
    ? 'linear-gradient(to top, #7a9676, #c7d4c2)'
    : 'linear-gradient(to top, #f5a623, #fff3dc)';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height, paddingTop: 6 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: d.hi ? 'var(--honey-deep)' : 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{d.v}</span>
          <div style={{ width: '100%', maxWidth: 26, height: `${(d.v / max) * (height - 28)}px`, background: d.hi ? fill : 'var(--surface-sunk)', borderRadius: 4, opacity: d.hi === false ? 0.55 : 1 }} />
          <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>{d.l}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Tableau de ruches compact ── */
const sevColor = (s) => s === 'bad' ? 'var(--status-bad)' : s === 'warn' ? 'var(--status-warn)' : 'var(--status-good)';
const HiveTable = ({ rows = [], cols = ['Ruche', 'Rucher', 'Dernière visite', ''] }) => (
  <div style={{ border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden', background: 'var(--surface-card)' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.4fr 1fr auto', gap: 12, padding: '9px 14px', background: 'var(--surface-muted)', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>
      {cols.map((c, i) => <span key={i} style={{ textAlign: i === 3 ? 'right' : 'left' }}>{c}</span>)}
    </div>
    {rows.map((r, i) => (
      <div key={i} style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.4fr 1fr auto', gap: 12, padding: '11px 14px', alignItems: 'center', borderTop: '1px solid var(--border-faint)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600 }}>{r.id}</span>
        <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{r.rucher}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-secondary)' }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: sevColor(r.sev) }} />
          {r.visit}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--honey-deep)', textAlign: 'right', cursor: 'pointer' }}>{r.action || 'Voir →'}</span>
      </div>
    ))}
  </div>
);

/* ── Carte d'action inline : Maya propose, l'apiculteur confirme ── */
const ActionCard = ({ icon = 'calendar', tint = 'honey', title, desc, meta = [], primary = 'Planifier', secondary = 'Modifier' }) => {
  const tints = {
    honey: { bg: 'var(--honey-soft)', fg: 'var(--honey-deep)' },
    sage: { bg: 'var(--sage-soft)', fg: 'var(--sage-deep)' },
    clay: { bg: 'var(--clay-soft)', fg: 'var(--clay-deep)' },
  }[tint];
  return (
    <div style={{
      display: 'flex', gap: 14, padding: 16, marginTop: 14,
      background: 'var(--surface-card)', border: '1px solid var(--border-default)',
      borderRadius: 14, boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: MAYA.grad }} />
      <div style={{ width: 38, height: 38, borderRadius: 10, background: tints.bg, color: tints.fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {React.createElement(window.I[icon], { size: 19, stroke: 1.9 })}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>Action proposée</span>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>{title}</div>
        {desc && <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>{desc}</div>}
        {meta.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 9 }}>
            {meta.map((m, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
                {m.icon && React.createElement(window.I[m.icon], { size: 13, stroke: 1.9, style: { color: 'var(--text-tertiary)' } })}
                <b style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.v}</b> {m.l}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 9, marginTop: 13 }}>
          <button style={{ height: 32, padding: '0 15px', background: '#1c1c1e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {React.createElement(window.I.check, { size: 14, stroke: 2.2 })}{primary}
          </button>
          {secondary && (
            <button style={{ height: 32, padding: '0 14px', background: 'var(--surface-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>{secondary}</button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Bulle utilisateur (alignée à droite) ── */
const UserBubble = ({ children }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 26 }}>
    <div style={{
      maxWidth: '76%', background: 'var(--surface-sunk)', color: 'var(--text-primary)',
      padding: '11px 16px', borderRadius: '16px 16px 4px 16px', fontSize: 14, lineHeight: 1.55,
    }}>{children}</div>
  </div>
);

/* ── Conteneur d'un message Maya ── */
const MayaMessage = ({ time, glow, children, indent = true }) => (
  <div className="maya-msg-in" style={{ marginBottom: 28 }}>
    <MayaName time={time} glow={glow} />
    <div style={{ marginLeft: indent ? 35 : 0, marginTop: 8, fontSize: 14, lineHeight: 1.62, color: 'var(--text-primary)' }}>{children}</div>
  </div>
);

/* ── Réactions sous un message ── */
const MsgActions = () => (
  <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
    {[['copy', 'Copier'], ['thumbUp', ''], ['thumbDown', ''], ['refresh', 'Régénérer']].map(([ic, lbl], i) => (
      <button key={i} style={{ height: 28, padding: lbl ? '0 9px' : '0 7px', display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: '1px solid transparent', borderRadius: 7, color: 'var(--text-tertiary)', fontSize: 12, fontWeight: 500 }}>
        {React.createElement(window.I[ic], { size: 14, stroke: 1.8 })}{lbl}
      </button>
    ))}
  </div>
);

/* ── Suggestions de prompts ── */
const SuggestionChip = ({ icon, children, tint = 'honey' }) => {
  const fg = tint === 'sage' ? 'var(--sage-deep)' : tint === 'clay' ? 'var(--clay-deep)' : 'var(--honey-deep)';
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, textAlign: 'left',
      padding: '10px 13px', background: 'var(--surface-card)',
      border: '1px solid var(--border-default)', borderRadius: 11,
      fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.35,
      boxShadow: 'var(--shadow-xs)',
    }}>
      {icon && <span style={{ color: fg, display: 'flex', flexShrink: 0 }}>{React.createElement(window.I[icon], { size: 15, stroke: 1.9 })}</span>}
      {children}
    </button>
  );
};

/* ── Barre de saisie ── */
const PromptBar = ({ placeholder = 'Demandez à Maya…', compact = false, contextChip = 'Tout le cheptel', listening = false }) => (
  <div style={{
    background: 'var(--surface-card)', border: '1px solid var(--border-strong)',
    borderRadius: 16, padding: compact ? '10px 10px 10px 14px' : '14px 14px 12px 18px',
    boxShadow: listening ? '0 0 0 3px rgba(245,166,35,0.18), var(--shadow-md)' : 'var(--shadow-md)',
    transition: 'box-shadow .2s',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ flex: 1, fontSize: 14.5, color: 'var(--text-tertiary)' }}>{placeholder}</span>
      <button style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid var(--border-default)', background: 'var(--surface-card)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>
        {React.createElement(window.I.paperclip, { size: 16 })}
      </button>
      <button style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: listening ? MAYA.grad : 'var(--surface-muted)', display: 'grid', placeItems: 'center', color: listening ? '#fff' : 'var(--text-secondary)' }}>
        {React.createElement(window.I.mic, { size: 16 })}
      </button>
      <button style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: MAYA.grad, display: 'grid', placeItems: 'center', color: '#fff', boxShadow: 'var(--shadow-sm)' }}>
        {React.createElement(window.I.arrowUp, { size: 18, stroke: 2.4 })}
      </button>
    </div>
    {!compact && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 11, paddingTop: 11, borderTop: '1px solid var(--border-faint)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--surface-muted)', padding: '4px 10px', borderRadius: 99 }}>
          {React.createElement(window.I.layoutGrid, { size: 12, stroke: 2 })}{contextChip}
          {React.createElement(window.I.chevronDown, { size: 12, stroke: 2, style: { color: 'var(--text-tertiary)' } })}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--text-quaternary)', marginLeft: 'auto' }}>Maya peut se tromper — vérifiez les actions sensibles.</span>
      </div>
    )}
  </div>
);

/* ── Onde sonore (capture vocale) ── */
const Waveform = ({ bars = 28, color = '#fff', height = 26 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 3, height }}>
    {Array.from({ length: bars }).map((_, i) => {
      const h = 0.3 + 0.7 * Math.abs(Math.sin(i * 0.9));
      return <span key={i} style={{ width: 3, borderRadius: 2, height: `${h * height}px`, background: color, transformOrigin: 'center', animation: `maya-wave ${0.7 + (i % 5) * 0.12}s ${i * 0.04}s ease-in-out infinite` }} />;
    })}
  </div>
);

/* ── Jauge anneau (miel) ── */
const RingGauge = ({ value = 92, size = 88, stroke = 9, color = '#e6982c', track = '#f1e3c8', children }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c.toFixed(1)} strokeDashoffset={off.toFixed(1)} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>{children}</div>
    </div>
  );
};

/* ── Sparkline (aire + ligne) ── */
const Sparkline = ({ data = [], width = 130, height = 40, color = '#e6982c', fill = 'rgba(230,152,44,0.13)', dot = true }) => {
  const max = Math.max(...data), min = Math.min(...data), span = max - min || 1;
  const pts = data.map((v, i) => [i / (data.length - 1) * (width - 6) + 3, height - 4 - ((v - min) / span) * (height - 10)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L ${(width - 3).toFixed(1)} ${height} L 3 ${height} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {dot && <circle cx={last[0]} cy={last[1]} r="2.8" fill={color} stroke="#fff" strokeWidth="1.5" />}
    </svg>
  );
};

Object.assign(window, {
  MAYA, MayaMark, MayaName, TypingDots, SourceChips, MiniBars, HiveTable,
  ActionCard, UserBubble, MayaMessage, MsgActions, SuggestionChip, PromptBar, Waveform,
  RingGauge, Sparkline,
});
