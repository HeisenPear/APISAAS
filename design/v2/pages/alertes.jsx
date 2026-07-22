/* PAGE — Centre d'alertes */
const alStyles = {
  page: { display: 'flex', width: 1280, height: 880, background: 'var(--surface-primary)', overflow: 'hidden', fontFamily: 'var(--font-text)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  scroll: { flex: 1, overflow: 'auto', padding: '28px 40px 60px' },
  header: { marginBottom: 22 },
  h1: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' },
  hSub: { fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 6 },

  sevRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 },
  sev: (c, a) => ({
    padding: '16px 18px',
    background: a ? c.bg : 'var(--surface-card)',
    border: `1px solid ${a ? c.border : 'var(--border-default)'}`,
    borderRadius: 12,
    cursor: 'pointer',
  }),
  sevTop: { display: 'flex', alignItems: 'center', gap: 10 },
  sevDot: (c) => ({ width: 9, height: 9, borderRadius: 99, background: c }),
  sevL: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' },
  sevN: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 8 },
  sevM: { fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 4 },

  tabs: { display: 'flex', gap: 4, marginBottom: 14, borderBottom: '1px solid var(--border-default)' },
  tab: (a) => ({ padding: '10px 14px', fontSize: 13.5, fontWeight: a ? 600 : 500, color: a ? 'var(--text-primary)' : 'var(--text-tertiary)', borderBottom: a ? '2px solid var(--honey)' : '2px solid transparent', marginBottom: -1 }),

  list: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, overflow: 'hidden' },
  aRow: { display: 'grid', gridTemplateColumns: '4px 1fr 140px 110px 110px', gap: 16, alignItems: 'center', padding: '18px 22px', borderTop: '1px solid var(--border-faint)' },
  aRowFirst: { display: 'grid', gridTemplateColumns: '4px 1fr 140px 110px 110px', gap: 16, alignItems: 'center', padding: '18px 22px' },
  aBar: (c) => ({ width: 4, height: 40, borderRadius: 99, background: c }),
  aT: { fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)' },
  aD: { fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 4 },
  aMeta: { fontSize: 12, color: 'var(--text-secondary)' },
  aMetaL: { fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 },
  aBtns: { display: 'flex', gap: 6, justifyContent: 'flex-end' },
  bSm: { padding: '6px 10px', fontSize: 12, fontWeight: 600, borderRadius: 7, border: '1px solid var(--border-default)', background: 'var(--surface-card)', color: 'var(--text-primary)' },
  bSmDark: { padding: '6px 10px', fontSize: 12, fontWeight: 600, borderRadius: 7, border: 'none', background: '#1c1c1e', color: '#fff' },
};

const ALERTES_FULL = [
  { sev: 'crit', c: 'var(--status-bad)', t: 'Rucher Sorgue · 3 ruches affaiblies', d: 'V-141, V-148, V-152 — population effondrée. Dernière visite il y a 17 j. Risque vol massif.', cat: 'Sanitaire', loc: 'Fontaine-de-Vaucluse', age: 'il y a 2 h' },
  { sev: 'high', c: 'var(--status-warn)', t: 'Stock cires gaufrées sous le seuil', d: 'Reste 8 plaques sur seuil 20. Récolte d\'été imminente, prévoir réassort.', cat: 'Stocks', loc: 'Miellerie', age: 'il y a 5 h' },
  { sev: 'high', c: 'var(--status-warn)', t: 'Risque d\'essaimage · Ventoux Sud', d: '4 cellules royales détectées sur V-024. Vérifier dans les 48 h.', cat: 'Cheptel', loc: 'Mont Ventoux Sud', age: 'il y a 1 j' },
  { sev: 'med', c: 'var(--status-info)', t: 'Météo : gel possible nuit du 4 mai', d: 'Sault et Buoux — minimum -2 °C en fin de nuit. Adapter visites.', cat: 'Météo', loc: 'Sault, Buoux', age: 'il y a 1 j' },
  { sev: 'med', c: 'var(--status-info)', t: 'Facture F-2025-039 en retard', d: 'Boulangerie Augier · 216 € · 12 jours de retard.', cat: 'Finances', loc: '—', age: 'il y a 2 j' },
];

const Alertes2 = () => {
  return (
    <div style={alStyles.page}>
      <window.Sidebar2 active="alertes" />
      <div style={alStyles.main}>
        <window.Topbar2 crumb={['Pilotage', 'Alertes']} />
        <div style={alStyles.scroll}>
          <div style={alStyles.header}>
            <h1 style={alStyles.h1}>Centre d'alertes</h1>
            <p style={alStyles.hSub}>5 ouvertes · 1 critique à traiter immédiatement · 14 résolues ce mois-ci</p>
          </div>

          <div style={alStyles.sevRow}>
            <div style={alStyles.sev({border:'var(--status-bad)', bg:'#f8e8e8'}, true)}>
              <div style={alStyles.sevTop}><span style={alStyles.sevDot('var(--status-bad)')} /><span style={alStyles.sevL}>Critiques</span></div>
              <div style={{...alStyles.sevN, color:'var(--status-bad)'}}>1</div>
              <div style={alStyles.sevM}>action immédiate</div>
            </div>
            <div style={alStyles.sev({border:'var(--status-warn)', bg:'#fdf3e3'}, false)}>
              <div style={alStyles.sevTop}><span style={alStyles.sevDot('var(--status-warn)')} /><span style={alStyles.sevL}>Importantes</span></div>
              <div style={{...alStyles.sevN, color:'var(--status-warn)'}}>2</div>
              <div style={alStyles.sevM}>traiter sous 48 h</div>
            </div>
            <div style={alStyles.sev({border:'var(--status-info)', bg:'#e8eef8'}, false)}>
              <div style={alStyles.sevTop}><span style={alStyles.sevDot('var(--status-info)')} /><span style={alStyles.sevL}>Modérées</span></div>
              <div style={{...alStyles.sevN, color:'var(--status-info)'}}>2</div>
              <div style={alStyles.sevM}>info à traiter</div>
            </div>
            <div style={alStyles.sev({border:'var(--sage)', bg:'var(--sage-soft)'}, false)}>
              <div style={alStyles.sevTop}><span style={alStyles.sevDot('var(--sage)')} /><span style={alStyles.sevL}>Résolues / 30 j</span></div>
              <div style={{...alStyles.sevN, color:'var(--sage-deep)'}}>14</div>
              <div style={alStyles.sevM}>temps moyen 8 h</div>
            </div>
          </div>

          <div style={alStyles.tabs}>
            <span style={alStyles.tab(true)}>Ouvertes · 5</span>
            <span style={alStyles.tab(false)}>Acquittées · 3</span>
            <span style={alStyles.tab(false)}>Résolues</span>
            <span style={alStyles.tab(false)}>Toutes</span>
          </div>

          <div style={alStyles.list}>
            {ALERTES_FULL.map((a, i) => (
              <div key={i} style={i === 0 ? alStyles.aRowFirst : alStyles.aRow}>
                <div style={alStyles.aBar(a.c)} />
                <div>
                  <div style={alStyles.aT}>{a.t}</div>
                  <div style={alStyles.aD}>{a.d}</div>
                </div>
                <div>
                  <div style={alStyles.aMetaL}>Catégorie</div>
                  <div style={alStyles.aMeta}>{a.cat}</div>
                </div>
                <div>
                  <div style={alStyles.aMetaL}>Détectée</div>
                  <div style={alStyles.aMeta}>{a.age}</div>
                </div>
                <div style={alStyles.aBtns}>
                  <button style={alStyles.bSm}>Reporter</button>
                  <button style={alStyles.bSmDark}>Traiter</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
window.Alertes2 = Alertes2;
