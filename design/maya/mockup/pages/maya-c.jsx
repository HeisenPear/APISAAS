/* PAGE — Maya · Variation C — "Briefing proactif" (cards-first)
   Maya ouvre la journée : ce qu'elle a repéré, classé par priorité, avec actions. */
const mcStyles = {
  page: { display: 'flex', width: 1280, height: 880, background: 'var(--surface-primary)', overflow: 'hidden', fontFamily: 'var(--font-text)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  scroll: { flex: 1, overflow: 'auto', padding: '34px 0 24px' },
  col: { maxWidth: 760, margin: '0 auto', padding: '0 44px' },

  hero: { display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 26 },
  greet: { fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.12 },
  greetSub: { color: 'var(--text-secondary)', fontSize: 15, marginTop: 8, lineHeight: 1.55, maxWidth: 540 },

  strip: { display: 'flex', gap: 12, marginBottom: 30 },
  stripCard: { flex: 1, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 13, padding: '13px 16px' },
  stripVal: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 4 },
  stripLbl: { fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 3, fontWeight: 500 },

  feedHead: { display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 16px' },
  feedTitle: { fontSize: 11, fontWeight: 700, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.12em' },

  card: (spine) => ({ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '20px 22px', marginBottom: 14, boxShadow: 'var(--shadow-sm)', borderLeft: `3px solid ${spine}`, position: 'relative' }),
  cHead: { display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 },
  cIco: (c, bg) => ({ width: 38, height: 38, borderRadius: 11, background: bg, color: c, display: 'grid', placeItems: 'center', flexShrink: 0 }),
  cTag: (c, bg) => ({ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c, background: bg, padding: '3px 9px', borderRadius: 99 }),
  cTitle: { fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em' },
  cBody: { fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 2 },
  cFoot: { display: 'flex', gap: 9, marginTop: 15, alignItems: 'center' },
  btnPrimary: { height: 34, padding: '0 15px', background: '#1c1c1e', color: '#fff', border: 'none', borderRadius: 9, fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 7 },
  btnGhost: { height: 34, padding: '0 14px', background: 'var(--surface-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: 9, fontSize: 12.5, fontWeight: 600 },
  dismiss: { marginLeft: 'auto', fontSize: 12.5, color: 'var(--text-tertiary)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5 },

  chipRow: { display: 'flex', gap: 8, marginTop: 13, flexWrap: 'wrap' },
  hiveChip: (c) => ({ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', background: 'var(--surface-muted)', border: '1px solid var(--border-faint)', padding: '5px 10px', borderRadius: 8 }),

  promptWrap: { padding: '6px 44px 22px', background: 'linear-gradient(to top, var(--surface-primary) 72%, transparent)' },
  promptInner: { maxWidth: 760, margin: '0 auto' },
};

const MayaC = () => (
  <div style={mcStyles.page}>
    <window.Sidebar2 active="maya" />
    <div style={mcStyles.main}>
      <window.Topbar2 crumb={['Maya', 'Briefing du matin']} />
      <div style={mcStyles.scroll}>
        <div style={mcStyles.col}>
          <div style={mcStyles.hero}>
            <window.MayaMark size={52} glow />
            <div>
              <h1 style={mcStyles.greet}>Bonjour Marc 👋</h1>
              <p style={mcStyles.greetSub}>Belle matinée sur le Ventoux. J'ai veillé sur vos 248 ruches cette nuit — <b style={{ color: 'var(--text-primary)' }}>3 choses</b> méritent votre attention, rien de grave. On y va&nbsp;?</p>
            </div>
          </div>

          <div style={mcStyles.strip}>
            <div style={mcStyles.stripCard}><div style={mcStyles.stripVal}>92<span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>%</span></div><div style={mcStyles.stripLbl}>Butinage aujourd'hui</div></div>
            <div style={mcStyles.stripCard}><div style={{ ...mcStyles.stripVal, color: 'var(--status-warn)' }}>2</div><div style={mcStyles.stripLbl}>Visites prévues</div></div>
            <div style={mcStyles.stripCard}><div style={mcStyles.stripVal}>17<span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>°C</span></div><div style={mcStyles.stripLbl}>Ensoleillé · vent faible</div></div>
            <div style={mcStyles.stripCard}><div style={{ ...mcStyles.stripVal, color: 'var(--sage-deep)' }}>+12<span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>%</span></div><div style={mcStyles.stripLbl}>Production vs 2024</div></div>
          </div>

          <div style={mcStyles.feedHead}>
            <span style={mcStyles.feedTitle}>Repéré par Maya</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
          </div>

          {/* Carte 1 — essaimage (priorité) */}
          <div style={mcStyles.card('var(--status-bad)')}>
            <div style={mcStyles.cHead}>
              <div style={mcStyles.cIco('var(--status-bad)', '#f7e6e6')}>{React.createElement(window.I.alertTriangle, { size: 19, stroke: 1.9 })}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={mcStyles.cTag('var(--status-bad)', '#f7e6e6')}>À traiter vite</span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Ventoux Sud · il y a 2 h</span>
                </div>
                <div style={{ ...mcStyles.cTitle, marginTop: 5 }}>Risque d'essaimage sur 3 ruches</div>
              </div>
            </div>
            <p style={mcStyles.cBody}>J'ai repéré <b style={{ color: 'var(--text-primary)' }}>4 cellules royales</b> lors de la dernière visite, et la météo se réchauffe (24 °C jeudi). C'est le moment d'agir pour ne pas perdre l'essaim. Je conseille une <b style={{ color: 'var(--text-primary)' }}>pose de hausse</b> ou une division.</p>
            <div style={mcStyles.chipRow}>
              <span style={mcStyles.hiveChip()}><span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--status-bad)' }} />V-014</span>
              <span style={mcStyles.hiveChip()}><span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--status-bad)' }} />V-018</span>
              <span style={mcStyles.hiveChip()}><span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--status-warn)' }} />V-021</span>
            </div>
            <div style={mcStyles.cFoot}>
              <button style={mcStyles.btnPrimary}>{React.createElement(window.I.calendar, { size: 14, stroke: 2.1 })} Planifier pose de hausse</button>
              <button style={mcStyles.btnGhost}>Voir les ruches</button>
              <span style={mcStyles.dismiss}>{React.createElement(window.I.check, { size: 14 })} Ignorer</span>
            </div>
          </div>

          {/* Carte 2 — gel */}
          <div style={mcStyles.card('var(--status-warn)')}>
            <div style={mcStyles.cHead}>
              <div style={mcStyles.cIco('var(--status-warn)', 'var(--honey-soft)')}>{React.createElement(window.I.thermometer, { size: 19, stroke: 1.9 })}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={mcStyles.cTag('var(--status-warn)', 'var(--honey-soft)')}>Anticiper</span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Sault, Buoux · nuit du 4 mai</span>
                </div>
                <div style={{ ...mcStyles.cTitle, marginTop: 5 }}>Gel possible : -2 °C en altitude</div>
              </div>
            </div>
            <p style={mcStyles.cBody}>Vos ruchers d'altitude (Garrigue de Sault, Hauts de Buoux) passeront sous zéro lundi nuit. Pensez à <b style={{ color: 'var(--text-primary)' }}>réduire les entrées</b> et vérifier les réserves — je peux ajouter un rappel à votre calendrier.</p>
            <div style={mcStyles.cFoot}>
              <button style={mcStyles.btnPrimary}>{React.createElement(window.I.bell, { size: 14, stroke: 2.1 })} Créer un rappel</button>
              <button style={mcStyles.btnGhost}>Voir la météo 7 j</button>
              <span style={mcStyles.dismiss}>{React.createElement(window.I.check, { size: 14 })} Ignorer</span>
            </div>
          </div>

          {/* Carte 3 — encouragement / production */}
          <div style={mcStyles.card('var(--sage)')}>
            <div style={mcStyles.cHead}>
              <div style={mcStyles.cIco('var(--sage-deep)', 'var(--sage-soft)')}>{React.createElement(window.I.trendUp, { size: 19, stroke: 1.9 })}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={mcStyles.cTag('var(--sage-deep)', 'var(--sage-soft)')}>Bonne nouvelle</span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Récolte de printemps</span>
                </div>
                <div style={{ ...mcStyles.cTitle, marginTop: 5 }}>Vous avez dépassé votre printemps 2024</div>
              </div>
            </div>
            <p style={mcStyles.cBody}>1 180 kg récoltés en mai, soit <b style={{ color: 'var(--sage-deep)' }}>+20 %</b> par rapport à l'an dernier à la même date. Le rucher de Sault tire la saison vers le haut. Beau travail&nbsp;! 🍯</p>
            <div style={mcStyles.cFoot}>
              <button style={mcStyles.btnGhost}>Voir le détail production</button>
              <span style={mcStyles.dismiss}>{React.createElement(window.I.bookmark, { size: 14 })} Garder</span>
            </div>
          </div>
        </div>
      </div>

      <div style={mcStyles.promptWrap}>
        <div style={mcStyles.promptInner}>
          <window.PromptBar placeholder="Demandez-moi autre chose, ou dictez un compte-rendu…" contextChip="Tout le cheptel" />
        </div>
      </div>
    </div>
  </div>
);
window.MayaC = MayaC;
