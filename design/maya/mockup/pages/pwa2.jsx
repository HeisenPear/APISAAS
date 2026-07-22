/* PAGE — Maya · PWA mobile (suite) : rencontre / relation + résultat de capture vocale */

/* ── D. Onboarding — « Rencontrez Maya » : poser la relation + le déterministe = confiance ── */
const MayaPwaMeet = () => (
  <window.IOSDevice width={402} height={874} dark>
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'radial-gradient(130% 70% at 50% 8%, #2a2a2c, #161617 62%)', color: '#fff' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '78px 28px 0', textAlign: 'center' }}>
        <div style={{ display: 'inline-grid', placeItems: 'center', position: 'relative', marginBottom: 26 }}>
          <div style={{ position: 'absolute', width: 170, height: 170, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,166,35,0.4), rgba(122,150,118,0.18) 55%, transparent 72%)', animation: 'maya-halo 3.4s ease-in-out infinite' }} />
          <window.MayaMark size={108} state="idle" />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.12 }}>Bonjour, moi c'est Maya 👋</h1>
        <p style={{ fontSize: 15.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.72)', marginTop: 14 }}>Je suis ton binôme au rucher. Je veille sur tes <b style={{ color: '#fff' }}>248 ruches</b>, je te préviens quand quelque chose cloche, et je note tes visites à ta place.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28, textAlign: 'left' }}>
          {[
            ['shieldCheck', 'Des conseils en qui tu peux avoir confiance', 'Je m\'appuie sur des règles apicoles éprouvées — pas de hasard, pas d\'invention. La même situation donne toujours le même conseil.'],
            ['heart', 'Je te connais, toi et ton cheptel', 'Tes ruchers, tes habitudes, ta saison. Je m\'adapte à ta façon de travailler, pas l\'inverse.'],
            ['moon', 'Je veille même quand tu dors', 'Météo, essaimage, retards de visite : je surveille en continu et je ne te dérange que si ça compte.'],
          ].map(([ic, t, d], i) => (
            <div key={i} style={{ display: 'flex', gap: 13, padding: '15px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(245,166,35,0.16)', color: '#f5a623', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{React.createElement(window.I[ic], { size: 19, stroke: 1.9 })}</div>
              <div><div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14.5 }}>{t}</div><div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 3, lineHeight: 1.5 }}>{d}</div></div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: '16px 24px 38px' }}>
        <button style={{ width: '100%', height: 52, border: 'none', borderRadius: 16, background: window.MAYA.grad, color: '#fff', fontSize: 16, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, boxShadow: '0 10px 30px rgba(245,166,35,0.4)' }}>
          On y va ensemble {React.createElement(window.I.arrowUpRight, { size: 19, stroke: 2.3 })}
        </button>
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>Tu gardes la main sur tout. Maya propose, tu décides.</div>
      </div>
    </div>
  </window.IOSDevice>
);
window.MayaPwaMeet = MayaPwaMeet;

/* ── E. Résultat de la capture vocale — fiche structurée + confirmation chaleureuse ── */
const MayaPwaVoiceResult = () => (
  <window.IOSDevice width={402} height={874}>
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface-primary)' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '58px 0 0' }}>
        <div style={{ padding: '0 18px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-tertiary)' }}>{React.createElement(window.I.chevronLeft, { size: 16 })} Carnet</div>

        {/* confirmation Maya */}
        <div style={{ padding: '16px 20px 4px', display: 'flex', gap: 13, alignItems: 'flex-start' }}>
          <window.MayaMark size={42} glow />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2 }}>C'est noté, j'ai tout rangé&nbsp;✓</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>J'ai transformé ta dictée en fiche propre. Relis, corrige si besoin, et je classe.</p>
          </div>
        </div>

        {/* fiche structurée déterministe */}
        <div style={{ margin: '16px', background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '15px 18px', borderBottom: '1px solid var(--border-faint)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface-sunk)', color: 'var(--clay-deep)', display: 'grid', placeItems: 'center' }}>{React.createElement(window.I.package, { size: 18 })}</div>
            <div style={{ flex: 1 }}><div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>Visite — V-014</div><div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Ventoux Sud · 2 mai, 07:12</div></div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sage-deep)', background: 'var(--sage-soft)', padding: '4px 9px', borderRadius: 99 }}>Visite de printemps</span>
          </div>
          {[['Couvain', '6 cadres · compact', 'good'], ['Reine', 'Vue · ponte régulière', 'good'], ['Réserves', 'Correctes', 'good'], ['Action menée', 'Hausse posée', 'honey'], ['Suivi', 'Surveiller essaimage', 'warn']].map(([k, v, s], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderTop: '1px solid var(--border-faint)' }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: s === 'good' ? 'var(--status-good)' : s === 'warn' ? 'var(--status-warn)' : 'var(--honey)', flexShrink: 0 }} />
              <span style={{ width: 96, fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{k}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{v}</span>
              {React.createElement(window.I.edit, { size: 15, style: { color: 'var(--text-quaternary)' } })}
            </div>
          ))}
        </div>

        {/* Maya enchaîne avec une suggestion déterministe */}
        <div style={{ margin: '0 16px 18px', padding: '14px 16px', borderRadius: 16, background: 'linear-gradient(140deg, #fff7ec, #fbf1e1)', border: '1px solid var(--border-default)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: window.MAYA.grad }} />
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--text-secondary)' }}>Tu as noté un risque d'essaimage — veux-tu que je <b style={{ color: 'var(--text-primary)' }}>programme un contrôle dans 7 jours</b>&nbsp;?</p>
          <div style={{ display: 'flex', gap: 9, marginTop: 12 }}>
            <button style={{ flex: 1, height: 40, background: '#1c1c1e', color: '#fff', border: 'none', borderRadius: 11, fontSize: 13, fontWeight: 600 }}>Oui, programme</button>
            <button style={{ height: 40, padding: '0 16px', background: 'var(--surface-card)', border: '1px solid var(--border-strong)', borderRadius: 11, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Non merci</button>
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, display: 'flex', gap: 11, padding: '12px 16px 30px', borderTop: '1px solid var(--border-faint)', background: 'rgba(250,249,246,0.95)' }}>
        <button style={{ height: 48, width: 48, borderRadius: 14, border: '1px solid var(--border-strong)', background: 'var(--surface-card)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>{React.createElement(window.I.mic, { size: 19 })}</button>
        <button style={{ flex: 1, height: 48, borderRadius: 14, border: 'none', background: window.MAYA.grad, color: '#fff', fontSize: 15, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{React.createElement(window.I.check, { size: 18, stroke: 2.3 })} Classer la fiche</button>
      </div>
    </div>
  </window.IOSDevice>
);
window.MayaPwaVoiceResult = MayaPwaVoiceResult;
