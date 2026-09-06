/* Maya — Guide de PREMIÈRE OUVERTURE (onboarding animé)
   Base : l'écran "Rencontrez Maya" du mobile (MayaPwaMeet), transformé en séquence
   animée + adapté en web (modale d'accueil par-dessus l'app).

   Principe : le rayon de miel S'ÉVEILLE (alvéoles qui éclosent), Maya se présente,
   montre qu'elle PROPOSE (déterministe, tu décides), puis te laisse choisir sa présence.
   5 étapes, cœur social & rassurant. */

const { useState, useEffect, useRef } = React;

const STEPS = [
  { key: 'wake' }, { key: 'role' }, { key: 'propose' }, { key: 'presence' }, { key: 'ready' },
];

const PILLARS = [
  ['shieldCheck', 'Des conseils sûrs', "Je m'appuie sur des règles apicoles éprouvées — jamais de hasard. La même situation donne toujours le même conseil."],
  ['heart', 'Je te connais', "Tes ruchers, tes habitudes, ta saison. Je m'adapte à ta façon de travailler, pas l'inverse."],
  ['moon', 'Je veille la nuit', "Météo, essaimage, retards de visite : je surveille en continu et je ne te dérange que si ça compte."],
];

/* ── Contenu d'une étape (adapté par `scale`: 'm' mobile | 'w' web) ── */
function StepBody({ step, scale, presence, setPresence, dark }) {
  const w = scale === 'w';
  const sub = dark ? 'rgba(255,255,255,0.78)' : 'var(--text-secondary)';
  const desc = dark ? 'rgba(255,255,255,0.72)' : 'var(--text-secondary)';
  const cardBg = dark ? 'rgba(255,255,255,0.07)' : 'var(--surface-card)';
  const cardBd = dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid var(--border-default)';
  const heading = dark ? '#fff' : 'var(--text-primary)';

  if (step === 'wake') {
    const facts = [['package', '248 ruches'], ['pin', '7 ruchers'], ['clock', 'Veille 24/7']];
    return (
      <div key="wake" style={{ textAlign: 'center' }}>
        <h1 className="onb-rise" style={{ fontFamily: 'var(--font-display)', fontSize: w ? 34 : 31, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, color: heading, animationDelay: '.5s' }}>Bonjour, moi c'est&nbsp;Maya</h1>
        <p className="onb-rise" style={{ fontSize: w ? 16.5 : 16, lineHeight: 1.6, color: sub, marginTop: 14, animationDelay: '.68s', maxWidth: w ? 460 : 320, marginInline: 'auto' }}>
          Je suis ton binôme au rucher. Je veille sur ton cheptel, je te préviens quand quelque chose cloche, et je note tes visites à ta place.
        </p>
        <div className="onb-rise" style={{ display: 'flex', flexWrap: 'wrap', gap: 9, justifyContent: 'center', marginTop: 22, animationDelay: '.82s' }}>
          {facts.map(([ic, t], i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, padding: '8px 13px', borderRadius: 99, background: dark ? 'rgba(255,255,255,0.08)' : 'var(--honey-soft)', color: dark ? 'rgba(255,255,255,0.85)' : 'var(--honey-deep)', border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent' }}>
              {React.createElement(window.I[ic], { size: 14, stroke: 2 })}{t}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'role') {
    return (
      <div key="role" style={{ textAlign: w ? 'center' : 'left' }}>
        <h2 className="onb-rise" style={{ fontFamily: 'var(--font-display)', fontSize: w ? 27 : 24, fontWeight: 600, letterSpacing: '-0.02em', color: heading, marginBottom: 6 }}>Voici comment je t'aide</h2>
        <p className="onb-rise" style={{ fontSize: 14, color: sub, marginBottom: w ? 26 : 22, animationDelay: '.06s', maxWidth: w ? 460 : 'none', marginInline: w ? 'auto' : 0 }}>Trois promesses, avant tout le reste.</p>
        <div style={{ display: w ? 'grid' : 'flex', gridTemplateColumns: w ? 'repeat(3,1fr)' : undefined, flexDirection: w ? undefined : 'column', gap: 12 }}>
          {PILLARS.map(([ic, t, d], i) => (
            <div key={i} className="onb-rise" style={{ display: 'flex', flexDirection: w ? 'column' : 'row', gap: 13, padding: w ? '20px 18px' : '15px 16px', background: cardBg, border: cardBd, borderRadius: 16, textAlign: w ? 'center' : 'left', alignItems: w ? 'center' : 'flex-start', animationDelay: `${0.1 + i * 0.11}s` }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: dark ? 'rgba(245,166,35,0.16)' : 'var(--honey-soft)', color: dark ? '#f5a623' : 'var(--honey-deep)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{React.createElement(window.I[ic], { size: 20, stroke: 1.9 })}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14.5, color: heading }}>{t}</div>
                <div style={{ fontSize: 13, color: desc, marginTop: 5, lineHeight: 1.55 }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'propose') {
    return (
      <div key="propose" style={{ textAlign: w ? 'center' : 'left' }}>
        <h2 className="onb-rise" style={{ fontFamily: 'var(--font-display)', fontSize: w ? 27 : 24, fontWeight: 600, letterSpacing: '-0.02em', color: heading, marginBottom: 6 }}>Je propose, tu décides</h2>
        <p className="onb-rise" style={{ fontSize: 14, color: sub, marginBottom: 20, animationDelay: '.06s', maxWidth: w ? 480 : 'none', marginInline: w ? 'auto' : 0 }}>Je ne fais jamais rien dans ton dos. Je te montre ce que j'ai vu, et je te laisse le dernier mot.</p>
        {/* démo : une carte de proposition */}
        <div className="onb-rise" style={{ maxWidth: w ? 460 : 'none', marginInline: w ? 'auto' : 0, background: cardBg, border: cardBd, borderRadius: 18, padding: 16, textAlign: 'left', animationDelay: '.16s', boxShadow: dark ? 'none' : 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <window.MayaMark size={26} state="alert" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dark ? '#e6a552' : 'var(--honey-deep)' }}>Une proposition</div>
              <p style={{ margin: '4px 0 0', fontSize: 13.5, lineHeight: 1.55, color: heading }}>Risque d'essaimage au Ventoux Sud (4 cellules royales + chaleur). Je peux planifier une pose de hausse demain matin — je m'en occupe&nbsp;?</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
            <div style={{ flex: 1, height: 42, borderRadius: 11, background: dark ? '#f5a623' : '#1c1c1e', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13.5, fontWeight: 600 }}>Oui, planifie</div>
            <div style={{ height: 42, padding: '0 18px', borderRadius: 11, background: dark ? 'rgba(255,255,255,0.08)' : 'var(--surface-card)', border: dark ? 'none' : '1px solid var(--border-strong)', color: dark ? '#fff' : 'var(--text-secondary)', display: 'grid', placeItems: 'center', fontSize: 13.5, fontWeight: 600 }}>Plus tard</div>
          </div>
        </div>
        <div className="onb-rise" style={{ display: 'flex', alignItems: 'center', justifyContent: w ? 'center' : 'flex-start', gap: 8, marginTop: 16, fontSize: 13, color: desc, animationDelay: '.26s' }}>
          {React.createElement(window.I.shieldCheck, { size: 16, stroke: 1.9, style: { color: dark ? '#9fd0a0' : 'var(--sage-deep)', flexShrink: 0 } })}
          Tu gardes le dernier mot sur chaque action — toujours.
        </div>
      </div>
    );
  }

  if (step === 'presence') {
    const opts = [
      ['partout', 'layoutGrid', 'Présente partout', "Je glisse des propositions sur tes pages — le maximum d'accompagnement."],
      ['discrete', 'message', 'Bulle discrète', "Je reste dans ma bulle, en bas de l'écran. J'attends que tu m'appelles."],
      ['pause', 'moon', 'En veille', "Je me fais silencieuse — aucune proposition, sauf les alertes vraiment critiques."],
    ];
    return (
      <div key="presence" style={{ textAlign: w ? 'center' : 'left' }}>
        <h2 className="onb-rise" style={{ fontFamily: 'var(--font-display)', fontSize: w ? 27 : 24, fontWeight: 600, letterSpacing: '-0.02em', color: heading, marginBottom: 6 }}>Comment veux-tu que je t'accompagne&nbsp;?</h2>
        <p className="onb-rise" style={{ fontSize: 14, color: sub, marginBottom: 20, animationDelay: '.06s', maxWidth: w ? 480 : 'none', marginInline: w ? 'auto' : 0 }}>Tu pourras changer d'avis à tout moment, dans mes réglages.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, maxWidth: w ? 480 : 'none', marginInline: w ? 'auto' : 0 }}>
          {opts.map(([k, ic, t, d], i) => {
            const sel = presence === k;
            return (
              <button key={k} onClick={() => setPresence(k)} className="onb-rise" style={{ display: 'flex', gap: 13, textAlign: 'left', padding: '14px 16px', borderRadius: 15, cursor: 'pointer', alignItems: 'center', animationDelay: `${0.1 + i * 0.08}s`,
                background: sel ? (dark ? 'rgba(245,166,35,0.16)' : '#fff') : cardBg,
                border: sel ? '1.5px solid #e6982c' : (dark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid var(--border-default)'),
                boxShadow: sel && !dark ? '0 4px 16px rgba(230,152,44,0.16)' : 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, display: 'grid', placeItems: 'center', background: sel ? (dark ? 'rgba(245,166,35,0.22)' : 'var(--honey-soft)') : (dark ? 'rgba(255,255,255,0.08)' : 'var(--surface-muted)'), color: sel ? (dark ? '#f5a623' : 'var(--honey-deep)') : (dark ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)') }}>{React.createElement(window.I[ic], { size: 20, stroke: 1.9 })}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: heading }}>{t}</span>
                    {sel && React.createElement(window.I.check, { size: 16, stroke: 2.4, style: { color: dark ? '#f5a623' : 'var(--honey-deep)', marginLeft: 'auto' } })}
                  </div>
                  <div style={{ fontSize: 13, color: desc, marginTop: 3, lineHeight: 1.5 }}>{d}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ready
  const readyText = {
    partout: "Je t'accompagnerai sur chaque page. Commençons par ton premier point du jour.",
    discrete: "Je resterai dans ma bulle, en bas à droite. Appelle-moi quand tu veux.",
    pause: "Je veillerai en silence. Je ne te préviendrai que pour l'essentiel — tu me réveilles quand tu veux.",
  }[presence];
  return (
    <div key="ready" style={{ textAlign: 'center' }}>
      <h1 className="onb-rise" style={{ fontFamily: 'var(--font-display)', fontSize: w ? 32 : 29, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.12, color: heading, animationDelay: '.45s' }}>On va bien s'entendre</h1>
      <p className="onb-rise" style={{ fontSize: w ? 16 : 15.5, lineHeight: 1.6, color: sub, marginTop: 14, animationDelay: '.6s', maxWidth: w ? 440 : 320, marginInline: 'auto' }}>{readyText}</p>
    </div>
  );
}

/* ── Séquence : gère l'étape, l'éveil du logo, la navigation ── */
function useOnboarding() {
  const [step, setStep] = useState(0);
  const [presence, setPresence] = useState('discrete');
  const key = STEPS[step].key;
  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const restart = () => setStep(0);
  return { step, setStep, key, presence, setPresence, next, back, restart, total: STEPS.length };
}

/* Points de progression */
function Dots({ step, total, dark }) {
  return (
    <div style={{ display: 'flex', gap: 7, justifyContent: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ height: 6, borderRadius: 99, transition: 'all .3s', width: i === step ? 22 : 6, background: i === step ? '#e6982c' : (dark ? 'rgba(255,255,255,0.22)' : 'var(--border-strong)') }} />
      ))}
    </div>
  );
}

/* Le rayon qui s'éveille (bloom une fois au montage, puis respire doucement).
   state="static" → aucune anim de cellule venant du CSS partagé : c'est NOTRE
   règle .onb-wake .maya-cell qui gère l'éclosion (pas de conflit de spécificité). */
function WakeMark({ size, playKey, big }) {
  return (
    <div className="onb-wake" key={playKey} style={{ display: 'inline-grid', placeItems: 'center', position: 'relative' }}>
      <div className="onb-halo" style={{ position: 'absolute', width: size * 1.7, height: size * 1.7, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,166,35,0.42), rgba(122,150,118,0.14) 55%, transparent 72%)' }} />
      {big && <div className="onb-ring" style={{ position: 'absolute', width: size * 1.3, height: size * 1.3, borderRadius: '50%', border: '1.5px solid rgba(245,166,35,0.35)' }} />}
      <div className="onb-wake-inner"><window.MayaMark size={size} state="static" /></div>
    </div>
  );
}

window.MayaOnb = { useOnboarding, StepBody, Dots, WakeMark, STEPS };
