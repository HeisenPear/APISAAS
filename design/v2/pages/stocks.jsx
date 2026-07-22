/* PAGE — Stocks & matériel */
const stStyles = {
  page: { display: 'flex', width: 1280, height: 880, background: 'var(--surface-primary)', overflow: 'hidden', fontFamily: 'var(--font-text)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  scroll: { flex: 1, overflow: 'auto', padding: '28px 40px 60px' },
  header: { marginBottom: 22 },
  h1: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em' },
  hSub: { fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 6 },

  catRow: { display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  cat: (a) => ({
    flex: 1, minWidth: 180, padding: '14px 18px',
    background: a ? '#1c1c1e' : 'var(--surface-card)',
    color: a ? '#fff' : 'var(--text-primary)',
    border: a ? '1px solid #1c1c1e' : '1px solid var(--border-default)',
    borderRadius: 12, cursor: 'pointer',
  }),
  catL: (a) => ({ fontSize: 11, color: a ? 'rgba(255,255,255,0.5)' : 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }),
  catV: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 4 },

  layout: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 },

  shelfTitle: { fontSize: 11, fontWeight: 600, color: 'var(--honey-deep)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 },
  shelfH: { fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em', marginBottom: 14 },

  shelf: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, marginBottom: 18, overflow: 'hidden' },
  shelfHead: { padding: '14px 20px', borderBottom: '1px solid var(--border-default)', background: 'var(--surface-muted)', display: 'flex', justifyContent: 'space-between' },
  shelfName: { fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 },
  shelfCount: { fontSize: 12, color: 'var(--text-tertiary)' },

  itemRow: { display: 'grid', gridTemplateColumns: '1fr 200px 130px 80px', padding: '14px 20px', alignItems: 'center', fontSize: 13, borderTop: '1px solid var(--border-faint)' },
  itemRowFirst: { display: 'grid', gridTemplateColumns: '1fr 200px 130px 80px', padding: '14px 20px', alignItems: 'center', fontSize: 13 },
  iName: { fontWeight: 500 },
  iSub: { fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 },
  iBar: { height: 6, borderRadius: 99, background: 'var(--surface-muted)', overflow: 'hidden', position: 'relative', width: '100%' },
  iBarFill: (v, low) => ({ height: '100%', width: `${Math.min(100, v)}%`, background: low ? 'var(--status-warn)' : 'var(--sage)', borderRadius: 99 }),
  iThr: { position: 'absolute', top: -2, height: 10, width: 1.5, background: 'var(--text-tertiary)' },
  iQty: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 },
  iThreshold: { fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 },
  iAction: { textAlign: 'right' },
  iCmd: { fontSize: 12, fontWeight: 600, color: 'var(--honey-deep)', display: 'inline-flex', alignItems: 'center', gap: 4 },

  /* Right panel — alerts & quick actions */
  side: { display: 'flex', flexDirection: 'column', gap: 18 },
  sPanel: { background: 'var(--surface-card)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 18 },
  sTitle: { fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 },

  alertS: { display: 'flex', gap: 10, padding: '10px 0', borderTop: '1px solid var(--border-faint)' },
  alertSDot: { width: 8, height: 8, borderRadius: 99, background: 'var(--status-warn)', marginTop: 6, flexShrink: 0 },
  alertSText: { fontSize: 12.5 },
  alertSName: { fontWeight: 500 },
  alertSDesc: { color: 'var(--text-tertiary)', fontSize: 12, marginTop: 2 },

  cmdRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border-faint)', fontSize: 12.5 },
  cmdName: { fontWeight: 500 },
  cmdMeta: { color: 'var(--text-tertiary)', marginTop: 1, fontSize: 11.5 },
  cmdState: (c) => ({ fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 99, color: c === 'sent' ? 'var(--sage-deep)' : 'var(--honey-deep)', background: c === 'sent' ? 'var(--sage-soft)' : 'var(--honey-soft)', alignSelf: 'flex-start' }),
};

const STOCK = {
  ruches: [
    { n: 'Corps Dadant 10c', s: 'bois cèdre', q: 32, t: 20, max: 50 },
    { n: 'Hausses Dadant', s: 'bois sapin', q: 64, t: 40, max: 120, low: false },
    { n: 'Cadres filés', s: 'à monter', q: 12, t: 40, max: 200, low: true },
    { n: 'Toits chalet', s: 'tôle galva', q: 18, t: 10, max: 30 },
  ],
  consommables: [
    { n: 'Cires gaufrées Dadant', s: 'plaques', q: 8, t: 20, max: 100, low: true, cmd: 'En commande' },
    { n: 'Sirop nourrissement', s: 'kg sirop 50/50', q: 220, t: 100, max: 400 },
    { n: 'Lanières varroa Apivar', s: 'sachets', q: 28, t: 30, max: 80, low: true },
    { n: 'Acide oxalique', s: 'kg', q: 4, t: 2, max: 10 },
  ],
  conditionnement: [
    { n: 'Pots verre 500 g', s: 'avec couvercle', q: 1240, t: 500, max: 2000 },
    { n: 'Pots verre 250 g', s: 'avec couvercle', q: 380, t: 200, max: 1500, low: false },
    { n: 'Étiquettes Lavande IGP', s: 'imprimées', q: 110, t: 200, max: 800, low: true },
    { n: 'Cartons 12 pots', s: 'kraft', q: 60, t: 30, max: 200 },
  ],
};

const Stocks2 = () => {
  return (
    <div style={stStyles.page}>
      <window.Sidebar2 active="stocks" />
      <div style={stStyles.main}>
        <window.Topbar2 crumb={['Affaires', 'Stocks']} action="Ajouter article" />
        <div style={stStyles.scroll}>
          <div style={stStyles.header}>
            <h1 style={stStyles.h1}>Stocks & matériel</h1>
            <p style={stStyles.hSub}>3 catégories · 12 articles suivis · 3 ruptures et 2 commandes en cours</p>
          </div>

          <div style={stStyles.catRow}>
            <div style={stStyles.cat(true)}>
              <div style={stStyles.catL(true)}>Tous articles</div>
              <div style={stStyles.catV}>12</div>
            </div>
            <div style={stStyles.cat(false)}>
              <div style={stStyles.catL(false)}>Matériel ruche</div>
              <div style={stStyles.catV}>4</div>
            </div>
            <div style={stStyles.cat(false)}>
              <div style={stStyles.catL(false)}>Consommables</div>
              <div style={stStyles.catV}>4</div>
            </div>
            <div style={stStyles.cat(false)}>
              <div style={stStyles.catL(false)}>Conditionnement</div>
              <div style={stStyles.catV}>4</div>
            </div>
          </div>

          <div style={stStyles.layout}>
            <div>
              {[
                { id: 'r', t: 'Matériel ruche', items: STOCK.ruches },
                { id: 'c', t: 'Consommables apicoles', items: STOCK.consommables },
                { id: 'p', t: 'Conditionnement', items: STOCK.conditionnement },
              ].map(group => (
                <div key={group.id} style={stStyles.shelf}>
                  <div style={stStyles.shelfHead}>
                    <span style={stStyles.shelfName}>{group.t}</span>
                    <span style={stStyles.shelfCount}>{group.items.length} articles</span>
                  </div>
                  {group.items.map((it, i) => {
                    const low = it.q < it.t;
                    return (
                      <div key={it.n} style={i === 0 ? stStyles.itemRowFirst : stStyles.itemRow}>
                        <div>
                          <div style={stStyles.iName}>{it.n}</div>
                          <div style={stStyles.iSub}>{it.s}</div>
                        </div>
                        <div style={stStyles.iBar}>
                          <div style={stStyles.iBarFill((it.q/it.max)*100, low)} />
                          <div style={{...stStyles.iThr, left: `${(it.t/it.max)*100}%`}} />
                        </div>
                        <div>
                          <div style={{...stStyles.iQty, color: low ? 'var(--status-warn)' : 'var(--text-primary)'}}>{it.q.toLocaleString('fr-FR')}</div>
                          <div style={stStyles.iThreshold}>seuil {it.t}</div>
                        </div>
                        <div style={stStyles.iAction}>
                          {low ? (
                            <span style={stStyles.iCmd}>{React.createElement(window.I.plus, {size: 12})} Commander</span>
                          ) : (
                            <span style={{fontSize: 11, color: 'var(--text-tertiary)'}}>OK</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div style={stStyles.side}>
              <div style={stStyles.sPanel}>
                <div style={stStyles.sTitle}>Sous le seuil — 3</div>
                <div style={stStyles.alertS}>
                  <div style={stStyles.alertSDot} />
                  <div style={stStyles.alertSText}>
                    <div style={stStyles.alertSName}>Cires gaufrées Dadant</div>
                    <div style={stStyles.alertSDesc}>8 / 20 plaques · récolte été imminente</div>
                  </div>
                </div>
                <div style={stStyles.alertS}>
                  <div style={stStyles.alertSDot} />
                  <div style={stStyles.alertSText}>
                    <div style={stStyles.alertSName}>Cadres filés</div>
                    <div style={stStyles.alertSDesc}>12 / 40 · à monter avant fin mai</div>
                  </div>
                </div>
                <div style={stStyles.alertS}>
                  <div style={stStyles.alertSDot} />
                  <div style={stStyles.alertSText}>
                    <div style={stStyles.alertSName}>Étiquettes Lavande IGP</div>
                    <div style={stStyles.alertSDesc}>110 / 200 · pour pots 500 g</div>
                  </div>
                </div>
              </div>

              <div style={stStyles.sPanel}>
                <div style={stStyles.sTitle}>Commandes en cours</div>
                <div style={stStyles.cmdRow}>
                  <div>
                    <div style={stStyles.cmdName}>Apiculture du Comtat</div>
                    <div style={stStyles.cmdMeta}>2 cartons cires · 320 €</div>
                  </div>
                  <span style={stStyles.cmdState('sent')}>Expédiée</span>
                </div>
                <div style={stStyles.cmdRow}>
                  <div>
                    <div style={stStyles.cmdName}>Étiquettes Provence</div>
                    <div style={stStyles.cmdMeta}>500 étiquettes · 78 €</div>
                  </div>
                  <span style={stStyles.cmdState('pending')}>Préparation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
window.Stocks2 = Stocks2;
