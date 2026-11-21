'use client';
import { useMemo } from 'react';
import { useFilters } from '@/components/Shell';
import { PageHead, Kpis, Card, Insight, DataTable } from '@/components/ui';
import { LineChart, BarChart } from '@/components/Chart';
import SudanMap from '@/components/SudanMap';
import { fTrips, byMonth, sum, groupBy, fmt, fmt1, pct, STATUS, STATES, EDGES, EG, NODE, C } from '@/lib/data';

export default function Overview() {
  const { FP, FS } = useFilters();
  const d = useMemo(() => {
    const tr = fTrips(FP, FS), ok = tr.filter(t => t.status !== 2);
    const wbs = sum(tr, t => t.wbs.length), tons = sum(ok, t => t.load), tkm = sum(ok, t => t.load * t.km), fuel = sum(ok, t => t.fuel);
    const done = tr.filter(t => [3, 4].includes(t.status)), ontime = done.filter(t => t.delay === 0).length / (done.length || 1);
    const kpis = [
      { l: 'الرحلات المسجلة', v: fmt(tr.length), s: `${fmt(tr.filter(t => t.status === 1).length)} رحلة نشطة الآن` },
      { l: 'بوالص الشحن', v: fmt(wbs), s: `${fmt1(wbs / (tr.length || 1))} بوليصة لكل رحلة` },
      { l: 'الحمولة المنقولة', v: fmt(tons / 1000) + ' ألف طن', s: `${fmt(tkm / 1e6)} مليون طن·كم` },
      { l: 'الوقود المستهلك (تقديري)', v: fmt1(fuel / 1e6) + ' مليون لتر', s: 'ديزل، شامل رحلة العودة' },
      { l: 'الإغلاق في الموعد', v: pct(ontime), s: 'من الرحلات المكتملة' },
      { l: 'رحلات بحمولة زائدة', v: pct(ok.filter(t => t.over).length / (ok.length || 1)), s: 'تتجاوز الحمولة المرخصة' },
    ];
    const trend = byMonth(tr, t => t.createdAt, FP);
    const groups = [...groupBy(ok, t => t.group)].map(([k, v]) => [k, sum(v, t => t.load)]).sort((a, b) => b[1] - a[1]);
    const status = [1, 3, 4, 6, 5, 2].map(s => [STATUS[s], tr.filter(t => t.status === s).length]);

    const inb = Object.fromEntries(STATES.map(s => [s.id, 0]));
    for (const t of ok) if (t.dir !== 'export') inb[t.d] += t.load;
    const mxv = Math.max(...Object.values(inb));
    const eu = {};
    for (const t of ok) for (const e of t.edges) eu[e] = (eu[e] || 0) + 1;
    const mxe = Math.max(1, ...Object.values(eu));
    const edges = {};
    for (const e of EDGES) { const v = eu[e.id] || 0; edges[e.id] = { w: 1.5 + 8 * v / mxe, c: '#93c2a8', tip: `${e.name}<br>${fmt(v)} رحلة · ${e.km} كم` }; }
    const bubbles = {};
    for (const s of STATES) bubbles[s.id] = { r: 4 + 16 * Math.sqrt(inb[s.id] / (mxv || 1)), c: C.s1, o: .88, tip: `<b>${s.ar}</b><br>حمولة واردة: ${fmt(inb[s.id])} طن` };

    const od = [...groupBy(ok, t => t.from + '>' + t.to)].map(([k, v]) => ({ k, o: v[0].from, d: v[0].to, n: v.length, t: sum(v, x => x.load), km: v[0].km }))
      .sort((a, b) => b.t - a.t).slice(0, 10);
    const port = sum(ok.filter(t => t.o === 'RSE'), t => t.load) / (tons || 1);
    const topE = Object.entries(eu).sort((a, b) => b[1] - a[1])[0];
    const borderShare = ok.filter(t => t.border).length / (ok.length || 1);
    return { kpis, trend, groups, status, edges, bubbles, od, port, topE, ontime, borderShare };
  }, [FP, FS]);

  return (
    <>
      <PageHead title="لوحة القيادة الوطنية للنقل البري" desc="الرحلات وبوالص الشحن المسجلة على مستوى الولايات، مع حركة الممرات القومية ونقاط العبور." />
      <Insight title="أبرز الملاحظات" items={[
        <>ميناء بورتسودان مصدر <b>{pct(d.port)}</b> من الحمولة المنقولة، أي تعطّل في ممري (عطبرة–هيا) و(كسلا–هيا) ينعكس مباشرة على الإمداد الوطني.</>,
        d.topE && <>الممر الأكثر استخداماً: <b>{EG[d.topE[0]].name}</b> بعدد {fmt(d.topE[1])} رحلة؛ يُوصى بإدراجه أولاً في خطط الصيانة والمراقبة.</>,
        `الرحلات العابرة للحدود تمثل ${pct(d.borderShare)} من الرحلات، ومعبر أشكيت هو البوابة البرية الأكبر للتجارة مع مصر، التفاصيل في صفحة المعابر الحدودية.`,
        `نسبة الإغلاق في الموعد ${pct(d.ontime)}؛ رفعها 10 نقاط يقلّل زمن دوران الأسطول ويخفض الطلب على الوقود.`,
      ]} />
      <Kpis items={d.kpis} />
      <div className="grid g23" style={{ marginBottom: 14 }}>
        <Card title="الحمولة الواردة وحركة الممرات" sub="حسب الولاية والممر">
          <SudanMap bubbles={d.bubbles} edges={d.edges} note="حجم الدائرة = الحمولة الواردة للولاية · سُمك الخط = عدد الرحلات على الممر · ◆ نقاط العبور الداخلية · ■ المعابر الحدودية (لون الإطار = حالة التشغيل)" />
        </Card>
        <div className="grid">
          <Card title="الرحلات الشهرية" sub="عدد الرحلات المسجلة">
            <LineChart size="short" labels={d.trend.labels} series={[{ label: 'الرحلات', data: d.trend.data, color: C.s1 }]} legend={false} />
          </Card>
          <Card title="الحمولة حسب فئة البضاعة" sub="بالطن">
            <BarChart size="short" labels={d.groups.map(x => x[0])} series={[{ label: 'الحمولة (طن)', data: d.groups.map(x => Math.round(x[1])), color: C.s1 }]} />
          </Card>
        </div>
      </div>
      <div className="grid g2">
        <Card title="أعلى 10 ممرات (منشأ ← وجهة)" sub="حسب الحمولة">
          <DataTable rows={d.od} rowKey={r => r.k} cols={[
            { h: 'من', f: r => NODE[r.o].ar }, { h: 'إلى', f: r => NODE[r.d].ar },
            { h: 'الرحلات', n: 1, f: r => fmt(r.n) }, { h: 'الحمولة (طن)', n: 1, f: r => fmt(r.t) }, { h: 'المسافة (كم)', n: 1, f: r => fmt(r.km) },
          ]} />
        </Card>
        <Card title="حالة الرحلات" sub="عدد الرحلات حسب الحالة">
          <BarChart labels={d.status.map(x => x[0])} series={[{ label: 'عدد الرحلات', data: d.status.map(x => x[1]), color: C.s1 }]} />
        </Card>
      </div>
    </>
  );
}
