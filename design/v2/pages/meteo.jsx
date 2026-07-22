/* PAGE — Météo apicole */
const meStyles = {
  page: { display: 'flex', width: 1280, height: 880, background: 'var(--surface-primary)', overflow: 'hidden', fontFamily: 'var(--font-text)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  scroll: { flex: 1, overflow: 'auto', padding: '28px 40px 60px' },
  header: { marginBottom: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' },
  h1: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' },
  hSub: { fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 6 },
  rucherSelect: { padding: '8px 14px', borderRadius: 9, border: '1px solid var(--border-default)', background: 'var(--surface-card)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 },

  hero: {
    background: 'linear-gradient(135deg, #1c1c1e 0%, #2a2725 100%)',
    color: '#fff', borderRadius: 18, padding: '32px 36px', marginBottom: 24,
    display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32,
  },
  heroL: {},
  heroPlace: { fontSize: 12, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 },
  heroTemp: { fontFamily: 'var(--font-display)', fontSize: 76, fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1, marginTop: 8 },
  heroLabel: { fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  heroChips: { display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' },
  chip: { fontSize: 12.5, padding: '6px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 6 },

  butinage: {
    borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 32,
  },
  butL: { fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 },
  butVal: { fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 8, color: 'var(--honey)' },
  butLabel: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  butBar: { marginTop: 14, height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.10)', overflow: 'hidden' },
  butFill: (v) => ({ height: '100%', width: `${v}%`, background: 'linear-gradient(90deg, var(--honey), var(--honey-light))', borderRadius: 99 }),
  butNote: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 10, lineHeight: 1.5 },

  /* 7-day forecast */
  sectLabel: { fontSize: 11, fontWeight: 600, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 },
  sectTitle: { fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 14, letterSpacing: '-0.015em' },
  forecast: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginBottom: 32 },
  fCard: (alert) => ({
    background: alert ? '#fdf3e3' : 'var(--surface-card)',
    border: alert ? '1px solid var(--status-warn)' : '1px solid var(--border-default)',
    borderRadius: 12, padding: '16px 14px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative',
  }),
  fDay: { fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  fDate: { fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 },
  fIcon: { width: 36, height: 36, borderRadius: 99, background: 'var(--surface-muted)', display: 'grid', placeItems: 'center' },
  fTemps: { display: 'flex', gap: 8, fontSize: 13 },
  fTmax: { fontWeight: 600, color: 'var(--text-primary)' },
  fTmin: { color: 'var(--text-tertiary)' },
  fButinage: (v) => ({ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, color: v >= 80 ? 'var(--sage-deep)' : v >= 50 ? 'var(--honey-deep)' : 'var(--status-bad)', background: v >= 80 ? 'var(--sage-soft)' : v >= 50 ? 'var(--honey-soft)' : '#f8e8e8' }),
  fAlertMark: { position: 'absolute', top: 10, right: 10, color: 'var(--status-warn)' },

  /* bottom panels */
  twoCol: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 },
  panel: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 22 },

  /* hourly chart */
  hours: { display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, marginTop: 14, paddingBottom: 22, position: 'relative' },
  hCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', height: '100%', justifyContent: 'flex-end' },
  hBar: (h) => ({ width: '70%', height: `${h}%`, background: 'linear-gradient(to top, var(--honey), var(--honey-light))', borderRadius: 4 }),
  hLabel: { fontSize: 10.5, color: 'var(--text-tertiary)', position: 'absolute', bottom: -18 },
  hTemp: { fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', position: 'absolute', top: -16 },

  /* recommendations */
  recoRow: { display: 'flex', gap: 12, padding: '12px 0', borderTop: '1px solid var(--border-faint)' },
  recoIcon: (c) => ({ width: 32, height: 32, borderRadius: 8, background: c, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }),
  recoTitle: { fontSize: 13.5, fontWeight: 600 },
  recoDesc: { fontSize: 12.5, color: 'var(--text-tertiary)', marginTop: 2 },
};

const WeatherIcon = ({ type, size = 18 }) => {
  if (type === 'sun') return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" fill="#f5a623"/><g stroke="#f5a623" strokeWidth="1.6" strokeLinecap="round"><path d="M12 3v2"/><path d="M12 19v2"/><path d="M3 12h2"/><path d="M19 12h2"/><path d="M5.6 5.6l1.4 1.4"/><path d="M17 17l1.4 1.4"/><path d="M5.6 18.4l1.4-1.4"/><path d="M17 7l1.4-1.4"/></g></svg>;
  if (type === 'cloud') return <svg width={size} height={size} viewBox="0 0 24 24" fill="#a8a29e"><path d="M6 18a4 4 0 010-8 6 6 0 0111.5 1.5A3.5 3.5 0 0117 18H6z"/></svg>;
  if (type === 'snow') return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#5e7ba8" strokeWidth="1.6" strokeLinecap="round"><path d="M12 3v18"/><path d="M3 12h18"/><path d="M5.6 5.6l12.8 12.8"/><path d="M18.4 5.6L5.6 18.4"/></svg>;
  return null;
};

const Meteo2 = () => {
  const D = window.APIGO_DATA;
  const HOURS = [
    {h: '06h', t: 9, b: 30}, {h: '08h', t: 12, b: 55}, {h: '10h', t: 15, b: 78}, {h: '12h', t: 18, b: 92},
    {h: '14h', t: 19, b: 95}, {h: '16h', t: 17, b: 80}, {h: '18h', t: 14, b: 50}, {h: '20h', t: 11, b: 20},
  ];
  return (
    <div style={meStyles.page}>
      <window.Sidebar2 active="meteo" />
      <div style={meStyles.main}>
        <window.Topbar2 crumb={['Pilotage', 'Météo']} />
        <div style={meStyles.scroll}>
          <div style={meStyles.header}>
            <div>
              <h1 style={meStyles.h1}>Météo apicole</h1>
              <p style={meStyles.hSub}>Conditions par rucher · indice de butinage prédictif sur 7 jours</p>
            </div>
            <button style={meStyles.rucherSelect}>
              {React.createElement(window.I.pin, {size: 14, style: {color: 'var(--honey-deep)'}})}
              Mont Ventoux Sud — Bédoin
              {React.createElement(window.I.chevronDown, {size: 13})}
            </button>
          </div>

          <div style={meStyles.hero}>
            <div style={meStyles.heroL}>
              <div style={meStyles.heroPlace}>Bédoin · 380 m · 02 mai, 14h</div>
              <div style={meStyles.heroTemp}>19°</div>
              <div style={meStyles.heroLabel}>Ensoleillé · vent faible NE 8 km/h</div>
              <div style={meStyles.heroChips}>
                <span style={meStyles.chip}>Humidité 52 %</span>
                <span style={meStyles.chip}>Pression 1018 hPa</span>
                <span style={meStyles.chip}>UV 7 · élevé</span>
                <span style={meStyles.chip}>Pollen lavande +++</span>
              </div>
            </div>
            <div style={meStyles.butinage}>
              <div style={meStyles.butL}>Indice de butinage</div>
              <div style={meStyles.butVal}>92<span style={{fontSize:18,color:'rgba(255,255,255,0.5)',marginLeft:4}}>/100</span></div>
              <div style={meStyles.butLabel}>Conditions excellentes</div>
              <div style={meStyles.butBar}><div style={meStyles.butFill(92)} /></div>
              <div style={meStyles.butNote}>Pic d'activité prévu entre 12h et 16h. Vol massif sur lavande et romarin.</div>
            </div>
          </div>

          <div style={meStyles.sectLabel}>01 — Prévisions</div>
          <div style={meStyles.sectTitle}>7 jours sur ce rucher</div>
          <div style={meStyles.forecast}>
            {D.METEO_7J.map((d, i) => (
              <div key={i} style={meStyles.fCard(d.alert)}>
                {d.alert && <span style={meStyles.fAlertMark}>{React.createElement(window.I.alertTriangle, {size: 13})}</span>}
                <div style={meStyles.fDay}>{d.jour}</div>
                <div style={meStyles.fDate}>{d.d}</div>
                <div style={meStyles.fIcon}><WeatherIcon type={d.icon} size={20} /></div>
                <div style={meStyles.fTemps}>
                  <span style={meStyles.fTmax}>{d.tmax}°</span>
                  <span style={meStyles.fTmin}>{d.tmin}°</span>
                </div>
                <span style={meStyles.fButinage(d.butinage)}>{d.butinage}</span>
              </div>
            ))}
          </div>

          <div style={meStyles.twoCol}>
            <div style={meStyles.panel}>
              <div style={meStyles.sectLabel}>02 — Aujourd'hui</div>
              <div style={meStyles.sectTitle}>Activité horaire prédite</div>
              <div style={meStyles.hours}>
                {HOURS.map(h => (
                  <div key={h.h} style={meStyles.hCol}>
                    <span style={meStyles.hTemp}>{h.t}°</span>
                    <div style={meStyles.hBar(h.b)} />
                    <span style={meStyles.hLabel}>{h.h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={meStyles.panel}>
              <div style={meStyles.sectLabel}>03 — Recommandations</div>
              <div style={meStyles.sectTitle}>Pour les 48 h</div>
              <div style={meStyles.recoRow}>
                <span style={meStyles.recoIcon('var(--sage)')}>{React.createElement(window.I.package, {size: 14})}</span>
                <div>
                  <div style={meStyles.recoTitle}>Posez les hausses</div>
                  <div style={meStyles.recoDesc}>Conditions optimales pour Ventoux Sud et Coteaux d'Apt</div>
                </div>
              </div>
              <div style={meStyles.recoRow}>
                <span style={meStyles.recoIcon('var(--status-warn)')}>{React.createElement(window.I.alertTriangle, {size: 14})}</span>
                <div>
                  <div style={meStyles.recoTitle}>Gel possible lundi 4 mai</div>
                  <div style={meStyles.recoDesc}>Sault et Buoux : -2 °C en fin de nuit. Pas de visite avant 10h.</div>
                </div>
              </div>
              <div style={meStyles.recoRow}>
                <span style={meStyles.recoIcon('var(--clay)')}>{React.createElement(window.I.eye, {size: 14})}</span>
                <div>
                  <div style={meStyles.recoTitle}>Surveillez l'essaimage</div>
                  <div style={meStyles.recoDesc}>Météo très favorable jeudi-vendredi : risque accru sur ruches fortes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.Meteo2 = Meteo2;
