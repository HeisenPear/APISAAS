/* PAGE — Maya · PWA mobile (le cœur social)
   Maya = binôme déterministe & chaleureux. Pas de chat libre : interactions guidées,
   cartes prévisibles, règles apicoles éprouvées. Présence qui veille, célèbre, prend soin. */

/* ── Coquille mobile : header app + scroll + tab bar ── */
const pwa = {
  root: { height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface-primary)' },
  scroll: { flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' },
  appbar: { paddingTop: 56, padding: '56px 20px 0', display: 'flex', alignItems: 'center', gap: 10 },
  appday: { fontSize: 12.5, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' },

  presence: { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px 6px' },
  greet: { fontFamily: 'var(--font-display)', fontSize: 27, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1 },
  status: { display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 7, fontSize: 13, color: 'var(--sage-deep)', fontWeight: 500, background: 'var(--sage-soft)', padding: '5px 11px', borderRadius: 99 },

  section: { padding: '0 16px', marginTop: 18 },
  secLabel: { fontSize: 11, fontWeight: 700, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 4px 10px', display: 'flex', alignItems: 'center', gap: 8 },

  pulse: { display: 'flex', gap: 9, padding: '0 16px', marginTop: 16 },
  pulseCard: { flex: 1, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '12px 12px 11px', textAlign: 'center' },
  pulseV: { fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em' },
  pulseL: { fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 3, fontWeight: 500 },

  hero: { margin: '16px', borderRadius: 20, padding: 18, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #fff6e9 0%, #f1f4ee 100%)' },

  tabbar: { flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '10px 14px 26px', background: 'rgba(250,249,246,0.94)', backdropFilter: 'blur(14px)', borderTop: '1px solid var(--border-faint)' },
  tab: (active) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: active ? 'var(--text-primary)' : 'var(--text-tertiary)', fontSize: 10, fontWeight: active ? 600 : 500, flex: 1 }),
};

const MayaTabBar = ({ active = 'today' }) => (
  <div style={pwa.tabbar}>
    {[['today', 'sun', 'Aujourd\'hui'], ['ruchers', 'pin', 'Ruchers']].map(([id, ic, lbl]) => (
      <div key={id} style={pwa.tab(active === id)}>{React.createElement(window.I[ic], { size: 22, stroke: active === id ? 2.1 : 1.8 })}<span>{lbl}</span></div>
    ))}
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
      <button style={{ width: 56, height: 56, borderRadius: 19, border: 'none', background: '#1c1c1e', boxShadow: '0 8px 20px rgba(28,28,30,0.28)', display: 'grid', placeItems: 'center', marginBottom: 2 }}>
        <window.MayaMark size={30} glow />
      </button>
    </div>
    {[['carnet', 'fileText', 'Carnet'], ['profil', 'user', 'Profil']].map(([id, ic, lbl]) => (
      <div key={id} style={pwa.tab(active === id)}>{React.createElement(window.I[ic], { size: 22, stroke: active === id ? 2.1 : 1.8 })}<span>{lbl}</span></div>
    ))}
  </div>
);
window.MayaTabBar = MayaTabBar;

/* ── A. Accueil PWA — Maya, le cœur ── */
const MayaPwaHome = () => (
  <window.IOSDevice width={402} height={874}>
    <div style={pwa.root}>
      <div style={pwa.scroll}>
        <div style={pwa.appbar}>
          <span style={pwa.appday}>Sam. 2 mai</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>{React.createElement(window.I.sun, { size: 15, style: { color: 'var(--honey)' } })} 17°C</div>
        </div>

        <div style={pwa.presence}>
          <window.MayaMark size={50} glow state="idle" />
          <div style={{ flex: 1 }}>
            <h1 style={pwa.greet}>Bonjour Marc ☀️</h1>
            <div style={pwa.status}><span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--sage)' }} />J'ai veillé cette nuit — tout est calme 🌙</div>
          </div>
        </div>

        {/* pouls du rucher — jauge + signes vitaux */}
        <div style={{ margin: '18px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px 10px', fontSize: 11, fontWeight: 700, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {React.createElement(window.I.hexagon, { size: 13, stroke: 2 })} Le pouls du rucher
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 18, padding: '18px 20px', boxShadow: 'var(--shadow-xs)' }}>
            <window.RingGauge value={92} size={94} stroke={10}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 25, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>92<span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>%</span></div>
                <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 3 }}>butinage</div>
              </div>
            </window.RingGauge>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['var(--sage)', 'Ruches en forme', '238', 'var(--sage-deep)'], ['var(--status-warn)', 'À surveiller', '3', 'var(--status-warn)'], ['var(--honey)', "Aujourd'hui", '17°C ☀️', 'var(--text-primary)']].map(([dot, lbl, val, vc], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 99, background: dot, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{lbl}</span>
                  <span style={{ fontSize: 14.5, fontWeight: 700, fontFamily: 'var(--font-display)', color: vc }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* hero : matinée préparée */}
        <div style={{ margin: 16, borderRadius: 20, padding: 18, position: 'relative', overflow: 'hidden', background: 'linear-gradient(140deg, #fff7ec, #fbf1e1)', border: '1px solid var(--border-default)' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,166,35,0.18), transparent 70%)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, position: 'relative' }}>
            <window.MayaMark size={24} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>J'ai préparé ta matinée</span>
          </div>
          <p style={{ margin: '11px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--text-secondary)', position: 'relative' }}>3 choses à regarder, rien de grave. On commence par le Ventoux Sud&nbsp;? Je t'accompagne.</p>
          <button style={{ marginTop: 15, width: '100%', height: 46, background: '#1c1c1e', color: '#fff', border: 'none', borderRadius: 13, fontSize: 14.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative' }}>
            Voir le point du jour {React.createElement(window.I.arrowUpRight, { size: 17, stroke: 2.2 })}
          </button>
        </div>

        {/* récolte — sparkline */}
        <div style={{ margin: '14px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 18, padding: '16px 20px', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Récolte 2025</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 23, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 5 }}>6 740 <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>kg</span></div>
              <div style={{ fontSize: 12.5, color: 'var(--sage-deep)', fontWeight: 600, marginTop: 3 }}>↑ 12 % vs 2024</div>
            </div>
            <window.Sparkline data={[420, 1180, 1840, 2150, 1320, 380]} width={120} height={54} />
          </div>
        </div>

        {/* carte priorité déterministe */}
        <div style={pwa.section}>
          <div style={pwa.secLabel}>{React.createElement(window.I.shieldCheck, { size: 13, stroke: 2 })} Repéré par mes règles</div>
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderLeft: '3px solid var(--status-bad)', borderRadius: 15, padding: 16, boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f7e6e6', color: 'var(--status-bad)', display: 'grid', placeItems: 'center' }}>{React.createElement(window.I.alertTriangle, { size: 17, stroke: 1.9 })}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14.5 }}>Risque d'essaimage</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Ventoux Sud · 3 ruches</div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)' }}><b style={{ color: 'var(--text-primary)' }}>Règle :</b> 4 cellules royales + chaleur qui monte. Une pose de hausse aujourd'hui et c'est réglé — je te montre&nbsp;?</p>
            <div style={{ display: 'flex', gap: 9, marginTop: 13 }}>
              <button style={{ flex: 1, height: 42, background: '#1c1c1e', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13.5, fontWeight: 600 }}>Planifier avec Maya</button>
              <button style={{ height: 42, width: 46, background: 'var(--surface-card)', border: '1px solid var(--border-strong)', borderRadius: 12, display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>{React.createElement(window.I.chevronRight, { size: 18 })}</button>
            </div>
          </div>
        </div>

        {/* actions guidées — pas de saisie libre */}
        <div style={{ ...pwa.section, marginBottom: 14 }}>
          <div style={pwa.secLabel}>{React.createElement(window.I.heart, { size: 13, stroke: 2, fill: 'var(--clay-soft)' })} On fait quoi ensemble ?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[['mic', 'Noter une visite', 'clay'], ['pin', 'Mes ruches à voir', 'honey'], ['trendUp', 'Le point production', 'sage'], ['smile', 'Comment tu vas, Maya ?', 'honey']].map(([ic, lbl, t], i) => (
              <div key={i} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '13px 13px', display: 'flex', flexDirection: 'column', gap: 9, minHeight: 84 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: t === 'sage' ? 'var(--sage-soft)' : t === 'clay' ? 'var(--clay-soft)' : 'var(--honey-soft)', color: t === 'sage' ? 'var(--sage-deep)' : t === 'clay' ? 'var(--clay-deep)' : 'var(--honey-deep)', display: 'grid', placeItems: 'center' }}>{React.createElement(window.I[ic], { size: 17, stroke: 1.9 })}</div>
                <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <MayaTabBar active="today" />
    </div>
  </window.IOSDevice>
);
window.MayaPwaHome = MayaPwaHome;

/* ── B. Parcours guidé déterministe (remplace le chat libre) ── */
const GBubble = ({ children }) => (
  <div className="maya-msg-in" style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', gap: 9, marginBottom: 7 }}><window.MayaMark size={24} /><span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13.5, alignSelf: 'center' }}>Maya</span></div>
    <div style={{ marginLeft: 33, fontSize: 14.5, lineHeight: 1.55 }}>{children}</div>
  </div>
);
const TapChip = ({ children, picked }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 15px', borderRadius: 13, fontSize: 14, fontWeight: 600, border: picked ? 'none' : '1.5px solid var(--border-strong)', background: picked ? 'var(--surface-sunk)' : 'var(--surface-card)', color: 'var(--text-primary)' }}>{children}</div>
);

const MayaPwaGuided = () => (
  <window.IOSDevice width={402} height={874}>
    <div style={pwa.root}>
      <div style={{ paddingTop: 56, padding: '56px 18px 12px', display: 'flex', alignItems: 'center', gap: 11, borderBottom: '1px solid var(--border-faint)' }}>
        <window.MayaMark size={32} glow />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>Maya</div>
          <div style={{ fontSize: 12, color: 'var(--sage-deep)' }}>On avance pas à pas, ensemble</div>
        </div>
        <button style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--surface-card)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>{React.createElement(window.I.x, { size: 17 })}</button>
      </div>

      <div style={{ ...pwa.scroll, padding: '18px 16px 8px' }}>
        <GBubble>Salut Marc&nbsp;👋 On regarde quoi en premier&nbsp;?</GBubble>
        {/* réponse de l'utilisateur = un tap, pas du texte libre */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
          <TapChip picked>{React.createElement(window.I.pin, { size: 16, stroke: 2, style: { color: 'var(--honey-deep)' } })} Mes ruches à visiter</TapChip>
        </div>

        <GBubble>
          <p style={{ margin: 0 }}>Bien vu. <b>4 ruches</b> attendent une visite — je les ai triées par urgence pour toi&nbsp;:</p>
          <div style={{ marginTop: 12 }}>
            <window.HiveTable rows={[{ id: 'V-031', rucher: 'Sorgue', visit: '17 j', sev: 'bad' }, { id: 'V-034', rucher: 'Sorgue', visit: '17 j', sev: 'bad' }, { id: 'V-009', rucher: 'Sault', visit: '12 j', sev: 'warn' }]} cols={['Ruche', 'Rucher', 'Retard', '']} />
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 13.5, color: 'var(--text-secondary)' }}>La Sorgue m'inquiète un peu — on y va demain à la fraîche&nbsp;?</p>
        </GBubble>

        {/* prochaines réponses = des taps déterministes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginLeft: 33, marginTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Tu réponds en un geste</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
            <TapChip>{React.createElement(window.I.calendar, { size: 16, stroke: 2, style: { color: 'var(--sage-deep)' } })} Oui, planifie demain</TapChip>
            <TapChip>Voir une ruche</TapChip>
            <TapChip>Plus tard</TapChip>
          </div>
        </div>
      </div>

      {/* barre d'actions guidées (pas de clavier libre) */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 30px', borderTop: '1px solid var(--border-faint)', background: 'rgba(250,249,246,0.95)' }}>
        <button style={{ flex: 1, height: 46, borderRadius: 14, border: '1px solid var(--border-strong)', background: 'var(--surface-card)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{React.createElement(window.I.grid, { size: 17 })} Menu</button>
        <button style={{ flex: 1, height: 46, borderRadius: 14, border: 'none', background: window.MAYA.grad, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>{React.createElement(window.I.mic, { size: 17, stroke: 2 })} Parler à Maya</button>
      </div>
    </div>
  </window.IOSDevice>
);
window.MayaPwaGuided = MayaPwaGuided;

/* ── C. Moment humain — le bilan chaleureux ── */
const MayaPwaRecap = () => (
  <window.IOSDevice width={402} height={874}>
    <div style={pwa.root}>
      <div style={pwa.scroll}>
        <div style={{ paddingTop: 64, textAlign: 'center', padding: '64px 28px 0' }}>
          <div style={{ display: 'inline-grid', placeItems: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%', background: 'radial-gradient(circle, rgba(122,150,118,0.35), transparent 70%)', animation: 'maya-halo 3.2s ease-in-out infinite' }} />
            <window.MayaMark size={60} state="idle" />
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--sage-deep)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 16 }}>Ton bilan de la semaine</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 25, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 8, lineHeight: 1.15 }}>On a bien travaillé, Marc 🍯</h1>
        </div>

        <p style={{ margin: '16px 24px 0', fontSize: 15, lineHeight: 1.6, color: 'var(--text-secondary)', textAlign: 'center' }}>Cette semaine, on a visité <b style={{ color: 'var(--text-primary)' }}>23 ruches</b>, récolté <b style={{ color: 'var(--text-primary)' }}>142 kg</b> de miel de printemps, et rattrapé la <b style={{ color: 'var(--text-primary)' }}>V-031</b> juste à temps. Je suis fière de nous.</p>

        <div style={{ display: 'flex', gap: 10, padding: '20px 16px 0' }}>
          {[['23', 'Visites', 'honey'], ['142', 'kg miel', 'sage'], ['+20%', 'vs 2024', 'sage']].map(([v, l, t], i) => (
            <div key={i} style={{ flex: 1, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 15, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: t === 'sage' ? 'var(--sage-deep)' : 'var(--text-primary)' }}>{v}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 4, fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* célébration */}
        <div style={{ margin: '16px', borderRadius: 18, padding: 18, background: 'linear-gradient(140deg, #fbf1e1, #fff7ec)', border: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: '#fff', display: 'grid', placeItems: 'center', color: 'var(--honey-deep)', boxShadow: 'var(--shadow-xs)' }}>{React.createElement(window.I.crown, { size: 19, stroke: 1.9 })}</div>
            <div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>Record de printemps battu</div><div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Sault tire toute la saison vers le haut.</div></div>
          </div>
        </div>

        {/* prendre soin de l'apiculteur */}
        <div style={{ margin: '0 16px 18px', padding: '16px 18px', borderRadius: 18, background: 'var(--surface-ink)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
            {React.createElement(window.I.moon, { size: 17, style: { color: '#f5a623' } })}
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14.5 }}>Repose-toi ce week-end</span>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.7)' }}>Je garde un œil sur tes 248 ruches. Si quoi que ce soit bouge, je te préviens — sinon, profite. 🐝</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 12, fontSize: 12.5, color: '#9fd0a0', fontWeight: 600 }}><span style={{ width: 7, height: 7, borderRadius: 99, background: '#7a9676' }} />Surveillance active la nuit</div>
        </div>
      </div>
      <MayaTabBar active="today" />
    </div>
  </window.IOSDevice>
);
window.MayaPwaRecap = MayaPwaRecap;
