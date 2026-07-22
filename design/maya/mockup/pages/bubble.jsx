/* PAGE — Maya · Mode discret : présence réglable + bulle façon chatbot
   Deux faces : (1) le réglage de présence (partout / discrète / en pause),
   (2) la petite bulle qui s'ouvre à la demande. Même identité, beaucoup plus sobre. */

const blb = {
  page: { display: 'flex', width: 1280, height: 880, background: 'var(--surface-primary)', overflow: 'hidden', fontFamily: 'var(--font-text)', position: 'relative' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  scroll: { flex: 1, overflow: 'auto', padding: '40px 56px' },
  kicker: { fontSize: 11.5, fontWeight: 700, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.16em' },
  h1: { fontFamily: 'var(--font-display)', fontSize: 27, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 9 },
  sub: { fontSize: 14.5, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 620, lineHeight: 1.55 },
};

/* ── Carte d'un mode de présence (radio) ── */
const ModeCard = ({ icon, tint, title, desc, sel, badge }) => {
  const fg = tint === 'clay' ? 'var(--clay-deep)' : tint === 'neutre' ? 'var(--text-secondary)' : 'var(--honey-deep)';
  const bg = tint === 'clay' ? 'var(--clay-soft)' : tint === 'neutre' ? 'var(--surface-sunk)' : 'var(--honey-soft)';
  return (
    <div style={{ display: 'flex', gap: 16, padding: '18px 20px', borderRadius: 16, background: 'var(--surface-card)', border: sel ? '1.5px solid var(--honey)' : '1px solid var(--border-default)', boxShadow: sel ? '0 0 0 4px rgba(230,152,44,0.12)' : 'none', cursor: 'pointer', alignItems: 'flex-start' }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, color: fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {React.createElement(window.I[icon], { size: 21, stroke: 1.9 })}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15.5, fontWeight: 600 }}>{title}</span>
          {badge && <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--honey-deep)', background: 'var(--honey-soft)', padding: '2px 8px', borderRadius: 99 }}>{badge}</span>}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.55 }}>{desc}</div>
      </div>
      <div style={{ width: 22, height: 22, borderRadius: 99, border: sel ? '7px solid var(--honey)' : '2px solid var(--border-strong)', flexShrink: 0, marginTop: 3, transition: 'all .15s' }} />
    </div>
  );
};

/* ── (1) Réglage de présence — vit dans Paramètres ── */
const MayaPresence = () => (
  <div style={blb.page}>
    <window.Sidebar2 active="parametres" />
    <div style={blb.main}>
      <window.Topbar2 crumb={['Paramètres', 'Maya']} />
      <div style={blb.scroll}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <window.MayaMark size={46} glow state="idle" />
          <div>
            <div style={blb.kicker}>Paramètres · Maya</div>
            <div style={blb.h1}>Quelle place pour Maya&nbsp;?</div>
          </div>
        </div>
        <p style={blb.sub}>Tu choisis combien Maya est présente. Tu peux changer d'avis à tout moment — elle s'adapte à toi, jamais l'inverse.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28, maxWidth: 680 }}>
          <ModeCard icon="layoutGrid" tint="honey" title="Partout — elle veille et anticipe" desc="Maya glisse des cartes d'aide sur le dashboard, les ruches, la météo. Briefing du matin, alertes proactives. Le binôme complet." sel={false} />
          <ModeCard icon="message" tint="clay" title="Discrète — sur demande" desc="Juste une petite bulle en bas à droite. Maya n'intervient que si tu l'appelles. Zéro carte, zéro notification de fond." sel={true} badge="Choisi" />
          <ModeCard icon="moon" tint="neutre" title="En pause" desc="Maya se met complètement en retrait. Tu peux la réveiller depuis les paramètres quand tu veux." sel={false} />
        </div>

        {/* sous-réglage du mode discret */}
        <div style={{ maxWidth: 680, marginTop: 20, padding: '18px 20px', borderRadius: 16, background: 'var(--surface-muted)', border: '1px solid var(--border-default)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Réglages du mode discret</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 14, borderBottom: '1px solid var(--border-faint)' }}>
            <window.MayaMark size={28} state="alert" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Me prévenir quand même si c'est critique</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>Essaimage imminent, gel, ruche en danger — la bulle clignote doucement.</div>
            </div>
            <div style={{ width: 46, height: 28, borderRadius: 99, background: 'var(--honey)', position: 'relative', flexShrink: 0 }}><div style={{ position: 'absolute', top: 3, left: 21, width: 22, height: 22, borderRadius: 99, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} /></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 14 }}>
            <div style={{ width: 28, display: 'grid', placeItems: 'center', color: 'var(--text-tertiary)' }}>{React.createElement(window.I.layoutGrid, { size: 19 })}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Position de la bulle</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>Où la petite bulle se pose à l'écran.</div>
            </div>
            <div style={{ display: 'flex', gap: 3, padding: 3, background: 'var(--surface-sunk)', borderRadius: 10 }}>
              {['Bas droite', 'Bas gauche'].map((o, i) => <div key={o} style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: i === 0 ? 600 : 500, background: i === 0 ? 'var(--surface-card)' : 'transparent', color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: i === 0 ? 'var(--shadow-xs)' : 'none' }}>{o}</div>)}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 16, maxWidth: 680, lineHeight: 1.5 }}>💡 Changement express aussi possible depuis la bulle elle-même (menu ⋯ → « Mettre Maya en retrait »), sans passer par les paramètres.</div>
      </div>
    </div>
  </div>
);
window.MayaPresence = MayaPresence;

/* ── La bulle ouverte (popover chatbot compact) ── */
const BubblePanel = ({ w = 380 }) => (
  <div style={{ width: w, height: 560, background: 'var(--surface-card)', borderRadius: 20, boxShadow: '0 24px 64px rgba(40,30,20,0.22), 0 0 0 1px var(--border-default)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    {/* header */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px', borderBottom: '1px solid var(--border-faint)' }}>
      <window.MayaMark size={30} glow state="idle" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14.5 }}>Maya</div>
        <div style={{ fontSize: 11.5, color: 'var(--sage-deep)', display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--sage)' }} />Prête à aider</div>
      </div>
      <button style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-tertiary)', display: 'grid', placeItems: 'center' }}>{React.createElement(window.I.history, { size: 16 })}</button>
      <button style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-tertiary)', display: 'grid', placeItems: 'center' }}>{React.createElement(window.I.chevronDown, { size: 18 })}</button>
    </div>

    {/* corps */}
    <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 8px' }}>
      <div className="maya-msg-in" style={{ marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>Salut Marc&nbsp;! Je suis là si tu as besoin. Sur quoi je peux aider&nbsp;?</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        <window.SuggestionChip icon="alertTriangle" tint="honey">Quelles ruches visiter en priorité&nbsp;?</window.SuggestionChip>
        <window.SuggestionChip icon="trendUp" tint="sage">Le point production du mois</window.SuggestionChip>
        <window.SuggestionChip icon="mic" tint="clay">Dicter un compte-rendu</window.SuggestionChip>
      </div>

      {/* échange court */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <div style={{ maxWidth: '82%', background: 'var(--surface-sunk)', padding: '9px 13px', borderRadius: '14px 14px 4px 14px', fontSize: 13.5, lineHeight: 1.5 }}>Combien de hausses en stock&nbsp;?</div>
      </div>
      <div className="maya-msg-in">
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}><window.MayaMark size={20} /><span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, alignSelf: 'center' }}>Maya</span></div>
        <p style={{ margin: '0 0 0 28px', fontSize: 13.5, lineHeight: 1.5 }}>Il te reste <b>34 hausses</b> au dépôt de Sault. Suffisant pour la pose de printemps, mais juste pour le miellat d'été — je te le rappellerai.</p>
      </div>
    </div>

    {/* saisie */}
    <div style={{ padding: '8px 14px 14px' }}>
      <window.PromptBar compact placeholder="Écrire à Maya…" />
      <div style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--text-quaternary)', marginTop: 8 }}>Maya suit des règles apicoles éprouvées · vérifie les actions sensibles</div>
    </div>
  </div>
);

/* fond d'app discret (sans aucune carte Maya) */
const QuietBackdrop = ({ children }) => (
  <div style={blb.page}>
    <window.Sidebar2 active="dashboard" />
    <div style={blb.main}>
      <window.Topbar2 crumb={['Tableau de bord']} action="Nouvelle intervention" />
      <div style={{ ...blb.scroll, opacity: 0.6 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 25, fontWeight: 600, letterSpacing: '-0.02em' }}>Bonjour Marc.</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>248 ruches · 7 ruchers. Tout est calme aujourd'hui.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginTop: 24 }}>
          {['Production', 'Chiffre d\'affaires', 'Interventions', 'Alertes'].map((l, i) => (
            <div key={i} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 13, padding: '15px 17px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{l}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, marginTop: 8 }}>—</div>
            </div>
          ))}
        </div>
      </div>
    </div>
    {children}
  </div>
);

/* ── (2) La bulle — web : fermée (FAB) + ouverte ── */
const MayaBubbleWeb = () => (
  <QuietBackdrop>
    {/* bulle ouverte, ancrée en bas à droite au-dessus du FAB */}
    <div style={{ position: 'absolute', right: 24, bottom: 96 }}>
      <BubblePanel />
    </div>
    {/* FAB (état fermé, montré aussi pour référence en bas) */}
    <button style={{ position: 'absolute', right: 24, bottom: 24, width: 56, height: 56, borderRadius: 18, border: 'none', background: '#1c1c1e', boxShadow: '0 12px 30px rgba(28,28,30,0.3)', display: 'grid', placeItems: 'center' }}>
      <window.MayaMark size={30} glow state="idle" />
    </button>
  </QuietBackdrop>
);
window.MayaBubbleWeb = MayaBubbleWeb;

/* ── (2bis) États de la bulle fermée — la rangée de référence ── */
const MayaBubbleStates = () => (
  <div style={{ ...blb.page, display: 'block', padding: '46px 56px', overflow: 'auto' }}>
    <div style={blb.kicker}>Maya · Mode discret</div>
    <div style={blb.h1}>La bulle, fermée — ses états</div>
    <p style={blb.sub}>Discrète par défaut. Elle ne s'anime que si elle a quelque chose d'utile, et ne « parle » jamais sans qu'on l'ait appelée.</p>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginTop: 30, maxWidth: 980 }}>
      {[
        ['Au repos', 'maya/state idle', 'Une simple bulle ink avec la marque. Respiration très lente. N\u2019attire pas l\u2019\u0153il.', 'idle', false, null],
        ['Invitation (1re fois / inactif)', 'bulle + libellé', 'Un petit mot apparaît quelques secondes, puis se replie. Jamais intrusif.', 'idle', true, null],
        ['Quelque chose à signaler', 'maya/state alert', 'Si « alertes critiques » est activé : une alvéole s\u2019embrase + une pastille de compteur. Pas de son.', 'alert', false, 1],
        ['Maya réfléchit', 'maya/state think', 'Pendant qu\u2019elle prépare une réponse, après ouverture.', 'think', false, null],
      ].map(([title, tag, desc, st, label, count], i) => (
        <div key={i} style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 18, padding: 22, display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ width: 150, height: 96, borderRadius: 14, background: 'var(--surface-muted)', position: 'relative', flexShrink: 0 }}>
            {label && (
              <div style={{ position: 'absolute', right: 64, bottom: 18, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: '12px 12px 4px 12px', padding: '7px 11px', fontSize: 11.5, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-sm)' }}>Un coup de main&nbsp;?</div>
            )}
            <button style={{ position: 'absolute', right: 16, bottom: 16, width: 52, height: 52, borderRadius: 17, border: 'none', background: '#1c1c1e', boxShadow: '0 8px 20px rgba(28,28,30,0.28)', display: 'grid', placeItems: 'center' }}>
              <window.MayaMark size={28} glow={st !== 'idle'} state={st} />
            </button>
            {count && <span style={{ position: 'absolute', right: 12, bottom: 50, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 99, background: 'var(--status-bad)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center', border: '2px solid var(--surface-muted)' }}>{count}</span>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15.5, fontWeight: 600 }}>{title}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>{tag}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>{desc}</div>
          </div>
        </div>
      ))}
    </div>

    {/* menu ⋯ depuis la bulle */}
    <div style={{ marginTop: 30, maxWidth: 980 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Changer la présence depuis la bulle (menu ⋯)</div>
      <div style={{ display: 'inline-block', width: 260, background: 'var(--surface-card)', borderRadius: 14, boxShadow: '0 16px 40px rgba(40,30,20,0.16), 0 0 0 1px var(--border-default)', overflow: 'hidden' }}>
        {[['layoutGrid', 'Activer le mode « partout »', false], ['bell', 'Couper les alertes critiques', false], ['moon', 'Mettre Maya en retrait', false], ['settings', 'Réglages de Maya', true]].map(([ic, lbl, sep], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderTop: sep ? '1px solid var(--border-faint)' : 'none', fontSize: 13.5, color: 'var(--text-primary)' }}>
            {React.createElement(window.I[ic] || window.I.layoutGrid, { size: 16, stroke: 1.9, style: { color: 'var(--text-tertiary)' } })}{lbl}
          </div>
        ))}
      </div>
    </div>
  </div>
);
window.MayaBubbleStates = MayaBubbleStates;

/* ── (3) La bulle — mobile (feuille du bas) ── */
const MayaBubbleMobile = () => (
  <window.IOSDevice width={402} height={874}>
    <div style={{ height: '100%', position: 'relative', background: 'var(--surface-primary)' }}>
      {/* app en fond, discret */}
      <div style={{ paddingTop: 58, padding: '58px 18px 0', opacity: 0.55 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600 }}>Tableau de bord</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          {[0, 1, 2, 3].map(i => <div key={i} style={{ height: 78, borderRadius: 14, background: 'var(--surface-card)', border: '1px solid var(--border-default)' }} />)}
        </div>
      </div>

      {/* FAB */}
      <button style={{ position: 'absolute', right: 18, bottom: 30, width: 56, height: 56, borderRadius: 18, border: 'none', background: '#1c1c1e', boxShadow: '0 12px 28px rgba(28,28,30,0.32)', display: 'grid', placeItems: 'center', zIndex: 2 }}>
        <window.MayaMark size={30} glow state="idle" />
      </button>

      {/* feuille ouverte */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 600, background: 'var(--surface-card)', borderRadius: '24px 24px 0 0', boxShadow: '0 -16px 40px rgba(40,30,20,0.16)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'grid', placeItems: 'center', paddingTop: 8 }}><div style={{ width: 38, height: 4, borderRadius: 99, background: 'var(--border-strong)' }} /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 18px', borderBottom: '1px solid var(--border-faint)' }}>
          <window.MayaMark size={30} glow state="idle" />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>Maya</div>
            <div style={{ fontSize: 11.5, color: 'var(--sage-deep)' }}>Prête à aider</div>
          </div>
          <button style={{ width: 32, height: 32, borderRadius: 9, border: 'none', background: 'var(--surface-muted)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>{React.createElement(window.I.chevronDown, { size: 18 })}</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 8px' }}>
          <p style={{ margin: '0 0 16px', fontSize: 14.5, lineHeight: 1.55 }}>Salut Marc&nbsp;! Je suis là si besoin. On regarde quoi&nbsp;?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <window.SuggestionChip icon="alertTriangle" tint="honey">Mes ruches à visiter</window.SuggestionChip>
            <window.SuggestionChip icon="mic" tint="clay">Dicter une visite</window.SuggestionChip>
            <window.SuggestionChip icon="trendUp" tint="sage">Le point du mois</window.SuggestionChip>
          </div>
        </div>
        <div style={{ padding: '8px 14px 26px' }}>
          <window.PromptBar compact placeholder="Écrire à Maya…" />
        </div>
      </div>
    </div>
  </window.IOSDevice>
);
window.MayaBubbleMobile = MayaBubbleMobile;
