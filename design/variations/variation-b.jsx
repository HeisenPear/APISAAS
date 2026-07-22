/* Variation B — "Editorial" : sticky page-side index, large display type, generous whitespace, all sections on one page */

const B_styles = {
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
    height: 56, display: 'flex', alignItems: 'center', gap: 10,
    padding: '0 32px',
    borderBottom: '1px solid var(--border-default)',
  },
  crumb: { color: 'var(--text-tertiary)', fontSize: 13 },
  crumbCurrent: { color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 },

  scroll: { flex: 1, overflow: 'auto' },
  layout: { display: 'flex', gap: 56, padding: '40px 56px 80px', maxWidth: 1180, margin: '0 auto' },

  /* Page index sticky */
  index: { width: 180, flexShrink: 0, position: 'sticky', top: 40, alignSelf: 'flex-start' },
  indexLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 },
  indexLink: (active) => ({
    display: 'block', padding: '6px 0', fontSize: 13.5,
    color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
    fontWeight: active ? 600 : 500,
    borderLeft: active ? '2px solid var(--honey)' : '2px solid transparent',
    paddingLeft: 12, marginLeft: -14,
  }),

  body: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 64 },

  /* Hero */
  pageTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 38, fontWeight: 600,
    letterSpacing: '-0.025em', lineHeight: 1.05,
    marginBottom: 10,
  },
  pageLede: { color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.55, maxWidth: 600 },

  hero: {
    marginTop: 28, padding: '24px 0',
    borderTop: '1px solid var(--border-default)',
    borderBottom: '1px solid var(--border-default)',
    display: 'flex', alignItems: 'center', gap: 20,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 999,
    background: '#1c1c1e', color: 'var(--honey)',
    display: 'grid', placeItems: 'center',
    fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em',
  },
  heroName: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' },
  heroSub: { color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 },
  statRow: { display: 'flex', gap: 36, marginLeft: 'auto' },
  stat: { textAlign: 'right' },
  statN: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' },
  statL: { fontSize: 11.5, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 },

  /* Section */
  section: {},
  sectionLabel: { fontSize: 11, fontWeight: 600, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 },
  sectionDesc: { color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.55, maxWidth: 560, marginBottom: 24 },

  /* Inline edit row — table-like, no boxes */
  rows: { borderTop: '1px solid var(--border-default)' },
  row: {
    display: 'grid',
    gridTemplateColumns: '180px 1fr auto',
    gap: 24,
    padding: '18px 0',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-default)',
  },
  rowLabel: { fontSize: 13.5, color: 'var(--text-secondary)', fontWeight: 500 },
  rowValue: { fontSize: 14.5, color: 'var(--text-primary)' },
  rowValueMuted: { color: 'var(--text-tertiary)' },
  rowEdit: { fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500, cursor: 'pointer' },
  rowEditActive: { color: 'var(--honey-deep)' },

  /* Toggle row */
  toggleRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 24,
    padding: '18px 0',
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--border-default)',
  },
  toggleTitle: { fontSize: 14.5, fontWeight: 500, marginBottom: 4 },
  toggleDesc: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 520 },
};

const B_Toggle = ({ on, onChange }) => (
  <button onClick={() => onChange(!on)} style={{
    width: 38, height: 22, borderRadius: 99, border: 'none',
    background: on ? '#1c1c1e' : '#d6d3d1',
    position: 'relative', transition: 'background .2s',
    flexShrink: 0, marginTop: 2,
  }}>
    <span style={{
      position: 'absolute', top: 2, left: on ? 18 : 2,
      width: 18, height: 18, borderRadius: 99, background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left .2s',
    }} />
  </button>
);

const B_Row = ({ label, value, hint, action = 'Modifier' }) => (
  <div style={B_styles.row}>
    <div style={B_styles.rowLabel}>{label}</div>
    <div>
      <div style={{ ...B_styles.rowValue, ...(value ? {} : B_styles.rowValueMuted) }}>{value || 'Non renseigné'}</div>
      {hint && <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 2 }}>{hint}</div>}
    </div>
    <span style={B_styles.rowEdit}>{action}</span>
  </div>
);

const VariationB = () => {
  const p = window.MOCK_PROFIL;
  const [prefs, setPrefs] = React.useState({ ...window.MOCK_PREFS });

  return (
    <div style={B_styles.page}>
      <window.Sidebar active="parametres" />
      <div style={B_styles.main}>
        <div style={B_styles.topbar}>
          <span style={B_styles.crumb}>Paramètres</span>
        </div>

        <div style={B_styles.scroll}>
          <div style={B_styles.layout}>
            <aside style={B_styles.index}>
              <div style={B_styles.indexLabel}>Sur cette page</div>
              <a style={B_styles.indexLink(true)}>Identité</a>
              <a style={B_styles.indexLink(false)}>Exploitation</a>
              <a style={B_styles.indexLink(false)}>Notifications</a>
              <a style={B_styles.indexLink(false)}>Sécurité</a>
              <a style={B_styles.indexLink(false)}>Abonnement</a>
              <a style={B_styles.indexLink(false)}>Équipe</a>
              <a style={B_styles.indexLink(false)}>Données</a>
            </aside>

            <div style={B_styles.body}>

              {/* Hero */}
              <div>
                <h1 style={B_styles.pageTitle}>Paramètres</h1>
                <p style={B_styles.pageLede}>Votre profil, vos préférences et les coordonnées de votre exploitation. Ces informations apparaissent sur vos factures et vos exports.</p>

                <div style={B_styles.hero}>
                  <div style={B_styles.avatar}>{p.initials}</div>
                  <div>
                    <div style={B_styles.heroName}>{p.prenom} {p.nom}</div>
                    <div style={B_styles.heroSub}>{p.raison} · {p.ville} · membre depuis février 2024</div>
                  </div>
                  <div style={B_styles.statRow}>
                    <div style={B_styles.stat}>
                      <div style={B_styles.statN}>{p.ruches}</div>
                      <div style={B_styles.statL}>Ruches</div>
                    </div>
                    <div style={B_styles.stat}>
                      <div style={B_styles.statN}>{p.ruchers}</div>
                      <div style={B_styles.statL}>Ruchers</div>
                    </div>
                    <div style={B_styles.stat}>
                      <div style={{ ...B_styles.statN, color: 'var(--honey-deep)' }}>Pro</div>
                      <div style={B_styles.statL}>Plan actif</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identité */}
              <section style={B_styles.section}>
                <div style={B_styles.sectionLabel}>01 — Identité</div>
                <h2 style={B_styles.sectionTitle}>Vos informations personnelles</h2>
                <p style={B_styles.sectionDesc}>Ces informations restent privées. Elles ne sont visibles que par vous et les membres de votre équipe.</p>

                <div style={B_styles.rows}>
                  <B_Row label="Prénom" value={p.prenom} />
                  <B_Row label="Nom" value={p.nom} />
                  <B_Row label="Email" value={p.email} hint="Identifiant de connexion — modification protégée" action="Vérifier" />
                  <B_Row label="Téléphone" value={p.telephone} />
                  <B_Row label="Mot de passe" value="••••••••••••" hint="Modifié il y a 3 mois" action="Changer" />
                </div>
              </section>

              {/* Exploitation */}
              <section style={B_styles.section}>
                <div style={B_styles.sectionLabel}>02 — Exploitation</div>
                <h2 style={B_styles.sectionTitle}>Votre miellerie</h2>
                <p style={B_styles.sectionDesc}>Coordonnées légales utilisées sur vos factures, exports comptables et déclarations sanitaires.</p>

                <div style={B_styles.rows}>
                  <B_Row label="Raison sociale" value={p.raison} />
                  <B_Row label="Adresse" value={`${p.adresse}, ${p.codePostal} ${p.ville}`} />
                  <B_Row label="NAPI" value={p.napi} hint="Numéro d'apiculteur — GDSA / DDPP" />
                  <B_Row label="SIRET" value={p.siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')} />
                  <div style={B_styles.toggleRow}>
                    <div>
                      <div style={B_styles.toggleTitle}>Option TVA sur les débits</div>
                      <div style={B_styles.toggleDesc}>Si activé, la mention « Option pour le paiement de la taxe d'après les débits » est ajoutée automatiquement à toutes vos factures.</div>
                    </div>
                    <B_Toggle on={true} onChange={() => {}} />
                  </div>
                </div>
              </section>

              {/* Notifications */}
              <section style={B_styles.section}>
                <div style={B_styles.sectionLabel}>03 — Notifications</div>
                <h2 style={B_styles.sectionTitle}>Ce qui mérite votre attention</h2>
                <p style={B_styles.sectionDesc}>Choisissez les événements qui vous envoient une alerte. Les autres restent consultables dans le journal d'activité.</p>

                <div style={B_styles.rows}>
                  {[
                    { k: 'alertesStock', t: 'Stocks bas', d: "Quand un stock passe sous le seuil défini." },
                    { k: 'rappelsInterventions', t: 'Interventions à venir', d: 'Rappel le matin pour les visites planifiées dans la journée.' },
                    { k: 'alertesMeteo', t: 'Météo critique', d: 'Gel sous -3 °C, canicule au-dessus de 36 °C, vents forts annoncés.' },
                    { k: 'alertesEssaim', t: 'Risque d\'essaimage', d: 'Détection à partir des cellules royales saisies en visite et de la phénologie locale.' },
                    { k: 'pushMobile', t: 'Push mobile', d: 'Recevoir aussi sur l\'app mobile, en plus des emails.' },
                    { k: 'digestHebdo', t: 'Digest hebdomadaire', d: 'Résumé envoyé chaque lundi matin à 7 h.' },
                  ].map(row => (
                    <div key={row.k} style={B_styles.toggleRow}>
                      <div>
                        <div style={B_styles.toggleTitle}>{row.t}</div>
                        <div style={B_styles.toggleDesc}>{row.d}</div>
                      </div>
                      <B_Toggle on={prefs[row.k]} onChange={(v) => setPrefs({ ...prefs, [row.k]: v })} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Abonnement */}
              <section style={B_styles.section}>
                <div style={B_styles.sectionLabel}>04 — Abonnement</div>
                <h2 style={B_styles.sectionTitle}>Plan Pro</h2>
                <p style={B_styles.sectionDesc}>29 € HT par mois. Renouvellement automatique le 14 mai 2026 sur Visa •• 4218.</p>

                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0,
                  borderTop: '1px solid var(--border-default)',
                  borderBottom: '1px solid var(--border-default)',
                }}>
                  {[
                    ['248 / 500', 'Ruches utilisées'],
                    ['7', 'Ruchers'],
                    ['3 / 3', 'Sièges équipe'],
                  ].map(([n, l], i) => (
                    <div key={l} style={{
                      padding: '20px 24px',
                      borderLeft: i === 0 ? 'none' : '1px solid var(--border-default)',
                    }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>{n}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 4 }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 20 }}>
                  <button style={{
                    height: 38, padding: '0 18px',
                    background: '#1c1c1e', color: '#fff',
                    border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 600,
                  }}>Gérer le plan</button>
                  <button style={{
                    height: 38, padding: '0 18px',
                    background: 'transparent', color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 13.5, fontWeight: 500,
                  }}>Voir les factures (14)</button>
                </div>
              </section>

              {/* Équipe */}
              <section style={B_styles.section}>
                <div style={B_styles.sectionLabel}>05 — Équipe</div>
                <h2 style={B_styles.sectionTitle}>Vos collaborateurs</h2>
                <p style={B_styles.sectionDesc}>Trois sièges utilisés sur trois disponibles avec votre plan Pro.</p>

                <div style={B_styles.rows}>
                  {[
                    { name: 'Marc Lefèvre', email: 'marc.lefevre@apigo.fr', role: 'Propriétaire', tag: 'Vous' },
                    { name: 'Élise Vidal', email: 'elise.v@apigo.fr', role: 'Apiculteur·trice' },
                    { name: 'Thomas Roux', email: 'thomas.roux@apigo.fr', role: 'Lecture seule' },
                  ].map(m => (
                    <div key={m.email} style={{
                      display: 'grid', gridTemplateColumns: '1fr 200px auto',
                      gap: 24, padding: '16px 0', alignItems: 'center',
                      borderBottom: '1px solid var(--border-default)',
                    }}>
                      <div>
                        <div style={{ fontSize: 14.5, fontWeight: 500 }}>
                          {m.name}
                          {m.tag && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 400 }}>· {m.tag}</span>}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>{m.email}</div>
                      </div>
                      <div style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{m.role}</div>
                      <span style={B_styles.rowEdit}>Gérer</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Données */}
              <section style={B_styles.section}>
                <div style={B_styles.sectionLabel}>06 — Données</div>
                <h2 style={B_styles.sectionTitle}>Confidentialité et export</h2>
                <p style={B_styles.sectionDesc}>Vous restez propriétaire de vos données. Données hébergées en France, conformes RGPD.</p>

                <div style={B_styles.rows}>
                  <B_Row label="Export complet" value="Archive ZIP au format CSV" hint="Interventions, ruches, finances, stocks." action="Exporter" />
                  <B_Row label="CGU" value="Version du 12 février 2026" action="Lire" />
                  <B_Row label="Confidentialité" value="Conforme RGPD — hébergement OVH France" action="Lire" />
                </div>

                <div style={{
                  marginTop: 24, padding: '18px 22px',
                  borderRadius: 12, border: '1px solid #f0d4d4',
                  background: '#fdf6f6',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                }}>
                  <div style={{ color: '#c54545', marginTop: 2 }}>{React.createElement(window.I.alertTriangle, { size: 16 })}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#9a2f2f' }}>Supprimer mon compte</div>
                    <div style={{ fontSize: 13, color: '#a85555', marginTop: 4, lineHeight: 1.5, maxWidth: 460 }}>Action irréversible. Toutes vos ruches, interventions et factures seront effacées sous 30 jours.</div>
                  </div>
                  <button style={{
                    height: 34, padding: '0 14px',
                    background: '#fff', border: '1px solid #e8c5c5',
                    color: '#9a2f2f', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  }}>Supprimer</button>
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.VariationB = VariationB;
