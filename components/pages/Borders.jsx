'use client';
import { useMemo, useState } from 'react';
import { useFilters } from '@/components/Shell';
import { PageHead, Kpis, Card, Insight, DataTable, Badge, Legend, Select } from '@/components/ui';
import { LineChart, BarChart } from '@/components/Chart';
import SudanMap from '@/components/SudanMap';
import {
  fTrips, inPeriod, inState, byMonth, periodMonths, mlabel, sum, groupBy, fmt, pct,
  BORDERS, BR, ST, CPS, EDGES, GT, INSPECTIONS, TRIP, COUNTRIES, STATES, TODAY, isOpen, getPath, fuelForKm, C, SERIES,
} from '@/lib/data';

const greyBubbles = Object.fromEntries(STATES.map(s => [s.id, { r: 3.5, c: '#575d59' }]));
const BX_OPTS = BORDERS.map(b => [b.id, `${b.ar} (${b.country})`]);
const isBorderCp = Object.fromEntries(CPS.map(c => [c.id, !!c.border]));

function ClosureSim({ sel, by }) {
  const B = BR[sel], aff = by[sel], alt = BORDERS.filter(x => x.country === B.country && x.id !== B.id);
  if (!aff.length) return <div className="empty">لا توجد رحلات عبر هذا المعبر ضمن عوامل التصفية الحالية</div>;
  const humN = aff.filter(t => t.hum).length;
  if (!alt.length) {
    const st = [...new Set(aff.map(t => ST[t.dir === 'import' ? t.d : t.o].ar))];
    return (
      <>
        <Kpis style={{ margin: 0 }} items={[
          { l: 'رحلات متأثرة', v: fmt(aff.length) },
          { l: 'حمولة متوقفة', v: fmt(sum(aff, t => t.load)) + ' طن' },
          { l: 'بديل بري', v: <Badge k="crit">لا يوجد معبر بديل مع {B.country}</Badge>, vs: { fontSize: 18 } },
        ]} />
        <Insight style={{ margin: '10px 0 0' }} title="الأثر المتوقع" items={[
          <>تتوقف التجارة البرية مع {B.country} بالكامل؛ الولايات الأكثر تأثراً: <b>{st.slice(0, 5).join('، ')}</b>.</>,
          'البديل الوحيد هو النقل عبر ميناء بورتسودان بحراً، بتكلفة وزمن أعلى بكثير.',
          humN ? `تتأثر ${fmt(humN)} شحنة إنسانية، يلزم تنسيق ممر بديل مسبقاً.` : 'يُوصى بخطة طوارئ لتخزين السلع الأساسية في الولايات الحدودية.',
        ]} />
      </>
    );
  }
  // reroute through the nearest same-country crossing: extra km x the fuel formula of the vehicle class
  const a = alt[0];
  let xkm = 0, xl = 0;
  for (const t of aff) {
    const np = t.dir === 'import' ? getPath(a.id, t.to) : getPath(t.from, a.id);
    const dk = np.km - t.km;
    xkm += dk; xl += fuelForKm(t.cls, t.load, dk);
  }
  return (
    <>
      <Kpis style={{ margin: 0 }} items={[
        { l: 'رحلات تُعاد توجيهها', v: fmt(aff.length), s: 'إلى ' + a.ar },
        { l: 'كيلومترات إضافية', v: fmt(xkm), s: `${fmt(xkm / aff.length)} كم لكل رحلة` },
        { l: 'وقود إضافي', v: fmt(xl) + ' لتر' },
        { l: 'شحنات إنسانية متأثرة', v: fmt(humN) },
      ]} />
      <div className="mini" style={{ marginTop: 8 }}>
        المعادلة: الفرق في طول المسار عبر المعبر البديل × معامل استهلاك فئة المركبة (نفس معادلة صفحة الوقود).{' '}
        {a.closed && !isOpen(a, TODAY) && <Badge k="crit">تنبيه: المعبر البديل مغلق حالياً</Badge>}
      </div>
    </>
  );
}

export default function Borders() {
  const { FP, FS } = useFilters();
  const [sel, setSel] = useState('ADR');
  const d = useMemo(() => {
    const all = fTrips(FP, FS);
    const tr = all.filter(t => t.border && t.status !== 2);
    const imp = tr.filter(t => t.dir === 'import'), exp = tr.filter(t => t.dir === 'export');
    const bins = INSPECTIONS.filter(i => isBorderCp[i.cp] && inPeriod(i.ts, FP) && inState(TRIP[i.trip], FS));
    const by = Object.fromEntries(BORDERS.map(b => [b.id, tr.filter(t => t.border === b.id)]));
    const top = BORDERS.slice().sort((a, b) => by[b.id].length - by[a.id].length)[0];
    const avgDur = sum(bins, i => i.dur) / (bins.length || 1);
    const kpis = [
      { l: 'رحلات عابرة للحدود', v: fmt(tr.length), s: pct(tr.length / (all.length || 1)) + ' من إجمالي الرحلات' },
      { l: 'واردات برية', v: fmt(sum(imp, t => t.load)) + ' طن', s: fmt(imp.length) + ' رحلة' },
      { l: 'صادرات برية', v: fmt(sum(exp, t => t.load)) + ' طن', s: fmt(exp.length) + ' رحلة' },
      { l: 'الأكثر نشاطاً', v: top.cap, s: pct(by[top.id].length / (tr.length || 1)) + ' من الحركة الحدودية' },
      { l: 'متوسط زمن الإجراءات', v: fmt(avgDur) + ' دقيقة', s: 'فحص + تخليص في المعبر' },
    ];
    const mxn = Math.max(1, ...BORDERS.map(b => by[b.id].length));
    const borders = {};
    for (const b of BORDERS) borders[b.id] = { r: 5 + 9 * Math.sqrt(by[b.id].length / mxn), tip: `<b>${b.ar}</b><br>${b.country} · ${b.stTxt}<br>${fmt(by[b.id].length)} رحلة · ${fmt(sum(by[b.id], t => t.load))} طن` };
    const eu = {};
    for (const t of tr) for (const e of t.edges) eu[e] = (eu[e] || 0) + 1;
    const mxe = Math.max(1, ...Object.values(eu));
    const edges = {};
    for (const e of EDGES) { const v = eu[e.id] || 0; edges[e.id] = { w: 1.2 + 7 * v / mxe, c: e.border ? C.s2 : '#93c2a8', tip: `${e.name}<br>${fmt(v)} رحلة عابرة للحدود` }; }
    const tons = dir => BORDERS.map(b => Math.round(sum(by[b.id].filter(t => t.dir === dir), t => t.load)));
    const trend = COUNTRIES.map((c, i) => ({ label: c, data: byMonth(tr.filter(t => BR[t.border].country === c), t => t.createdAt, FP).data, color: SERIES[i] }));
    const rows = BORDERS.map(b => {
      const L = by[b.id], ins = bins.filter(i => i.cp === 'BC-' + b.id);
      const g = [...groupBy(L.flatMap(t => t.wbs), w => w.gt)].sort((x, y) => sum(y[1], w => w.weight) - sum(x[1], w => w.weight)).slice(0, 2).map(x => GT[x[0]].ar);
      return {
        b, n: L.length, im: sum(L.filter(t => t.dir === 'import'), t => t.load), ex: sum(L.filter(t => t.dir === 'export'), t => t.load),
        hum: L.filter(t => t.hum).length, dur: sum(ins, i => i.dur) / (ins.length || 1), v: ins.filter(i => i.viol !== null && i.confirmed).length / (ins.length || 1), g,
      };
    });
    const egy = sum(tr.filter(t => BR[t.border].country === 'مصر'), t => t.load) / (sum(tr, t => t.load) || 1);
    return { kpis, by, borders, edges, imp: tons('import'), exp: tons('export'), trend, rows, egy, avgDur };
  }, [FP, FS]);

  return (
    <>
      <PageHead title="المعابر الحدودية البرية" desc="حركة التجارة والمساعدات عبر معابر مصر (أشكيت – قسطل، أرقين)، وإثيوبيا (القلابات)، وجنوب السودان (جودة)، وتشاد (أدري، الطينة)، مع محاكاة أثر إغلاق أي معبر." />
      <Insight title="ملاحظات" items={[
        `مصر هي الشريك البري الأكبر (${pct(d.egy)} من الحمولة الحدودية)، ويتركز معظمها في معبر أشكيت، تأهيل طريق دنقلا–وادي حلفا وتوسعة ساحات الانتظار أولوية.`,
        'معبرا القلابات (إثيوبيا) وجودة (جنوب السودان) بلا بديل بري مع نفس الدولة، أي إغلاق يوقف التجارة كلياً؛ يُقترح مخزون احتياطي في القضارف والنيل الأبيض.',
        'إغلاق أدري منذ فبراير 2026 جعل الطينة المنفذ الوحيد من تشاد بعد إعادة فتحها للمساعدات، بطريق وصول أطول وأكثر تأثراً بالأمطار.',
        `زمن الإجراءات في المعابر (${fmt(d.avgDur)} دقيقة في المتوسط) هو أكبر مصدر تأخير في الرحلات الحدودية؛ الربط الإلكتروني المسبق للبيان مع الجمارك يمكن أن يختصره.`,
      ]} />
      <Kpis items={d.kpis} />
      <div className="grid g2" style={{ marginBottom: 14 }}>
        <Card title="خريطة المعابر وطرق الوصول" sub="حالة التشغيل وفق تقارير منشورة حتى نوفمبر 2026 · الأحجام تجريبية">
          <SudanMap bubbles={greyBubbles} edges={d.edges} borders={d.borders} note="حجم المربع = عدد الرحلات عبر المعبر · لون إطاره = حالة التشغيل · الخطوط الزرقاء = طرق الوصول للمعابر" />
          <Legend items={[[C.good, 'مفتوح'], [C.warn, 'مفتوح جزئياً / يحتاج تحقق'], [C.serious, 'إغلاقات متقطعة'], [C.crit, 'مغلق']]} />
        </Card>
        <div className="grid">
          <Card title="الواردات والصادرات حسب المعبر" sub="طن">
            <BarChart labels={BORDERS.map(b => b.cap)} series={[{ label: 'واردات (طن)', data: d.imp, color: C.s1 }, { label: 'صادرات (طن)', data: d.exp, color: C.s2 }]} />
          </Card>
          <Card title="الرحلات الشهرية حسب الدولة" sub="عدد الرحلات العابرة">
            <LineChart size="short" labels={periodMonths(FP).map(mlabel)} series={d.trend} y="رحلات" />
          </Card>
        </div>
      </div>
      <Card title="سجل المعابر" sub="الحالة، الحجم، زمن الإجراءات، المخالفات" style={{ marginBottom: 14 }}>
        <DataTable rows={d.rows} rowKey={r => r.b.id} cols={[
          { h: 'المعبر', f: r => <b>{r.b.ar}</b> }, { h: 'الدولة', f: r => r.b.country }, { h: 'الولاية', f: r => ST[r.b.state].ar },
          { h: 'حالة التشغيل', f: r => <Badge k={r.b.st}>{r.b.stTxt}</Badge> },
          { h: 'الرحلات', n: 1, f: r => fmt(r.n) }, { h: 'واردات (طن)', n: 1, f: r => fmt(r.im) }, { h: 'صادرات (طن)', n: 1, f: r => fmt(r.ex) },
          { h: 'إنسانية', n: 1, f: r => fmt(r.hum) }, { h: 'زمن الإجراءات', n: 1, f: r => fmt(r.dur) + ' د' }, { h: 'المخالفات', n: 1, f: r => pct(r.v) },
          { h: 'أهم السلع', f: r => <span className="mini">{r.g.join('، ')}</span> },
        ]} />
      </Card>
      <div className="card">
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <div>
            <h3>محاكي أثر إغلاق معبر</h3>
            <div className="sub">إعادة توجيه الرحلات لأقرب معبر مع نفس الدولة، أو توقفها إن لم يوجد بديل</div>
          </div>
          <Select id="bxSel" label="المعبر" value={sel} onChange={setSel} options={BX_OPTS} />
        </div>
        <div style={{ marginTop: 10 }}><ClosureSim sel={sel} by={d.by} /></div>
      </div>
    </>
  );
}
