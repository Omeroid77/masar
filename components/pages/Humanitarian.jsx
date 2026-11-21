'use client';
import { useMemo } from 'react';
import { useFilters } from '@/components/Shell';
import { PageHead, Kpis, Card, Insight, DataTable, Badge } from '@/components/ui';
import { LineChart, BarChart } from '@/components/Chart';
import { fTrips, inState, byMonth, sum, groupBy, fmt, fmt1, pct, iso, DAY, TODAY, TRIPS, ST, GT, NODE, CARR, C } from '@/lib/data';

export default function Humanitarian() {
  const { FP, FS } = useFilters();
  const d = useMemo(() => {
    const tr = fTrips(FP, FS).filter(t => t.hum);
    const delivered = tr.filter(t => [3, 4, 6].includes(t.status));
    const ontime = delivered.filter(t => t.delay === 0).length / (delivered.length || 1);
    const transit = sum(delivered, t => (t.actual - t.receivedDate) / DAY) / (delivered.length || 1);
    const lost = tr.filter(t => t.status === 5 || (t.status === 2 && [3, 4].includes(t.cancelReason)));
    const kpis = [
      { l: 'شحنات إنسانية', v: fmt(tr.length), s: `${fmt(sum(tr, t => t.wbs.length))} بوليصة` },
      { l: 'الحمولة', v: fmt(sum(tr, t => t.load)) + ' طن' },
      { l: 'التسليم في الموعد', v: pct(ontime) },
      { l: 'متوسط زمن العبور', v: fmt1(transit) + ' يوم' },
      { l: 'شحنات مفقودة/تالفة/لم تسلم', v: fmt(lost.length), s: pct(lost.length / (tr.length || 1)) + ' من الشحنات' },
    ];
    const dest = [...groupBy(tr, t => t.d)].map(([k, v]) => [ST[k].ar, sum(v, t => t.load)]).sort((a, b) => b[1] - a[1]);
    const trend = byMonth(tr, t => t.createdAt, FP);
    const items = [...groupBy(tr.flatMap(t => t.wbs), w => w.gt)].map(([k, v]) => [GT[k].ar, sum(v, w => w.weight)]).sort((a, b) => b[1] - a[1]);
    const perf = [...groupBy(tr, t => t.d)].map(([k, v]) => {
      const dl = v.filter(t => [3, 4, 6].includes(t.status));
      return {
        s: ST[k], n: v.length, exp: sum(v, t => (t.expected - t.receivedDate) / DAY) / v.length,
        act: dl.length ? sum(dl, t => (t.actual - t.receivedDate) / DAY) / dl.length : null,
        ot: dl.filter(t => t.delay === 0).length / (dl.length || 1),
      };
    }).sort((a, b) => a.ot - b.ot);
    // active shipments past their expected date (not limited by period: still open)
    const late = TRIPS.filter(t => t.hum && t.status === 1 && t.expected < TODAY && inState(t, FS)).sort((a, b) => a.expected - b.expected).slice(0, 12);
    return { kpis, dest, trend, items, perf, late, lost, viaBorder: tr.filter(t => t.border).length };
  }, [FP, FS]);

  return (
    <>
      <PageHead title="حركة المساعدات الإنسانية" desc="متابعة الشحنات الإغاثية من المصدر إلى مراكز التوزيع: الأزمنة، التأخير، الفاقد، والممرات الأبطأ." />
      <Insight title="ملاحظات" items={[
        <>أبطأ الوجهات أداءً: <b>{d.perf.slice(0, 3).map(r => r.s.ar).join('، ')}</b>، يُوصى بتنسيق مرافقة/أولوية عبور في نقاط التفتيش لهذه الشحنات (المسار الأخضر الإنساني).</>,
        `الشحنات المفقودة أو التالفة أو غير المسلمة: ${fmt(d.lost.length)}، تُربط آلياً بأسباب الإلغاء (تلف، سرقة) من خدمة Cancel Waybill لتحديد الممرات عالية المخاطر.`,
        `شحنات إنسانية دخلت عبر معابر تشاد (أدري/الطينة): ${fmt(d.viaBorder)}، إغلاق أدري منذ فبراير 2026 حوّل الإمداد إلى الطينة بعد إعادة فتحها، أو إلى الممر الداخلي الأطول من بورتسودان.`,
        'تتبع كل شحنة إنسانية لحظياً عبر عمليات المسح في نقاط العبور (تطبيق المفتش) يعطي صورة حيّة لموقع المساعدات.',
      ]} />
      <Kpis items={d.kpis} />
      <div className="grid g3" style={{ marginBottom: 14 }}>
        <Card title="الحمولة حسب الولاية المستفيدة" sub="طن">
          <BarChart size="tall" labels={d.dest.map(x => x[0])} series={[{ label: 'طن', data: d.dest.map(x => Math.round(x[1])), color: C.s1 }]} />
        </Card>
        <Card title="الشحنات شهرياً" sub="عدد الرحلات الإنسانية">
          <LineChart size="tall" labels={d.trend.labels} series={[{ label: 'الشحنات', data: d.trend.data, color: C.s1 }]} legend={false} />
        </Card>
        <Card title="نوع المساعدات" sub="طن">
          <BarChart size="tall" labels={d.items.map(x => x[0])} series={[{ label: 'طن', data: d.items.map(x => Math.round(x[1])), color: C.s1 }]} />
        </Card>
      </div>
      <div className="grid g2">
        <Card title="أداء الممرات الإنسانية" sub="زمن العبور المتوقع مقابل الفعلي">
          <DataTable rows={d.perf} rowKey={r => r.s.id} cols={[
            { h: 'الوجهة', f: r => r.s.ar }, { h: 'الشحنات', n: 1, f: r => fmt(r.n) },
            { h: 'المتوقع (يوم)', n: 1, f: r => fmt1(r.exp) }, { h: 'الفعلي (يوم)', n: 1, f: r => r.act == null ? '·' : fmt1(r.act) },
            { h: 'في الموعد', n: 1, f: r => pct(r.ot) },
            { h: 'الأداء', f: r => r.ot < 0.5 ? <Badge k="crit">حرج</Badge> : r.ot < 0.7 ? <Badge k="serious">بطيء</Badge> : <Badge k="good">جيد</Badge> },
          ]} />
        </Card>
        <Card title="شحنات نشطة تجاوزت موعدها" sub="تتطلب متابعة فورية">
          <DataTable rows={d.late} rowKey={r => r.id} cols={[
            { h: 'رقم الرحلة', f: r => '#' + r.id }, { h: 'من', f: r => NODE[r.from].cap }, { h: 'إلى', f: r => NODE[r.to].cap },
            { h: 'الناقل', f: r => CARR[r.carrier].name }, { h: 'الموعد المتوقع', n: 1, f: r => iso(r.expected) },
            { h: 'التأخير', f: r => <Badge k="serious">{Math.ceil((TODAY - r.expected) / DAY)} يوم</Badge> },
          ]} />
        </Card>
      </div>
    </>
  );
}
