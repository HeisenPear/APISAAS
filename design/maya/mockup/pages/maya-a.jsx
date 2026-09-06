/* PAGE — Maya · Variation A — "Conversation enrichie"
   Rail de fils + colonne de conversation centrée, réponses riches inline. */
const maStyles = {
  page: { display: 'flex', width: 1280, height: 880, background: 'var(--surface-primary)', overflow: 'hidden', fontFamily: 'var(--font-text)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  body: { flex: 1, display: 'flex', minHeight: 0 },

  rail: { width: 244, flexShrink: 0, borderRight: '1px solid var(--border-default)', background: 'var(--surface-muted)', display: 'flex', flexDirection: 'column', padding: '18px 14px' },
  newBtn: { display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', borderRadius: 11, background: '#1c1c1e', color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', boxShadow: 'var(--shadow-sm)' },
  railGroup: { fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.09em', padding: '20px 8px 8px' },
  thread: (active) => ({ padding: '9px 11px', borderRadius: 9, fontSize: 12.5, color: active ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: active ? 600 : 500, background: active ? 'var(--surface-card)' : 'transparent', border: active ? '1px solid var(--border-default)' : '1px solid transparent', cursor: 'pointer', marginBottom: 2, lineHeight: 1.3 }),
  threadMeta: { fontSize: 11, color: 'var(--text-quaternary)', marginTop: 2 },

  convo: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' },
  scroll: { flex: 1, overflow: 'auto', padding: '26px 0 20px' },
  col: { maxWidth: 720, margin: '0 auto', padding: '0 40px' },
  promptWrap: { padding: '0 40px 22px', background: 'linear-gradient(to top, var(--surface-primary) 70%, transparent)' },
  promptInner: { maxWidth: 720, margin: '0 auto' },

  metricRow: { display: 'flex', gap: 10, marginTop: 14 },
  metric: { flex: 1, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '12px 14px' },
  metricVal: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' },
  metricLbl: { fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 },
};

const MayaA = () => {
  const hives = [
    { id: 'V-031', rucher: 'Prés de la Sorgue', visit: 'il y a 17 j', sev: 'bad' },
    { id: 'V-034', rucher: 'Prés de la Sorgue', visit: 'il y a 17 j', sev: 'bad' },
    { id: 'V-009', rucher: 'Garrigue de Sault', visit: 'il y a 12 j', sev: 'warn' },
    { id: 'V-022', rucher: 'Garrigue de Sault', visit: 'il y a 11 j', sev: 'warn' },
  ];
  return (
    <div style={maStyles.page}>
      <window.Sidebar2 active="maya" />
      <div style={maStyles.main}>
        <window.Topbar2 crumb={['Maya', 'Visites en retard']} />
        <div style={maStyles.body}>
          {/* Rail de conversations */}
          <aside style={maStyles.rail}>
            <button style={maStyles.newBtn}>{React.createElement(window.I.plus, { size: 15, stroke: 2.4 })} Nouvelle conversation</button>
            <div style={maStyles.railGroup}>Aujourd'hui</div>
            <div style={maStyles.thread(true)}>Visites en retard · Sorgue<div style={maStyles.threadMeta}>4 ruches identifiées</div></div>
            <div style={maStyles.thread(false)}>Risque d'essaimage Ventoux<div style={maStyles.threadMeta}>il y a 2 h</div></div>
            <div style={maStyles.railGroup}>Cette semaine</div>
            <div style={maStyles.thread(false)}>Bilan production avril<div style={maStyles.threadMeta}>lun.</div></div>
            <div style={maStyles.thread(false)}>Plan de traitement varroa<div style={maStyles.threadMeta}>dim.</div></div>
            <div style={maStyles.thread(false)}>Compte-rendu V-014 (vocal)<div style={maStyles.threadMeta}>sam.</div></div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 11px', fontSize: 12, color: 'var(--text-secondary)', borderTop: '1px solid var(--border-default)' }}>
              {React.createElement(window.I.history, { size: 14 })} Tout l'historique
            </div>
          </aside>

          {/* Conversation */}
          <div style={maStyles.convo}>
            <div style={maStyles.scroll}>
              <div style={maStyles.col}>
                <window.UserBubble>Quelles ruches n'ont pas été visitées depuis plus de 10 jours&nbsp;?</window.UserBubble>

                <window.MayaMessage time="09:24" glow>
                  <p style={{ margin: 0 }}>Bonne question, Marc — mieux vaut s'en occuper avant la grande miellée. J'ai trouvé <b>4 ruches</b> sans visite depuis plus de 10 jours, dont 2 que je surveillerais en priorité au rucher <b>Prés de la Sorgue</b> (déjà signalé affaibli).</p>

                  <div style={maStyles.metricRow}>
                    <div style={maStyles.metric}><div style={{ ...maStyles.metricVal, color: 'var(--status-bad)' }}>2</div><div style={maStyles.metricLbl}>À voir vite</div></div>
                    <div style={maStyles.metric}><div style={{ ...maStyles.metricVal, color: 'var(--status-warn)' }}>2</div><div style={maStyles.metricLbl}>À surveiller</div></div>
                    <div style={maStyles.metric}><div style={maStyles.metricVal}>17<span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}> j</span></div><div style={maStyles.metricLbl}>Retard max</div></div>
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <window.HiveTable rows={hives} />
                  </div>

                  <window.ActionCard
                    icon="calendar" tint="honey"
                    title="Planifier une tournée au rucher Prés de la Sorgue"
                    desc="Je peux bloquer un créneau demain matin (météo favorable, butinage 78 %) et préparer la fiche des 4 ruches."
                    meta={[{ icon: 'clock', v: 'Mer. 06:30', l: '' }, { icon: 'pin', v: '4 ruches', l: '· Sorgue' }, { icon: 'cloud', v: '17 °C', l: 'ensoleillé' }]}
                    primary="Planifier la tournée" secondary="Choisir le créneau"
                  />

                  <window.SourceChips items={[{ icon: 'package', label: '248 ruches' }, { icon: 'calendar', label: 'Interventions · 30 j' }, { icon: 'alertTriangle', label: 'Alerte Sorgue' }]} />
                  <window.MsgActions />
                </window.MayaMessage>
              </div>
            </div>

            <div style={maStyles.promptWrap}>
              <div style={maStyles.promptInner}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <window.SuggestionChip icon="trendUp" tint="sage">Compare à l'an dernier</window.SuggestionChip>
                  <window.SuggestionChip icon="flame" tint="clay">Risque varroa sur ces ruches&nbsp;?</window.SuggestionChip>
                  <window.SuggestionChip icon="fileText">Génère la feuille de visite</window.SuggestionChip>
                </div>
                <window.PromptBar contextChip="Tout le cheptel" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.MayaA = MayaA;
