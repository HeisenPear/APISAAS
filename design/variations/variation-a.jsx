/* Variation A — "Quiet" : tabs verticaux, monochrome warm, sticky save bar */

const A_styles = {
  page: {
    display: 'flex',
    background: 'var(--surface-primary)',
    width: 1280,
    height: 880,
    overflow: 'hidden',
    fontFamily: 'var(--font-text)',
    color: 'var(--text-primary)',
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar: {
    height: 56, display: 'flex', alignItems: 'center', gap: 12,
    padding: '0 28px',
    borderBottom: '1px solid var(--border-default)',
    background: 'rgba(250,250,248,0.85)',
    backdropFilter: 'blur(8px)',
  },
  crumb: { color: 'var(--text-tertiary)', fontSize: 13 },
  crumbCurrent: { color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 },
  searchBox: {
    marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 10px',
    background: 'var(--surface-muted)',
    border: '1px solid transparent',
    borderRadius: 8,
    color: 'var(--text-tertiary)', fontSize: 13,
    width: 240,
  },
  body: { flex: 1, display: 'flex', minHeight: 0 },

  /* Section nav */
  sectionNav: {
    width: 240, flexShrink: 0,
    padding: '32px 16px 32px 28px',
    display: 'flex', flexDirection: 'column', gap: 1,
    borderRight: '1px solid var(--border-default)',
  },
  sectionNavTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 22, fontWeight: 600,
    letterSpacing: '-0.02em',
    marginBottom: 4,
  },
  sectionNavSub: { color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 22 },
  navItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px', borderRadius: 8,
    fontSize: 13.5, fontWeight: active ? 600 : 500,
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    background: active ? 'var(--surface-card)' : 'transparent',
    boxShadow: active ? 'var(--shadow-xs)' : 'none',
    border: active ? '1px solid var(--border-default)' : '1px solid transparent',
    cursor: 'pointer',
    transition: 'all .15s',
  }),
  navDot: (active) => ({
    width: 4, height: 4, borderRadius: 99,
    background: active ? 'var(--honey)' : 'var(--text-quaternary)',
  }),

  /* Content */
  content: { flex: 1, overflow: 'auto', padding: '32px 40px 120px', minWidth: 0 },
  sectionHead: { marginBottom: 24 },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, letterSpacing: '-0.015em' },
  sectionDesc: { color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 4, lineHeight: 1.55 },

  /* Profile hero */
  hero: {
    display: 'flex', alignItems: 'center', gap: 18,
    padding: '20px 22px',
    background: 'var(--surface-card)',
    border: '1px solid var(--border-default)',
    borderRadius: 16,
    marginBottom: 28,
  },
  avatar: {
    width: 62, height: 62, borderRadius: 16,
    background: '#1c1c1e', color: 'var(--honey)',
    display: 'grid', placeItems: 'center',
    fontFamily: 'var(--font-display)',
    fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em',
  },
  heroName: { fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 },
  heroEmail: { color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 },
  heroMeta: { display: 'flex', gap: 16, marginTop: 8, color: 'var(--text-tertiary)', fontSize: 12 },
  metaBit: { display: 'flex', alignItems: 'center', gap: 5 },
  planChip: {
    marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 10px',
    background: 'var(--honey-soft)',
    border: '1px solid #f5d8a8',
    color: 'var(--honey-deep)',
    borderRadius: 999, fontSize: 12, fontWeight: 600,
  },

  /* Form */
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px 24px',
    marginBottom: 32,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldFull: { gridColumn: '1 / -1' },
  label: {
    fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  labelHint: { color: 'var(--text-tertiary)', fontWeight: 400, fontSize: 11.5 },
  input: {
    height: 38,
    padding: '0 12px',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    background: 'var(--surface-card)',
    fontSize: 14,
    outline: 'none',
    color: 'var(--text-primary)',
  },
  inputDisabled: {
    background: 'var(--surface-muted)',
    color: 'var(--text-tertiary)',
    cursor: 'not-allowed',
  },
  inputWithIcon: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' },

  /* Toggle row */
  toggleRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 0',
    borderTop: '1px solid var(--border-default)',
  },
  toggleRowFirst: { borderTop: 'none' },
  toggleLabel: { fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 },
  toggleDesc: { fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 2 },

  /* Sticky bar */
  stickyBar: {
    position: 'absolute', left: 240, right: 0, bottom: 0,
    padding: '14px 40px',
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(10px)',
    borderTop: '1px solid var(--border-default)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    fontSize: 13,
    transform: 'translateY(0)',
    transition: 'transform .25s',
  },
  unsavedDot: {
    display: 'inline-block', width: 6, height: 6, borderRadius: 99, background: 'var(--honey)',
    marginRight: 8, verticalAlign: 'middle',
  },
  cancelBtn: {
    height: 36, padding: '0 16px', background: 'transparent',
    border: 'none', color: 'var(--text-secondary)',
    fontSize: 13.5, fontWeight: 500,
  },
  saveBtn: {
    height: 36, padding: '0 18px',
    background: 'var(--text-primary)', color: '#fff',
    border: 'none', borderRadius: 8,
    fontSize: 13.5, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 8,
  },
};

const A_Toggle = ({ on, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!on)}
    style={{
      width: 36, height: 22, borderRadius: 99,
      border: 'none',
      background: on ? '#1c1c1e' : '#d6d3d1',
      position: 'relative', transition: 'background .2s',
      flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute', top: 2, left: on ? 16 : 2,
      width: 18, height: 18, borderRadius: 99, background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      transition: 'left .2s',
    }} />
  </button>
);

const A_Field = ({ label, hint, children, full, icon }) => (
  <label style={{ ...A_styles.field, ...(full ? A_styles.fieldFull : {}) }}>
    <span style={A_styles.label}>
      <span>{label}</span>
      {hint && <span style={A_styles.labelHint}>{hint}</span>}
    </span>
    {children}
  </label>
);

const A_Input = ({ value, placeholder, disabled, icon }) => (
  <div style={{ ...A_styles.inputWithIcon, ...(icon ? {} : {}) }}>
    {icon && <div style={A_styles.inputIcon}>{React.createElement(window.I[icon], { size: 15 })}</div>}
    <input
      defaultValue={value}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        ...A_styles.input,
        ...(disabled ? A_styles.inputDisabled : {}),
        paddingLeft: icon ? 34 : 12,
        width: '100%',
      }}
    />
  </div>
);

const A_NavItem = ({ icon, label, active, count }) => (
  <div style={A_styles.navItem(active)}>
    {React.createElement(window.I[icon], { size: 16, stroke: 1.75, style: { color: active ? 'var(--honey-deep)' : 'var(--text-tertiary)' } })}
    <span>{label}</span>
    {count != null && (
      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)' }}>{count}</span>
    )}
  </div>
);

const VariationA = () => {
  const [tab, setTab] = React.useState('compte');
  const [prefs, setPrefs] = React.useState({ ...window.MOCK_PREFS });
  const p = window.MOCK_PROFIL;

  const renderCompte = () => (
    <>
      <div style={A_styles.hero}>
        <div style={A_styles.avatar}>{p.initials}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={A_styles.heroName}>{p.prenom} {p.nom}</div>
          <div style={A_styles.heroEmail}>{p.email}</div>
          <div style={A_styles.heroMeta}>
            <span style={A_styles.metaBit}>{React.createElement(window.I.pin, { size: 12 })} {p.ville}</span>
            <span style={A_styles.metaBit}>{React.createElement(window.I.hexagon, { size: 12 })} {p.ruches} ruches · {p.ruchers} ruchers</span>
            <span style={A_styles.metaBit}>{p.napi}</span>
          </div>
        </div>
        <div style={A_styles.planChip}>
          {React.createElement(window.I.crown, { size: 13 })} Plan Pro
        </div>
      </div>

      <div style={A_styles.sectionHead}>
        <div style={A_styles.sectionTitle}>Identité</div>
        <div style={A_styles.sectionDesc}>Informations qui apparaissent dans l'application et sur vos documents.</div>
      </div>

      <div style={A_styles.fieldGrid}>
        <A_Field label="Prénom"><A_Input value={p.prenom} /></A_Field>
        <A_Field label="Nom"><A_Input value={p.nom} /></A_Field>
        <A_Field label="Email" hint="non modifiable"><A_Input value={p.email} disabled icon="lock" /></A_Field>
        <A_Field label="Téléphone"><A_Input value={p.telephone} icon="phone" /></A_Field>
      </div>

      <div style={A_styles.sectionHead}>
        <div style={A_styles.sectionTitle}>Exploitation apicole</div>
        <div style={A_styles.sectionDesc}>Coordonnées légales et numéros officiels utilisés sur vos factures.</div>
      </div>

      <div style={A_styles.fieldGrid}>
        <A_Field label="Raison sociale" full><A_Input value={p.raison} /></A_Field>
        <A_Field label="Adresse" full><A_Input value={p.adresse} icon="pin" /></A_Field>
        <A_Field label="Code postal"><A_Input value={p.codePostal} /></A_Field>
        <A_Field label="Ville"><A_Input value={p.ville} /></A_Field>
        <A_Field label="NAPI" hint="GDSA / DDPP"><A_Input value={p.napi.replace('NAPI ','')} /></A_Field>
        <A_Field label="SIRET" hint="14 chiffres"><A_Input value={p.siret} /></A_Field>
      </div>

      <div style={A_styles.sectionHead}>
        <div style={A_styles.sectionTitle}>Options de facturation</div>
      </div>
      <div style={{ ...A_styles.toggleRow, ...A_styles.toggleRowFirst }}>
        <div>
          <div style={A_styles.toggleLabel}>Option TVA sur les débits</div>
          <div style={A_styles.toggleDesc}>Ajoute la mention « Option pour le paiement de la taxe d'après les débits » sur vos factures.</div>
        </div>
        <A_Toggle on={true} onChange={() => {}} />
      </div>
    </>
  );

  const renderNotifications = () => (
    <>
      <div style={A_styles.sectionHead}>
        <div style={A_styles.sectionTitle}>Notifications</div>
        <div style={A_styles.sectionDesc}>Choisissez ce qui mérite une alerte. Les autres événements restent dans le journal.</div>
      </div>
      {[
        { k: 'alertesStock', label: 'Stocks bas', desc: "Quand un stock passe sous le seuil que vous avez défini." },
        { k: 'rappelsInterventions', label: 'Interventions à venir', desc: 'Rappel le matin pour les visites planifiées dans la journée.' },
        { k: 'alertesMeteo', label: 'Météo critique', desc: 'Gel sous -3 °C, canicule au-dessus de 36 °C, vents forts.' },
        { k: 'alertesEssaim', label: 'Risque d\'essaimage', desc: 'Détection à partir des cellules royales saisies en visite.' },
        { k: 'pushMobile', label: 'Push mobile', desc: 'Recevoir aussi sur l\'app mobile, en plus des emails.' },
        { k: 'digestHebdo', label: 'Digest hebdomadaire', desc: 'Résumé envoyé chaque lundi à 7 h.' },
      ].map((row, i) => (
        <div key={row.k} style={{ ...A_styles.toggleRow, ...(i === 0 ? A_styles.toggleRowFirst : {}) }}>
          <div>
            <div style={A_styles.toggleLabel}>{row.label}</div>
            <div style={A_styles.toggleDesc}>{row.desc}</div>
          </div>
          <A_Toggle on={prefs[row.k]} onChange={(v) => setPrefs({ ...prefs, [row.k]: v })} />
        </div>
      ))}
    </>
  );

  const renderSecurite = () => (
    <>
      <div style={A_styles.sectionHead}>
        <div style={A_styles.sectionTitle}>Sécurité</div>
        <div style={A_styles.sectionDesc}>Mot de passe, sessions actives et accès à votre compte.</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {[
          { icon: 'key', title: 'Mot de passe', desc: 'Modifié il y a 3 mois', cta: 'Modifier' },
          { icon: 'shield', title: 'Authentification à deux facteurs', desc: 'Désactivée — recommandée pour un compte Pro', cta: 'Activer', accent: true },
          { icon: 'globe', title: 'Sessions actives', desc: '2 appareils — MacBook Pro (ici), iPhone 15', cta: 'Voir' },
          { icon: 'logout', title: 'Se déconnecter de cet appareil', desc: 'Vous devrez ressaisir votre mot de passe', cta: 'Déconnecter' },
        ].map((row, i) => (
          <div key={row.title} style={{ ...A_styles.toggleRow, ...(i === 0 ? A_styles.toggleRowFirst : {}) }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, marginTop: 2,
                background: row.accent ? 'var(--honey-soft)' : 'var(--surface-muted)',
                color: row.accent ? 'var(--honey-deep)' : 'var(--text-secondary)',
                display: 'grid', placeItems: 'center',
              }}>
                {React.createElement(window.I[row.icon], { size: 15 })}
              </div>
              <div>
                <div style={A_styles.toggleLabel}>{row.title}</div>
                <div style={A_styles.toggleDesc}>{row.desc}</div>
              </div>
            </div>
            <button style={{
              height: 32, padding: '0 14px',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 8, fontSize: 13, fontWeight: 500,
              color: 'var(--text-primary)',
            }}>{row.cta}</button>
          </div>
        ))}
      </div>
    </>
  );

  const renderAbonnement = () => (
    <>
      <div style={A_styles.sectionHead}>
        <div style={A_styles.sectionTitle}>Abonnement</div>
        <div style={A_styles.sectionDesc}>Plan actuel, prochaine facture et historique.</div>
      </div>
      <div style={{
        padding: 22, borderRadius: 16,
        background: 'linear-gradient(135deg, #fff8e7, #fef6e4)',
        border: '1px solid #f5d8a8',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: '#1c1c1e', color: 'var(--honey)',
            display: 'grid', placeItems: 'center',
          }}>{React.createElement(window.I.crown, { size: 22 })}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600 }}>Plan Pro</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>Jusqu'à 500 ruches, exports illimités, météo avancée</div>
            <div style={{ display: 'flex', gap: 24, marginTop: 14, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <div><span style={{ color: 'var(--text-tertiary)' }}>Prochaine facture · </span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>14 mai 2026</span></div>
              <div><span style={{ color: 'var(--text-tertiary)' }}>Montant · </span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>29 € HT / mois</span></div>
              <div><span style={{ color: 'var(--text-tertiary)' }}>Carte · </span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Visa •• 4218</span></div>
            </div>
          </div>
          <button style={{
            height: 34, padding: '0 14px',
            background: '#1c1c1e', color: '#fff',
            border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 600,
          }}>Gérer le plan</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <a style={{ ...A_styles.toggleRow, ...A_styles.toggleRowFirst, flex: 1, padding: '14px 18px', borderTop: 'none', border: '1px solid var(--border-default)', borderRadius: 12 }}>
          <div>
            <div style={A_styles.toggleLabel}>Historique de factures</div>
            <div style={A_styles.toggleDesc}>14 factures depuis février 2024</div>
          </div>
          {React.createElement(window.I.chevronRight, { size: 16, style: { color: 'var(--text-tertiary)' } })}
        </a>
        <a style={{ ...A_styles.toggleRow, ...A_styles.toggleRowFirst, flex: 1, padding: '14px 18px', borderTop: 'none', border: '1px solid var(--border-default)', borderRadius: 12 }}>
          <div>
            <div style={A_styles.toggleLabel}>Moyens de paiement</div>
            <div style={A_styles.toggleDesc}>1 carte enregistrée</div>
          </div>
          {React.createElement(window.I.chevronRight, { size: 16, style: { color: 'var(--text-tertiary)' } })}
        </a>
      </div>
    </>
  );

  const renderEquipe = () => (
    <>
      <div style={A_styles.sectionHead}>
        <div style={A_styles.sectionTitle}>Équipe</div>
        <div style={A_styles.sectionDesc}>Vos collaborateurs et leurs accès. Le plan Pro inclut jusqu'à 3 sièges.</div>
      </div>
      <div style={{ border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'hidden' }}>
        {[
          { name: 'Marc Lefèvre', email: 'marc.lefevre@apigo.fr', role: 'Propriétaire', tag: 'Vous' },
          { name: 'Élise Vidal', email: 'elise.v@apigo.fr', role: 'Apiculteur·trice', tag: null },
          { name: 'Thomas Roux', email: 'thomas.roux@apigo.fr', role: 'Lecture seule', tag: null },
        ].map((m, i) => (
          <div key={m.email} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 18px',
            borderTop: i === 0 ? 'none' : '1px solid var(--border-default)',
            background: 'var(--surface-card)',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 99,
              background: 'var(--surface-muted)',
              color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12,
              display: 'grid', placeItems: 'center',
            }}>{m.name.split(' ').map(s=>s[0]).join('')}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{m.name} {m.tag && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>· {m.tag}</span>}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>{m.email}</div>
            </div>
            <span style={{
              fontSize: 12, color: 'var(--text-secondary)',
              background: 'var(--surface-muted)', padding: '4px 10px', borderRadius: 99,
            }}>{m.role}</span>
            {React.createElement(window.I.chevronRight, { size: 14, style: { color: 'var(--text-tertiary)' } })}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8,
          height: 36, padding: '0 14px',
          background: 'var(--surface-card)',
          border: '1px dashed var(--border-strong)',
          borderRadius: 8, fontSize: 13.5, fontWeight: 500, color: 'var(--text-secondary)',
        }}>{React.createElement(window.I.plus, { size: 14 })} Inviter un collaborateur</button>
      </div>
    </>
  );

  const renderDonnees = () => (
    <>
      <div style={A_styles.sectionHead}>
        <div style={A_styles.sectionTitle}>Données & confidentialité</div>
        <div style={A_styles.sectionDesc}>Vous restez propriétaire de vos données. Exportez-les ou supprimez votre compte à tout moment.</div>
      </div>
      {[
        { icon: 'download', title: 'Exporter mes données', desc: 'Archive ZIP au format CSV — interventions, ruches, finances.', cta: 'Exporter' },
        { icon: 'fileText', title: 'Conditions Générales d\'Utilisation', desc: 'Dernière mise à jour le 12 février 2026.', cta: 'Lire', external: true },
        { icon: 'shield', title: 'Politique de confidentialité', desc: 'Conforme RGPD — données hébergées en France (OVH).', cta: 'Lire', external: true },
      ].map((row, i) => (
        <div key={row.title} style={{ ...A_styles.toggleRow, ...(i === 0 ? A_styles.toggleRowFirst : {}) }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, marginTop: 2,
              background: 'var(--surface-muted)',
              color: 'var(--text-secondary)',
              display: 'grid', placeItems: 'center',
            }}>{React.createElement(window.I[row.icon], { size: 15 })}</div>
            <div>
              <div style={A_styles.toggleLabel}>{row.title}</div>
              <div style={A_styles.toggleDesc}>{row.desc}</div>
            </div>
          </div>
          <button style={{
            height: 32, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 8, fontSize: 13, fontWeight: 500,
            color: 'var(--text-primary)',
          }}>
            {row.cta} {row.external && React.createElement(window.I.external, { size: 12 })}
          </button>
        </div>
      ))}

      <div style={{ marginTop: 32, padding: 18, borderRadius: 12, border: '1px solid #f0d4d4', background: '#fdf6f6' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ color: '#c54545', marginTop: 2 }}>{React.createElement(window.I.alertTriangle, { size: 16 })}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#9a2f2f' }}>Supprimer mon compte</div>
            <div style={{ fontSize: 12.5, color: '#a85555', marginTop: 4, lineHeight: 1.5 }}>Action irréversible. Toutes vos ruches, interventions, factures et exports seront définitivement effacés sous 30 jours.</div>
          </div>
          <button style={{
            height: 32, padding: '0 14px',
            background: '#fff', border: '1px solid #e8c5c5',
            color: '#9a2f2f', borderRadius: 8, fontSize: 13, fontWeight: 600,
          }}>Supprimer le compte</button>
        </div>
      </div>
    </>
  );

  const tabs = [
    { id: 'compte', icon: 'user', label: 'Compte' },
    { id: 'notifications', icon: 'bell', label: 'Notifications' },
    { id: 'securite', icon: 'shield', label: 'Sécurité' },
    { id: 'abonnement', icon: 'card', label: 'Abonnement' },
    { id: 'equipe', icon: 'users', label: 'Équipe', count: 3 },
    { id: 'donnees', icon: 'database', label: 'Données' },
  ];

  const renderers = {
    compte: renderCompte,
    notifications: renderNotifications,
    securite: renderSecurite,
    abonnement: renderAbonnement,
    equipe: renderEquipe,
    donnees: renderDonnees,
  };

  return (
    <div style={A_styles.page}>
      <window.Sidebar active="parametres" />
      <div style={A_styles.main}>
        <div style={A_styles.topbar}>
          <span style={A_styles.crumb}>Paramètres</span>
          {React.createElement(window.I.chevronRight, { size: 13, style: { color: 'var(--text-quaternary)' } })}
          <span style={A_styles.crumbCurrent}>{tabs.find(t => t.id === tab).label}</span>
          <div style={A_styles.searchBox}>
            {React.createElement(window.I.search, { size: 14 })}
            <span>Rechercher un paramètre…</span>
          </div>
        </div>
        <div style={A_styles.body}>
          <div style={A_styles.sectionNav}>
            <div style={A_styles.sectionNavTitle}>Paramètres</div>
            <div style={A_styles.sectionNavSub}>Compte et préférences</div>
            {tabs.map(t => (
              <div key={t.id} onClick={() => setTab(t.id)}>
                <A_NavItem icon={t.icon} label={t.label} active={t.id === tab} count={t.count} />
              </div>
            ))}
          </div>
          <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
            <div style={A_styles.content}>
              {renderers[tab]()}
            </div>
            <div style={A_styles.stickyBar}>
              <span style={{ color: 'var(--text-secondary)' }}>
                <span style={A_styles.unsavedDot} />
                Modifications non enregistrées
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={A_styles.cancelBtn}>Annuler</button>
                <button style={A_styles.saveBtn}>
                  {React.createElement(window.I.check, { size: 14 })} Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.VariationA = VariationA;
