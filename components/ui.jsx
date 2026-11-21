import { tierOf } from '@/lib/data';

export function PageHead({ title, desc, children }) {
  return (
    <div className="ph">
      <div><h2>{title}</h2>{desc && <p>{desc}</p>}</div>
      {children}
    </div>
  );
}

export function Kpis({ items, style }) {
  return (
    <div className="kpis" style={style}>
      {items.map((k, i) => (
        <div className="kpi" key={i}>
          <div className="l">{k.l}</div>
          <div className="v" style={k.vs}>{k.v}</div>
          {k.s && <div className="s">{k.s}</div>}
        </div>
      ))}
    </div>
  );
}

export function Card({ title, sub, children, style, head }) {
  return (
    <div className="card" style={style}>
      {head}
      {title && <h3>{title}</h3>}
      {sub !== undefined && <div className="sub">{sub || ' '}</div>}
      {children}
    </div>
  );
}

export function Insight({ title, items, style }) {
  return (
    <div className="insight" style={style}>
      <h4>{title}</h4>
      <ul>{items.filter(Boolean).map((x, i) => <li key={i}>{x}</li>)}</ul>
    </div>
  );
}

export function Badge({ k, children }) {
  return <span className={`badge b-${k}`}><i />{children}</span>;
}

export function Tier({ p, a = 'party', children }) {
  const t = tierOf(p, a);
  return <span className={`tier ${t.c}`}>{children ?? t.n}</span>;
}

export function Legend({ items, style }) {
  return (
    <div className="legend" style={style}>
      {items.map(([c, l], i) => <span key={i}><i style={{ background: c }} />{l}</span>)}
    </div>
  );
}

export function RampLegend({ colors, lo, hi, style }) {
  return (
    <div className="legend" style={style}>
      <span>{lo}</span>
      {colors.map(c => <i key={c} style={{ background: c }} />)}
      <span>{hi}</span>
    </div>
  );
}

/* cols: [{h, n (numeric, LTR), f(row) -> node}] */
export function DataTable({ cols, rows, style, wrap = true, rowKey }) {
  const body = rows.length ? (
    <table>
      <thead><tr>{cols.map((c, i) => <th key={i} className={c.n ? 'num' : undefined}>{c.h}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, j) => (
          <tr key={rowKey ? rowKey(r) : j}>
            {cols.map((c, i) => <td key={i} className={c.n ? 'num' : undefined}>{c.f(r)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  ) : <div className="empty">لا توجد بيانات ضمن عوامل التصفية الحالية</div>;
  return wrap ? <div className="tw" style={style}>{body}</div> : body;
}

export function Select({ label, value, onChange, options, id }) {
  return (
    <div className="filters">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
