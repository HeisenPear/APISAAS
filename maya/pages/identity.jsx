/* PAGE — Maya · Identité, mouvement & application
   Le logo = un rayon de miel vivant : un hexagone composé d'alvéoles qui s'animent.
   Le mouvement raconte l'état de Maya. Ton honey calme, zéro dégradé orange-vert. */

const idy = {
  page: { width: 1280, height: 880, background: '#faf7f0', fontFamily: 'var(--font-text)', display: 'flex', overflow: 'hidden' },
  left: { width: 520, flexShrink: 0, padding: '64px 56px', borderRight: '1px solid var(--border-faint)', display: 'flex', flexDirection: 'column' },
  right: { flex: 1, padding: '64px 56px', display: 'flex', flexDirection: 'column' },
  kicker: { fontSize: 11.5, fontWeight: 700, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.16em' },
  wordmark: { fontFamily: 'var(--font-display)', fontSize: 58, fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1, marginTop: 18, color: 'var(--text-primary)' },
  tagline: { fontSize: 18, color: 'var(--text-secondary)', marginTop: 14, lineHeight: 1.5, maxWidth: 360 },
  traits: { display: 'flex', gap: 8, marginTop: 22 },
  trait: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', background: '#fff', border: '1px solid var(--border-default)', padding: '6px 13px', borderRadius: 99 },
  lockTitle: { fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 },
  hRow: { display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: '#fff', border: '1px solid var(--border-default)', borderRadius: 16 },
  hWord: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text-primary)' },
  sec: { fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 },
  annot: { display: 'flex', gap: 11, marginBottom: 16, alignItems: 'flex-start' },
  annotDot: { width: 22, height: 22, borderRadius: 7, background: 'var(--honey-soft)', color: 'var(--honey-deep)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: 'var(--font-display)' },
  annotT: { fontWeight: 600, fontSize: 14.5, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' },
  annotD: { fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 },
};

/* ── Board 1 — Logo & construction ── */
const MayaLogo = () => (
  <div style={idy.page}>
    <div style={idy.left}>
      <div style={idy.kicker}>Identité · Maya</div>
      <div style={{ marginTop: 44, marginBottom: 6 }}>
        <window.MayaMark size={132} glow state="idle" />
      </div>
      <div style={idy.wordmark}>Maya</div>
      <div style={idy.tagline}>Votre binôme au rucher. Un rayon de miel qui veille — vivant, calme, à vos côtés.</div>
      <div style={idy.traits}>
        <span style={idy.trait}>Calme</span>
        <span style={idy.trait}>Vivant</span>
        <span style={idy.trait}>À vos côtés</span>
      </div>
      <div style={{ flex: 1 }} />
      <div style={idy.lockTitle}>Lockup horizontal</div>
      <div style={idy.hRow}>
        <window.MayaMark size={40} />
        <div>
          <div style={idy.hWord}>Maya</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 1 }}>Assistant apicole · APIGO</div>
        </div>
      </div>
    </div>

    <div style={idy.right}>
      <div style={idy.sec}>Une forme, pas un objet posé dessus</div>
      <div style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 20, padding: 30, display: 'flex', gap: 34, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <window.MayaMark size={132} />
          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>Le rayon de miel</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={idy.annot}><span style={idy.annotDot}>1</span><div><div style={idy.annotT}>L'hexagone</div><div style={idy.annotD}>L'alvéole de la ruche — on garde l'hexagone orange qui servait de fond. C'est la maille, le repère de l'apiculture.</div></div></div>
          <div style={idy.annot}><span style={idy.annotDot}>2</span><div><div style={idy.annotT}>Les sept alvéoles</div><div style={idy.annotD}>L'hexagone se compose de lui-même — un rayon. Pas de forme étrangère à l'intérieur : la même maille, répétée.</div></div></div>
          <div style={{ ...idy.annot, marginBottom: 0 }}><span style={idy.annotDot}>3</span><div><div style={idy.annotT}>Le mouvement</div><div style={idy.annotD}>Chaque alvéole peut se remplir, respirer, pulser. La forme est faite pour bouger — et le mouvement dit ce que fait Maya.</div></div></div>
        </div>
      </div>

      <div style={{ ...idy.sec, marginTop: 40 }}>La maille, à toutes les tailles</div>
      <div style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 18, padding: '26px 24px', display: 'flex', alignItems: 'flex-end', gap: 26, justifyContent: 'center' }}>
        {[120, 64, 40, 28, 18].map(s => (
          <div key={s} style={{ textAlign: 'center' }}>
            <div style={{ display: 'grid', placeItems: 'center', height: 120 }}><window.MayaMark size={s} /></div>
            <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 6 }}>{s}px</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 14, lineHeight: 1.5 }}>En dessous de ~18px (favicon, puces), la maille se referme en un hexagone plein — toujours lisible.</div>
    </div>
  </div>
);
window.MayaLogo = MayaLogo;

/* ── Board 2 — Mouvement (états animés, en direct) ── */
const motionStates = [
  { s: 'idle', name: 'Au repos', tag: 'Présence', d: 'Respiration lente, scintillement doux. Maya veille, sans bruit.' },
  { s: 'think', name: 'Réflexion', tag: 'Déterministe', d: 'Une vague parcourt les alvéoles — Maya déroule ses règles apicoles.' },
  { s: 'listen', name: 'Écoute', tag: 'Voix', d: 'Une onde concentrique bat au rythme de votre voix, pendant la dictée.' },
  { s: 'alert', name: 'Alerte', tag: 'Attention', d: 'Une seule alvéole s\u2019embrase — une chose précise à regarder, sans alarmer.' },
  { s: 'loading', name: 'Chargement', tag: 'Patience', d: 'Une lueur fait le tour du rayon, comme une abeille qui inspecte la ruche.' },
  { s: 'success', name: 'Récolte', tag: 'Victoire', d: 'Le miel monte du bas vers le haut, puis se maintient — c\u2019est réussi.' },
];
const MayaMotion = () => (
  <div style={{ ...idy.page, display: 'block', padding: '58px 64px', overflow: 'auto' }}>
    <div style={idy.kicker}>Identité · Mouvement</div>
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>Un logo qui répond à l'identité</div>
        <div style={{ fontSize: 14.5, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 640, lineHeight: 1.55 }}>La même contrainte que le logo Claude, sur notre thème : la forme bouge, et chaque mouvement <b style={{ color: 'var(--text-primary)' }}>veut dire quelque chose</b>. Le rayon vit au rythme de la ruche.</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 22px', background: '#fff', border: '1px solid var(--border-default)', borderRadius: 18 }}>
        <window.MayaMark size={56} glow state="think" />
        <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)', maxWidth: 130, lineHeight: 1.4 }}>En direct — passez la souris pour rejouer.</div>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 34 }}>
      {motionStates.map((m) => (
        <div key={m.s} style={{ background: '#fff', border: '1px solid var(--border-default)', borderRadius: 18, padding: '22px 20px 20px', display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 104, height: 104, flexShrink: 0, display: 'grid', placeItems: 'center', background: m.s === 'idle' ? '#1c1c1e' : m.s === 'alert' ? '#fbf0e2' : 'var(--surface-muted)', borderRadius: 16 }}>
            <window.MayaMark size={70} glow={m.s === 'idle' || m.s === 'alert'} state={m.s} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.tag}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, marginTop: 4, color: 'var(--text-primary)' }}>{m.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 7, lineHeight: 1.5 }}>{m.d}</div>
          </div>
        </div>
      ))}
    </div>

    <div style={{ display: 'flex', gap: 14, marginTop: 30, alignItems: 'center', padding: '18px 22px', background: 'linear-gradient(120deg,#fff8ee,#fbf1e1)', border: '1px solid var(--border-default)', borderRadius: 18 }}>
      <window.MayaMark size={44} glow state="idle" />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>Le principe</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>Une seule géométrie (le rayon), déclinée en états par le mouvement — jamais par l'ajout d'éléments. Doux par défaut, plus présent quand il faut. Respecte « réduire les animations ».</div>
      </div>
    </div>
  </div>
);
window.MayaMotion = MayaMotion;

/* ── Board 3 — Palette & application ── */
const palette = [
  ['#e6982c', 'Honey', 'Signature · accent unique'],
  ['#cf8420', 'Wall', 'Parois du rayon'],
  ['#f7bd57', 'Cell', 'Alvéoles · le miel'],
  ['#1c1c1e', 'Ink', 'Texte, boutons, launcher'],
  ['#faf7f0', 'Sand', 'Fond chaud, jamais blanc pur'],
  ['#7a9676', 'Sage', 'Sémantique : santé / vivant'],
];
const MayaBrand = () => (
  <div style={{ ...idy.page, padding: '60px 64px', display: 'block', overflow: 'auto' }}>
    <div style={idy.kicker}>Identité · Application</div>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 10, color: 'var(--text-primary)' }}>Une palette qui apaise</div>
    <div style={{ fontSize: 14.5, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 640, lineHeight: 1.55 }}>Du miel et des neutres chauds, beaucoup d'air, des formes rondes. Le vert reste réservé au sens (santé du cheptel) — il n'entre jamais dans l'identité de Maya.</div>

    <div style={{ display: 'flex', gap: 14, marginTop: 30 }}>
      {palette.map(([c, n, d]) => (
        <div key={n} style={{ flex: 1, background: '#fff', border: '1px solid var(--border-default)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ height: 84, background: c, borderBottom: c === '#faf7f0' ? '1px solid var(--border-faint)' : 'none' }} />
          <div style={{ padding: '12px 14px' }}>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)' }}>{n}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{c}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.4 }}>{d}</div>
          </div>
        </div>
      ))}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 20, marginTop: 36 }}>
      <div>
        <div style={idy.sec}>La marque sur tous les fonds</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, height: 140, background: '#faf7f0', border: '1px solid var(--border-default)', borderRadius: 16, display: 'grid', placeItems: 'center' }}><window.MayaMark size={62} glow /></div>
          <div style={{ flex: 1, height: 140, background: '#1c1c1e', borderRadius: 16, display: 'grid', placeItems: 'center' }}><window.MayaMark size={62} glow /></div>
          <div style={{ flex: 1, height: 140, background: 'var(--surface-muted)', border: '1px solid var(--border-default)', borderRadius: 16, display: 'grid', placeItems: 'center' }}><window.MayaMark size={62} /></div>
        </div>
      </div>
      <div>
        <div style={idy.sec}>À faire · à éviter</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, background: '#fff', border: '1px solid var(--border-default)', borderRadius: 16, padding: 14, textAlign: 'center', height: 140, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'grid', placeItems: 'center' }}><window.MayaMark size={50} /></div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sage-deep)', marginTop: 14 }}>✓ Le rayon, honey calme</div>
          </div>
          <div style={{ flex: 1, background: '#fff', border: '1px solid var(--border-default)', borderRadius: 16, padding: 14, textAlign: 'center', height: 140, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <div style={{ width: 50, height: 50, position: 'relative' }}>
                <svg width="50" height="50" viewBox="0 0 24 24"><path d="M12 1.7 20.9 6.85v10.3L12 22.3 3.1 17.15V6.85z" fill="url(#maya-old-bad)" /><path d="M12 6.6l1.15 2.9 2.9 1.15-2.9 1.15L12 14.7l-1.15-2.9L7.95 10.65l2.9-1.15z" fill="#fff" /></svg>
                <svg width="0" height="0"><defs><linearGradient id="maya-old-bad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f5a623" /><stop offset="1" stopColor="#7a9676" /></linearGradient></defs></svg>
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><div style={{ width: 60, height: 2.5, background: 'var(--status-bad)', transform: 'rotate(-45deg)', borderRadius: 2 }} /></div>
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--status-bad)', marginTop: 14 }}>✕ Dégradé · objet posé</div>
          </div>
        </div>
      </div>
    </div>

    <div style={{ display: 'flex', gap: 14, marginTop: 30, alignItems: 'center', padding: '18px 22px', background: '#fff', border: '1px solid var(--border-default)', borderRadius: 18 }}>
      <window.MayaMark size={40} glow state="idle" />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>La voix de Maya</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>Chaleureuse, tutoiement, première personne. Elle rassure sans infantiliser, célèbre les victoires, s'inquiète avec mesure. Jamais un robot — un binôme.</div>
      </div>
    </div>
  </div>
);
window.MayaBrand = MayaBrand;
