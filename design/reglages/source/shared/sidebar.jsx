/* Shared sidebar matching the existing APIGO app navigation */
const sidebarStyles = {
  wrap: {
    width: 220, flexShrink: 0,
    background: 'var(--surface-sidebar)',
    color: '#fff',
    height: '100%',
    padding: '20px 14px',
    display: 'flex', flexDirection: 'column',
    gap: 4,
    fontFamily: 'var(--font-text)',
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '6px 8px 18px',
  },
  brandMark: {
    width: 28, height: 28, borderRadius: 8,
    background: 'linear-gradient(135deg, #f5a623, #d4891a)',
    display: 'grid', placeItems: 'center',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#1c1c1e',
    letterSpacing: '-0.02em',
  },
  brandText: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' },
  group: { fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '14px 10px 6px' },
  item: {
    display: 'flex', alignItems: 'center', gap: 11,
    padding: '8px 10px',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13, fontWeight: 500,
    transition: 'all .15s',
    cursor: 'pointer',
  },
  itemActive: {
    background: 'rgba(255,255,255,0.10)',
    color: '#fff',
  },
  badge: {
    marginLeft: 'auto', fontSize: 10.5, fontWeight: 600,
    background: 'var(--honey)', color: '#1c1c1e',
    padding: '1px 6px', borderRadius: 999,
  },
};

const Sidebar = ({ active = 'parametres' }) => {
  const Item = ({ id, icon, label, badge }) => {
    const isActive = id === active;
    return (
      <div style={{ ...sidebarStyles.item, ...(isActive ? sidebarStyles.itemActive : {}) }}>
        {React.createElement(window.I[icon], { size: 17, stroke: 1.75 })}
        <span>{label}</span>
        {badge && <span style={sidebarStyles.badge}>{badge}</span>}
      </div>
    );
  };

  return (
    <div style={sidebarStyles.wrap}>
      <div style={sidebarStyles.brand}>
        <div style={sidebarStyles.brandMark}>A</div>
        <div style={sidebarStyles.brandText}>APIGO</div>
      </div>

      <div style={sidebarStyles.group}>Pilotage</div>
      <Item id="dashboard" icon="hexagon" label="Tableau de bord" />
      <Item id="ruchers" icon="pin" label="Ruchers" />
      <Item id="ruches" icon="package" label="Ruches" badge="248" />
      <Item id="interventions" icon="calendar" label="Interventions" />
      <Item id="meteo" icon="cloud" label="Météo" />

      <div style={sidebarStyles.group}>Gestion</div>
      <Item id="production" icon="database" label="Production" />
      <Item id="stocks" icon="inbox" label="Stocks" />
      <Item id="finances" icon="card" label="Finances" />
      <Item id="clients" icon="users" label="Clients" />

      <div style={{ marginTop: 'auto' }} />
      <Item id="parametres" icon="settings" label="Paramètres" />
    </div>
  );
};

window.Sidebar = Sidebar;
