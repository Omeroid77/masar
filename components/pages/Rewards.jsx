'use client';
import { useMemo, useState } from 'react';
import { PageHead, Card, DataTable, Tier } from '@/components/ui';
import { BarChart } from '@/components/Chart';
import { INSPECTORS, INSPECTIONS, CPS, CARRIERS, TRIPS, VEH, FORWARDERS, WAYBILLS, PTS, RULES, tiers, tierOf, sum, fmt, C } from '@/lib/data';
import { REWARDS } from '@/lib/rewards';

const SEGS = [['insp', 'المفتشون'], ['co', 'شركات النقل'], ['own', 'ملاك المركبات'], ['ff', 'مكاتب الشحن']];
const AUD = { insp: 'insp', co: 'party', own: 'own', ff: 'ff' };
const cpName = Object.fromEntries(CPS.map(c => [c.id, c.name]));

function board(lb) {
  let rows, cols;
  if (lb === 'insp') {
    rows = INSPECTORS.map(i => {
      const mine = INSPECTIONS.filter(x => x.insp === i.id);
      return { id: i.id, name: i.name, sub: cpName[i.cp], p: PTS[i.id]?.pts || 0, m: mine.length, v: mine.filter(x => x.viol !== null && x.confirmed).length };
    });
    cols = [{ h: 'نقطة العبور', f: r => r.sub }, { h: 'عمليات الفحص', n: 1, f: r => fmt(r.m) }, { h: 'مخالفات مؤكدة', n: 1, f: r => fmt(r.v) }];
  } else if (lb === 'co' || lb === 'own') {
    const typ = lb === 'co' ? 'COMPANY' : 'INDIVIDUAL';
    rows = CARRIERS.filter(c => c.type === typ).map(c => {
      const ts = TRIPS.filter(t => t.carrier === c.id);
      return { id: c.id, name: c.name, p: PTS[c.id]?.pts || 0, m: ts.length, w: sum(ts, t => t.wbs.length), fl: VEH.filter(v => v.owner === c.id).length };
    });
    cols = [{ h: 'المركبات', n: 1, f: r => fmt(r.fl) }, { h: 'الرحلات', n: 1, f: r => fmt(r.m) }, { h: 'البوالص', n: 1, f: r => fmt(r.w) }];
  } else {
    rows = FORWARDERS.map(f => ({ id: f.id, name: f.name, p: PTS[f.id]?.pts || 0, m: WAYBILLS.filter(w => w.ff === f.id).length }));
    cols = [{ h: 'البوالص الصادرة', n: 1, f: r => fmt(r.m) }];
  }
  rows.sort((a, b) => b.p - a.p);
  rows.forEach((r, i) => { r.rank = i + 1; });
  return { rows, cols };
}

const RuleTable = ({ list }) => (
  <table><tbody>{list.map(r => (
    <tr key={r[0]}><td>{r[0]}</td><td className="num"><b style={{ color: r[1] < 0 ? '#8f1f1f' : '#0a5d0a' }}>{r[1] > 0 ? '+' : ''}{r[1]}</b></td></tr>
  ))}</tbody></table>
);
const Catalogue = ({ list }) => (
  <div className="rw">{list.map(r => (
    <div className="rcard" key={r[0]}><b>{r[0]}</b><div className="mini">{r[2] || ' '}</div><div className="c">{fmt(r[1])} نقطة</div></div>
  ))}</div>
);

export default function Rewards() {
  const [lb, setLb] = useState('insp');
  const aud = AUD[lb];
  const { rows, cols } = useMemo(() => board(lb), [lb]);
  const ladder = tiers(aud).slice().reverse();
  const counts = ladder.map(t => [t.n, rows.filter(r => tierOf(r.p, aud).n === t.n).length]);

  return (
    <>
      <PageHead title="برنامج النقاط والمكافآت" desc="حوافز قابلة للقياس للمفتشين، وشركات النقل، وملاك المركبات، ومكاتب الشحن، مرتبطة بالامتثال والدقة لا بالكمّ وحده." />
      <div className="grid g32" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="row" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
            <h3>لوحة الصدارة</h3>
            <div className="seg">
              {SEGS.map(([k, l]) => <button key={k} className={lb === k ? 'on' : undefined} onClick={() => setLb(k)}>{l}</button>)}
            </div>
          </div>
          <DataTable style={{ maxHeight: 430 }} rows={rows.slice(0, 25)} rowKey={r => r.id} cols={[
            { h: '#', n: 1, f: r => r.rank <= 3 ? <b>{r.rank}</b> : r.rank }, { h: 'الاسم', f: r => r.name }, ...cols,
            { h: 'النقاط', n: 1, f: r => <b>{fmt(r.p)}</b> }, { h: 'المستوى', f: r => <Tier p={r.p} a={aud} /> },
          ]} />
        </div>
        <div className="grid">
          <Card title="التوزيع على المستويات" sub={ladder.map(t => t.n + ' ' + fmt(t.min)).join(' · ')}>
            <BarChart size="short" horizontal={false} labels={counts.map(x => x[0])} series={[{ label: 'العدد', data: counts.map(x => x[1]), color: C.s1 }]} />
          </Card>
          <div className="insight" style={{ margin: 0 }}>
            <h4>ضوابط الحوكمة ومنع التلاعب</h4>
            <ul>
              <li>نقاط المخالفة للمفتش لا تُعتمد إلا بعد انقضاء فترة اعتراض الناقل (72 ساعة)، وتُخصم 15 نقطة عن كل مخالفة تُلغى، حتى لا يتحول الحافز إلى ضغط على السائقين.</li>
              <li>سقف يومي للنقاط لكل مفتش، وتدقيق عشوائي لـ 5% من عمليات الفحص مقارنةً بالصور وقراءات الميزان.</li>
              <li>الفحص مرتبط بموقع نقطة العبور وتوقيت مرور الرحلة المسجل؛ أي فحص خارج النطاق لا يُحتسب.</li>
              <li>معايرة نقاط المفتشين وفق حجم الحركة في كل نقطة عبور، حتى لا تُكافأ النقاط المزدحمة على حساب جودة الفحص.</li>
              <li>كل عملية نقاط تُسجَّل كحدث غير قابل للتعديل (سجل تدقيق) في المنصة.</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="grid g3" style={{ marginBottom: 14 }}>
        <Card title="قواعد نقاط المفتشين" sub="لكل عملية"><RuleTable list={RULES.insp} /></Card>
        <Card title="قواعد نقاط شركات النقل وملاك المركبات" sub="لكل رحلة/بوليصة/فحص"><RuleTable list={RULES.carrier} /></Card>
        <Card title="قواعد نقاط مكاتب الشحن" sub="لكل بوليصة"><RuleTable list={RULES.ff} /></Card>
      </div>
      <Card title="كتالوج المكافآت، شركات النقل وملاك المركبات" sub="" style={{ marginBottom: 14 }}><Catalogue list={REWARDS.carrier} /></Card>
      <div className="grid g2">
        <Card title="مكافآت المفتشين" sub=""><Catalogue list={REWARDS.insp} /></Card>
        <Card title="مكافآت مكاتب الشحن" sub=""><Catalogue list={REWARDS.ff} /></Card>
      </div>
    </>
  );
}
