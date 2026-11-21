'use client';
import { useMemo } from 'react';
import { useFilters } from '@/components/Shell';
import { PageHead, Kpis, Card, Insight, DataTable, Badge, Legend } from '@/components/ui';
import { LineChart, BarChart } from '@/components/Chart';
import SudanMap from '@/components/SudanMap';
import { fTrips, sum, fmt, fmt1, pct, EDGES, STATES, PCI, pciStat, pciColor, C } from '@/lib/data';

const LAW_X = Array.from({ length: 13 }, (_, i) => i + 4); // axle load 4..16 t
const greyBubbles = Object.fromEntries(STATES.map(s => [s.id, { r: 3.5, c: '#575d59' }]));

export default function Roads() {
  const { FP, FS } = useFilters();
  const d = useMemo(() => {
    const tr = fTrips(FP, FS).filter(t => t.status !== 2);
    const agg = {};
    for (const e of EDGES) agg[e.id] = { e, n: 0, heavy: 0, esal: 0, legal: 0, over: 0 };
    for (const t of tr) for (const id of t.edges) {
      const a = agg[id]; a.n++; if (t.cls === 'H' || t.cls === 'T') a.heavy++; a.esal += t.esal; a.legal += t.esalLegal; if (t.over) a.over++;
    }
    const rows = Object.values(agg).map(a => ({ ...a, pci: PCI[a.e.id], perKm: a.esal / a.e.km, share: a.esal ? (a.esal - a.legal) / a.esal : 0 })).sort((a, b) => a.pci - b.pci);
    const tot = sum(rows, r => r.esal), legal = sum(rows, r => r.legal);
    const overTrips = tr.filter(t => t.over).length / (tr.length || 1);
    const kpis = [
      { l: 'محاور التحميل القياسية (ESAL)', v: fmt(tot), s: 'محور قياسي 8.2 طن' },
      { l: 'ضرر ناتج عن الحمولة الزائدة', v: pct((tot - legal) / (tot || 1)), s: `من ${pct(overTrips)} فقط من الرحلات` },
      { l: 'مقاطع تحتاج تدخلاً عاجلاً', v: fmt(rows.filter(r => r.pci < 60).length) + ' / ' + EDGES.length },
      { l: 'أسوأ مقطع', v: fmt(rows[0].pci), s: rows[0].e.name },
      { l: 'الأطوال المرصودة', v: fmt(sum(EDGES, e => e.km)) + ' كم' },
    ];
    const mxPerKm = Math.max(...rows.map(x => x.perKm || 0.0001));
    const edges = {};
    for (const r of rows) edges[r.e.id] = { w: 2.5 + 7 * Math.sqrt(r.perKm / mxPerKm), c: pciColor(r.pci), tip: `<b>${r.e.name}</b><br>مؤشر الحالة PCI: ${r.pci}<br>ESAL: ${fmt(r.esal)} · ${fmt(r.n)} رحلة` };
    const top = [...rows].sort((a, b) => b.esal - a.esal).slice(0, 10);
    return { kpis, rows, edges, top, tot, legal, overTrips };
  }, [FP, FS]);

  return (
    <>
      <PageHead title="إهلاك الطرق وأولويات الصيانة" desc="حساب محاور التحميل القياسية المكافئة (ESAL) لكل رحلة على كل مقطع وفق قانون القوة الرابعة، وربطها بمؤشر حالة الرصف PCI." />
      <Insight title="ملاحظات" items={[
        `وفق قانون القوة الرابعة، محور بحمولة 13 طناً يُحدث ضرراً يعادل ${fmt1(Math.pow(13 / 8.2, 4))} أضعاف المحور القياسي، و16 طناً ≈ ${fmt1(Math.pow(16 / 8.2, 4))} ضعفاً.`,
        <><b>{pct(d.overTrips)}</b> من الرحلات بحمولة زائدة مسؤولة عن <b>{pct((d.tot - d.legal) / (d.tot || 1))}</b> من الضرر الكلي، تطبيق الوزن الإلزامي في نقاط العبور هو أرخص أداة لإطالة عمر الطرق.</>,
        <>أولويات الصيانة للعام القادم: {d.rows.filter(r => r.pci < 60).length
          ? d.rows.filter(r => r.pci < 60).slice(0, 3).map((r, i) => <span key={r.e.id}>{i ? '، ' : ''}<b>{r.e.name}</b></span>)
          : 'لا توجد'}.</>,
      ]} />
      <Kpis items={d.kpis} />
      <div className="grid g2" style={{ marginBottom: 14 }}>
        <Card title="حالة شبكة الطرق القومية" sub="PCI مقدّر من التحميل التراكمي وعمر الطريق">
          <SudanMap bubbles={greyBubbles} edges={d.edges} note="اللون = مؤشر حالة الرصف PCI · السُمك = شدة التحميل لكل كم" />
          <Legend items={[[C.good, 'جيد ≥75'], [C.warn, 'متوسط 60–74'], [C.serious, 'سيئ 45–59'], [C.crit, 'حرج <45']]} />
        </Card>
        <div className="grid">
          <Card title="التحميل على المقاطع (ESAL)" sub="الجزء الإضافي الناتج عن الحمولة الزائدة">
            <BarChart stacked labels={d.top.map(r => r.e.name)} series={[
              { label: 'ضمن الحمولة المرخصة', data: d.top.map(r => Math.round(r.legal)), color: C.s1 },
              { label: 'إضافي بسبب الحمولة الزائدة', data: d.top.map(r => Math.round(r.esal - r.legal)), color: C.s2 },
            ]} />
          </Card>
          <Card title="قانون القوة الرابعة" sub="الضرر النسبي حسب حمولة المحور (المحور القياسي 8.2 طن = 1)">
            <LineChart size="short" labels={LAW_X.map(a => a + ' طن')} series={[{ label: 'معامل الضرر النسبي', data: LAW_X.map(a => +Math.pow(a / 8.2, 4).toFixed(2)), color: C.s1 }]} legend={false} fmtv={v => fmt1(v)} />
          </Card>
        </div>
      </div>
      <Card title="خطة الصيانة المقترحة" sub="مرتبة حسب الحالة">
        <DataTable style={{ maxHeight: 460 }} rows={d.rows} rowKey={r => r.e.id} cols={[
          { h: 'المقطع', f: r => r.e.name }, { h: 'كم', n: 1, f: r => fmt(r.e.km) }, { h: 'الرحلات', n: 1, f: r => fmt(r.n) },
          { h: 'ثقيلة', n: 1, f: r => pct(r.heavy / (r.n || 1)) }, { h: 'ESAL/كم', n: 1, f: r => fmt1(r.perKm) },
          { h: 'ضرر الحمولة الزائدة', n: 1, f: r => pct(r.share) }, { h: 'PCI', n: 1, f: r => r.pci },
          { h: 'الإجراء الموصى به', f: r => { const s = pciStat(r.pci); return <Badge k={s[0]}>{s[1]}</Badge>; } },
          { h: 'السنة المقترحة', n: 1, f: r => r.pci < 60 ? 2027 : r.pci < 75 ? 2028 : 2029 },
        ]} />
      </Card>
    </>
  );
}
