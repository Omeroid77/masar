import { STATES, EDGES, NODE, CPS, EG, BORDERS, C } from '@/lib/data';
import { MW, MH, mx, my, GEO, PCODE, ABYEI, pts } from '@/lib/geo';

/* Draw order (do not change): outline, state fills, Abyei (plain, no label), sea label,
   corridors, checkpoints, state bubbles + labels, border crossings.
   Halaib & Shalateen is part of Red Sea State: no hatching, dashes, label or "disputed" styling. */
const halo = { paintOrder: 'stroke', stroke: '#ffffff', strokeWidth: '3px' };
const STATUS_C = { good: C.good, warn: C.warn, serious: C.serious, crit: C.crit };

export default function SudanMap({ bubbles = {}, edges = {}, borders = {}, fills = {}, labels = true, note = '' }) {
  return (
    <div className="map">
      <svg viewBox={`0 0 ${MW} ${MH}`} style={{ direction: 'ltr' }} role="img" aria-label="خريطة السودان بالحدود الإدارية للولايات">
        {Object.keys(GEO).map(k => (
          <polygon key={'o' + k} points={pts(GEO[k])} fill="#e8e6de" stroke="#b5b0a2" strokeWidth="2.4" strokeLinejoin="round" />
        ))}
        {STATES.map(st => {
          const f = fills[st.id];
          return (
            <polygon key={st.id} points={pts(GEO[PCODE[st.id]])} fill={f ? f.c : '#e8e6de'} fillOpacity={f ? (f.o ?? 1) : 1}
              stroke="#ffffff" strokeWidth="1.1" strokeLinejoin="round" data-tip={f && f.tip ? f.tip : st.ar} />
          );
        })}
        <polygon points={pts(ABYEI)} fill="#e8e6de" stroke="#ffffff" strokeWidth="1.1" strokeLinejoin="round" />
        <text x={mx(38.05)} y={my(22.2)} textAnchor="middle" fontSize="9.5" fill="#7d9a94" fontStyle="italic" pointerEvents="none">البحر الأحمر</text>
        {EDGES.map(e => {
          const a = NODE[e.a], b = NODE[e.b], st = edges[e.id] || {};
          const w = st.w ?? 1.5, c = st.c || '#b9c4c0', tip = st.tip || e.name;
          const p = { x1: mx(a.lon), y1: my(a.lat), x2: mx(b.lon), y2: my(b.lat) };
          return (
            <g key={e.id}>
              <line {...p} stroke="#ffffff" strokeWidth={w + 3} strokeLinecap="round" />
              <line {...p} stroke={c} strokeWidth={w} strokeLinecap="round" data-tip={tip} style={{ cursor: 'pointer' }} />
              <line {...p} stroke="transparent" strokeWidth="14" data-tip={tip} />
            </g>
          );
        })}
        {CPS.filter(cp => !cp.border).map(cp => {
          const e = EG[cp.edge], a = NODE[e.a], b = NODE[e.b];
          const x = (mx(a.lon) + mx(b.lon)) / 2, y = (my(a.lat) + my(b.lat)) / 2;
          return <rect key={cp.id} x={x - 4} y={y - 4} width="8" height="8" rx="2" fill="#1c211e" stroke="#ffffff" strokeWidth="1.5" transform={`rotate(45 ${x} ${y})`} data-tip={cp.name} />;
        })}
        {STATES.map(st => {
          const b = bubbles[st.id] || {}, r = b.r ?? 4;
          return (
            <g key={'b' + st.id}>
              <circle cx={mx(st.lon)} cy={my(st.lat)} r={r} fill={b.c || '#575d59'} fillOpacity={b.o ?? .9} stroke="#ffffff" strokeWidth="2" data-tip={b.tip || st.ar} style={{ cursor: 'pointer' }} />
              {labels && <text x={mx(st.lon)} y={my(st.lat) - r - 4} textAnchor="middle" fontSize="10.5" fill="#13211f" fontWeight="500" style={halo}>{st.ar}</text>}
            </g>
          );
        })}
        {BORDERS.map(b => {
          const o = borders[b.id] || {}, r = o.r ?? 5, x = mx(b.lon), y = my(b.lat);
          const lx = b.la === 'end' ? x - r - 4 : x + r + 4;
          return (
            <g key={b.id}>
              <rect x={x - r} y={y - r} width={2 * r} height={2 * r} rx="2" fill={o.c || '#1c211e'} stroke={STATUS_C[b.st]} strokeWidth="2.5"
                data-tip={o.tip || `<b>${b.ar}</b><br>${b.country} · ${b.stTxt}`} style={{ cursor: 'pointer' }} />
              <text x={lx} y={y + 4} textAnchor={b.la} fontSize="10" fill="#1c211e" fontWeight="600" style={halo}>{b.cap}</text>
            </g>
          );
        })}
      </svg>
      <div className="mini" style={{ marginTop: 4 }}>{note ? note + ' · ' : ''}حدود الولايات: بوابة المشروعات القومية (npo.gov.sd)، مبسّطة للعرض</div>
    </div>
  );
}
