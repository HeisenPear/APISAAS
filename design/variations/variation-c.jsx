/* Variation C — "Cockpit" : sticky overview rail + dense data list view, modal-style edit drawer */

const C_styles = {
  page: {
    display: 'flex',
    background: 'var(--surface-primary)',
    width: 1280, height: 880,
    overflow: 'hidden',
    fontFamily: 'var(--font-text)',
    color: 'var(--text-primary)',
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar: {
    height: 56, padding: '0 24px',
    borderBottom: '1px solid var(--border-default)',
    display: 'flex', alignItems: 'center', gap: 16,
  },
  pageTitle: { fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' },
  topbarSub: { fontSize: 13, color: 'var(--text-tertiary)' },
  searchBox: {
    marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 10px',
    background: 'var(--surface-muted)',
    borderRadius: 8,
    color: 'var(--text-tertiary)', fontSize: 13,
    width: 220,
  },
  kbd: {
    fontSize: 10.5, color: 'var(--text-tertiary)',
    border: '1px solid var(--border-default)',
    borderRadius: 4, padding: '1px 5px',
    background: 'var(--surface-card)',
    fontFamily: 'var(--font-mono)',
    marginLeft: 'auto',
  },

  body: { flex: 1, display: 'flex', minHeight: 0 },

  /* Left rail: profile card + nav */
  rail: {
    width: 280, flexShrink: 0,
    padding: '24px 20px',
    borderRight: '1px solid var(--border-default)',
    display: 'flex', flexDirection: 'column', gap: 18,
    overflow: 'auto',
  },
  profileCard: {
    padding: 20, borderRadius: 14,
    background: 'var(--surface-card)',
    border: '1px solid var(--border-default)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 999,
    background: '#1c1c1e', color: 'var(--honey)',
    display: 'grid', placeItems: 'center',
    fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em',
    marginBottom: 14,
  },
  pName: { fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 },
  pRole: { fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 2 },
  pPlan: {
    marginTop: 14,
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #fff8e7, #fef6e4)',
    border: '1px solid #f5d8a8',
    display: 'flex', alignItems: 'center', gap: 10,
    textAlign: 'left',
  },
  pPlanIcon: { width: 28, height: 28, borderRadius: 8, background: '#1c1c1e', color: 'var(--honey)', display: 'grid', placeItems: 'center', flexShrink: 0 },
  pPlanLabel: { fontSize: 12, color: 'var(--text-secondary)' },
  pPlanName: { fontSize: 13.5, fontWeight: 600 },
  pUpgrade: { marginLeft: 'auto', fontSize: 12, color: 'var(--honey-deep)', fontWeight: 600 },

  navTitle: { fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 8, marginBottom: 6, padding: '0 8px' },
  navItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: 11,
    padding: '7px 10px', borderRadius: 8,
    fontSize: 13.5, fontWeight: active ? 600 : 500,
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    background: active ? 'var(--surface-muted)' : 'transparent',
    cursor: 'pointer',
  }),
  navCount: { marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)' },

  /* Center: list */
  center: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' },
  centerHead: {
    padding: '24px 32px 16px',
    borderBottom: '1px solid var(--border-default)',
  },
  centerTitle: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' },
  centerDesc: { fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4 },
  centerScroll: { flex: 1, overflow: 'auto', padding: '8px 32px 40px' },

  group: { marginTop: 24 },
  groupHeader: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 0',
    fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
    textTransform: 'uppercase', letterSpacing: '0.1em',
  },
  groupLine: { flex: 1, height: 1, background: 'var(--border-default)' },

  row: {
    display: 'grid',
    gridTemplateColumns: '180px 1fr auto',
    gap: 20,
    padding: '12px 14px',
    alignItems: 'center',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background .12s',
  },
  rowKey: { fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 },
  rowVal: { fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowEmpty: { color: 'var(--text-tertiary)', fontStyle: 'italic' },
  rowAction: { color: 'var(--text-tertiary)' },

  /* Right: contextual / current selection drawer */
  right: {
    width: 360, flexShrink: 0,
    background: 'var(--surface-card)',
    borderLeft: '1px solid var(--border-default)',
    display: 'flex', flexDirection: 'column',
    overflow: 'auto',
  },
  rightHead: {
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-default)',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  rightLabel: { fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 },
  rightTitle: { fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginTop: 4 },
  rightBody: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  fieldLabel: { fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)' },
  input: {
    height: 38, padding: '0 12px',
    border: '1px solid var(--border-default)',
    borderRadius: 8, background: 'var(--surface-card)',
    fontSize: 14, outline: 'none',
  },
  helper: { fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 4 },

  rightFoot: {
    marginTop: 'auto',
    padding: 20,
    borderTop: '1px solid var(--border-default)',
    display: 'flex', gap: 8, justifyContent: 'flex-end',
  },
};

const C_NavItem = ({ icon, label, active, count, onClick }) => (
  <div style={C_styles.navItem(active)} onClick={onClick}>
    {React.createElement(window.I[icon], { size: 16, stroke: 1.75, style: { color: active ? 'var(--honey-deep)' : 'var(--text-tertiary)' } })}
    <span>{label}</span>
    {count != null && <span style={C_styles.navCount}>{count}</span>}
  </div>
);

const VariationC = () => {
  const p = window.MOCK_PROFIL;
  const [tab, setTab] = React.useState('compte');
  const [selectedKey, setSelectedKey] = React.useState('telephone');

  const compteRows = [
    { k: 'identite', g: 'Identité', items: [
      { id: 'prenom', label: 'Prénom', value: p.prenom },
      { id: 'nom', label: 'Nom', value: p.nom },
      { id: 'email', label: 'Email', value: p.email, locked: true },
      { id: 'telephone', label: 'Téléphone', value: p.telephone },
    ]},
    { k: 'expl', g: 'Exploitation', items: [
      { id: 'raison', label: 'Raison sociale', value: p.raison },
      { id: 'adresse', label: 'Adresse', value: `${p.adresse}, ${p.codePostal} ${p.ville}` },
      { id: 'napi', label: 'NAPI', value: p.napi, hint: 'GDSA / DDPP' },
      { id: 'siret', label: 'SIRET', value: '832 174 096 00018' },
      { id: 'tvadebits', label: 'TVA sur les débits', value: 'Activé', toggle: true },
    ]},
    { k: 'connect', g: 'Connexion', items: [
      { id: 'pwd', label: 'Mot de passe', value: '•••••••••••• · modifié il y a 3 mois' },
      { id: '2fa', label: 'Double authentification', value: 'Désactivée', warn: true },
      { id: 'sessions', label: 'Sessions actives', value: '2 appareils — MacBook, iPhone' },
    ]},
  ];

  const renderCenter = () => {
    if (tab === 'compte') {
      return (
        <>
          {compteRows.map(group => (
            <div key={group.k} style={C_styles.group}>
              <div style={C_styles.groupHeader}>
                <span>{group.g}</span>
                <span style={C_styles.groupLine} />
              </div>
              {group.items.map(item => {
                const active = selectedKey === item.id;
                return (
                  <div
                    key={item.id}
                    style={{ ...C_styles.row, background: active ? 'var(--honey-soft)' : 'transparent', boxShadow: active ? 'inset 2px 0 0 var(--honey)' : 'none' }}
                    onClick={() => setSelectedKey(item.id)}
                  >
                    <div style={C_styles.rowKey}>
                      {item.label}
                      {item.locked && <span style={{ marginLeft: 6, color: 'var(--text-quaternary)', display: 'inline-flex', verticalAlign: 'middle' }}>{React.createElement(window.I.lock, { size: 11 })}</span>}
                    </div>
                    <div style={{
                      ...C_styles.rowVal,
                      ...(item.warn ? { color: '#9a2f2f' } : {}),
                    }}>
                      {item.warn && (<span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 99, background: '#c54545', marginRight: 8, verticalAlign: 'middle' }} />)}
                      {item.value}
                      {item.hint && <span style={{ color: 'var(--text-tertiary)', marginLeft: 8, fontSize: 12.5 }}>· {item.hint}</span>}
                    </div>
                    <div style={C_styles.rowAction}>
                      {item.toggle
                        ? React.createElement(window.I.chevronRight, { size: 14 })
                        : item.warn
                          ? <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--honey-deep)' }}>Activer</span>
                          : React.createElement(window.I.chevronRight, { size: 14 })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </>
      );
    }

    if (tab === 'notif') {
      return (
        <div style={C_styles.group}>
          <div style={C_styles.groupHeader}><span>Alertes opérationnelles</span><span style={C_styles.groupLine} /></div>
          {[
            { t: 'Stocks bas', d: 'Sous le seuil défini', on: true },
            { t: 'Interventions à venir', d: 'Rappel le matin', on: true },
            { t: 'Météo critique', d: 'Gel, canicule, vents', on: true },
            { t: 'Risque d\'essaimage', d: 'À partir des cellules royales', on: true },
          ].map(r => (
            <div key={r.t} style={C_styles.row}>
              <div style={C_styles.rowKey}>{r.t}</div>
              <div style={C_styles.rowVal}><span style={{ color: 'var(--text-tertiary)' }}>{r.d}</span></div>
              <C_Switch on={r.on} />
            </div>
          ))}
          <div style={C_styles.groupHeader}><span>Canaux & résumés</span><span style={C_styles.groupLine} /></div>
          {[
            { t: 'Email', d: 'marc.lefevre@apigo.fr', on: true },
            { t: 'Push mobile', d: 'iPhone 15 Pro', on: true },
            { t: 'Digest hebdomadaire', d: 'Lundi 7 h', on: false },
          ].map(r => (
            <div key={r.t} style={C_styles.row}>
              <div style={C_styles.rowKey}>{r.t}</div>
              <div style={C_styles.rowVal}><span style={{ color: 'var(--text-tertiary)' }}>{r.d}</span></div>
              <C_Switch on={r.on} />
            </div>
          ))}
        </div>
      );
    }

    if (tab === 'abo') {
      return (
        <div style={{ marginTop: 24 }}>
          <div style={{
            padding: 22, borderRadius: 14,
            background: 'linear-gradient(135deg, #fff8e7, #fef6e4)',
            border: '1px solid #f5d8a8',
            display: 'flex', alignItems: 'center', gap: 18,
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1c1c1e', color: 'var(--honey)', display: 'grid', placeItems: 'center' }}>
              {React.createElement(window.I.crown, { size: 22 })}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontFamily: 'var(--font-display)', fontWeight: 600 }}>Plan Pro · 29 € HT / mois</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Renouvellement le 14 mai 2026 · Visa •• 4218</div>
            </div>
            <button style={{ height: 36, padding: '0 16px', background: '#1c1c1e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>Gérer</button>
          </div>

          <div style={C_styles.groupHeader}><span>Utilisation du plan</span><span style={C_styles.groupLine} /></div>
          {[
            { l: 'Ruches', n: '248', max: '500', pct: 49.6 },
            { l: 'Sièges équipe', n: '3', max: '3', pct: 100 },
            { l: 'Exports ce mois', n: '12', max: '∞', pct: 18 },
          ].map(u => (
            <div key={u.l} style={{ ...C_styles.row, gridTemplateColumns: '180px 1fr 80px' }}>
              <div style={C_styles.rowKey}>{u.l}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--surface-muted)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${u.pct}%`, height: '100%',
                    background: u.pct >= 90 ? '#c54545' : 'var(--honey)',
                    borderRadius: 99,
                  }} />
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'right' }}>{u.n} / {u.max}</div>
            </div>
          ))}

          <div style={C_styles.groupHeader}><span>Factures récentes</span><span style={C_styles.groupLine} /></div>
          {[
            { d: '14 avril 2026', n: 'F-2026-04-218', m: '29,00 € HT' },
            { d: '14 mars 2026', n: 'F-2026-03-204', m: '29,00 € HT' },
            { d: '14 février 2026', n: 'F-2026-02-191', m: '29,00 € HT' },
          ].map(f => (
            <div key={f.n} style={C_styles.row}>
              <div style={C_styles.rowKey}>{f.d}</div>
              <div style={C_styles.rowVal}>{f.n} · {f.m}</div>
              <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)', fontWeight: 500 }}>PDF</span>
            </div>
          ))}
        </div>
      );
    }

    if (tab === 'eq') {
      return (
        <div style={{ marginTop: 24 }}>
          <div style={C_styles.groupHeader}><span>Membres · 3 sur 3</span><span style={C_styles.groupLine} /></div>
          {[
            { n: 'Marc Lefèvre', e: 'marc.lefevre@apigo.fr', r: 'Propriétaire', tag: 'Vous' },
            { n: 'Élise Vidal', e: 'elise.v@apigo.fr', r: 'Apiculteur·trice' },
            { n: 'Thomas Roux', e: 'thomas.roux@apigo.fr', r: 'Lecture seule' },
          ].map(m => (
            <div key={m.e} style={{ ...C_styles.row, gridTemplateColumns: '40px 1fr 140px auto' }}>
              <div style={{ width: 32, height: 32, borderRadius: 99, background: 'var(--surface-muted)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{m.n.split(' ').map(s=>s[0]).join('')}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{m.n} {m.tag && <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 4 }}>· {m.tag}</span>}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>{m.e}</div>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{m.r}</div>
              {React.createElement(window.I.chevronRight, { size: 14, style: { color: 'var(--text-tertiary)' } })}
            </div>
          ))}
        </div>
      );
    }

    if (tab === 'donnees') {
      return (
        <div style={{ marginTop: 24 }}>
          <div style={C_styles.groupHeader}><span>Export & confidentialité</span><span style={C_styles.groupLine} /></div>
          {[
            { i: 'download', t: 'Exporter mes données', d: 'Archive ZIP au format CSV — interventions, ruches, finances' },
            { i: 'fileText', t: 'Conditions Générales d\'Utilisation', d: 'Version du 12 février 2026' },
            { i: 'shield', t: 'Politique de confidentialité', d: 'Conforme RGPD — hébergement OVH France' },
          ].map(r => (
            <div key={r.t} style={C_styles.row}>
              <div style={C_styles.rowKey}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                  {React.createElement(window.I[r.i], { size: 14 })} {r.t}
                </span>
              </div>
              <div style={C_styles.rowVal}><span style={{ color: 'var(--text-tertiary)' }}>{r.d}</span></div>
              {React.createElement(window.I.chevronRight, { size: 14, style: { color: 'var(--text-tertiary)' } })}
            </div>
          ))}
          <div style={{
            marginTop: 24, padding: '14px 16px',
            border: '1px solid #f0d4d4', background: '#fdf6f6',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ color: '#c54545' }}>{React.createElement(window.I.alertTriangle, { size: 16 })}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#9a2f2f' }}>Supprimer mon compte</div>
              <div style={{ fontSize: 12.5, color: '#a85555' }}>Action irréversible, prend effet sous 30 jours.</div>
            </div>
            <button style={{ height: 32, padding: '0 12px', background: '#fff', border: '1px solid #e8c5c5', color: '#9a2f2f', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>Supprimer</button>
          </div>
        </div>
      );
    }
    return null;
  };

  /* Right drawer reflects selectedKey when on compte tab */
  const renderRight = () => {
    if (tab !== 'compte') {
      const ctx = {
        notif: { label: 'Notifications', title: 'Aperçu', body: <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>4 alertes activées sur 7 disponibles. Email principal : <b style={{ color: 'var(--text-primary)' }}>marc.lefevre@apigo.fr</b>.<br/><br/>Vous recevez en moyenne <b style={{ color: 'var(--text-primary)' }}>3 notifications par semaine</b> sur ce compte.</div> },
          abo: { label: 'Abonnement', title: 'Plan Pro', body: <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>Vous utilisez <b style={{ color: 'var(--text-primary)' }}>49 % de votre quota</b> de ruches. À ce rythme, vous dépasserez le seuil dans environ 9 mois.<br/><br/>Le plan Expert ajoute <b style={{ color: 'var(--text-primary)' }}>ruches illimitées</b> et l'API privée.</div> },
          eq: { label: 'Équipe', title: 'Sièges utilisés', body: <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>Tous les sièges sont occupés. Pour ajouter un membre, libérez un siège ou passez au plan Expert (10 sièges).</div> },
          donnees: { label: 'Données', title: 'Conformité', body: <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>Vos données sont hébergées en France (OVH Roubaix). Sauvegardes chiffrées toutes les 6 h.<br/><br/>Dernier export : <b style={{ color: 'var(--text-primary)' }}>il y a 12 jours</b>.</div> },
      }[tab];
      return (
        <>
          <div style={C_styles.rightHead}>
            <div>
              <div style={C_styles.rightLabel}>{ctx.label}</div>
              <div style={C_styles.rightTitle}>{ctx.title}</div>
            </div>
          </div>
          <div style={C_styles.rightBody}>{ctx.body}</div>
        </>
      );
    }

    /* compte tab — show contextual editor */
    const meta = {
      prenom: { label: 'Identité', title: 'Prénom', fields: [{ l: 'Prénom', v: p.prenom }] },
      nom: { label: 'Identité', title: 'Nom', fields: [{ l: 'Nom', v: p.nom }] },
      email: { label: 'Identité', title: 'Email', fields: [{ l: 'Email', v: p.email, locked: true }] },
      telephone: { label: 'Identité', title: 'Téléphone', help: 'Utilisé uniquement pour les alertes critiques (gel, essaimage). Ne sert jamais au marketing.', fields: [{ l: 'Téléphone', v: p.telephone, type: 'tel' }] },
      raison: { label: 'Exploitation', title: 'Raison sociale', help: 'Apparaît en en-tête de toutes vos factures.', fields: [{ l: 'Raison sociale', v: p.raison }] },
      adresse: { label: 'Exploitation', title: 'Adresse', fields: [{ l: 'Adresse', v: p.adresse, full: true }, { l: 'Code postal', v: p.codePostal }, { l: 'Ville', v: p.ville }] },
      napi: { label: 'Exploitation', title: 'NAPI', help: 'Numéro d\'apiculteur délivré par votre GDSA ou la DDPP de votre département.', fields: [{ l: 'NAPI', v: p.napi }] },
      siret: { label: 'Exploitation', title: 'SIRET', help: 'Obligatoire si vous facturez en miellerie. Format : 14 chiffres.', fields: [{ l: 'SIRET', v: p.siret }] },
      tvadebits: { label: 'Exploitation', title: 'Option TVA sur les débits', help: 'Si activé, la mention « Option pour le paiement de la taxe d\'après les débits » est ajoutée à toutes vos factures.', toggle: true },
      pwd: { label: 'Connexion', title: 'Mot de passe', help: 'Nous vous enverrons un email pour confirmer le changement.', fields: [{ l: 'Email de confirmation', v: p.email, locked: true }] },
      '2fa': { label: 'Connexion', title: 'Double authentification', help: 'Recommandée pour un compte Pro. Vous devrez scanner un QR code avec une app comme Authy ou 1Password.', cta: 'Activer la 2FA' },
      sessions: { label: 'Connexion', title: 'Sessions actives', sessions: [
        { d: 'MacBook Pro · Safari', l: 'Bédoin (FR)', t: 'En cours', current: true },
        { d: 'iPhone 15 · App APIGO', l: 'Bédoin (FR)', t: 'Il y a 2 h' },
      ]},
    }[selectedKey] || { label: 'Détail', title: 'Sélectionnez un élément', fields: [] };

    return (
      <>
        <div style={C_styles.rightHead}>
          <div>
            <div style={C_styles.rightLabel}>{meta.label}</div>
            <div style={C_styles.rightTitle}>{meta.title}</div>
          </div>
          <button style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-tertiary)' }}>
            {React.createElement(window.I.copy, { size: 14 })}
          </button>
        </div>
        <div style={C_styles.rightBody}>
          {meta.help && (
            <div style={{
              padding: '10px 12px',
              background: 'var(--honey-soft)',
              borderRadius: 8,
              fontSize: 12.5, color: 'var(--honey-deep)', lineHeight: 1.5,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}>{React.createElement(window.I.info, { size: 13 })}</span>
              <span>{meta.help}</span>
            </div>
          )}

          {meta.fields && meta.fields.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {meta.fields.map(f => (
                <div key={f.l} style={C_styles.field}>
                  <span style={C_styles.fieldLabel}>{f.l}</span>
                  <input
                    defaultValue={f.v}
                    disabled={f.locked}
                    style={{
                      ...C_styles.input,
                      ...(f.locked ? { background: 'var(--surface-muted)', color: 'var(--text-tertiary)' } : {}),
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {meta.toggle && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'var(--surface-muted)',
              borderRadius: 8,
            }}>
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>Activer cette option</span>
              <C_Switch on={true} />
            </div>
          )}

          {meta.cta && (
            <button style={{
              marginTop: 4,
              height: 38,
              background: '#1c1c1e', color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 13.5, fontWeight: 600,
            }}>{meta.cta}</button>
          )}

          {meta.sessions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {meta.sessions.map(s => (
                <div key={s.d} style={{
                  padding: '12px 14px',
                  border: '1px solid var(--border-default)', borderRadius: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{s.d}</div>
                    {s.current && <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--honey-deep)', background: 'var(--honey-soft)', padding: '2px 6px', borderRadius: 99 }}>ACTIF</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>{s.l} · {s.t}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {(meta.fields && meta.fields.length > 0) && (
          <div style={C_styles.rightFoot}>
            <button style={{ height: 34, padding: '0 14px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>Annuler</button>
            <button style={{ height: 34, padding: '0 16px', background: '#1c1c1e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>Enregistrer</button>
          </div>
        )}
      </>
    );
  };

  return (
    <div style={C_styles.page}>
      <window.Sidebar active="parametres" />
      <div style={C_styles.main}>
        <div style={C_styles.topbar}>
          <div style={C_styles.pageTitle}>Paramètres</div>
          <span style={{ color: 'var(--text-quaternary)' }}>·</span>
          <div style={C_styles.topbarSub}>Compte, équipe, abonnement</div>
          <div style={C_styles.searchBox}>
            {React.createElement(window.I.search, { size: 14 })}
            <span>Rechercher…</span>
            <span style={{ ...C_styles.kbd, marginLeft: 'auto', background: 'var(--surface-card)' }}>⌘K</span>
          </div>
        </div>
        <div style={C_styles.body}>
          <aside style={C_styles.rail}>
            <div style={C_styles.profileCard}>
              <div style={C_styles.avatar}>{p.initials}</div>
              <div style={C_styles.pName}>{p.prenom} {p.nom}</div>
              <div style={C_styles.pRole}>{p.email}</div>
              <div style={C_styles.pPlan}>
                <div style={C_styles.pPlanIcon}>{React.createElement(window.I.crown, { size: 14 })}</div>
                <div>
                  <div style={C_styles.pPlanLabel}>Plan</div>
                  <div style={C_styles.pPlanName}>Pro</div>
                </div>
                <span style={C_styles.pUpgrade}>Upgrade →</span>
              </div>
            </div>

            <div>
              <div style={C_styles.navTitle}>Paramètres</div>
              <C_NavItem icon="user" label="Compte" active={tab==='compte'} onClick={() => setTab('compte')} />
              <C_NavItem icon="bell" label="Notifications" active={tab==='notif'} onClick={() => setTab('notif')} />
              <C_NavItem icon="card" label="Abonnement" active={tab==='abo'} onClick={() => setTab('abo')} />
              <C_NavItem icon="users" label="Équipe" count="3/3" active={tab==='eq'} onClick={() => setTab('eq')} />
              <C_NavItem icon="database" label="Données" active={tab==='donnees'} onClick={() => setTab('donnees')} />
            </div>

            <div>
              <div style={C_styles.navTitle}>Aide</div>
              <C_NavItem icon="helpCircle" label="Centre d'aide" />
              <C_NavItem icon="mail" label="Contacter le support" />
            </div>

            <div style={{ marginTop: 'auto' }}>
              <C_NavItem icon="logout" label="Se déconnecter" />
            </div>
          </aside>

          <div style={C_styles.center}>
            <div style={C_styles.centerHead}>
              <div style={C_styles.centerTitle}>
                {tab === 'compte' && 'Compte'}
                {tab === 'notif' && 'Notifications'}
                {tab === 'abo' && 'Abonnement'}
                {tab === 'eq' && 'Équipe'}
                {tab === 'donnees' && 'Données & confidentialité'}
              </div>
              <div style={C_styles.centerDesc}>
                {tab === 'compte' && 'Cliquez sur une ligne pour la modifier dans le panneau de droite.'}
                {tab === 'notif' && 'Choisissez les événements qui méritent une alerte et leurs canaux de réception.'}
                {tab === 'abo' && 'Plan actif, utilisation et historique de facturation.'}
                {tab === 'eq' && 'Vos collaborateurs et leurs rôles.'}
                {tab === 'donnees' && 'Export, conformité et suppression du compte.'}
              </div>
            </div>
            <div style={C_styles.centerScroll}>
              {renderCenter()}
            </div>
          </div>

          <aside style={C_styles.right}>
            {renderRight()}
          </aside>
        </div>
      </div>
    </div>
  );
};

const C_Switch = ({ on }) => {
  const [v, setV] = React.useState(on);
  return (
    <button onClick={() => setV(!v)} style={{
      width: 34, height: 20, borderRadius: 99, border: 'none',
      background: v ? '#1c1c1e' : '#d6d3d1', position: 'relative', flexShrink: 0,
    }}>
      <span style={{ position: 'absolute', top: 2, left: v ? 16 : 2, width: 16, height: 16, borderRadius: 99, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left .2s' }} />
    </button>
  );
};

window.VariationC = VariationC;
