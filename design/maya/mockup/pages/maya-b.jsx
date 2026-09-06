/* PAGE — Maya · Variation B — "Atelier" (split canvas)
   Conversation à gauche, espace de travail à droite où Maya construit l'artefact. */
const mbStyles = {
  page: { display: 'flex', width: 1280, height: 880, background: 'var(--surface-primary)', overflow: 'hidden', fontFamily: 'var(--font-text)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  body: { flex: 1, display: 'flex', minHeight: 0 },

  convo: { width: 468, flexShrink: 0, borderRight: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', background: 'var(--surface-primary)' },
  scroll: { flex: 1, overflow: 'auto', padding: '24px 26px 12px' },
  promptWrap: { padding: '10px 22px 20px' },

  canvas: { flex: 1, minWidth: 0, background: 'var(--surface-muted)', display: 'flex', flexDirection: 'column' },
  canvasBar: { height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '0 24px', borderBottom: '1px solid var(--border-default)', background: 'rgba(250,249,246,0.7)', backdropFilter: 'blur(8px)' },
  canvasScroll: { flex: 1, overflow: 'auto', padding: '26px 30px 40px' },
  artefact: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 18, boxShadow: 'var(--shadow-md)', overflow: 'hidden', maxWidth: 660, margin: '0 auto' },
  artHead: { padding: '22px 26px 18px', borderBottom: '1px solid var(--border-faint)' },
  artBadge: { display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 600, color: 'var(--honey-deep)', background: 'var(--honey-soft)', padding: '4px 10px', borderRadius: 99 },
  artTitle: { fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 12 },
  artSub: { fontSize: 13, color: 'var(--text-secondary)', marginTop: 5 },

  chartBox: { padding: '22px 26px' },
  legend: { display: 'flex', gap: 18, marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)' },
  legDot: (c) => ({ width: 9, height: 9, borderRadius: 3, background: c, display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }),
  bars: { display: 'flex', alignItems: 'flex-end', gap: 14, height: 180, borderBottom: '1px solid var(--border-default)', paddingBottom: 0 },
  group: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  pair: { display: 'flex', alignItems: 'flex-end', gap: 4, height: 160, width: '100%', justifyContent: 'center' },

  metrics: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: '4px 26px 22px' },
  mTile: { background: 'var(--surface-muted)', borderRadius: 13, padding: '14px 16px' },
  mVal: { fontFamily: 'var(--font-display)', fontSize: 23, fontWeight: 600, letterSpacing: '-0.02em' },
  mLbl: { fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 },

  reading: { padding: '20px 26px 24px', borderTop: '1px solid var(--border-faint)', background: 'var(--surface-primary)' },
  readRow: { display: 'flex', gap: 11, marginBottom: 13, fontSize: 13, lineHeight: 1.55, color: 'var(--text-secondary)' },
  readIco: (c, bg) => ({ width: 26, height: 26, borderRadius: 8, background: bg, color: c, display: 'grid', placeItems: 'center', flexShrink: 0 }),

  artFoot: { display: 'flex', gap: 10, padding: '16px 26px', borderTop: '1px solid var(--border-faint)' },
  footBtn: (primary) => ({ height: 36, padding: '0 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 7, border: primary ? 'none' : '1px solid var(--border-strong)', background: primary ? '#1c1c1e' : 'var(--surface-card)', color: primary ? '#fff' : 'var(--text-secondary)' }),
};

const DUO = [
  { m: 'Avr', a: 320, b: 420 }, { m: 'Mai', a: 980, b: 1180 }, { m: 'Juin', a: 1620, b: 1840 },
  { m: 'Juil', a: 1980, b: 2150 }, { m: 'Août', a: 1240, b: 1320, fc: true }, { m: 'Sept', a: 360, b: 470, fc: true },
];

const MayaB = () => {
  const max = 2300;
  return (
    <div style={mbStyles.page}>
      <window.Sidebar2 active="maya" />
      <div style={mbStyles.main}>
        <window.Topbar2 crumb={['Maya', 'Atelier · Production 2025']} />
        <div style={mbStyles.body}>
          {/* Conversation */}
          <div style={mbStyles.convo}>
            <div style={mbStyles.scroll}>
              <window.UserBubble>Compare ma production 2025 à 2024 et estime la fin de saison.</window.UserBubble>
              <window.MayaMessage time="14:02" glow>
                <p style={{ margin: 0 }}>Avec plaisir&nbsp;! Bonne nouvelle d'abord&nbsp;: vous êtes <b style={{ color: 'var(--sage-deep)' }}>+12 %</b> sur l'année. J'ai monté l'analyse complète dans l'atelier à droite — barres comparées, prévision de fin de saison et ma lecture.</p>
              </window.MayaMessage>
              <window.MayaMessage time="14:02">
                <p style={{ margin: '0 0 10px' }}>En résumé&nbsp;:</p>
                <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                  <li>Juin a été votre meilleur mois (<b style={{ color: 'var(--text-primary)' }}>+14 %</b> vs 2024).</li>
                  <li>Le creux d'août est normal — c'est la sécheresse sur la lavande.</li>
                  <li>Je projette <b style={{ color: 'var(--text-primary)' }}>~7 210 kg</b> en fin de saison, soit 90 % de votre objectif.</li>
                </ul>
                <window.SourceChips items={[{ icon: 'database', label: 'Récoltes 2024-25' }, { icon: 'cloud', label: 'Météo saison' }]} />
                <window.MsgActions />
              </window.MayaMessage>
            </div>
            <div style={mbStyles.promptWrap}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <window.SuggestionChip icon="pin" tint="sage">Par rucher&nbsp;?</window.SuggestionChip>
                <window.SuggestionChip icon="trendUp">Comment atteindre l'objectif&nbsp;?</window.SuggestionChip>
              </div>
              <window.PromptBar compact placeholder="Affiner l'analyse…" />
            </div>
          </div>

          {/* Atelier / canvas */}
          <div style={mbStyles.canvas}>
            <div style={mbStyles.canvasBar}>
              <window.MayaMark size={20} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Atelier de Maya</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>· généré il y a 1 min</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--surface-card)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>{React.createElement(window.I.refresh, { size: 15 })}</button>
                <button style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--surface-card)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>{React.createElement(window.I.external, { size: 15 })}</button>
              </div>
            </div>
            <div style={mbStyles.canvasScroll}>
              <div style={mbStyles.artefact}>
                <div style={mbStyles.artHead}>
                  <span style={mbStyles.artBadge}>{React.createElement(window.I.sparkles, { size: 13, stroke: 2 })} Analyse Maya</span>
                  <div style={mbStyles.artTitle}>Production de miel — saison 2025</div>
                  <div style={mbStyles.artSub}>Miellerie du Ventoux · 7 ruchers · comparaison 2024 → 2025 et projection</div>
                </div>

                <div style={mbStyles.chartBox}>
                  <div style={mbStyles.legend}>
                    <span><span style={mbStyles.legDot('var(--surface-sunk)')} />2024</span>
                    <span><span style={mbStyles.legDot('#f5a623')} />2025</span>
                    <span><span style={mbStyles.legDot('repeating-linear-gradient(45deg,#cdbd9a,#cdbd9a 3px,#fff 3px,#fff 6px)')} />Prévision</span>
                  </div>
                  <div style={mbStyles.bars}>
                    {DUO.map((d, i) => (
                      <div key={i} style={mbStyles.group}>
                        <div style={mbStyles.pair}>
                          <div style={{ width: 16, height: `${(d.a / max) * 160}px`, background: 'var(--surface-sunk)', borderRadius: '3px 3px 0 0' }} />
                          <div style={{ width: 16, height: `${(d.b / max) * 160}px`, borderRadius: '3px 3px 0 0', background: d.fc ? 'repeating-linear-gradient(45deg,#f0c982,#f0c982 3px,#fff7e8 3px,#fff7e8 6px)' : 'linear-gradient(to top,#f5a623,#fbc56a)', border: d.fc ? '1px dashed var(--honey-dark)' : 'none' }} />
                        </div>
                        <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{d.m}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={mbStyles.metrics}>
                  <div style={mbStyles.mTile}><div style={mbStyles.mVal}>6 740 <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>kg</span></div><div style={mbStyles.mLbl}>Récolté à ce jour</div></div>
                  <div style={mbStyles.mTile}><div style={{ ...mbStyles.mVal, color: 'var(--sage-deep)' }}>+12 %</div><div style={mbStyles.mLbl}>vs 2024</div></div>
                  <div style={mbStyles.mTile}><div style={mbStyles.mVal}>~7 210 <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>kg</span></div><div style={mbStyles.mLbl}>Prévision fin saison</div></div>
                </div>

                <div style={mbStyles.reading}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--honey-deep)', marginBottom: 14 }}>La lecture de Maya</div>
                  <div style={mbStyles.readRow}><span style={mbStyles.readIco('var(--sage-deep)', 'var(--sage-soft)')}>{React.createElement(window.I.trendUp, { size: 15, stroke: 2 })}</span><span><b style={{ color: 'var(--text-primary)' }}>Juin porte votre saison.</b> 1 840 kg, votre meilleur mois — la miellée de lavande de Sault a été exceptionnelle cette année.</span></div>
                  <div style={mbStyles.readRow}><span style={mbStyles.readIco('var(--status-warn)', 'var(--honey-soft)')}>{React.createElement(window.I.thermometer, { size: 15, stroke: 2 })}</span><span><b style={{ color: 'var(--text-primary)' }}>Le creux d'août est attendu.</b> La sécheresse a réduit le nectar — rien d'inquiétant, c'est cohérent avec la météo.</span></div>
                  <div style={{ ...mbStyles.readRow, marginBottom: 0 }}><span style={mbStyles.readIco('var(--honey-deep)', 'var(--honey-soft)')}>{React.createElement(window.I.zap, { size: 15, stroke: 2 })}</span><span><b style={{ color: 'var(--text-primary)' }}>90 % de l'objectif en vue.</b> Pour viser les 8 000 kg, je conseille de pousser le miellat de châtaignier au Comtat — voulez-vous que je le planifie&nbsp;?</span></div>
                </div>

                <div style={mbStyles.artFoot}>
                  <button style={mbStyles.footBtn(true)}>{React.createElement(window.I.check, { size: 15, stroke: 2.2 })} Enregistrer dans Production</button>
                  <button style={mbStyles.footBtn(false)}>{React.createElement(window.I.download, { size: 15 })} Export PDF</button>
                  <button style={mbStyles.footBtn(false)}>{React.createElement(window.I.bookmark, { size: 15 })} Épingler</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.MayaB = MayaB;
