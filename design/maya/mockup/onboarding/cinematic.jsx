/* Maya — Onboarding CINÉMATIQUE AUTO-GUIDÉ (v2, sans chat)
   Maya "naît", puis raconte elle-même son rôle à travers des scènes immersives qui
   s'enchaînent AUTOMATIQUEMENT. L'apiculteur regarde ; il peut tapoter pour accélérer.
   Un seul vrai choix : le mode de présence. Puis on entre dans APIGO.

   Le rayon de miel reste l'ancre vivante ; sous lui, une "voix" (légende) + un visuel
   par scène, en fondu enchaîné. Rythme posé, premium, rassurant. */

const { useState, useEffect, useRef, useCallback } = React;

/* ── Géométrie du rayon (locale) ── */
const cineHex = (cx, cy, r) => {
  const a = [-90, -30, 30, 90, 150, 210];
  return a.map(d => { const t = d * Math.PI / 180; return `${(cx + r * Math.cos(t)).toFixed(2)},${(cy + r * Math.sin(t)).toFixed(2)}`; }).join(' ');
};
const C_S = 3.75, C_DC = C_S * 1.732;
const C_BASE = cineHex(50, 50, 44);
const C_CELLS = [[50, 50]];
for (let k = 0; k < 6; k++) { const t = k * 60 * Math.PI / 180; C_CELLS.push([50 + (C_DC * 4.16) * Math.cos(t), 50 + (C_DC * 4.16) * Math.sin(t)]); }
const C_CELL_PTS = C_CELLS.map(([x, y]) => cineHex(x, y, C_S * 3.05));
const C_START = [[0, -8], [66, -70], [92, 20], [58, 84], [-52, 74], [-92, -6], [-44, -78]];

/* ── LA NAISSANCE ── */
function MayaBirth({ size = 240, play, born }) {
  return (
    <div className={`cine-birth ${play ? 'is-play' : ''} ${born ? 'is-born' : ''}`} style={{ width: size, height: size, position: 'relative' }}>
      <div className="cine-halo cine-halo-1" />
      <div className="cine-halo cine-halo-2" />
      <div className="cine-ring cine-ring-1" />
      <div className="cine-ring cine-ring-2" />
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ position: 'relative', display: 'block', overflow: 'visible' }}>
        <defs>
          <radialGradient id="cine-cell" cx="0.36" cy="0.28" r="0.9">
            <stop offset="0" stopColor="#ffe0a0" /><stop offset="0.55" stopColor="#f6b552" /><stop offset="1" stopColor="#e2951f" />
          </radialGradient>
          <radialGradient id="cine-base" cx="0.4" cy="0.3" r="0.95">
            <stop offset="0" stopColor="#c8801f" /><stop offset="1" stopColor="#a86814" />
          </radialGradient>
        </defs>
        <polygon className="cine-base" points={C_BASE} fill="url(#cine-base)" stroke="#b0731a" strokeWidth="2.4" strokeLinejoin="round" />
        {C_CELL_PTS.map((p, i) => (
          <polygon key={i} className="cine-cell" points={p} fill="url(#cine-cell)" stroke="#f3ad44" strokeWidth="1.4" strokeLinejoin="round"
            style={{ '--tx': `${C_START[i][0]}px`, '--ty': `${C_START[i][1]}px`, '--rot': `${(i % 2 ? 40 : -40)}deg`, animationDelay: `${(0.15 + i * 0.13).toFixed(2)}s` }} />
        ))}
      </svg>
    </div>
  );
}

/* ══ Les SCÈNES (récit auto) ══
   dur = durée avant enchaînement auto (ms). wait = attend une action (présence).
   cta = scène finale (bouton d'entrée). visual = quel contenu afficher. */
const SCENES = [
  { id: 'hello',    caption: "Bonjour. Moi, c'est Maya.",                         sub: "Ta binôme au rucher — je veille, tu décides.",   visual: 'hello',    dur: 4200 },
  { id: 'apigo',    caption: "Bienvenue dans APIGO.",                              sub: "Ton rucher connecté : le cheptel, les visites, la récolte — réunis, clairs, à jour.", visual: 'apigo', dur: 5400 },
  { id: 'watch',    caption: "Je veille sur ton cheptel, jour et nuit.",          sub: "Tu n'as plus à tout porter seul.",           visual: 'pillars',  dur: 4800 },
  { id: 'propose',  caption: "Et quand quelque chose compte, j'agis.",           sub: "Je repère, je te propose, et je m'en occupe — sous tes yeux.", visual: 'proposal', dur: 7400 },
  { id: 'presence', caption: "Comment veux-tu que je t'accompagne ?",             sub: "Tu pourras changer d'avis quand tu veux.",   visual: 'presence', wait: true },
  { id: 'plan',     caption: "On choisit ta formule ?",                           sub: "Elle fixe le nombre de ruches — modifiable à tout moment.", visual: 'plan',     wait: true },
  { id: 'rucher',   caption: "Créons ton premier rucher.",                        sub: "Un nom, un emplacement — je m'occupe du reste.", visual: 'rucher',   wait: true },
  { id: 'ruches',   caption: "Combien de ruches y installe-t-on ?",              sub: "Je les prépare toutes d'un coup.",           visual: 'ruches',   wait: true },
  { id: 'ready',    caption: "Ton rucher prend vie.",                             sub: "Tout est prêt — entrons ensemble.",           visual: 'ready',    cta: true },
];

/* Plafond de ruches selon l'abonnement (repris du SaaS : Découverte 1, Starter 10,
   Pro/Expert/Essai illimité — plafonné à 30 côté UI). */
const PLAN_CAPS = { decouverte: 1, starter: 10, pro: 999, expert: 999, trial: 999 };

/* ── Moteur auto : naissance → scènes qui s'enchaînent seules ── */
function useScenes() {
  const [phase, setPhase] = useState('birth'); // 'birth' | 'play'
  const [i, setI] = useState(0);
  const [presence, setPresence] = useState('discrete');
  const [plan, setPlan] = useState('trial');
  const [rucher, setRucher] = useState({ nom: '', commune: '', environ: '', gps: false });
  const [nbRuches, setNbRuches] = useState(3);
  const [rucheType, setRucheType] = useState('dadant_10');
  const timer = useRef(null);
  const cap = PLAN_CAPS[plan] ?? 30;

  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };

  // reclampe le nombre de ruches quand la formule change
  useEffect(() => { setNbRuches((n) => Math.min(n, PLAN_CAPS[plan] ?? 30)); }, [plan]);

  const arm = useCallback((idx) => {
    clear();
    const s = SCENES[idx];
    if (s && s.dur && !s.wait && !s.cta) {
      timer.current = setTimeout(() => setI((n) => Math.min(SCENES.length - 1, n + 1)), s.dur);
    }
  }, []);

  const start = useCallback(() => { setPhase('play'); setI(0); }, []);
  useEffect(() => { if (phase === 'play') arm(i); return clear; }, [phase, i, arm]);

  const tap = useCallback(() => {
    const s = SCENES[i];
    if (phase !== 'play' || !s || s.wait || s.cta) return;
    clear(); setI((n) => Math.min(SCENES.length - 1, n + 1));
  }, [phase, i]);

  const advance = useCallback(() => { clear(); setI((n) => Math.min(SCENES.length - 1, n + 1)); }, []);
  const skip = useCallback(() => { clear(); setI(SCENES.findIndex((s) => s.id === 'presence')); }, []);

  return { phase, i, scene: SCENES[i], presence, setPresence, plan, setPlan, rucher, setRucher,
    nbRuches, setNbRuches, rucheType, setRucheType, cap, start, tap, advance, skip, total: SCENES.length };
}

window.MayaCine = { MayaBirth, useScenes, SCENES, PLAN_CAPS };
