'use client';
import { useMemo, useState } from 'react';
import { useFilters } from '@/components/Shell';
import { PageHead, Kpis, Card, Insight, DataTable, RampLegend, Select } from '@/components/ui';
import { LineChart } from '@/components/Chart';
import { CROSS, CPS, EG, INSPECTIONS, TRIP, inPeriod, inState, sum, fmt, fmt1, pct, seqColor, SEQ, C } from '@/lib/data';

const WD = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const HRS = Array.from({ length: 24 }, (_, i) => i + ':00');
const CP_OPTS = [['ALL', 'كل نقاط العبور'], ...CPS.map(c => [c.id, c.name])];

export default function Traffic() {
  const { FP, FS } = useFilters();
  const [cp, setCp] = useState('ALL');
  const [shift, setShift] = useState(30);

  // base aggregates: depend on filters + checkpoint, not on the slider
  const b = useMemo(() => {
    const cr = CROSS.filter(c => inPeriod(c.ts, FP) && inState(c.trip, FS));
    const scope = cr.filter(c => cp === 'ALL' || c.cp === cp);
    const M = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const c of scope) M[c.ts.getDay()][c.ts.getHours()]++;
    const flat = M.flat(), mxv = Math.max(1, ...flat), mnv = Math.min(...flat);
    const hv = Array(24).fill(0), lt = Array(24).fill(0);
    for (const c of scope) (c.heavy ? hv : lt)[c.ts.getHours()]++;
    const tot0 = hv.map((v, i) => v + lt[i]);
    const order = [...tot0.keys()].sort((a, z) => tot0[z] - tot0[a]);
    const perCp = CPS.map(p => { const a = Array(24).fill(0); for (const c of cr) if (c.cp === p.id) a[c.ts.getHours()]++; return Math.max(...a); });
    const rows = CPS.map(p => {
      const c = cr.filter(x => x.cp === p.id);
      const ins = INSPECTIONS.filter(i => i.cp === p.id && inPeriod(i.ts, FP) && inState(TRIP[i.trip], FS));
      const hh = Array(24).fill(0); for (const x of c) hh[x.ts.getHours()]++;
      return {
        cp: p, n: c.length, ins: ins.length, dur: sum(ins, i => i.dur) / (ins.length || 1),
        v: ins.filter(i => i.viol !== null && i.confirmed).length / (ins.length || 1), pkH: hh.indexOf(Math.max(...hh)),
        heavy: c.filter(x => x.heavy).length / (c.length || 1),
      };
    }).sort((a, z) => z.n - a.n);
    return { M, mxv, mnv, hv, lt, tot0, order, perCp, rows };
  }, [FP, FS, cp]);

  // scenario: shift heavy trucks from the 6 busiest hours to the 6 quietest hours; waiting time via M/M/1
  const s = useMemo(() => {
    const { hv, lt, tot0, order, perCp } = b;
    const peakH = new Set(order.slice(0, 6)), quietH = new Set(order.slice(-6));
    const moved = sum(hv.filter((_, i) => peakH.has(i))) * shift / 100;
    const after = hv.map((v, i) => peakH.has(i) ? v * (1 - shift / 100) : quietH.has(i) ? v + moved / 6 : v);
    const tot1 = after.map((v, i) => v + lt[i]);
    const pk0 = Math.max(...tot0), pk1 = Math.max(...tot1);
    const rho0 = cp === 'ALL' ? 0.88 : 0.88 * pk0 / Math.max(1, ...perCp);
    const rho1 = rho0 * pk1 / (pk0 || 1);
    const wait = r => 5 * r / (1 - Math.min(r, 0.97));
    const hl = set => [...set].sort((a, z) => a - z).map(h => h + ':00').join('، ');
    return { peakH: hl(peakH), quietH: hl(quietH), moved, tot1, cut: (pk0 - pk1) / (pk0 || 1), w0: wait(rho0), w1: wait(rho1) };
  }, [b, shift, cp]);

  return (
    <>
      <PageHead title="خطط توزيع الحركة المرورية" desc="أنماط العبور في نقاط التفتيش حسب اليوم والساعة، ومحاكاة أثر نوافذ زمنية للشاحنات الثقيلة على الذروة وزمن الانتظار.">
        <Select id="trCp" label="نقطة العبور" value={cp} onChange={setCp} options={CP_OPTS} />
      </PageHead>
      <Insight title="مقترحات" items={[
        `أعلى ساعات الذروة: ${b.order.slice(0, 3).map(h => h + ':00').join('، ')}، يُقترح نافذة عبور مخصّصة للشاحنات الثقيلة خارجها.`,
        `أهدأ الساعات المناسبة لتوجيه الشاحنات الثقيلة إليها: ${b.order.slice(-3).map(h => h + ':00').join('، ')}.`,
        `تحويل ${shift}% من الشاحنات الثقيلة يخفض حمل ساعة الذروة بنحو ${pct(s.cut)} وزمن الانتظار من ${fmt1(s.w0)} إلى ${fmt1(s.w1)} دقيقة؛ ويمكن تحفيز الالتزام بنقاط إضافية للناقلين.`,
      ]} />
      <div className="grid g2" style={{ marginBottom: 14 }}>
        <Card title="الخريطة الحرارية للعبور" sub="اليوم × الساعة">
          <div className="hmwrap">
            <div className="hm">
              <div className="hh" />
              {HRS.map((_, i) => <div className="hh" key={'h' + i}>{i % 3 === 0 ? i : ''}</div>)}
              {b.M.map((row, dI) => [
                <div className="hl" key={'l' + dI}>{WD[dI]}</div>,
                ...row.map((v, k) => (
                  <div key={dI + '-' + k} style={{ background: v ? seqColor(v - b.mnv, b.mxv - b.mnv) : '#f1f0ea' }} data-tip={`${WD[dI]} · الساعة ${k}:00<br>${fmt(v)} عبور`} />
                )),
              ])}
            </div>
          </div>
          <RampLegend colors={SEQ} lo="أقل" hi="أعلى كثافة" style={{ marginTop: 8 }} />
        </Card>
        <Card title="الملف الساعي للحركة" sub="حسب فئة المركبة">
          <LineChart labels={HRS} y="عدد العبور" series={[
            { label: 'شاحنات ثقيلة وصهاريج', data: b.hv, color: C.s1 },
            { label: 'مركبات خفيفة ومتوسطة', data: b.lt, color: C.s2 },
          ]} />
        </Card>
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <div>
            <h3>محاكي السيناريو: نوافذ زمنية للشاحنات الثقيلة</h3>
            <div className="sub">تحويل نسبة من الشاحنات الثقيلة من أعلى 6 ساعات ذروة إلى أهدأ 6 ساعات في اليوم</div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <input type="range" min="0" max="70" step="5" value={shift} onChange={e => setShift(+e.target.value)} style={{ width: 200 }} aria-label="نسبة التحويل" />
            <b>{shift}%</b>
          </div>
        </div>
        <div style={{ margin: '10px 0' }}>
          <Kpis style={{ margin: 0 }} items={[
            { l: 'خفض حمل ساعة الذروة', v: pct(s.cut) },
            { l: 'زمن الانتظار في الذروة، الحالي', v: fmt1(s.w0) + ' دقيقة', s: 'نموذج طوابير مبسّط (M/M/1)' },
            { l: 'زمن الانتظار، بعد الخطة', v: fmt1(s.w1) + ' دقيقة' },
            { l: 'شاحنات تُحوَّل', v: fmt(s.moved), s: 'عبور خلال الفترة' },
          ]} />
          <div className="mini" style={{ marginTop: 6 }}>ساعات الذروة: {s.peakH} · الساعات البديلة الأهدأ: {s.quietH}</div>
        </div>
        <LineChart labels={HRS} y="إجمالي العبور" series={[
          { label: 'الوضع الحالي', data: b.tot0.map(Math.round), color: C.s1 },
          { label: 'بعد تطبيق الخطة', data: s.tot1.map(Math.round), color: C.s2, dash: [5, 4] },
        ]} />
      </div>
      <Card title="أداء نقاط العبور" sub="العبور، الفحص، المخالفات">
        <DataTable rows={b.rows} rowKey={r => r.cp.id} cols={[
          { h: 'نقطة العبور', f: r => r.cp.name }, { h: 'الممر', f: r => EG[r.cp.edge].name },
          { h: 'العبور', n: 1, f: r => fmt(r.n) }, { h: 'ثقيلة', n: 1, f: r => pct(r.heavy) },
          { h: 'نسبة الفحص', n: 1, f: r => pct(r.ins / (r.n || 1)) }, { h: 'متوسط الفحص', n: 1, f: r => fmt1(r.dur) + ' د' },
          { h: 'المخالفات', n: 1, f: r => pct(r.v) }, { h: 'ساعة الذروة', n: 1, f: r => r.pkH + ':00' },
        ]} />
      </Card>
    </>
  );
}
