/* PAGE — Calendrier mensuel */
const caStyles = {
  page: { display: 'flex', width: 1280, height: 880, background: 'var(--surface-primary)', overflow: 'hidden', fontFamily: 'var(--font-text)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  scroll: { flex: 1, overflow: 'auto', padding: '28px 40px 40px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  hLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  h1: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' },
  navBtn: { width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--surface-card)', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' },
  today: { padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--surface-card)', fontSize: 12.5, fontWeight: 600 },
  views: { display: 'flex', gap: 0, border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden', background: 'var(--surface-card)' },
  vBtn: (a) => ({ padding: '7px 14px', fontSize: 12.5, fontWeight: 600, background: a ? 'var(--surface-muted)' : 'transparent', color: a ? 'var(--text-primary)' : 'var(--text-tertiary)', border: 'none' }),
  legend: { display: 'flex', gap: 16, marginBottom: 14, fontSize: 12, color: 'var(--text-secondary)' },
  legDot: (c) => ({ width: 9, height: 9, borderRadius: 99, background: c, display: 'inline-block', marginRight: 6 }),

  grid: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, overflow: 'hidden' },
  weekdays: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-default)', background: 'var(--surface-muted)' },
  wd: { padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  weeks: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '116px' },
  cell: (today, otherMonth) => ({
    borderRight: '1px solid var(--border-faint)',
    borderTop: '1px solid var(--border-faint)',
    padding: '8px 10px',
    background: today ? 'var(--honey-soft)' : 'transparent',
    opacity: otherMonth ? 0.4 : 1,
    display: 'flex', flexDirection: 'column', gap: 4,
    position: 'relative',
  }),
  dayN: { fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font-display)' },
  dayNToday: { fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--honey-deep)' },
  evt: (c) => ({
    fontSize: 11, padding: '2px 6px', borderRadius: 4,
    background: c === 'honey' ? 'var(--honey-soft)' : c === 'sage' ? 'var(--sage-soft)' : c === 'clay' ? 'var(--clay-soft)' : '#e8eef8',
    color: c === 'honey' ? 'var(--honey-deep)' : c === 'sage' ? 'var(--sage-deep)' : c === 'clay' ? 'var(--clay-deep)' : 'var(--status-info)',
    fontWeight: 500,
    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
  }),
  alertBadge: { position: 'absolute', top: 8, right: 8, fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: 'var(--status-warn)', color: '#fff' },
};

const MAY = [
  // [day, otherMonth, today, events]
  [27,1,0,[]],[28,1,0,[]],[29,1,0,[]],[30,1,0,[]],
  [1,0,0,[{c:'honey',t:'Visite Ouvèze'}]],
  [2,0,1,[{c:'honey',t:'06:30 Visite V-014'},{c:'honey',t:'07:15 Visite V-018'}]],
  [3,0,0,[{c:'sage',t:'Pose hausse R03'}]],

  [4,0,0,[{c:'clay',t:'Trait. varroa R02'}],true],
  [5,0,0,[]],
  [6,0,0,[{c:'honey',t:'Visite Ventoux'}]],
  [7,0,0,[{c:'sage',t:'Pose hausses'}]],
  [8,0,0,[{c:'info',t:'Marché Bédoin'}]],
  [9,0,0,[]],
  [10,0,0,[{c:'clay',t:'Récolte printemps'}]],

  [11,0,0,[{c:'clay',t:'Récolte R01 R04'}]],
  [12,0,0,[{c:'honey',t:'Visite Sault'}]],
  [13,0,0,[]],
  [14,0,0,[{c:'sage',t:'Élevage reines'}]],
  [15,0,0,[{c:'sage',t:'Élevage J2'}]],
  [16,0,0,[{c:'info',t:'Marché Vaison'}]],
  [17,0,0,[]],

  [18,0,0,[{c:'sage',t:'Greffe larves'}]],
  [19,0,0,[]],
  [20,0,0,[{c:'honey',t:'Comptage varroas'}]],
  [21,0,0,[{c:'honey',t:'Visite globale'}]],
  [22,0,0,[]],
  [23,0,0,[{c:'info',t:'Marché Bédoin'},{c:'info',t:'Salon apiculture'}]],
  [24,0,0,[{c:'info',t:'Salon J2'}]],

  [25,0,0,[]],
  [26,0,0,[{c:'sage',t:'Intro reines'}]],
  [27,0,0,[{c:'clay',t:'Mise en pots'}]],
  [28,0,0,[{c:'clay',t:'Étiquetage'}]],
  [29,0,0,[]],
  [30,0,0,[{c:'info',t:'Livraison épicerie'}]],
  [31,0,0,[]],
];

const Calendrier2 = () => {
  return (
    <div style={caStyles.page}>
      <window.Sidebar2 active="calendrier" />
      <div style={caStyles.main}>
        <window.Topbar2 crumb={['Pilotage', 'Calendrier']} action="Nouvel événement" />
        <div style={caStyles.scroll}>
          <div style={caStyles.header}>
            <div style={caStyles.hLeft}>
              <h1 style={caStyles.h1}>Mai 2026</h1>
              <button style={caStyles.navBtn}>{React.createElement(window.I.chevronLeft, {size:14})}</button>
              <button style={caStyles.navBtn}>{React.createElement(window.I.chevronRight, {size:14})}</button>
              <button style={caStyles.today}>Aujourd'hui</button>
            </div>
            <div style={caStyles.views}>
              <button style={caStyles.vBtn(false)}>Jour</button>
              <button style={caStyles.vBtn(false)}>Semaine</button>
              <button style={caStyles.vBtn(true)}>Mois</button>
              <button style={caStyles.vBtn(false)}>Saison</button>
            </div>
          </div>

          <div style={caStyles.legend}>
            <span><span style={caStyles.legDot('var(--honey)')} />Visites & contrôles</span>
            <span><span style={caStyles.legDot('var(--sage)')} />Production & élevage</span>
            <span><span style={caStyles.legDot('var(--clay)')} />Récolte & conditionnement</span>
            <span><span style={caStyles.legDot('var(--status-info)')} />Vente & marchés</span>
          </div>

          <div style={caStyles.grid}>
            <div style={caStyles.weekdays}>
              {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => <div key={d} style={caStyles.wd}>{d}</div>)}
            </div>
            <div style={caStyles.weeks}>
              {MAY.map(([n, om, today, evts, alert], i) => (
                <div key={i} style={caStyles.cell(today, om)}>
                  <span style={today ? caStyles.dayNToday : caStyles.dayN}>{n}</span>
                  {alert && <span style={caStyles.alertBadge}>!</span>}
                  {evts.map((e, k) => <div key={k} style={caStyles.evt(e.c)}>{e.t}</div>)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.Calendrier2 = Calendrier2;
