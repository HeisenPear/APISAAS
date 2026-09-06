/* Sidebar v2 — repensée : groupes éditoriaux, mono-couleur, breadcrumb intégré */

const sb2 = {
  wrap: {
    width: 232, flexShrink: 0,
    background: '#1c1c1e',
    color: '#fff',
    height: '100%',
    display: 'flex', flexDirection: 'column',
    fontFamily: 'var(--font-text)',
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 11,
    padding: '20px 18px 8px',
  },
  brandMark: {
    width: 30, height: 30, borderRadius: 9,
    background: 'linear-gradient(135deg, #f5a623, #d4891a)',
    display: 'grid', placeItems: 'center',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#1c1c1e',
  },
  brandText: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' },
  exploit: {
    margin: '8px 14px 6px',
    padding: '10px 12px', borderRadius: 10,
    background: 'rgba(255,255,255,0.05)',
    fontSize: 12,
  },
  exploitName: { color: '#fff', fontWeight: 600, fontSize: 12.5 },
  exploitMeta: { color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  scroll: { flex: 1, overflow: 'auto', padding: '4px 14px 14px' },
  group: {
    fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: '0.1em',
    padding: '14px 10px 6px',
  },
  item: (active) => ({
    display: 'flex', alignItems: 'center', gap: 11,
    padding: '7px 10px', borderRadius: 8,
    color: active ? '#fff' : 'rgba(255,255,255,0.65)',
    fontSize: 13, fontWeight: active ? 600 : 500,
    background: active ? 'rgba(255,255,255,0.10)' : 'transparent',
    cursor: 'pointer',
    transition: 'all .12s',
  }),
  badge: {
    marginLeft: 'auto', fontSize: 10.5, fontWeight: 600,
    background: 'rgba(245,166,35,0.18)',
    color: '#f5a623',
    padding: '1px 6px', borderRadius: 99,
  },
  dot: {
    marginLeft: 'auto', width: 6, height: 6, borderRadius: 99,
    background: '#c87f2a',
  },
  mayaItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: 11,
    margin: '6px 14px 2px',
    padding: '9px 12px', borderRadius: 10,
    color: '#fff', fontSize: 13.5, fontWeight: 600,
    background: active ? 'rgba(230,152,44,0.16)' : 'rgba(255,255,255,0.05)',
    border: active ? '1px solid rgba(230,152,44,0.5)' : '1px solid rgba(255,255,255,0.07)',
    cursor: 'pointer', transition: 'all .14s', position: 'relative',
  }),
  mayaNew: {
    marginLeft: 'auto', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em',
    color: '#e6982c', textTransform: 'uppercase',
  },
  foot: {
    padding: '12px 14px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex', alignItems: 'center', gap: 11,
  },
  avatar: {
    width: 28, height: 28, borderRadius: 99,
    background: '#fff3dc', color: '#a86a13',
    display: 'grid', placeItems: 'center',
    fontSize: 11.5, fontWeight: 700,
  },
  userName: { color: '#fff', fontSize: 12.5, fontWeight: 600 },
  userPlan: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
};

const Sidebar2 = ({ active = 'dashboard', onMaya }) => {
  const Item = ({ id, icon, label, badge, dot }) => (
    <div style={sb2.item(active === id)}>
      {React.createElement(window.I[icon], { size: 16, stroke: 1.75 })}
      <span>{label}</span>
      {badge != null && <span style={sb2.badge}>{badge}</span>}
      {dot && <span style={sb2.dot} />}
    </div>
  );
  return (
    <aside style={sb2.wrap}>
      <div style={sb2.brand}>
        <div style={sb2.brandMark}>A</div>
        <div style={sb2.brandText}>APIGO</div>
      </div>
      <div style={sb2.exploit}>
        <div style={sb2.exploitName}>Miellerie du Ventoux</div>
        <div style={sb2.exploitMeta}>248 ruches · 7 ruchers</div>
      </div>
      <div style={sb2.mayaItem(active === 'maya')} onClick={onMaya}>
        <window.MayaMark size={22} />
        <span>Maya</span>
        <span style={sb2.mayaNew}>Assistant</span>
      </div>
      <div style={sb2.scroll}>
        <div style={sb2.group}>Pilotage</div>
        <Item id="dashboard" icon="hexagon" label="Tableau de bord" />
        <Item id="alertes" icon="alertTriangle" label="Alertes" dot />
        <Item id="calendrier" icon="calendar" label="Calendrier" />
        <Item id="meteo" icon="cloud" label="Météo" />

        <div style={sb2.group}>Cheptel</div>
        <Item id="ruchers" icon="pin" label="Ruchers" badge="7" />
        <Item id="ruches" icon="package" label="Ruches" badge="248" />
        <Item id="interventions" icon="calendar" label="Interventions" />
        <Item id="production" icon="database" label="Production" />

        <div style={sb2.group}>Affaires</div>
        <Item id="stocks" icon="inbox" label="Stocks" />
        <Item id="finances" icon="card" label="Finances" />
        <Item id="clients" icon="users" label="Clients" />
        <Item id="analytics" icon="zap" label="Analytics" />
      </div>
      <div style={sb2.foot}>
        <div style={sb2.avatar}>ML</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={sb2.userName}>Marc Lefèvre</div>
          <div style={sb2.userPlan}>Plan Pro</div>
        </div>
        {React.createElement(window.I.settings, { size: 15, style: { color: 'rgba(255,255,255,0.5)' } })}
      </div>
    </aside>
  );
};

window.Sidebar2 = Sidebar2;
