/* PAGE — Maya · Surfaces contextuelles
   Comment Maya vit dans le reste de l'app : dashboard, ⌘K, panneau latéral, launcher. */

const ctxS = {
  page: { display: 'flex', width: 1280, height: 880, background: 'var(--surface-primary)', overflow: 'hidden', fontFamily: 'var(--font-text)', position: 'relative' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  scroll: { flex: 1, overflow: 'auto', padding: '28px 36px 40px' },
  greet: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' },
  greetSub: { color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginTop: 22 },
  kpi: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 13, padding: '15px 17px' },
  kpiLbl: { fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 },
  kpiVal: { fontFamily: 'var(--font-display)', fontSize: 25, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 7 },
  kpiHint: { fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 5 },
};

/* Fond d'app réutilisable (dashboard allégé) */
const Backdrop = ({ active = 'dashboard', crumb = ['Tableau de bord'], children }) => {
  const D = window.APIGO_DATA;
  return (
    <div style={ctxS.page}>
      <window.Sidebar2 active={active} />
      <div style={ctxS.main}>
        <window.Topbar2 crumb={crumb} action="Nouvelle intervention" />
        <div style={ctxS.scroll}>
          <h1 style={ctxS.greet}>Bonjour Marc.</h1>
          <p style={ctxS.greetSub}>248 ruches surveillées sur 7 ruchers. 4 alertes à traiter aujourd'hui.</p>
          {children}
          <div style={ctxS.kpiRow}>
            <div style={ctxS.kpi}><div style={ctxS.kpiLbl}>Production 2025</div><div style={ctxS.kpiVal}>6 740<span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}> kg</span></div><div style={ctxS.kpiHint}><b style={{ color: 'var(--sage-deep)' }}>+12 %</b> · objectif 8 000</div></div>
            <div style={ctxS.kpi}><div style={ctxS.kpiLbl}>Chiffre d'affaires</div><div style={ctxS.kpiVal}>38,4<span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}> k€</span></div><div style={ctxS.kpiHint}><b style={{ color: 'var(--sage-deep)' }}>+12 %</b> · vs 2024</div></div>
            <div style={ctxS.kpi}><div style={ctxS.kpiLbl}>Interventions</div><div style={ctxS.kpiVal}>18<span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}> sem.</span></div><div style={ctxS.kpiHint}>4 planifiées aujourd'hui</div></div>
            <div style={ctxS.kpi}><div style={ctxS.kpiLbl}>Alertes ouvertes</div><div style={{ ...ctxS.kpiVal, color: 'var(--status-warn)' }}>4</div><div style={ctxS.kpiHint}>1 critique · 2 importantes</div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22, marginTop: 24 }}>
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>01 — Production</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, marginTop: 5, marginBottom: 16 }}>Récolte 2025 par mois</div>
              <window.MiniBars accent="honey" height={130} data={[{ l: 'Avr', v: 420 }, { l: 'Mai', v: 1180, hi: true }, { l: 'Juin', v: 1840, hi: true }, { l: 'Juil', v: 2150, hi: true }, { l: 'Août', v: 1320 }, { l: 'Sept', v: 380 }]} />
            </div>
            <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px 10px', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>Alertes à traiter</div>
              {D.ALERTES.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 11, padding: '12px 18px', borderTop: '1px solid var(--border-faint)', alignItems: 'flex-start' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, marginTop: 5, flexShrink: 0, background: a.sev === 'bad' ? 'var(--status-bad)' : a.sev === 'warn' ? 'var(--status-warn)' : 'var(--status-info)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{a.t}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>{a.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── 1. Maya tissée dans le dashboard (carte proactive en tête) ── */
const MayaCtxDash = () => (
  <Backdrop active="dashboard" crumb={['Tableau de bord']}>
    <div style={{ marginTop: 20, background: 'linear-gradient(130deg, #fff8ee, #fbf1e1)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: window.MAYA.grad }} />
      <window.MayaMark size={42} glow />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14.5 }}>Maya a préparé votre matinée</span>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--honey-deep)', background: 'var(--honey-soft)', padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em' }}>3 priorités</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>Risque d'essaimage au Ventoux Sud, gel lundi en altitude, et 4 ruches à visiter à la Sorgue. Je peux tout planifier en une fois.</div>
      </div>
      <button style={{ height: 38, padding: '0 18px', background: '#1c1c1e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {React.createElement(window.I.sparkles, { size: 15, stroke: 2 })} Ouvrir le briefing
      </button>
    </div>
  </Backdrop>
);
window.MayaCtxDash = MayaCtxDash;

/* ── 2. Barre de commande ⌘K (Maya + navigation) ── */
const MayaCommandK = () => (
  <div style={ctxS.page}>
    <window.Sidebar2 active="dashboard" />
    <div style={ctxS.main}>
      <window.Topbar2 crumb={['Tableau de bord']} action="Nouvelle intervention" />
      <div style={{ ...ctxS.scroll, filter: 'blur(1px)', opacity: 0.55 }}>
        <h1 style={ctxS.greet}>Bonjour Marc.</h1>
        <div style={ctxS.kpiRow}><div style={ctxS.kpi} /><div style={ctxS.kpi} /><div style={ctxS.kpi} /><div style={ctxS.kpi} /></div>
      </div>
    </div>
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,24,20,0.32)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 130 }}>
      <div style={{ width: 600, background: 'var(--surface-card)', borderRadius: 18, boxShadow: '0 30px 80px rgba(40,30,20,0.3), 0 0 0 1px var(--border-default)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: '1px solid var(--border-faint)' }}>
          <window.MayaMark size={24} />
          <input disabled placeholder="Demandez à Maya, ou tapez une commande…" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, background: 'transparent', color: 'var(--text-primary)' }} />
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', border: '1px solid var(--border-default)', borderRadius: 5, padding: '2px 7px' }}>esc</span>
        </div>
        <div style={{ padding: '8px 8px 12px', maxHeight: 420 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 12px 6px' }}>Demander à Maya</div>
          {[['alertTriangle', 'Quelles ruches dois-je visiter en priorité ?', 'honey'], ['trendUp', 'Compare ma production à l\'an dernier', 'sage'], ['mic', 'Dicter le compte-rendu de la ruche V-014', 'clay']].map(([ic, q, t], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: i === 0 ? 'var(--surface-muted)' : 'transparent' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: t === 'sage' ? 'var(--sage-soft)' : t === 'clay' ? 'var(--clay-soft)' : 'var(--honey-soft)', color: t === 'sage' ? 'var(--sage-deep)' : t === 'clay' ? 'var(--clay-deep)' : 'var(--honey-deep)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{React.createElement(window.I[ic], { size: 15, stroke: 1.9 })}</div>
              <span style={{ flex: 1, fontSize: 13.5, color: 'var(--text-primary)' }}>{q}</span>
              {i === 0 && <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>↵</span>}
            </div>
          ))}
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 12px 6px' }}>Aller à</div>
          {[['hexagon', 'Tableau de bord'], ['package', 'Ruches'], ['card', 'Finances']].map(([ic, lbl], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--surface-muted)', color: 'var(--text-secondary)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{React.createElement(window.I[ic], { size: 15 })}</div>
              <span style={{ flex: 1, fontSize: 13.5, color: 'var(--text-secondary)' }}>{lbl}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
window.MayaCommandK = MayaCommandK;

/* ── 3. Panneau latéral contextuel (ouvert sur une fiche ruche) ── */
const MayaSidePanel = () => (
  <div style={ctxS.page}>
    <window.Sidebar2 active="ruches" />
    <div style={{ ...ctxS.main, marginRight: 384 }}>
      <window.Topbar2 crumb={['Ruches', 'V-031']} />
      <div style={ctxS.scroll}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--surface-sunk)', display: 'grid', placeItems: 'center', color: 'var(--clay-deep)' }}>{React.createElement(window.I.package, { size: 26 })}</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Ruche V-031</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Prés de la Sorgue · reine 2023 · <span style={{ color: 'var(--status-bad)', fontWeight: 600 }}>affaiblie</span></div>
          </div>
        </div>
        <div style={{ ...ctxS.kpiRow, gridTemplateColumns: 'repeat(3,1fr)', marginTop: 24 }}>
          <div style={ctxS.kpi}><div style={ctxS.kpiLbl}>Dernière visite</div><div style={{ ...ctxS.kpiVal, color: 'var(--status-bad)' }}>17 j</div></div>
          <div style={ctxS.kpi}><div style={ctxS.kpiLbl}>Cadres de couvain</div><div style={ctxS.kpiVal}>3</div></div>
          <div style={ctxS.kpi}><div style={ctxS.kpiLbl}>Production 2025</div><div style={ctxS.kpiVal}>11<span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}> kg</span></div></div>
        </div>
        <div style={{ marginTop: 22, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 20, color: 'var(--text-tertiary)', fontSize: 13 }}>Historique des interventions…</div>
      </div>
    </div>
    {/* Panneau Maya */}
    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 384, background: 'var(--surface-card)', borderLeft: '1px solid var(--border-default)', boxShadow: '-12px 0 40px rgba(40,30,20,0.06)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: '1px solid var(--border-faint)' }}>
        <window.MayaMark size={26} glow />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Maya</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>au sujet de la ruche V-031</div>
        </div>
        <button style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'var(--surface-muted)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>{React.createElement(window.I.x, { size: 16 })}</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 18px 8px' }}>
        <window.MayaMessage time="" indent={false}>
          <p style={{ margin: 0 }}>Cette ruche m'inquiète un peu. <b>17 jours</b> sans visite, seulement 3 cadres de couvain et elle est marquée affaiblie depuis le 15 avril.</p>
          <p style={{ margin: '10px 0 0' }}>Je conseille une <b>visite sanitaire rapide</b> et, si le couvain reste faible, un test varroa.</p>
          <window.ActionCard icon="alertTriangle" tint="clay" title="Visite sanitaire — V-031" desc="Demain matin, intégrée à la tournée Sorgue déjà proposée." meta={[{ icon: 'clock', v: 'Mer. 07:00', l: '' }]} primary="Ajouter à la tournée" secondary="Plus tard" />
        </window.MayaMessage>
      </div>
      <div style={{ padding: '8px 16px 18px' }}>
        <window.PromptBar compact placeholder="Poser une question sur V-031…" />
      </div>
    </div>
  </div>
);
window.MayaSidePanel = MayaSidePanel;

/* ── 4. Launcher flottant + menu rapide ── */
const MayaLauncher = () => (
  <Backdrop active="ruchers" crumb={['Ruchers']}>
    <div />
  </Backdrop>
);
/* on superpose le launcher après coup via wrapper */
const MayaLauncherFull = () => (
  <div style={{ position: 'relative', width: 1280, height: 880 }}>
    <MayaLauncher />
    {/* menu rapide */}
    <div style={{ position: 'absolute', right: 28, bottom: 96, width: 320, background: 'var(--surface-card)', borderRadius: 18, boxShadow: '0 24px 60px rgba(40,30,20,0.22), 0 0 0 1px var(--border-default)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-faint)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <window.MayaMark size={28} glow />
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Bonjour Marc 👋</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>Comment puis-je aider ?</div>
        </div>
      </div>
      <div style={{ padding: 8 }}>
        {[['alertTriangle', 'Voir le briefing du jour', 'honey'], ['mic', 'Dicter une visite', 'clay'], ['plus', 'Créer une intervention', 'sage']].map(([ic, lbl, t], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 11px', borderRadius: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: t === 'sage' ? 'var(--sage-soft)' : t === 'clay' ? 'var(--clay-soft)' : 'var(--honey-soft)', color: t === 'sage' ? 'var(--sage-deep)' : t === 'clay' ? 'var(--clay-deep)' : 'var(--honey-deep)', display: 'grid', placeItems: 'center' }}>{React.createElement(window.I[ic], { size: 15, stroke: 1.9 })}</div>
            <span style={{ fontSize: 13.5 }}>{lbl}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '0 12px 12px' }}>
        <window.PromptBar compact placeholder="Écrire à Maya…" />
      </div>
    </div>
    {/* bouton */}
    <button style={{ position: 'absolute', right: 28, bottom: 24, height: 56, padding: '0 8px 0 8px', width: 56, borderRadius: 18, border: 'none', background: '#1c1c1e', boxShadow: '0 12px 30px rgba(28,28,30,0.3)', display: 'grid', placeItems: 'center' }}>
      <window.MayaMark size={30} glow />
    </button>
  </div>
);
window.MayaLauncherFull = MayaLauncherFull;
