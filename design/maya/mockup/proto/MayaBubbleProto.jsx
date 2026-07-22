/* PROTOTYPE cliquable — Maya, mode discret (la bulle)
   Maya PROPOSE des actions plutôt que de balancer des infos : chaque réponse
   se termine par des pistes à choisir (machine de conversation à embranchements).
   Beaucoup d'animations : compteurs, courbe qui se dessine, chips en cascade, lueur de succès. */

/* ── Compteur animé (0 → valeur) ── */
const CountUp = ({ raw }) => {
  const m = String(raw).match(/^([+\-]?)([\d\s\u00a0]+)(.*)$/);
  const target = m ? parseInt(m[2].replace(/[\s\u00a0]/g, ''), 10) : NaN;
  const [v, setV] = React.useState(isNaN(target) ? null : 0);
  React.useEffect(() => {
    if (isNaN(target)) return;
    let raf, t0;
    const dur = 680;
    const tick = (t) => { t0 = t0 || t; const p = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - p, 3); setV(Math.round(e * target)); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    const safety = setTimeout(() => setV(target), dur + 250); // garantit l'arrivée si rAF est throttlé
    return () => { cancelAnimationFrame(raf); clearTimeout(safety); };
  }, [target]);
  if (isNaN(target)) return <>{raw}</>;
  return <>{m[1]}{v.toLocaleString('fr-FR')}{m[3]}</>;
};

const tone = (t) => t === 'bad' ? ['#f7e6e6', 'var(--status-bad)'] : t === 'sage' ? ['var(--sage-soft)', 'var(--sage-deep)'] : t === 'clay' ? ['var(--clay-soft)', 'var(--clay-deep)'] : t === 'neutre' ? ['var(--surface-muted)', 'var(--text-secondary)'] : ['var(--honey-soft)', 'var(--honey-deep)'];

const StatChips = ({ items }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 11 }}>
    {items.map((it, i) => { const [bg, fg] = tone(it[2]); return (
      <div key={i} className="maya-chip-in" style={{ background: bg, borderRadius: 10, padding: '7px 11px', minWidth: 62, animationDelay: `${0.05 + i * 0.08}s` }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: fg, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}><CountUp raw={it[0]} /></div>
        <div style={{ fontSize: 10.5, color: fg, opacity: 0.82, marginTop: 3, fontWeight: 500 }}>{it[1]}</div>
      </div>
    ); })}
  </div>
);

/* ── Courbe qui se dessine ── */
const AnimatedSpark = ({ data }) => {
  const W = 150, H = 46, max = Math.max(...data), min = Math.min(...data), span = max - min || 1;
  const pts = data.map((v, i) => [i / (data.length - 1) * (W - 6) + 3, H - 5 - ((v - min) / span) * (H - 12)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L ${W - 3} ${H} L 3 ${H} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
      <path d={area} fill="rgba(245,166,35,0.13)" style={{ opacity: 0, animation: 'maya-msg-in .6s .5s forwards', animationName: 'maya-chip-in' }} />
      <path d={line} fill="none" stroke="var(--honey)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" style={{ animation: 'maya-draw 1s cubic-bezier(.4,0,.2,1) forwards' }} />
      <circle cx={last[0]} cy={last[1]} r="3" fill="var(--honey)" stroke="#fff" strokeWidth="1.6" style={{ opacity: 0, animation: 'maya-chip-in .4s .9s both' }} />
    </svg>
  );
};

const sev = (s) => s === 'bad' ? 'var(--status-bad)' : s === 'warn' ? 'var(--status-warn)' : 'var(--status-good)';
const MiniList = ({ rows }) => (
  <div style={{ marginTop: 11, border: '1px solid var(--border-faint)', borderRadius: 11, overflow: 'hidden', background: 'var(--surface-muted)' }}>
    {rows.map((r, i) => (
      <div key={i} className="maya-chip-in" style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderTop: i ? '1px solid var(--border-faint)' : 'none', animationDelay: `${0.1 + i * 0.09}s` }}>
        <span style={{ width: 7, height: 7, borderRadius: 99, background: sev(r[2]), flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{r[0]}</span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 'auto' }}>{r[1]}</span>
      </div>
    ))}
  </div>
);

/* ── Carte d'action proposée (inline) ── */
const ActionMini = ({ node }) => (
  <div className="maya-chip-in" style={{ marginTop: 12, background: 'var(--surface-muted)', border: '1px solid var(--border-default)', borderRadius: 13, padding: '13px 14px', position: 'relative', overflow: 'hidden', animationDelay: '0.12s' }}>
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--honey)' }} />
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 5 }}>Proposition</div>
    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14.5 }}>{node.title}</div>
    {node.desc && <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{node.desc}</div>}
    {node.meta && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 9 }}>
        {node.meta.map((m, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
            {React.createElement(window.I[m[0]], { size: 13, stroke: 1.9, style: { color: 'var(--text-tertiary)' } })}<b style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m[1]}</b>
          </span>
        ))}
      </div>
    )}
  </div>
);

/* ── La conversation : Maya propose, l'apiculteur choisit ── */
const STARTERS = [
  { label: "Quelles ruches visiter ?", icon: 'alertTriangle', to: 'ruches' },
  { label: "Le point production", icon: 'trendUp', to: 'prod' },
  { label: "Mon stock de hausses", icon: 'package', to: 'stock' },
];
const FLOW = {
  ruches: { text: "J'ai fait le tour de tes 248 ruches cette nuit. 4 dépassent 10 jours sans visite — dont 2 que je surveillerais en priorité, à la Sorgue. On avance comment ?", stats: [['4', 'à voir', 'honey'], ['2', 'prioritaires', 'bad']], proposals: [{ label: "Montre-moi lesquelles", icon: 'eye', to: 'ruchesList' }, { label: "Planifie une tournée", icon: 'calendar', to: 'planTour', primary: true }, { label: "Rappelle-moi demain", icon: 'clock', to: 'remind' }] },
  ruchesList: { text: "Les voici, de la plus urgente à la moins. Je te propose de commencer par les deux de la Sorgue, déjà affaiblies.", list: [['V-031', 'Sorgue · 17 j', 'bad'], ['V-034', 'Sorgue · 17 j', 'bad'], ['V-009', 'Sault · 12 j', 'warn'], ['V-022', 'Sault · 11 j', 'warn']], proposals: [{ label: "Planifie la Sorgue demain", icon: 'calendar', to: 'planTour', primary: true }, { label: "Plus tard", icon: 'clock', to: 'later' }] },
  planTour: { text: "Voilà ce que je te propose — dis-moi si ça te va :", action: { title: "Tournée — Prés de la Sorgue", desc: "Créneau libre, météo favorable, butinage 78 %. Je prépare la feuille des 4 ruches.", meta: [['clock', 'Mer. 06:30'], ['pin', '4 ruches'], ['cloud', '17 °C']] }, proposals: [{ label: "Valide la tournée", icon: 'check', to: 'done', primary: true }, { label: "Un autre créneau", icon: 'calendar', to: 'slot' }] },
  slot: { text: "Quand ça t'arrange le mieux ? Je m'adapte à ton planning.", proposals: [{ label: "Demain 06:30", to: 'done', primary: true }, { label: "Jeudi matin", to: 'done' }, { label: "Ce week-end", to: 'done' }] },
  done: { text: "C'est noté ✓ J'ai bloqué le créneau et préparé ta feuille de visite. Bonne tournée — je veille sur le reste 🐝", success: true },
  remind: { text: "D'accord, je te le remettrai demain matin dans ton briefing. Autre chose ?", success: true, proposals: STARTERS },
  later: { text: "Pas de souci, je garde ça sous le coude. Tu me dis quand.", success: true, proposals: STARTERS },

  prod: { text: "Mai a été ton meilleur mois 🍯 +20 % vs 2024. Tu veux que je creuse, ou que je te dise comment pousser jusqu'à ton objectif ?", stats: [['1 180', 'kg en mai', 'honey'], ['+20 %', 'vs 2024', 'sage']], spark: [320, 540, 760, 980, 1180], proposals: [{ label: "Détaille par rucher", icon: 'pin', to: 'prodDetail' }, { label: "Comment viser 8 000 kg", icon: 'trendUp', to: 'prodGoal', primary: true }] },
  prodDetail: { text: "Sault porte la saison (480 kg à lui seul), Buoux et Comtat suivent. Je t'ouvre le tableau complet dans Production ?", proposals: [{ label: "Ouvre Production", icon: 'arrowUpRight', to: 'open', primary: true }, { label: "Ça me suffit", to: 'later' }] },
  prodGoal: { text: "Pour viser 8 000 kg, je pousserais le miellat de châtaignier au Comtat fin juin. Je te le planifie ?", proposals: [{ label: "Planifie le châtaignier", icon: 'calendar', to: 'done', primary: true }, { label: "Pas cette année", to: 'later' }] },

  stock: { text: "Il te reste 34 hausses à Sault. Ça passe pour le printemps, mais ce sera juste pour le miellat d'été. Je te prépare un réassort ou je te le rappelle en juin ?", stats: [['34', 'hausses', 'clay']], proposals: [{ label: "Prépare une commande", icon: 'plus', to: 'order', primary: true }, { label: "Rappelle-moi en juin", icon: 'clock', to: 'remind' }] },
  order: { text: "C'est parti — je te prépare un brouillon de 20 hausses chez ton fournisseur habituel. Tu n'auras qu'à valider les quantités.", success: true, proposals: [{ label: "Voir le brouillon", icon: 'arrowUpRight', to: 'open' }] },
  open: { text: "Je t'y emmène 👍", success: true },
  fallback: { text: "Je suis surtout là pour te proposer des actions concrètes à partir de tes données. On regarde quoi ?", proposals: STARTERS },
};

/* ── Menu de présence (⋯) ── */
const PresenceMenu = ({ presence, critical, onPresence, onCritical, onClose }) => (
  <>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
    <div style={{ position: 'absolute', top: 48, right: 4, width: 250, background: 'var(--surface-card)', borderRadius: 14, boxShadow: '0 16px 40px rgba(40,30,20,0.2), 0 0 0 1px var(--border-default)', overflow: 'hidden', zIndex: 41 }}>
      <div style={{ padding: '10px 14px 6px', fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Présence de Maya</div>
      {[['partout', 'layoutGrid', 'Partout'], ['discrete', 'message', 'Discrète (bulle)'], ['pause', 'moon', 'En pause']].map(([k, ic, lbl]) => (
        <div key={k} onClick={() => { onPresence(k); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px', fontSize: 13.5, color: 'var(--text-primary)', cursor: 'pointer', background: presence === k ? 'var(--surface-muted)' : 'transparent' }}>
          {React.createElement(window.I[ic], { size: 16, stroke: 1.9, style: { color: 'var(--text-tertiary)' } })}{lbl}
          {presence === k && React.createElement(window.I.check, { size: 15, stroke: 2.4, style: { marginLeft: 'auto', color: 'var(--honey-deep)' } })}
        </div>
      ))}
      <div onClick={() => onCritical(!critical)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderTop: '1px solid var(--border-faint)', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
        {React.createElement(window.I.bell, { size: 16, stroke: 1.9, style: { color: 'var(--text-tertiary)' } })}
        <span style={{ flex: 1 }}>Alertes critiques</span>
        <div style={{ width: 38, height: 22, borderRadius: 99, background: critical ? 'var(--honey)' : 'var(--surface-sunk)', position: 'relative', transition: 'background .2s' }}><div style={{ position: 'absolute', top: 2, left: critical ? 18 : 2, width: 18, height: 18, borderRadius: 99, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.2)', transition: 'left .2s' }} /></div>
      </div>
    </div>
  </>
);

/* ── Chips de proposition (cascade) ── */
const ProposalRow = ({ proposals, onPick }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 13, marginLeft: 28 }}>
    {proposals.map((p, i) => (
      <button key={i} className="maya-chip-in" onClick={() => onPick(p)} style={{ ...chipBtn(p.primary), animationDelay: `${0.08 + i * 0.07}s` }}>
        {p.icon && React.createElement(window.I[p.icon], { size: 15, stroke: 2, style: { color: p.primary ? '#fff' : 'var(--honey-deep)' } })}
        <span style={{ flex: 1 }}>{p.label}</span>
        {React.createElement(window.I.arrowUpRight, { size: 14, stroke: 2, style: { opacity: p.primary ? 0.9 : 0.4 } })}
      </button>
    ))}
  </div>
);

const MayaBubbleProto = () => {
  const [presence, setPresence] = React.useState(() => localStorage.getItem('maya-proto-presence') || 'discrete');
  const [critical, setCritical] = React.useState(() => localStorage.getItem('maya-proto-critical') !== '0');
  const [open, setOpen] = React.useState(false);
  const [flying, setFlying] = React.useState(false);
  const [menu, setMenu] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [briefing, setBriefing] = React.useState(true);
  const [voice, setVoice] = React.useState(true);
  const [thinking, setThinking] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [alertSeen, setAlertSeen] = React.useState(false);
  const [pulse, setPulse] = React.useState(false);
  const [msgs, setMsgs] = React.useState([{ role: 'maya', text: "Salut Marc ! Je suis là si tu as besoin. Je peux te proposer quelques pistes :", proposals: STARTERS }]);
  const scrollRef = React.useRef(null);

  React.useEffect(() => { localStorage.setItem('maya-proto-presence', presence); }, [presence]);
  React.useEffect(() => { localStorage.setItem('maya-proto-critical', critical ? '1' : '0'); }, [critical]);
  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [msgs, thinking, open]);

  const hasAlert = critical && presence !== 'pause' && !alertSeen;
  const lastIdx = msgs.length - 1;

  const pushMaya = (node) => {
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setMsgs((m) => [...m, { role: 'maya', ...node }]);
      if (node.success) { setPulse(true); setTimeout(() => setPulse(false), 2400); }
    }, 780);
  };
  const pick = (p) => { setMsgs((m) => [...m, { role: 'user', text: p.label }]); pushMaya(FLOW[p.to] || FLOW.fallback); };
  const send = () => { const t = draft.trim(); if (!t) return; setDraft(''); setMsgs((m) => [...m, { role: 'user', text: t }]); pushMaya(FLOW.fallback); };
  const openBubble = () => {
    if (open) return;
    setFlying(true);
    setOpen(true);
    setTimeout(() => setFlying(false), 560);
    if (hasAlert) { setAlertSeen(true); setTimeout(() => setMsgs((m) => [...m, { role: 'maya', alert: true, text: "Avant tout : risque d'essaimage repéré au Ventoux Sud (4 cellules royales + chaleur qui monte). 3 ruches concernées. Je te propose d'agir vite — tu veux que je m'en occupe ?", list: [['V-014', 'Ventoux Sud', 'bad'], ['V-018', 'Ventoux Sud', 'bad'], ['V-021', 'Ventoux Sud', 'warn']], proposals: [{ label: "Planifie une pose de hausse", icon: 'calendar', to: 'planTour', primary: true }, { label: "Montre-moi d'abord", icon: 'eye', to: 'ruchesList' }] }]), 760); }
  };

  const headState = thinking ? 'think' : pulse ? 'success' : 'idle';

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: 'var(--surface-primary)', fontFamily: 'var(--font-text)', position: 'relative', overflow: 'hidden' }}>
      <window.Sidebar2 active="dashboard" onMaya={() => setSettingsOpen(true)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <window.Topbar2 crumb={['Tableau de bord']} action="Nouvelle intervention" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 40px', background: 'var(--surface-muted)', borderBottom: '1px solid var(--border-faint)' }}>
          <window.MayaMark size={20} state={presence === 'pause' ? 'static' : 'idle'} cells={presence !== 'pause'} />
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
            Maya&nbsp;: <b style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{presence === 'partout' ? 'présente partout' : presence === 'discrete' ? 'en bulle discrète' : 'en pause'}</b>
            <span style={{ color: 'var(--text-tertiary)' }}> · {presence === 'partout' ? "elle glisse des propositions sur tes pages" : presence === 'discrete' ? "elle attend que tu l'appelles" : 'elle se fait silencieuse'}</span>
          </span>
          <button onClick={() => setSettingsOpen(true)} style={{ marginLeft: 'auto', height: 30, padding: '0 13px', display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            {React.createElement(window.I.settings, { size: 14, stroke: 1.9 })} Gérer Maya
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '30px 40px 60px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 25, fontWeight: 600, letterSpacing: '-0.02em' }}>Bonjour Marc.</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>248 ruches · 7 ruchers.</p>

          {presence === 'partout' && (
            <div style={{ marginTop: 20, background: 'linear-gradient(120deg, #fff8ee, #fbf1e1)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'center', position: 'relative', overflow: 'hidden', maxWidth: 720 }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--honey)' }} />
              <window.MayaMark size={38} glow state="idle" />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14.5 }}>Maya te propose 3 actions ce matin</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>Pose de hausse au Ventoux, rappel gel lundi, tournée à la Sorgue.</div>
              </div>
              <button onClick={openBubble} style={{ height: 36, padding: '0 16px', background: '#1c1c1e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>Voir</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginTop: 22, maxWidth: 720 }}>
            {[['Production', '6 740 kg'], ['Chiffre d\'affaires', '38,4 k€'], ['Interventions', '18'], ['Alertes', critical ? '4' : '0']].map(([l, v], i) => (
              <div key={i} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 13, padding: '14px 16px' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{l}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, marginTop: 7 }}>{v}</div>
              </div>
            ))}
          </div>

          {presence === 'pause' && (
            <div style={{ marginTop: 22, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 12 }}>
              <window.MayaMark size={24} cells={false} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Maya est en pause.</span>
              <button onClick={() => setPresence('discrete')} style={{ height: 30, padding: '0 12px', background: 'var(--honey-soft)', color: 'var(--honey-deep)', border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>La réveiller</button>
            </div>
          )}
        </div>
      </div>

      {presence !== 'pause' && (
        <>
          {/* tooltip + badge quand fermé */}
          {!open && hasAlert && (
            <div className="maya-chip-in" style={{ position: 'absolute', right: 92, bottom: 40, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px 12px 4px 12px', padding: '8px 12px', fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-md)', zIndex: 32 }}>Une proposition pour toi 🐝</div>
          )}

          {/* LA COQUILLE : bouton qui se déplie en fenêtre (un seul élément qui se morphe) */}
          <div
            className={!open ? 'maya-launch' : undefined}
            onClick={() => { if (!open) openBubble(); }}
            style={{
              position: 'absolute', right: 24, bottom: 24, zIndex: 31,
              width: open ? 392 : 58, height: open ? 580 : 58,
              borderRadius: open ? 22 : 18, overflow: 'hidden',
              background: open ? 'linear-gradient(180deg,#fdf8ef,#fbf1de)' : '#111112',
              boxShadow: open ? '0 28px 70px rgba(40,30,20,0.32), 0 0 0 1px rgba(180,140,80,0.18)' : '0 12px 30px rgba(28,28,30,0.34)',
              transition: 'width .5s cubic-bezier(.32,1.02,.38,1), height .54s cubic-bezier(.32,1.02,.38,1), border-radius .5s ease, box-shadow .5s ease, background .4s ease',
            }}
          >
            {/* en-tête = le bouton : noir plein fermé, dégradé chaud une fois déplié */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 62, overflow: 'hidden', background: open ? 'linear-gradient(135deg,#2c2218,#1a1a1c)' : '#111112', transition: 'background .45s ease' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(130% 120% at 20% -20%, rgba(245,166,35,0.42), transparent 60%)', opacity: open ? 1 : 0, transition: 'opacity .5s ease .1s' }} />
              <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', left: -14, top: -50, background: 'radial-gradient(circle, rgba(245,166,35,0.5), transparent 70%)', filter: 'blur(6px)', opacity: open ? 1 : 0, transition: 'opacity .5s ease .1s', animation: 'maya-float 6.5s ease-in-out infinite' }} />
              {/* logo : reste au chaud dans le bouton, monte avec le dépliage */}
              <div className="maya-boop" style={{ position: 'absolute', top: open ? 14 : 12, left: open ? 16 : 12, transformOrigin: 'center', transition: 'top .5s cubic-bezier(.32,1.02,.38,1), left .5s cubic-bezier(.32,1.02,.38,1)' }}>
                <window.MayaMark size={34} glow={open} state={open ? headState : (hasAlert ? 'alert' : 'idle')} />
              </div>
              {/* badge alerte sur le bouton fermé */}
              {!open && hasAlert && <span style={{ position: 'absolute', top: 6, right: 6, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 99, background: 'var(--status-bad)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center', border: '2px solid #111112' }}>1</span>}
              {/* texte + actions : apparaissent une fois déplié */}
              <div style={{ position: 'absolute', top: 0, left: 60, right: 12, height: 62, display: 'flex', alignItems: 'center', gap: 8, opacity: open ? 1 : 0, transition: open ? 'opacity .25s .2s' : 'opacity .1s', pointerEvents: open ? 'auto' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: '#fff' }}>Maya</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.62)', display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: 99, background: thinking ? '#f5a623' : '#9fd0a0' }} />{thinking ? 'réfléchit…' : pulse ? 'c\'est fait ✓' : 'Prête à aider'}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setSettingsOpen(true); }} title="Réglages de Maya" style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>{React.createElement(window.I.settings, { size: 16, stroke: 1.9 })}</button>
                <button onClick={(e) => { e.stopPropagation(); setOpen(false); }} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>{React.createElement(window.I.chevronDown, { size: 18 })}</button>
              </div>
            </div>

            {/* corps : messages */}
            <div ref={scrollRef} style={{ position: 'absolute', top: 62, left: 0, right: 0, bottom: 74, overflow: 'auto', padding: '18px 16px 8px', opacity: open ? 1 : 0, transition: open ? 'opacity .3s .22s' : 'opacity .12s', pointerEvents: open ? 'auto' : 'none' }}>
                {msgs.map((m, i) => m.role === 'user' ? (
                  <div key={i} className="maya-msg-in" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                    <div style={{ maxWidth: '82%', background: 'linear-gradient(135deg,#f5a623,#e6982c)', color: '#fff', padding: '10px 14px', borderRadius: '16px 16px 4px 16px', fontSize: 13.5, lineHeight: 1.5, boxShadow: '0 4px 12px rgba(230,152,44,0.28)' }}>{m.text}</div>
                  </div>
                ) : (
                  <div key={i} className="maya-msg-in" style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 7 }}><window.MayaMark size={20} state={m.alert ? 'alert' : m.success ? 'success' : 'static'} /><span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, alignSelf: 'center' }}>Maya</span></div>
                    <div style={{ marginLeft: 28, background: '#fff', border: m.alert ? '1px solid rgba(181,69,69,0.3)' : '1px solid var(--border-faint)', borderRadius: '5px 15px 15px 15px', padding: '12px 14px', boxShadow: '0 3px 12px rgba(120,100,80,0.07)', animation: m.success ? 'maya-glow-pulse 2.2s ease-out' : 'none' }}>
                      {m.alert && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--status-bad)', marginBottom: 7 }}>{React.createElement(window.I.alertTriangle, { size: 13, stroke: 2.1 })} Priorité</div>}
                      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-primary)' }}>{m.text}</p>
                      {m.stats && <StatChips items={m.stats} />}
                      {m.spark && <div className="maya-chip-in" style={{ marginTop: 12, padding: '10px 12px', background: 'var(--surface-muted)', borderRadius: 11, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', animationDelay: '0.1s' }}><div><div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Montée mai</div><div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginTop: 2 }}><CountUp raw="1 180" /> <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>kg</span></div></div><AnimatedSpark data={m.spark} /></div>}
                      {m.list && <MiniList rows={m.list} />}
                      {m.action && <ActionMini node={m.action} />}
                    </div>
                    {m.proposals && i === lastIdx && !thinking && <ProposalRow proposals={m.proposals} onPick={pick} />}
                  </div>
                ))}
                {thinking && <div className="maya-msg-in" style={{ marginLeft: 28, marginBottom: 16 }}><window.TypingDots label="Maya prépare des pistes" /></div>}
            </div>

            {/* pied : saisie */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 12px 12px', opacity: open ? 1 : 0, transition: open ? 'opacity .3s .24s' : 'opacity .12s', pointerEvents: open ? 'auto' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#fff', border: '1.5px solid var(--border-strong)', borderRadius: 14, padding: '7px 8px 7px 14px', boxShadow: '0 4px 14px rgba(120,100,80,0.06)' }}>
                <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Écrire à Maya…" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'inherit' }} />
                <button onClick={(e) => e.stopPropagation()} style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: 'var(--surface-muted)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>{React.createElement(window.I.mic, { size: 16 })}</button>
                <button onClick={(e) => { e.stopPropagation(); send(); }} style={{ width: 34, height: 34, borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#f5a623,#e6982c)', display: 'grid', placeItems: 'center', color: '#fff', cursor: 'pointer' }}>{React.createElement(window.I.arrowUp, { size: 17, stroke: 2.4 })}</button>
              </div>
              <div style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 7 }}>Maya suit des règles apicoles éprouvées · tu gardes la main sur tout</div>
            </div>
          </div>
        </>
      )}

      {settingsOpen && (
        <MayaSettings
          presence={presence} critical={critical} briefing={briefing} voice={voice}
          onPresence={setPresence} onCritical={setCritical} onBriefing={setBriefing} onVoice={setVoice}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
};

/* ── Écran « Maya · Assistant » : la gestion de présence vit ici ── */
const SettingToggle = ({ on, onToggle }) => (
  <button onClick={onToggle} style={{ width: 44, height: 26, flexShrink: 0, border: 'none', borderRadius: 99, background: on ? 'var(--honey)' : 'var(--surface-sunk)', position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
    <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: 99, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left .2s cubic-bezier(.2,.8,.3,1.2)' }} />
  </button>
);

const MayaSettings = ({ presence, critical, briefing, voice, onPresence, onCritical, onBriefing, onVoice, onClose }) => {
  const opts = [
    { k: 'partout', icon: 'layoutGrid', name: 'Présente partout', desc: 'Maya glisse des propositions sur tes pages (dashboard, ruches, météo). Le maximum d’accompagnement.' },
    { k: 'discrete', icon: 'message', name: 'Bulle discrète', desc: 'Maya reste dans sa bulle en bas à droite. Elle attend que tu l’appelles — toujours là, jamais envahissante.' },
    { k: 'pause', icon: 'moon', name: 'En pause', desc: 'Maya se fait silencieuse. Aucune proposition (sauf alertes critiques si activées).' },
  ];
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(28,22,16,0.4)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="maya-msg-in" style={{ width: 560, maxHeight: '100%', overflow: 'auto', background: 'linear-gradient(180deg,#fdf8ef,#fbf3e4)', borderRadius: 22, boxShadow: '0 30px 80px rgba(40,30,20,0.34)', border: '1px solid rgba(180,140,80,0.2)' }}>
        {/* en-tête vivant, cohérent avec la bulle */}
        <div style={{ position: 'relative', overflow: 'hidden', padding: '20px 22px', background: 'linear-gradient(135deg,#2c2218,#1a1a1c)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 100% at 12% -10%, rgba(245,166,35,0.4), transparent 56%)' }} />
          <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', left: -20, top: -64, background: 'radial-gradient(circle, rgba(245,166,35,0.5), transparent 70%)', filter: 'blur(7px)', animation: 'maya-float 6.5s ease-in-out infinite' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 13 }}>
            <window.MayaMark size={40} glow state={presence === 'pause' ? 'static' : 'idle'} cells={presence !== 'pause'} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: '#fff' }}>Maya</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', color: '#f0b454', textTransform: 'uppercase', border: '1px solid rgba(240,180,84,0.4)', padding: '2px 7px', borderRadius: 99 }}>Assistant</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Règle sa présence et ce qu’elle surveille pour toi.</div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>{React.createElement(window.I.x, { size: 17 })}</button>
          </div>
        </div>

        <div style={{ padding: '20px 22px 22px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Présence</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {opts.map((o) => {
              const sel = presence === o.k;
              return (
                <button key={o.k} onClick={() => onPresence(o.k)} style={{ display: 'flex', gap: 13, textAlign: 'left', padding: '14px 16px', borderRadius: 14, cursor: 'pointer', background: sel ? '#fff' : 'rgba(255,255,255,0.55)', border: sel ? '1.5px solid var(--honey)' : '1.5px solid var(--border-default)', boxShadow: sel ? '0 4px 16px rgba(230,152,44,0.14)' : 'none', transition: 'all .15s' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center', background: sel ? 'var(--honey-soft)' : 'var(--surface-muted)', color: sel ? 'var(--honey-deep)' : 'var(--text-tertiary)' }}>{React.createElement(window.I[o.icon], { size: 19, stroke: 1.9 })}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14.5, color: 'var(--text-primary)' }}>{o.name}</span>
                      {sel && React.createElement(window.I.check, { size: 16, stroke: 2.5, style: { color: 'var(--honey-deep)', marginLeft: 'auto' } })}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{o.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '22px 0 12px' }}>Ce que Maya surveille</div>
          <div style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid var(--border-default)', borderRadius: 14, overflow: 'hidden' }}>
            {[['alertTriangle', 'Alertes critiques', 'Essaimage, gel, sanitaire — Maya te prévient même en pause.', critical, () => onCritical(!critical)],
              ['sun', 'Briefing du matin', 'Un point chaque matin : priorités du jour, météo, ruches à voir.', briefing, () => onBriefing(!briefing)],
              ['mic', 'Dictée vocale', 'Noter une visite à la voix ; Maya remplit la fiche.', voice, () => onVoice(!voice)]].map(([ic, name, desc, on, tog], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', borderTop: i ? '1px solid var(--border-faint)' : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center', background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}>{React.createElement(window.I[ic], { size: 17, stroke: 1.9 })}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2, lineHeight: 1.45 }}>{desc}</div>
                </div>
                <SettingToggle on={on} onToggle={tog} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 18, fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            {React.createElement(window.I.shieldCheck, { size: 15, stroke: 1.9, style: { color: 'var(--sage)', flexShrink: 0 } })}
            Maya suit des règles apicoles éprouvées et te propose — tu gardes la main sur chaque action.
          </div>
        </div>
      </div>
    </div>
  );
};

function chipBtn(primary) {
  return primary
    ? { display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left', width: '100%', padding: '11px 14px', background: '#1c1c1e', border: '1px solid #1c1c1e', borderRadius: 12, fontSize: 13, color: '#fff', fontWeight: 600, cursor: 'pointer', boxShadow: '0 6px 16px rgba(28,28,30,0.18)', fontFamily: 'inherit' }
    : { display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left', width: '100%', padding: '11px 14px', background: '#fff', border: '1px solid var(--border-default)', borderRadius: 12, fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', boxShadow: '0 3px 10px rgba(120,100,80,0.06)', fontFamily: 'inherit' };
}

window.MayaBubbleProto = MayaBubbleProto;
