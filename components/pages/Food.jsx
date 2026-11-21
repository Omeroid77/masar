'use client';
import { useMemo } from 'react';
import { useFilters } from '@/components/Shell';
import { PageHead, Kpis, Card, Insight, DataTable, Badge, RampLegend } from '@/components/ui';
import { LineChart, BarChart } from '@/components/Chart';
import SudanMap from '@/components/SudanMap';
import { fTrips, byMonth, periodMonths, mlabel, sum, groupBy, fmt, fmt1, STATES, GT, FOOD, NODE, SEQ, C } from '@/lib/data';

const FOODSUB = [['حبوب وأعلاف', [137], C.s1], ['سلع جافة وزيوت', [14, 16, 138], C.s2], ['خضروات وفواكه', [171], C.s3], ['مبرّدات وألبان ومشروبات', [15, 122, 142], C.s4]];
const FSEQ = SEQ.slice(2);

export default function Food() {
  const { FP, FS } = useFilters();
  const d = useMemo(() => {
    const tr = fTrips(FP, FS).filter(t => ![2, 5].includes(t.status));
    const items = [];
    for (const t of tr) if (t.dir !== 'export') for (const w of t.wbs) if (FOOD.has(w.gt)) items.push({ t, w });
    const tons = sum(items, x => x.w.weight);
    const per = Object.fromEntries(STATES.map(s => [s.id, 0]));
    for (const x of items) per[x.t.d] += x.w.weight;
    // kg per 1,000 people per month = tonnes x 1e6 / (pop x 1e6) / months  (pop in millions)
    const natPop = sum(STATES, s => s.pop), natPc = tons * 1e6 / (natPop * 1e6) / FP;
    const rows = STATES.map(s => { const pc = per[s.id] * 1e6 / (s.pop * 1e6) / FP; return { s, t: per[s.id], pc, idx: pc / (natPc || 1) }; }).sort((a, b) => a.idx - b.idx);
    const low = rows.filter(r => r.idx < 0.5);
    const kpis = [
      { l: 'المواد الغذائية المنقولة', v: fmt(tons) + ' طن' },
      { l: 'الإمداد لكل 1,000 نسمة', v: fmt(natPc) + ' كجم/شهر', s: 'متوسط وطني، من النقل البري المسجل' },
      { l: 'ولايات بفجوة حادة', v: fmt(low.length), s: 'مؤشر تغطية أقل من 0.5' },
      { l: 'الأدنى تغطية', v: rows[0].s.ar, s: `مؤشر ${fmt1(rows[0].idx)}` },
      { l: 'بوالص غذائية', v: fmt(items.length) },
    ];
    const mxpc = Math.max(...rows.map(r => r.pc)), mxt = Math.max(...rows.map(r => r.t));
    const fcol = v => FSEQ[Math.min(FSEQ.length - 1, Math.floor(v / (mxpc || 1) * FSEQ.length))];
    const bubbles = {};
    for (const r of rows) bubbles[r.s.id] = { r: 5 + 15 * Math.sqrt(r.t / (mxt || 1)), c: fcol(r.pc), o: .95, tip: `<b>${r.s.ar}</b><br>${fmt(r.t)} طن · ${fmt(r.pc)} كجم لكل 1,000 نسمة/شهر<br>مؤشر التغطية: ${fmt1(r.idx)}` };
    const sub = [...groupBy(items, x => x.w.gt)].map(([k, v]) => [GT[k].ar, sum(v, x => x.w.weight)]).sort((a, b) => b[1] - a[1]);
    const trend = FOODSUB.map(([n, ids, c]) => {
      const m = byMonth(items.filter(x => ids.includes(x.w.gt)), x => x.t.createdAt, FP, x => x.w.weight);
      return { label: n, data: m.data.map(Math.round), color: c };
    });
    const flows = [...groupBy(items, x => x.t.from + '>' + x.t.to)].map(([k, v]) => ({ k, o: v[0].t.from, d: v[0].t.to, t: sum(v, x => x.w.weight), n: new Set(v.map(x => x.t.id)).size }))
      .sort((a, b) => b.t - a.t).slice(0, 10);
    const prod = [...groupBy(items, x => x.t.from)].map(([k, v]) => [k, sum(v, x => x.w.weight)]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => NODE[x[0]].ar);
    return { kpis, rows, low, bubbles, sub, trend, flows, prod };
  }, [FP, FS]);

  return (
    <>
      <PageHead title="التوزيع الجغرافي للمواد الغذائية" desc="تتبع حركة الحبوب والسلع الغذائية بين الولايات، ونصيب الفرد من الإمداد البري، ومؤشر التغطية لكل ولاية." />
      <Insight title="ملاحظات" items={[
        <>أكبر مراكز الإنتاج/التوريد للغذاء: <b>{d.prod.join('، ')}</b>.</>,
        d.low.length
          ? <>ولايات بفجوة حادة في وصول الغذاء عبر النقل البري: <b>{d.low.map(r => r.s.ar).join('، ')}</b>، يُوصى بإنشاء مخازن استراتيجية إقليمية وتخصيص ممرات ذات أولوية.</>
          : 'لا توجد فجوات حادة ضمن التصفية الحالية.',
        'انخفاض الحركة في يوليو–سبتمبر (موسم الأمطار) يستدعي تخزيناً مسبقاً في الولايات الطرفية قبل يونيو.',
      ]} />
      <Kpis items={d.kpis} />
      <div className="grid g2" style={{ marginBottom: 14 }}>
        <Card title="خريطة التغطية الغذائية" sub="نصيب الفرد كجم/شهر">
          <SudanMap bubbles={d.bubbles} note="حجم الدائرة = إجمالي الأطنان · لونها = الإمداد لكل 1,000 نسمة (الأغمق أعلى)" />
          <RampLegend colors={FSEQ} lo="أقل" hi="أعلى نصيب للفرد" />
        </Card>
        <Card title="مؤشر التغطية حسب الولاية" sub="نصيب الفرد ÷ المتوسط الوطني">
          <DataTable style={{ maxHeight: 440 }} rows={d.rows} rowKey={r => r.s.id} cols={[
            { h: 'الولاية', f: r => r.s.ar }, { h: 'الأطنان', n: 1, f: r => fmt(r.t) },
            { h: 'كجم/1000 نسمة/شهر', n: 1, f: r => fmt(r.pc) }, { h: 'مؤشر التغطية', n: 1, f: r => fmt1(r.idx) },
            { h: 'التقييم', f: r => r.idx < 0.5 ? <Badge k="crit">فجوة حادة</Badge> : r.idx < 0.8 ? <Badge k="serious">منخفض</Badge> : r.idx < 1.3 ? <Badge k="good">متوازن</Badge> : <Badge k="neutral">مركز توزيع/فائض</Badge> },
          ]} />
        </Card>
      </div>
      <div className="grid g3">
        <Card title="حسب نوع المادة" sub="طن">
          <BarChart labels={d.sub.map(x => x[0])} series={[{ label: 'طن', data: d.sub.map(x => Math.round(x[1])), color: C.s1 }]} />
        </Card>
        <Card title="الاتجاه الشهري حسب الفئة" sub="طن">
          <LineChart labels={periodMonths(FP).map(mlabel)} series={d.trend} y="طن" />
        </Card>
        <Card title="أكبر تدفقات الغذاء" sub="منشأ ← وجهة">
          <DataTable rows={d.flows} rowKey={r => r.k} cols={[
            { h: 'المنشأ', f: r => NODE[r.o].ar }, { h: 'الوجهة', f: r => NODE[r.d].ar },
            { h: 'الرحلات', n: 1, f: r => fmt(r.n) }, { h: 'الأطنان', n: 1, f: r => fmt(r.t) },
          ]} />
        </Card>
      </div>
    </>
  );
}
