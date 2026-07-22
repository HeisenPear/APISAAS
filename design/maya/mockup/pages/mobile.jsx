/* PAGE — Maya · Mobile terrain (iOS) : conversation, capture vocale, contexte ruche */

/* ── A. Accueil / conversation Maya (terrain) ── */
const MayaMobChat = () => (
  <window.IOSDevice width={402} height={874}>
    <div style={{ minHeight: '100%', background: 'var(--surface-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div style={{ paddingTop: 58, paddingBottom: 12, paddingLeft: 18, paddingRight: 18, display: 'flex', alignItems: 'center', gap: 11, borderBottom: '1px solid var(--border-faint)', background: 'rgba(250,249,246,0.9)', backdropFilter: 'blur(8px)' }}>
        <window.MayaMark size={32} glow />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17 }}>Maya</div>
          <div style={{ fontSize: 12, color: 'var(--sage-deep)', display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--sage)' }} />En ligne · sur le terrain</div>
        </div>
        <button style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--surface-card)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>{React.createElement(window.I.history, { size: 17 })}</button>
      </div>

      <div style={{ flex: 1, padding: '18px 16px 12px' }}>
        <div className="maya-msg-in" style={{ marginBottom: 18 }}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6 }}>Bonjour Marc&nbsp;! Vous êtes au rucher du <b>Ventoux Sud</b>. Je garde un œil sur vos ruches — que voulez-vous faire&nbsp;?</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 13, boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--clay-soft)', color: 'var(--clay-deep)', display: 'grid', placeItems: 'center' }}>{React.createElement(window.I.mic, { size: 18, stroke: 1.9 })}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>Dicter une visite</div><div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Maya remplit la fiche pour vous</div></div>
            {React.createElement(window.I.chevronRight, { size: 17, style: { color: 'var(--text-quaternary)' } })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 13, boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--honey-soft)', color: 'var(--honey-deep)', display: 'grid', placeItems: 'center' }}>{React.createElement(window.I.alertTriangle, { size: 18, stroke: 1.9 })}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>Quelles ruches voir ici&nbsp;?</div><div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>3 prioritaires sur ce rucher</div></div>
            {React.createElement(window.I.chevronRight, { size: 17, style: { color: 'var(--text-quaternary)' } })}
          </div>
        </div>

        {/* exchange */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div style={{ maxWidth: '82%', background: 'var(--surface-sunk)', padding: '10px 14px', borderRadius: '16px 16px 4px 16px', fontSize: 14, lineHeight: 1.5 }}>La V-014, ça donne quoi&nbsp;?</div>
        </div>
        <div className="maya-msg-in">
          <div style={{ display: 'flex', gap: 9, marginBottom: 7 }}><window.MayaMark size={22} /><span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13.5, alignSelf: 'center' }}>Maya</span></div>
          <p style={{ margin: '0 0 0 31px', fontSize: 14, lineHeight: 1.55, color: 'var(--text-primary)' }}>Attention sur celle-là&nbsp;: <b>4 cellules royales</b> au dernier contrôle. Risque d'essaimage élevé avec la chaleur qui arrive. Je pose une hausse&nbsp;?</p>
        </div>
      </div>

      {/* prompt */}
      <div style={{ padding: '8px 14px 30px', background: 'rgba(250,249,246,0.95)', backdropFilter: 'blur(8px)', borderTop: '1px solid var(--border-faint)' }}>
        <window.PromptBar compact placeholder="Écrire à Maya…" />
      </div>
    </div>
  </window.IOSDevice>
);
window.MayaMobChat = MayaMobChat;

/* ── B. Capture vocale — moment IA plein écran ── */
const MayaMobVoice = () => (
  <window.IOSDevice width={402} height={874} dark>
    <div style={{ minHeight: '100%', background: 'radial-gradient(120% 80% at 50% 0%, #2a2a2c, #161617 60%)', display: 'flex', flexDirection: 'column', color: '#fff', position: 'relative' }}>
      <div style={{ paddingTop: 64, textAlign: 'center' }}>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Compte-rendu vocal</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginTop: 4 }}>Ruche V-014 · Ventoux Sud</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26, padding: '0 28px' }}>
        <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
          <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,166,35,0.35), transparent 68%)', animation: 'maya-halo 3s ease-in-out infinite' }} />
          <window.MayaMark size={92} />
        </div>
        <window.Waveform bars={32} height={34} color="rgba(245,166,35,0.95)" />
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Maya vous écoute…</div>
      </div>

      {/* live transcript + structured fields */}
      <div style={{ margin: '0 16px', padding: '16px 18px', background: 'rgba(255,255,255,0.06)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: 14, lineHeight: 1.55, color: 'rgba(255,255,255,0.92)' }}>« …six cadres de couvain, bien compact. J'ai vu la reine, elle pond bien. Réserves correctes, j'ai posé une <span style={{ color: '#f5a623' }}>hausse</span>… »</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {[['Couvain', '6 cadres'], ['Reine', 'vue ✓'], ['Réserves', 'OK'], ['Action', 'Hausse posée']].map(([k, v], i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, background: 'rgba(245,166,35,0.16)', border: '1px solid rgba(245,166,35,0.3)', color: '#fbd089', padding: '5px 10px', borderRadius: 99 }}>
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>{k}</span><b style={{ fontWeight: 600 }}>{v}</b>
            </span>
          ))}
        </div>
      </div>

      {/* controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30, padding: '22px 0 40px' }}>
        <button style={{ width: 52, height: 52, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', display: 'grid', placeItems: 'center' }}>{React.createElement(window.I.x, { size: 22 })}</button>
        <button style={{ width: 76, height: 76, borderRadius: '50%', border: 'none', background: window.MAYA.grad, boxShadow: '0 10px 30px rgba(245,166,35,0.45)', display: 'grid', placeItems: 'center', color: '#fff' }}>{React.createElement(window.I.square, { size: 30 })}</button>
        <button style={{ width: 52, height: 52, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', display: 'grid', placeItems: 'center' }}>{React.createElement(window.I.check, { size: 24, stroke: 2.2 })}</button>
      </div>
    </div>
  </window.IOSDevice>
);
window.MayaMobVoice = MayaMobVoice;

/* ── C. Maya contextuelle sur une fiche ruche + launcher ── */
const MayaMobContext = () => (
  <window.IOSDevice width={402} height={874}>
    <div style={{ minHeight: '100%', background: 'var(--surface-primary)', position: 'relative' }}>
      <div style={{ paddingTop: 58, paddingBottom: 14, paddingLeft: 18, paddingRight: 18, borderBottom: '1px solid var(--border-faint)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-tertiary)' }}>{React.createElement(window.I.chevronLeft, { size: 16 })} Ruches</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginTop: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: 'var(--surface-sunk)', display: 'grid', placeItems: 'center', color: 'var(--clay-deep)' }}>{React.createElement(window.I.package, { size: 24 })}</div>
          <div><div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600 }}>V-031</div><div style={{ fontSize: 12.5, color: 'var(--status-bad)', fontWeight: 600 }}>Affaiblie · Sorgue</div></div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
          {[['Visite', '17 j', 'bad'], ['Couvain', '3', ''], ['Miel', '11 kg', '']].map(([l, v, s], i) => (
            <div key={i} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 12, padding: '12px 12px' }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{l}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, marginTop: 5, color: s === 'bad' ? 'var(--status-bad)' : 'var(--text-primary)' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Maya inline card */}
        <div style={{ background: 'linear-gradient(130deg, #fff8ee, #fbf1e1)', border: '1px solid var(--border-default)', borderRadius: 16, padding: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: window.MAYA.grad }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
            <window.MayaMark size={26} glow />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>Maya s'inquiète pour cette ruche</span>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-secondary)' }}>17 jours sans visite et couvain faible. Une <b style={{ color: 'var(--text-primary)' }}>visite sanitaire</b> demain matin&nbsp;?</p>
          <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
            <button style={{ flex: 1, height: 42, background: '#1c1c1e', color: '#fff', border: 'none', borderRadius: 11, fontSize: 13.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>{React.createElement(window.I.calendar, { size: 16, stroke: 2 })} Planifier</button>
            <button style={{ height: 42, padding: '0 16px', background: 'var(--surface-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: 11, fontSize: 13.5, fontWeight: 600 }}>Plus tard</button>
          </div>
        </div>

        <div style={{ marginTop: 16, fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>Historique</div>
        <div style={{ marginTop: 10, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 13, padding: '14px 16px', fontSize: 13, color: 'var(--text-tertiary)' }}>15 avr. · Visite sanitaire — affaiblie</div>
      </div>

      {/* launcher flottant */}
      <button style={{ position: 'absolute', right: 18, bottom: 44, width: 58, height: 58, borderRadius: 19, border: 'none', background: '#1c1c1e', boxShadow: '0 12px 28px rgba(28,28,30,0.32)', display: 'grid', placeItems: 'center' }}>
        <window.MayaMark size={32} glow />
      </button>
    </div>
  </window.IOSDevice>
);
window.MayaMobContext = MayaMobContext;
