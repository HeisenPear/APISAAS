/* Topbar v2 — breadcrumb + search + actions, partagée par toutes les pages */
const tb2 = {
  bar: {
    height: 60, padding: '0 28px',
    display: 'flex', alignItems: 'center', gap: 16,
    borderBottom: '1px solid var(--border-default)',
    background: 'rgba(250,249,246,0.85)',
    backdropFilter: 'blur(8px)',
    flexShrink: 0,
  },
  crumb: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 },
  crumbMuted: { color: 'var(--text-tertiary)' },
  crumbCurrent: { color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: 14 },
  search: {
    marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 12px',
    background: 'var(--surface-muted)',
    borderRadius: 8, color: 'var(--text-tertiary)', fontSize: 13,
    width: 280,
  },
  kbd: {
    fontSize: 10.5, fontFamily: 'var(--font-mono)',
    background: 'var(--surface-card)',
    border: '1px solid var(--border-default)',
    borderRadius: 4, padding: '1px 5px',
    marginLeft: 'auto',
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 8,
    border: '1px solid var(--border-default)',
    background: 'var(--surface-card)',
    display: 'grid', placeItems: 'center',
    color: 'var(--text-secondary)',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 6, right: 6,
    width: 7, height: 7, borderRadius: 99,
    background: 'var(--status-warn)',
    border: '2px solid var(--surface-card)',
  },
  primaryBtn: {
    height: 36, padding: '0 14px',
    background: '#1c1c1e', color: '#fff',
    border: 'none', borderRadius: 8,
    fontSize: 13, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 7,
  },
};
const Topbar2 = ({ crumb = [], action }) => (
  <div style={tb2.bar}>
    <div style={tb2.crumb}>
      {crumb.slice(0, -1).map((c, i) => (
        <React.Fragment key={i}>
          <span style={tb2.crumbMuted}>{c}</span>
          {React.createElement(window.I.chevronRight, { size: 13, style: { color: 'var(--text-quaternary)' } })}
        </React.Fragment>
      ))}
      <span style={tb2.crumbCurrent}>{crumb[crumb.length - 1]}</span>
    </div>
    <div style={tb2.search}>
      {React.createElement(window.I.search, { size: 14 })}
      <span>Rechercher ruche, intervention…</span>
      <span style={tb2.kbd}>⌘K</span>
    </div>
    <button style={tb2.iconBtn}>
      {React.createElement(window.I.bell, { size: 15 })}
      <span style={tb2.notifDot} />
    </button>
    {action && (
      <button style={tb2.primaryBtn}>
        {React.createElement(window.I.plus, { size: 14 })} {action}
      </button>
    )}
  </div>
);
window.Topbar2 = Topbar2;
