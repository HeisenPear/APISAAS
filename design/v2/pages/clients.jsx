/* PAGE — Clients & vente */
const clStyles = {
  page: { display: 'flex', width: 1280, height: 880, background: 'var(--surface-primary)', overflow: 'hidden', fontFamily: 'var(--font-text)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  scroll: { flex: 1, overflow: 'auto', padding: '28px 40px 60px' },
  header: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 },
  h1: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' },
  hSub: { fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 6 },

  toolbar: { display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' },
  search: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid var(--border-default)', background: 'var(--surface-card)', borderRadius: 8, fontSize: 13, color: 'var(--text-tertiary)', width: 280 },
  filter: { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--surface-card)', fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 },
  spacer: { marginLeft: 'auto', display: 'flex', gap: 8 },

  layout: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 },

  /* Clients table */
  panel: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, overflow: 'hidden' },
  tHead: { padding: '14px 22px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tTitle: { fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em' },
  cardSep: { borderTop: '1px solid var(--border-faint)' },

  cliRow: { display: 'grid', gridTemplateColumns: '40px 1fr 100px 90px 90px', padding: '14px 22px', alignItems: 'center', gap: 12 },
  avatar: (c) => ({ width: 36, height: 36, borderRadius: 99, background: c, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-display)' }),
  cliN: { fontSize: 13.5, fontWeight: 600 },
  cliM: { fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 },
  cliTag: (c) => ({ display: 'inline-block', fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: c === 'pro' ? 'var(--clay-soft)' : c === 'vip' ? 'var(--honey-soft)' : 'var(--surface-muted)', color: c === 'pro' ? 'var(--clay-deep)' : c === 'vip' ? 'var(--honey-deep)' : 'var(--text-secondary)', marginTop: 4 }),
  cliN2: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, textAlign: 'right' },
  cliL2: { fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, textAlign: 'right' },

  /* Right side */
  side: { display: 'flex', flexDirection: 'column', gap: 18 },
  topClients: { padding: '0 22px 14px' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--border-faint)' },
  topRank: { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)', width: 22 },
  topName: { fontSize: 13, fontWeight: 500, flex: 1 },
  topCa: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13 },

  channels: { padding: 22 },
  chRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' },
  chIcon: (c) => ({ width: 32, height: 32, borderRadius: 8, background: c, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }),
  chName: { flex: 1, fontSize: 13, fontWeight: 500 },
  chPct: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13 },
  chBar: { height: 5, borderRadius: 99, background: 'var(--surface-muted)', overflow: 'hidden', marginTop: 8 },
  chFill: (v, c) => ({ height: '100%', width: `${v}%`, background: c, borderRadius: 99 }),

  pH: { padding: '14px 22px', borderBottom: '1px solid var(--border-default)', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em' },
};

const CLIENTS = [
  { n: 'Hôtel Crillon-le-Brave', m: 'crillon@…  · Crillon-le-Brave', tag: 'vip', c: 'var(--honey)', i: 'CB', cmd: 14, ca: 4280 },
  { n: 'Restaurant Les Florets', m: 'florets@…  · Gigondas', tag: 'vip', c: 'var(--clay)', i: 'LF', cmd: 11, ca: 3120 },
  { n: 'Coopérative Provence', m: 'achat@coop-provence.fr', tag: 'pro', c: 'var(--sage)', i: 'CP', cmd: 6, ca: 5280 },
  { n: 'Épicerie La Récolte', m: 'larecolte@…  · Bédoin', tag: 'pro', c: '#7a6f8e', i: 'LR', cmd: 18, ca: 2640 },
  { n: 'Boulangerie Augier', m: 'augier@…  · Mazan', tag: 'pro', c: 'var(--status-info)', i: 'BA', cmd: 9, ca: 1320 },
  { n: 'Marché Bédoin (récurrent)', m: 'Particuliers · samedi', tag: 'partic', c: 'var(--text-tertiary)', i: 'MB', cmd: '~', ca: 8420 },
  { n: 'Caveau Domaine Saint-Hubert', m: 'caveau@…  · Mormoiron', tag: 'pro', c: '#a584b5', i: 'SH', cmd: 4, ca: 980 },
];

const Clients2 = () => {
  return (
    <div style={clStyles.page}>
      <window.Sidebar2 active="clients" />
      <div style={clStyles.main}>
        <window.Topbar2 crumb={['Affaires', 'Clients']} action="Nouveau client" />
        <div style={clStyles.scroll}>
          <div style={clStyles.header}>
            <div>
              <h1 style={clStyles.h1}>Clients & vente</h1>
              <p style={clStyles.hSub}>62 clients actifs · 4 segments · 38,4 k€ générés YTD</p>
            </div>
          </div>

          <div style={clStyles.toolbar}>
            <div style={clStyles.search}>
              {React.createElement(window.I.search, {size: 14})}<span>Rechercher un client…</span>
            </div>
            <button style={clStyles.filter}>Segment {React.createElement(window.I.chevronDown, {size: 12})}</button>
            <button style={clStyles.filter}>Type {React.createElement(window.I.chevronDown, {size: 12})}</button>
            <button style={clStyles.filter}>Région {React.createElement(window.I.chevronDown, {size: 12})}</button>
            <div style={clStyles.spacer}>
              <button style={clStyles.filter}>{React.createElement(window.I.download, {size: 13})} Export</button>
            </div>
          </div>

          <div style={clStyles.layout}>
            <div style={clStyles.panel}>
              <div style={clStyles.tHead}>
                <div style={clStyles.tTitle}>Tous les clients</div>
                <span style={{fontSize:12, color:'var(--text-tertiary)'}}>1–7 sur 62</span>
              </div>
              {CLIENTS.map((c, i) => (
                <div key={c.n} style={{...clStyles.cliRow, ...(i > 0 ? clStyles.cardSep : {})}}>
                  <div style={clStyles.avatar(c.c)}>{c.i}</div>
                  <div>
                    <div style={clStyles.cliN}>{c.n}</div>
                    <div style={clStyles.cliM}>{c.m}</div>
                    <span style={clStyles.cliTag(c.tag)}>{c.tag === 'vip' ? 'VIP' : c.tag === 'pro' ? 'Professionnel' : 'Particulier'}</span>
                  </div>
                  <div>
                    <div style={clStyles.cliN2}>{c.cmd}</div>
                    <div style={clStyles.cliL2}>commandes</div>
                  </div>
                  <div>
                    <div style={clStyles.cliN2}>{c.ca.toLocaleString('fr-FR')} €</div>
                    <div style={clStyles.cliL2}>CA 2025</div>
                  </div>
                  <span style={{color:'var(--text-tertiary)', textAlign:'right'}}>{React.createElement(window.I.more, {size:14})}</span>
                </div>
              ))}
            </div>

            <div style={clStyles.side}>
              <div style={clStyles.panel}>
                <div style={clStyles.pH}>Top clients · 2025</div>
                <div style={clStyles.topClients}>
                  {[
                    { r: 1, n: 'Marché Bédoin (récurrent)', ca: '8 420 €' },
                    { r: 2, n: 'Coopérative Provence', ca: '5 280 €' },
                    { r: 3, n: 'Hôtel Crillon-le-Brave', ca: '4 280 €' },
                    { r: 4, n: 'Restaurant Les Florets', ca: '3 120 €' },
                    { r: 5, n: 'Épicerie La Récolte', ca: '2 640 €' },
                  ].map(t => (
                    <div key={t.r} style={clStyles.topRow}>
                      <span style={clStyles.topRank}>{String(t.r).padStart(2,'0')}</span>
                      <span style={clStyles.topName}>{t.n}</span>
                      <span style={clStyles.topCa}>{t.ca}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={clStyles.panel}>
                <div style={clStyles.pH}>Canaux de vente</div>
                <div style={clStyles.channels}>
                  {[
                    { n: 'Vente directe (marché)', v: 38, c: 'var(--honey)' },
                    { n: 'Restaurants & hôtels', v: 26, c: 'var(--clay)' },
                    { n: 'Coopérative & vrac', v: 20, c: 'var(--sage)' },
                    { n: 'Épiceries & revendeurs', v: 12, c: 'var(--status-info)' },
                    { n: 'Boutique en ligne', v: 4, c: '#a584b5' },
                  ].map(ch => (
                    <div key={ch.n}>
                      <div style={clStyles.chRow}>
                        <span style={clStyles.chIcon(ch.c)} />
                        <span style={clStyles.chName}>{ch.n}</span>
                        <span style={clStyles.chPct}>{ch.v} %</span>
                      </div>
                      <div style={clStyles.chBar}><div style={clStyles.chFill(ch.v, ch.c)} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.Clients2 = Clients2;
