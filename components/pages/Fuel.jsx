'use client';
import { useMemo } from 'react';
import { useFilters } from '@/components/Shell';
import { PageHead, Kpis, Card, Insight, DataTable, Badge } from '@/components/ui';
import { LineChart, BarChart } from '@/components/Chart';
import { fTrips, byMonth, sum, fmt, fmt1, pct, VCLASS, EG, STATES, GT, C } from '@/lib/data';

export default function Fuel() {
  const { FP, FS } = useFilters();
  const d = useMemo(() => {
    const tr = fTrips(FP, FS).filter(t => t.status !== 2);
    const fuel = sum(tr, t => t.fuel), tkm = sum(tr, t => t.load * t.km), empty = sum(tr, t => t.km * VCLASS[t.cls].base * 0.62 / 100);
    const kpis = [
      { l: 'إجمالي الوقود (تقديري)', v: fmt1(fuel / 1e6) + ' مليون لتر' },
      { l: 'انبعاثات CO₂', v: fmt(fuel * 2.68 / 1000) + ' طن', s: '2.68 كجم لكل لتر ديزل' },
      { l: 'الكفاءة', v: fmt1(fuel / (tkm || 1) * 100) + ' لتر', s: 'لكل 100 طن·كم' },
      { l: 'وقود رحلات العودة الفارغة', v: pct(empty / (fuel || 1)), s: `${fmt1(empty / 1e6)} مليون لتر` },
      { l: 'متوسط الرحلة', v: fmt(fuel / (tr.length || 1)) + ' لتر' },
    ];
    const trend = byMonth(tr, t => t.createdAt, FP, t => t.fuel / 1000);
    const byC = Object.keys(VCLASS).map(k => [VCLASS[k].ar, sum(tr.filter(t => t.cls === k), t => t.fuel) / 1000]);
    const fe = {};
    for (const t of tr) for (const e of t.edges) fe[e] = (fe[e] || 0) + t.fuel * EG[e].km / t.km;
    const top = Object.entries(fe).sort((a, b) => b[1] - a[1]).slice(0, 10);
    // fuel supply (petroleum waybills into the state, t -> litres at 1190 L/t) vs transport demand from it
    const rows = STATES.filter(s => FS === 'ALL' || s.id === FS).map(s => {
      const sup = sum(tr.filter(t => t.d === s.id && t.dir !== 'export'), t => sum(t.wbs.filter(w => GT[w.gt].p === 10), w => w.weight)) * 1190;
      const dem = sum(tr.filter(t => t.o === s.id), t => t.fuel);
      return { s, sup, dem, r: s.id === 'RSE' ? Infinity : sup / (dem || 1) };
    }).sort((a, b) => a.r - b.r);
    const heavy = sum(tr.filter(t => t.cls === 'H' || t.cls === 'T'), t => t.fuel) / (fuel || 1);
    const lows = rows.filter(r => r.r < 0.5).map(r => r.s.ar).slice(0, 4);
    return { kpis, trend, byC, top, rows, heavy, lows, fuel, empty };
  }, [FP, FS]);

  return (
    <>
      <PageHead title="استهلاك الوقود في قطاع النقل" desc="تقدير الاستهلاك لكل رحلة من المسافة الفعلية على الشبكة × معامل استهلاك فئة المركبة × الحمولة، مع رحلة العودة." />
      <Insight title="ملاحظات وتوصيات" items={[
        <>الشاحنات الثقيلة والصهاريج تستهلك <b>{pct(d.heavy)}</b> من وقود النقل؛ تحسين كفاءتها (صيانة دورية، ضبط الحمولة) هو الرافعة الأكبر.</>,
        <>نحو <b>{pct(d.empty / (d.fuel || 1))}</b> من الوقود يُحرق في رحلات عودة فارغة، تفعيل ميزة &quot;مطابقة حمولة العودة&quot; بين شركات النقل ومكاتب الشحن قد يوفّر حتى {fmt1(d.empty * 0.3 / 1e6)} مليون لتر (بافتراض 30%).</>,
        d.lows.length
          ? <>ولايات بعجز حاد في إمداد الوقود مقارنة بطلب النقل: <b>{d.lows.join('، ')}</b>، يُقترح جدولة قوافل صهاريج وتوسيع سعة التخزين المحلية.</>
          : 'لا توجد ولايات بعجز حاد ضمن التصفية الحالية.',
      ]} />
      <Kpis items={d.kpis} />
      <div className="grid g2" style={{ marginBottom: 14 }}>
        <Card title="الاستهلاك الشهري" sub="ألف لتر">
          <LineChart labels={d.trend.labels} series={[{ label: 'الوقود (ألف لتر)', data: d.trend.data.map(Math.round), color: C.s1 }]} legend={false} />
        </Card>
        <Card title="حسب فئة المركبة" sub="ألف لتر">
          <BarChart labels={d.byC.map(x => x[0])} series={[{ label: 'الوقود (ألف لتر)', data: d.byC.map(x => Math.round(x[1])), color: C.s1 }]} />
        </Card>
      </div>
      <div className="grid g2">
        <Card title="أعلى الممرات استهلاكاً للوقود" sub="ألف لتر، موزّعة على المقاطع حسب الطول">
          <BarChart size="tall" labels={d.top.map(x => EG[x[0]].name)} series={[{ label: 'الوقود (ألف لتر)', data: d.top.map(x => Math.round(x[1] / 1000)), color: C.s1 }]} />
        </Card>
        <Card title="توازن إمداد الوقود مع طلب النقل" sub="شحنات المنتجات البترولية الواردة مقابل استهلاك الرحلات المنطلقة من الولاية">
          <DataTable rows={d.rows} rowKey={r => r.s.id} cols={[
            { h: 'الولاية', f: r => r.s.ar },
            { h: 'إمداد وقود وارد (لتر)', n: 1, f: r => r.s.id === 'RSE' ? 'مصدر (ميناء)' : fmt(r.sup) },
            { h: 'طلب النقل المنطلق منها (لتر)', n: 1, f: r => fmt(r.dem) },
            { h: 'نسبة التغطية', n: 1, f: r => r.s.id === 'RSE' ? '·' : fmt1(r.r) + '×' },
            { h: 'الحالة', f: r => r.s.id === 'RSE' ? <Badge k="neutral">مصدر</Badge> : r.r < 0.5 ? <Badge k="crit">عجز حاد</Badge> : r.r < 1 ? <Badge k="serious">عجز</Badge> : <Badge k="good">مغطّى</Badge> },
          ]} />
        </Card>
      </div>
    </>
  );
}
