/* PAGE — APIGO · Système de formulaires (unifié & moderne)
   Une seule grammaire de saisie pour tout le site. Warm Precision + accent honey.
   Pensé pour le terrain (gros hit targets) et pour que Maya pré-remplisse. */

const fmS = {
  label: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 },
  input: (st) => ({
    display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 14px',
    background: 'var(--surface-card)', borderRadius: 11, fontSize: 14.5,
    border: `1.5px solid ${st === 'focus' ? 'var(--honey)' : st === 'error' ? 'var(--status-bad)' : st === 'success' ? 'var(--sage)' : 'var(--border-strong)'}`,
    boxShadow: st === 'focus' ? '0 0 0 3px rgba(230,152,44,0.16)' : 'none',
  }),
  msg: (st) => ({ fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, color: st === 'error' ? 'var(--status-bad)' : st === 'maya' ? 'var(--honey-deep)' : st === 'success' ? 'var(--sage-deep)' : 'var(--text-tertiary)' }),
  segTrack: { display: 'flex', gap: 3, padding: 3, background: 'var(--surface-muted)', borderRadius: 12 },
  segItem: (sel) => ({ flex: 1, textAlign: 'center', padding: '9px 8px', borderRadius: 9, fontSize: 13.5, fontWeight: sel ? 600 : 500, color: sel ? 'var(--text-primary)' : 'var(--text-secondary)', background: sel ? 'var(--surface-card)' : 'transparent', boxShadow: sel ? 'var(--shadow-xs)' : 'none', cursor: 'pointer' }),
  toggle: (on) => ({ width: 46, height: 28, borderRadius: 99, background: on ? 'var(--honey)' : 'var(--surface-sunk)', position: 'relative', transition: 'background .2s', flexShrink: 0, cursor: 'pointer' }),
  knob: (on) => ({ position: 'absolute', top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: 99, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left .2s' }),
  stepper: { display: 'inline-flex', alignItems: 'center', gap: 0, border: '1.5px solid var(--border-strong)', borderRadius: 11, overflow: 'hidden', height: 46 },
  stepBtn: { width: 46, height: '100%', display: 'grid', placeItems: 'center', background: 'var(--surface-muted)', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' },
  stepVal: { minWidth: 64, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 },
  chip: (sel) => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${sel ? 'var(--honey)' : 'var(--border-strong)'}`, background: sel ? 'var(--honey-soft)' : 'var(--surface-card)', color: sel ? 'var(--honey-deep)' : 'var(--text-secondary)' }),
  textarea: (st) => ({ padding: '12px 14px', minHeight: 92, background: 'var(--surface-card)', borderRadius: 11, fontSize: 14.5, lineHeight: 1.55, color: 'var(--text-primary)', border: `1.5px solid ${st === 'focus' ? 'var(--honey)' : 'var(--border-strong)'}`, boxShadow: st === 'focus' ? '0 0 0 3px rgba(230,152,44,0.16)' : 'none' }),
  photo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, height: 76, border: '1.5px dashed var(--border-strong)', borderRadius: 12, color: 'var(--text-tertiary)', fontSize: 13.5, fontWeight: 500, background: 'var(--surface-muted)' },
  sliderTrack: { position: 'relative', height: 6, borderRadius: 99, background: 'var(--surface-sunk)', margin: '18px 11px' },
  btnPrimary: { height: 46, padding: '0 22px', background: '#1c1c1e', color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' },
  btnGhost: { height: 46, padding: '0 20px', background: 'var(--surface-card)', color: 'var(--text-secondary)', border: '1.5px solid var(--border-strong)', borderRadius: 11, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};

const FField = ({ label, hint, required, status, message, children }) => (
  <div style={{ marginBottom: 18 }}>
    {label && <div style={fmS.label}>{label}{required && <span style={{ color: 'var(--status-bad)' }}>*</span>}{hint && <span style={{ marginLeft: 'auto', fontWeight: 500, color: 'var(--text-tertiary)', fontSize: 11.5 }}>{hint}</span>}</div>}
    {children}
    {message && <div style={fmS.msg(status)}>{status === 'maya' && <window.MayaMark size={13} />}{status === 'error' && React.createElement(window.I.info, { size: 13 })}{status === 'success' && React.createElement(window.I.check, { size: 13, stroke: 2.4 })}{message}</div>}
  </div>
);
const FInput = ({ placeholder, value, icon, suffix, status }) => (
  <div style={fmS.input(status)}>
    {icon && React.createElement(window.I[icon], { size: 17, style: { color: 'var(--text-tertiary)' } })}
    <span style={{ flex: 1, color: value ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{value || placeholder}</span>
    {status === 'success' && React.createElement(window.I.check, { size: 17, stroke: 2.4, style: { color: 'var(--sage)' } })}
    {suffix && <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{suffix}</span>}
  </div>
);
const FSelect = ({ placeholder, value, icon }) => (
  <div style={fmS.input()}>
    {icon && React.createElement(window.I[icon], { size: 17, style: { color: 'var(--text-tertiary)' } })}
    <span style={{ flex: 1, color: value ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{value || placeholder}</span>
    {React.createElement(window.I.chevronDown, { size: 17, style: { color: 'var(--text-tertiary)' } })}
  </div>
);
const FSeg = ({ options, value }) => (
  <div style={fmS.segTrack}>{options.map((o) => <div key={o} style={fmS.segItem(o === value)}>{o}</div>)}</div>
);
const FToggle = ({ on }) => <div style={fmS.toggle(on)}><div style={fmS.knob(on)} /></div>;
const FStepper = ({ value, unit }) => (
  <div style={fmS.stepper}>
    <button style={fmS.stepBtn}>{React.createElement(window.I.minus, { size: 18, stroke: 2.2 })}</button>
    <span style={fmS.stepVal}>{value}{unit ? <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}> {unit}</span> : null}</span>
    <button style={fmS.stepBtn}>{React.createElement(window.I.plus, { size: 18, stroke: 2.2 })}</button>
  </div>
);
const FChips = ({ options, selected = [] }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{options.map((o) => <div key={o} style={fmS.chip(selected.includes(o))}>{selected.includes(o) && React.createElement(window.I.check, { size: 14, stroke: 2.6 })}{o}</div>)}</div>
);
const FSlider = ({ value = 60 }) => (
  <div style={fmS.sliderTrack}>
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${value}%`, background: 'var(--honey)', borderRadius: 99 }} />
    <div style={{ position: 'absolute', top: '50%', left: `${value}%`, transform: 'translate(-50%,-50%)', width: 20, height: 20, borderRadius: 99, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)', border: '1px solid var(--border-default)' }} />
  </div>
);
const FPhoto = () => <div style={fmS.photo}>{React.createElement(window.I.camera, { size: 19 })} Ajouter une photo</div>;
Object.assign(window, { FField, FInput, FSelect, FSeg, FToggle, FStepper, FChips, FSlider, FPhoto, fmS });

/* ── Board 1 — Le kit ── */
const sectionT = { fontSize: 11, fontWeight: 700, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 };
const FormsKit = () => (
  <div style={{ width: 1280, height: 880, background: '#faf7f0', fontFamily: 'var(--font-text)', overflow: 'auto', padding: '48px 56px' }}>
    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>APIGO · Système de saisie</div>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 10, color: 'var(--text-primary)' }}>Des formulaires unifiés, modernes, terrain</div>
    <div style={{ fontSize: 14.5, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 680, lineHeight: 1.55 }}>Une seule grammaire pour toute l'app : cibles de 46px, focus honey, choix au tap plutôt qu'à la saisie libre — et chaque champ peut être pré-rempli par Maya.</div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28, marginTop: 40 }}>
      <div>
        <div style={sectionT}>Champs texte</div>
        <FField label="Nom du rucher" required><FInput value="Mont Ventoux Sud" icon="pin" /></FField>
        <FField label="Email"><FInput placeholder="prenom@exploitation.fr" icon="mail" /></FField>
        <FField label="Recherche" status="focus" message="État focus — anneau honey" ><FInput placeholder="Rechercher…" icon="search" status="focus" /></FField>
      </div>
      <div>
        <div style={sectionT}>Validation</div>
        <FField label="Numéro SIRET" status="error" message="14 chiffres attendus"><FInput value="812 044 9" status="error" /></FField>
        <FField label="Code rucher" status="success" message="Disponible"><FInput value="R-08" status="success" /></FField>
        <FField label="Date de naissance reine" status="maya" message="Pré-rempli par Maya · 2023"><FInput value="Avril 2023" icon="calendar" /></FField>
      </div>
      <div>
        <div style={sectionT}>Nombres</div>
        <FField label="Cadres de couvain"><FStepper value="6" unit="cadres" /></FField>
        <FField label="Hausses posées"><FStepper value="2" /></FField>
        <FField label="Force de la colonie" hint="60 %"><FSlider value={60} /></FField>
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28, marginTop: 14 }}>
      <div>
        <div style={sectionT}>Choix unique</div>
        <FField label="Type d'intervention"><FSeg options={['Visite', 'Récolte', 'Traitement']} value="Visite" /></FField>
        <FField label="État de la reine"><FSeg options={['Vue', 'Non vue', 'À remplacer']} value="Vue" /></FField>
        <FField label="Rucher"><FSelect value="Garrigue de Sault" icon="pin" /></FField>
      </div>
      <div>
        <div style={sectionT}>Choix multiple</div>
        <FField label="Actions menées"><FChips options={['Hausse posée', 'Nourrissement', 'Traitement', 'Nettoyage']} selected={['Hausse posée']} /></FField>
        <FField label="Flore dominante"><FChips options={['Lavande', 'Thym', 'Châtaignier', 'Romarin']} selected={['Lavande', 'Thym']} /></FField>
      </div>
      <div>
        <div style={sectionT}>Bascules & médias</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <FToggle on={true} /><div style={{ fontSize: 13.5 }}><div style={{ fontWeight: 600 }}>Surveillance nocturne</div><div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Maya veille la nuit</div></div>
        </div>
        <FField label="Photo de la ruche"><FPhoto /></FField>
        <FField label="Notes libres"><div style={fmS.textarea()}><span style={{ color: 'var(--text-tertiary)' }}>Observations du jour…</span></div></FField>
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18, paddingTop: 22, borderTop: '1px solid var(--border-default)' }}>
      <div style={sectionT}>Boutons</div>
      <div style={{ flex: 1 }} />
      <button style={fmS.btnGhost}>Annuler</button>
      <button style={{ ...fmS.btnGhost, color: 'var(--honey-deep)', borderColor: 'var(--honey)', display: 'inline-flex', alignItems: 'center', gap: 7 }}><window.MayaMark size={16} /> Demander à Maya</button>
      <button style={fmS.btnPrimary}>{React.createElement(window.I.check, { size: 17, stroke: 2.4 })} Enregistrer</button>
    </div>
  </div>
);
window.FormsKit = FormsKit;

/* ── Board 2 — Formulaire desktop (Nouvelle intervention) ── */
const FormDesktop = () => (
  <div style={{ width: 1280, height: 880, background: 'var(--surface-sunk)', fontFamily: 'var(--font-text)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
    <div style={{ width: 560, background: 'var(--surface-card)', borderRadius: 22, boxShadow: '0 30px 70px rgba(40,30,20,0.2)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 26px', borderBottom: '1px solid var(--border-faint)' }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--honey-soft)', color: 'var(--honey-deep)', display: 'grid', placeItems: 'center' }}>{React.createElement(window.I.calendar, { size: 20 })}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Nouvelle intervention</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>Planifiez une action au rucher</div>
        </div>
        <button style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid var(--border-default)', background: 'var(--surface-card)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>{React.createElement(window.I.x, { size: 17 })}</button>
      </div>
      <div style={{ padding: '24px 26px' }}>
        <FField label="Type"><FSeg options={['Visite', 'Récolte', 'Traitement', 'Pose hausse']} value="Visite" /></FField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FField label="Rucher" required><FSelect value="Prés de la Sorgue" icon="pin" /></FField>
          <FField label="Ruche"><FSelect placeholder="Toutes" icon="package" /></FField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FField label="Date" status="maya" message="Maya suggère mer. 3 mai"><FInput value="Mer. 3 mai" icon="calendar" /></FField>
          <FField label="Heure"><FInput value="06:30" icon="clock" suffix="à la fraîche" /></FField>
        </div>
        <FField label="Priorité"><FSeg options={['Normale', 'Importante', 'Urgente']} value="Importante" /></FField>
        <FField label="Note pour le terrain"><div style={fmS.textarea()}><span style={{ color: 'var(--text-tertiary)' }}>Vérifier les 4 cellules royales, prévoir une hausse…</span></div></FField>
      </div>
      <div style={{ display: 'flex', gap: 12, padding: '16px 26px', borderTop: '1px solid var(--border-faint)', background: 'var(--surface-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-tertiary)' }}><window.MayaMark size={18} /> Maya a pré-rempli 2 champs</div>
        <div style={{ flex: 1 }} />
        <button style={fmS.btnGhost}>Annuler</button>
        <button style={fmS.btnPrimary}>{React.createElement(window.I.check, { size: 17, stroke: 2.4 })} Planifier</button>
      </div>
    </div>
  </div>
);
window.FormDesktop = FormDesktop;

/* ── Board 3 — Formulaire mobile terrain (Compte-rendu de visite) ── */
const FormMobile = () => (
  <window.IOSDevice width={402} height={874}>
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface-primary)' }}>
      <div style={{ paddingTop: 58, padding: '58px 18px 14px', borderBottom: '1px solid var(--border-faint)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-tertiary)' }}>{React.createElement(window.I.chevronLeft, { size: 16 })} Annuler</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, marginTop: 10, color: 'var(--text-primary)' }}>Compte-rendu · V-014</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', marginBottom: 18, borderRadius: 13, background: 'linear-gradient(135deg,#fff7ec,#fbf1e1)', border: '1px solid var(--border-default)' }}>
          <window.MayaMark size={26} state="idle" />
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}><b style={{ color: 'var(--text-primary)' }}>J'ai pré-rempli depuis ta dictée.</b> Corrige ce qu'il faut.</div>
        </div>
        <FField label="État de la reine"><FSeg options={['Vue', 'Non vue', 'À remplacer']} value="Vue" /></FField>
        <FField label="Cadres de couvain"><FStepper value="6" unit="cadres" /></FField>
        <FField label="Réserves"><FSeg options={['Faibles', 'Correctes', 'Bonnes']} value="Correctes" /></FField>
        <FField label="Actions menées"><FChips options={['Hausse posée', 'Nourrir', 'Traiter']} selected={['Hausse posée']} /></FField>
        <FField label="Suivi" status="maya" message="Maya programmera un contrôle dans 7 j"><FInput value="Surveiller essaimage" icon="alertTriangle" /></FField>
        <FField label="Photo"><FPhoto /></FField>
      </div>
      <div style={{ flexShrink: 0, padding: '12px 16px 30px', borderTop: '1px solid var(--border-faint)', background: 'rgba(250,249,246,0.95)' }}>
        <button style={{ ...fmS.btnPrimary, width: '100%', height: 50, borderRadius: 14, fontSize: 15 }}>{React.createElement(window.I.check, { size: 18, stroke: 2.4 })} Classer la fiche</button>
      </div>
    </div>
  </window.IOSDevice>
);
window.FormMobile = FormMobile;

/* ── Board 4 — Archétypes : tous les contextes de formulaire du site ── */
const FormArchetypes = () => (
  <div style={{ width: 1280, height: 880, background: '#faf7f0', fontFamily: 'var(--font-text)', overflow: 'hidden', padding: '40px 48px', display: 'flex', flexDirection: 'column' }}>
    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>APIGO · Archétypes de formulaire</div>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 8, color: 'var(--text-primary)' }}>Le même kit, dans tous les contextes du site</div>

    <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.25fr', gap: 26, marginTop: 26, flex: 1, minHeight: 0 }}>
      {/* Auth */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 14 }}>Connexion · pleine page</div>
        <div style={{ flex: 1, background: 'linear-gradient(160deg,#fff7ec,#faf3e6)', border: '1px solid var(--border-default)', borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 44px' }}>
          <window.MayaMark size={56} state="idle" />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 18 }}>Content de vous revoir</div>
          <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 6, marginBottom: 24, textAlign: 'center' }}>Maya a veillé sur vos ruches.</div>
          <div style={{ width: '100%' }}>
            <window.FField label="Email"><window.FInput value="marc@miellerie-ventoux.fr" icon="mail" /></window.FField>
            <window.FField label="Mot de passe" status="focus"><window.FInput value="••••••••••" icon="lock" status="focus" /></window.FField>
            <button style={{ ...window.fmS.btnPrimary, width: '100%', marginTop: 4 }}>Se connecter</button>
            <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 14 }}>Mot de passe oublié ?</div>
          </div>
        </div>
      </div>

      {/* Wizard */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 14 }}>Assistant multi-étapes · Nouvelle ruche</div>
        <div style={{ flex: 1, background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 20, boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '20px 26px 18px', borderBottom: '1px solid var(--border-faint)' }}>
            {[['Identité', 'done'], ['Emplacement', 'active'], ['Colonie', ''], ['Maya', '']].map(([lbl, st], i) => (
              <React.Fragment key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 99, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)', background: st === 'done' ? 'var(--sage)' : st === 'active' ? '#1c1c1e' : 'var(--surface-sunk)', color: st ? '#fff' : 'var(--text-tertiary)' }}>{st === 'done' ? React.createElement(window.I.check, { size: 14, stroke: 2.6 }) : i + 1}</div>
                  <span style={{ fontSize: 12.5, fontWeight: st === 'active' ? 600 : 500, color: st === 'active' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{lbl}</span>
                </div>
                {i < 3 && <div style={{ flex: 1, height: 1.5, background: st === 'done' ? 'var(--sage)' : 'var(--border-default)', margin: '0 12px' }} />}
              </React.Fragment>
            ))}
          </div>
          <div style={{ flex: 1, padding: '22px 26px', minHeight: 0, overflow: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <window.FField label="Rucher" required><window.FSelect value="Prés de la Sorgue" icon="pin" /></window.FField>
              <window.FField label="Code ruche" status="success" message="R-09 · libre"><window.FInput value="R-09" status="success" /></window.FField>
            </div>
            <window.FField label="Type de support"><window.FSeg options={['Dadant', 'Langstroth', 'Warré']} value="Dadant" /></window.FField>
            <window.FField label="Exposition" status="maya" message="Maya recommande plein sud, abritée du mistral"><window.FSeg options={['Nord', 'Est', 'Sud', 'Ouest']} value="Sud" /></window.FField>
            <window.FField label="Photo de l'emplacement"><window.FPhoto /></window.FField>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 26px', borderTop: '1px solid var(--border-faint)', background: 'var(--surface-primary)' }}>
            <button style={window.fmS.btnGhost}>Retour</button>
            <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>Étape 2 sur 4</div>
            <button style={window.fmS.btnPrimary}>Continuer {React.createElement(window.I.chevronRight, { size: 16, stroke: 2.2 })}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
window.FormArchetypes = FormArchetypes;
