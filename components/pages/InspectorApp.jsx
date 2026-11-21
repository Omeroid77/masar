'use client';
import { useRef, useState } from 'react';
import { useToast } from '@/components/Shell';
import { PageHead, Card, Badge, Tier } from '@/components/ui';
import {
  INSPECTORS, INSP, CPS, EG, ACTIVE, TRIP, VEHM, CARR, FFM, NODE, BR, VCLASS, STATUS, PLATE, UNITS, GT, VIOL, INSPECTIONS,
  PTS, RULES, tierOf, nextTier, audOf, plateStr, pick, sum, fmt, fmt1, pct, iso, inspSeq,
} from '@/lib/data';
import { REWARDS } from '@/lib/rewards';

const ICON = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  scan: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10',
  points: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  hist: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
};
const Ico = ({ k, s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ICON[k]} /></svg>
);
const TABS = [['home', 'الرئيسية'], ['scan', 'مسح'], ['points', 'نقاطي'], ['hist', 'السجل']];
const CHECKS = (dang, bx) => [
  ...(bx ? [['customs', 'مطابقة البيان الجمركي ووثائق المنشأ']] : []),
  ['plate', 'مطابقة لوحة المركبة للبوليصة'], ['driver', 'هوية السائق صالحة ومطابقة'],
  ['goods', 'البضاعة مطابقة لنوع وكمية البوليصة'], ['seal', 'الأختام والتغطية سليمة'],
  ...(dang ? [['dang', 'لوحات ورمز المواد الخطرة']] : []),
];
const mask = s => '•'.repeat(Math.max(0, s.length - 4)) + s.slice(-4);
const Plate = ({ v }) => <span className="plate"><span>{PLATE[v.plateTypeId]}</span><span>{plateStr(v)}</span></span>;
const Stat = ({ v, l }) => (
  <div className="acard" style={{ flex: 1, margin: 0, textAlign: 'center' }}><div style={{ fontSize: 20, fontWeight: 700 }}>{v}</div><div className="mini">{l}</div></div>
);
const cpOf = id => CPS.find(c => c.id === INSP[id].cp);
function expectedTrips(id) {
  const cp = cpOf(id);
  const l = ACTIVE.filter(t => t.edges.includes(cp.edge));
  return (l.length ? l : ACTIVE).slice(-6).reverse();
}

export default function InspectorApp() {
  const toast = useToast();
  const [screen, setScreen] = useState('login');
  const [tab, setTab] = useState('home');
  const [insp, setInsp] = useState(INSPECTORS[0].id);
  const [loginSel, setLoginSel] = useState(INSPECTORS[0].id);
  const [tripId, setTripId] = useState(null);
  const [checks, setChecks] = useState({});
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(false);
  const [t0, setT0] = useState(0);
  const [session, setSession] = useState([]);
  const [pending, setPending] = useState(0);
  const [redeemed, setRedeemed] = useState(0);
  const [events, setEvents] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState('');
  const evSeq = useRef(0);

  const points = (PTS[insp]?.pts || 0) + sum(session, s => s.earned) - redeemed;
  const emit = (topic, payload) => setEvents(ev => [{ id: ++evSeq.current, topic, ts: new Date().toLocaleTimeString('en-GB'), payload }, ...ev].slice(0, 8));
  const go = k => { setTab(k); setScreen(k); };
  const cp = cpOf(insp);

  const openTrip = id => {
    if (!TRIP[id]) { toast('لم يتم العثور على الرحلة'); return; }
    setTripId(id); setScreen('trip');
    emit('trip.verified', { tripId: id, checkpointId: cp.id, status: STATUS[TRIP[id].status], waybills: TRIP[id].wbs.map(w => w.id) });
  };
  const simScan = () => {
    const t = pick(expectedTrips(insp));
    setScanning(true);
    setTimeout(() => { setScanning(false); openTrip(t.id); }, 900);
  };
  const startCheck = () => { setChecks({}); setWeight(''); setNote(''); setPhoto(false); setT0(Date.now()); setScreen('check'); };
  const submitCheck = () => {
    const t = TRIP[tripId], vc = VCLASS[t.cls], legal = vc.tare + vc.cap, gw = parseFloat(weight);
    const fails = Object.entries(checks).filter(([, v]) => v === false).map(([k]) => k);
    if (gw > legal * 1.05) fails.push('weight');
    const mins = (Date.now() - t0) / 60000;
    const lines = [['إتمام فحص موثق', 10]];
    if (mins <= 5) lines.push(['إنجاز خلال 5 دقائق', 5]);
    if (photo) lines.push(['إرفاق صورة', 3]);
    let pendingPts = 0;
    if (fails.length) { lines.push(['مخالفة موثقة (تُعتمد بعد فترة الاعتراض)', 20, true]); pendingPts = 20; setPending(p => p + 1); }
    const earned = sum(lines.filter(l => !l[2]), l => l[1]);
    setSession(s => [{ trip: t.id, viol: fails.length > 0, fails, earned, pendingPts, lines }, ...s]);
    emit('inspection.completed', {
      inspectionId: 'INS-' + (inspSeq + session.length + 1), tripId: t.id, checkpointId: cp.id, inspectorId: insp,
      result: fails.length ? 'VIOLATION' : 'PASS', findings: fails, measuredGrossWeightT: gw, durationMin: +mins.toFixed(1), photoAttached: photo,
    });
    emit('points.awarded', { partyId: insp, partyType: 'INSPECTOR', points: earned, pending: pendingPts, reason: 'INSPECTION' });
    emit('points.awarded', {
      partyId: t.carrier, partyType: CARR[t.carrier].type === 'COMPANY' ? 'CARRIER' : 'VEHICLE_OWNER',
      points: fails.length ? -20 : 3, pending: fails.length > 0, reason: fails.length ? 'VIOLATION' : 'CLEAN_INSPECTION',
    });
    setScreen('result');
  };
  const redeem = i => {
    const rw = REWARDS.insp[i];
    if (points < rw[1]) return;
    setRedeemed(r => r + rw[1]);
    emit('rewards.redeemed', { partyId: insp, reward: rw[0], points: -rw[1] });
    toast('تم تقديم طلب الاستبدال: ' + rw[0]);
  };

  const head = { title: INSP[insp].name, sub: cp.name + ' · ' + EG[cp.edge].name };
  let view = null, hdr = head, tabs = true;

  if (screen === 'login') {
    tabs = false; hdr = null;
    view = (
      <>
        <div style={{ textAlign: 'center', margin: '26px 0 18px' }}>
          <div className="logo" style={{ margin: 'auto', width: 64, height: 64, borderRadius: 18, background: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M4 19c4-1 5-5 8-7s6-2 8-7" /></svg>
          </div>
          <h3 style={{ margin: '12px 0 2px' }}>مسار، تطبيق المفتش</h3>
          <div className="mini">نقاط العبور والتفتيش</div>
        </div>
        <div className="acard">
          <label className="mini" htmlFor="lgI">المفتش (للعرض)</label>
          <select id="lgI" style={{ width: '100%', margin: '4px 0 10px' }} value={loginSel} onChange={e => setLoginSel(e.target.value)}>
            {CPS.map(c => (
              <optgroup key={c.id} label={c.name}>
                {INSPECTORS.filter(i => i.cp === c.id).map(i => <option key={i.id} value={i.id}>{i.name}، {i.rankName}</option>)}
              </optgroup>
            ))}
          </select>
          <label className="mini">الرقم الوظيفي</label>
          <input type="text" value={loginSel} style={{ width: '100%', margin: '4px 0 10px' }} readOnly />
          <label className="mini">رمز الدخول</label>
          <input type="text" value="••••••" style={{ width: '100%', marginTop: 4 }} readOnly />
        </div>
        <button className="bigbtn" onClick={() => {
          setInsp(loginSel); setScreen('home'); setTab('home');
          emit('auth.login', { inspectorId: loginSel, checkpointId: cpOf(loginSel).id });
        }}>تسجيل الدخول</button>
        <div className="mini" style={{ textAlign: 'center', marginTop: 10 }}>يعمل دون اتصال ويُزامن تلقائياً عند توفر الشبكة</div>
      </>
    );
  } else if (screen === 'home') {
    const cur = tierOf(points, 'insp'), nt = nextTier(points, 'insp');
    view = (
      <>
        <div className="acard">
          <div className="row"><div><div className="mini">رصيد النقاط</div><div style={{ fontSize: 28, fontWeight: 700 }}>{fmt(points)}</div></div><Tier p={points} a="insp" /></div>
          {nt ? (
            <>
              <div className="prog" style={{ margin: '8px 0 4px' }}><i style={{ width: Math.min(100, (points - cur.min) / (nt.min - cur.min) * 100) + '%' }} /></div>
              <div className="mini">{fmt(nt.min - points)} نقطة للوصول إلى المستوى {nt.n}</div>
            </>
          ) : <div className="mini">أعلى مستوى</div>}
        </div>
        <div className="row" style={{ gap: 8, marginBottom: 10 }}>
          <Stat v={session.length} l="فحص اليوم" /><Stat v={fmt(sum(session, s => s.earned))} l="نقاط اليوم" /><Stat v={pending} l="قيد التأكيد" />
        </div>
        <button className="bigbtn" onClick={() => go('scan')}><Ico k="scan" s={24} /> مسح رمز البوليصة / الرحلة</button>
        <h4 style={{ margin: '14px 0 6px', fontSize: 13 }}>رحلات نشطة متجهة لنقطتك</h4>
        {expectedTrips(insp).map(t => (
          <div className="acard" key={t.id} style={{ cursor: 'pointer' }} onClick={() => openTrip(t.id)}>
            <div className="row"><b>#{t.id}</b><Plate v={VEHM[t.veh]} /></div>
            <div className="mini">{NODE[t.from].cap} ← {NODE[t.to].cap} · {t.group} · {fmt1(t.load)} طن</div>
          </div>
        ))}
      </>
    );
  } else if (screen === 'scan') {
    view = (
      <>
        <div className="scanbox">
          <div className="fr"><div className="ln" /></div>
          <div style={{ position: 'absolute', bottom: 12, color: '#cfe', fontSize: 12 }}>{scanning ? 'جارٍ التعرف على الرمز…' : 'وجّه الكاميرا إلى رمز QR في البوليصة'}</div>
        </div>
        <button className="bigbtn" onClick={simScan} disabled={scanning}>محاكاة مسح رمز QR</button>
        <div className="acard" style={{ marginTop: 12 }}>
          <label className="mini" htmlFor="mTrip">أو أدخل رقم الرحلة يدوياً</label>
          <div className="row" style={{ marginTop: 6 }}>
            <input type="text" id="mTrip" inputMode="numeric" value={manual} onChange={e => setManual(e.target.value)} placeholder={String(expectedTrips(insp)[0]?.id || '')} style={{ flex: 1 }} />
            <button className="btn pri" onClick={() => openTrip(+manual)}>بحث</button>
          </div>
        </div>
      </>
    );
  } else if (screen === 'trip') {
    const t = TRIP[tripId], v = VEHM[t.veh], c = CARR[t.carrier], vc = VCLASS[t.cls];
    hdr = { title: 'تفاصيل الرحلة', sub: 'GET /trip/' + t.id + ' · تم التحقق ✓' };
    view = (
      <>
        <div className="acard">
          <div className="row"><b>رحلة #{t.id}</b><Badge k={t.status === 1 ? 'good' : 'neutral'}>{STATUS[t.status]}</Badge></div>
          <div className="row" style={{ marginTop: 8 }}><Plate v={v} /><span className="mini">{vc.ar}</span></div>
          <div className="mini" style={{ marginTop: 8 }}>{NODE[t.from].cap} ← {NODE[t.to].cap} · {fmt(t.km)} كم</div>
          {t.border && <div style={{ marginTop: 6 }}><Badge k="warn">{(t.dir === 'import' ? 'استيراد من ' : 'تصدير إلى ') + BR[t.border].country + ' عبر ' + BR[t.border].cap}</Badge></div>}
          <div className="mini">الاستلام {iso(t.receivedDate)} · التسليم المتوقع {iso(t.expected)}</div>
        </div>
        <div className="acard">
          <div className="row"><div><div className="mini">الناقل</div><b style={{ fontSize: 13 }}>{c.name}</b></div><Tier p={PTS[c.id]?.pts || 0} a={audOf(c.id)} /></div>
          <div className="row" style={{ marginTop: 8 }}>
            <div><div className="mini">السائق</div><b style={{ fontSize: 13 }}>{t.driver}</b></div>
            <div className="mini" style={{ direction: 'ltr' }}>ID {mask(t.driverId)}</div>
          </div>
        </div>
        <div className="acard">
          <div className="row"><b style={{ fontSize: 13 }}>البوالص ({t.wbs.length})</b><span className="mini">المصرّح: {fmt1(t.load)} طن / الحد {vc.cap} طن</span></div>
          {t.wbs.map(w => (
            <div key={w.id} style={{ borderTop: '1px solid #f0efea', marginTop: 8, paddingTop: 8 }}>
              <div className="row"><b style={{ fontSize: 12.5 }}>#{w.id}</b><span className="mini">{fmt1(w.weight)} طن · {w.qty} {UNITS[w.unit]}</span></div>
              <div className="mini">{GT[w.gt].ar}{w.dangerousCode && <> · <b style={{ color: '#8f1f1f' }}>رمز خطر {w.dangerousCode}</b></>}</div>
              <div className="mini">{w.sender} ← {w.recipient}</div>
              {w.ff && <div className="mini">مكتب الشحن: {FFM[w.ff].name}</div>}
            </div>
          ))}
        </div>
        <button className="bigbtn" onClick={startCheck}>بدء الفحص</button>
      </>
    );
  } else if (screen === 'check') {
    const t = TRIP[tripId], vc = VCLASS[t.cls], legal = vc.tare + vc.cap;
    const items = CHECKS(t.wbs.some(w => w.dangerousCode), !!cp.border);
    const gw = parseFloat(weight), over = gw > legal * 1.05;
    const done = items.every(i => checks[i[0]] !== undefined) && weight !== '';
    hdr = { title: 'قائمة الفحص', sub: 'رحلة #' + t.id };
    view = (
      <>
        <div className="acard">
          {items.map(([k, l]) => (
            <div className="chk" key={k}>
              <span style={{ fontSize: 13 }}>{l}</span>
              <span className="tg">
                <button className={'ok' + (checks[k] === true ? ' on' : '')} onClick={() => setChecks(c => ({ ...c, [k]: true }))}>✓ سليم</button>
                <button className={'no' + (checks[k] === false ? ' on' : '')} onClick={() => setChecks(c => ({ ...c, [k]: false }))}>✗ مخالف</button>
              </span>
            </div>
          ))}
        </div>
        <div className="acard">
          <label style={{ fontSize: 13 }} htmlFor="wIn">الوزن الإجمالي من الميزان (طن)</label>
          <div className="mini">الحد القانوني للمركبة: {legal} طن (فارغ {vc.tare} + حمولة {vc.cap})</div>
          <div className="row" style={{ marginTop: 6 }}>
            <input type="number" step="0.1" id="wIn" value={weight} placeholder={'مثال: ' + fmt1(vc.tare + t.load)} style={{ flex: 1 }} onChange={e => setWeight(e.target.value)} />
            <button className="btn" onClick={() => setWeight(String(+(vc.tare + t.load * (0.97 + Math.random() * 0.06)).toFixed(1)))}>قراءة الميزان</button>
          </div>
          {weight !== '' && <div style={{ marginTop: 6 }}>{over ? <Badge k="crit">تجاوز الحد بنسبة {pct(gw / legal - 1)}</Badge> : <Badge k="good">ضمن الحد المسموح</Badge>}</div>}
        </div>
        <div className="acard">
          <label style={{ fontSize: 13 }}>صورة المركبة / الحمولة</label>
          <div className="row" style={{ marginTop: 6 }}>
            <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files.length > 0)} style={{ fontSize: 11, flex: 1 }} />
            {photo && <Badge k="good">مرفقة</Badge>}
          </div>
          <label style={{ fontSize: 13, display: 'block', marginTop: 8 }} htmlFor="nIn">ملاحظات</label>
          <textarea id="nIn" rows={2} style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 4, padding: 6 }} value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <button className="bigbtn" disabled={!done} style={done ? undefined : { opacity: .5 }} onClick={submitCheck}>اعتماد نتيجة الفحص</button>
      </>
    );
  } else if (screen === 'result') {
    const r = session[0];
    hdr = { title: 'نتيجة الفحص', sub: 'تمت المزامنة مع المنصة' };
    view = (
      <>
        <div style={{ textAlign: 'center', margin: '10px 0' }}>{r.viol ? <Badge k="crit">تم تسجيل مخالفة</Badge> : <Badge k="good">اجتازت المركبة الفحص</Badge>}</div>
        <div className="pts pop">+{r.earned}</div>
        <div style={{ textAlign: 'center' }} className="mini">نقطة أُضيفت لرصيدك{r.pendingPts ? ` · و+${r.pendingPts} قيد التأكيد` : ''}</div>
        <div className="acard" style={{ marginTop: 14 }}>
          {r.lines.map(l => (
            <div className="row" key={l[0]} style={{ padding: '5px 0', borderBottom: '1px solid #f2f1ec' }}>
              <span style={{ fontSize: 12.5 }}>{l[0]}</span>
              <b style={{ color: l[1] < 0 ? '#8f1f1f' : l[2] ? '#7a5600' : '#0a5d0a' }}>{l[1] > 0 ? '+' : ''}{l[1]}{l[2] ? ' (معلّق)' : ''}</b>
            </div>
          ))}
        </div>
        <div className="acard">
          <div className="mini">أثر الفحص على الناقل: <b>{CARR[TRIP[r.trip].carrier].name}</b></div>
          <div style={{ marginTop: 4 }}>{r.viol ? <Badge k="serious">−20 نقطة بعد انقضاء فترة الاعتراض (72 ساعة)</Badge> : <Badge k="good">+3 نقاط فحص نظيف</Badge>}</div>
        </div>
        <button className="bigbtn" onClick={() => go('scan')}>فحص مركبة أخرى</button>
        <button className="btn" style={{ width: '100%', marginTop: 8 }} onClick={() => go('home')}>العودة للرئيسية</button>
      </>
    );
  } else if (screen === 'points') {
    view = (
      <>
        <div className="acard" style={{ textAlign: 'center' }}><div className="mini">رصيدك الحالي</div><div className="pts">{fmt(points)}</div><Tier p={points} a="insp" /></div>
        <h4 style={{ margin: '6px 0', fontSize: 13 }}>كيف أكسب النقاط؟</h4>
        <div className="acard">
          {RULES.insp.map(r => <div className="row" key={r[0]} style={{ padding: '4px 0' }}><span style={{ fontSize: 12.5 }}>{r[0]}</span><b>{r[1] > 0 ? '+' : ''}{r[1]}</b></div>)}
        </div>
        <h4 style={{ margin: '6px 0', fontSize: 13 }}>استبدال النقاط</h4>
        {REWARDS.insp.map((rw, i) => (
          <div className="acard" key={rw[0]}>
            <div className="row">
              <div><b style={{ fontSize: 13 }}>{rw[0]}</b><div className="mini">{rw[2]}</div></div>
              <button className={'btn' + (points >= rw[1] ? ' pri' : '')} disabled={points < rw[1]} onClick={() => redeem(i)}>{fmt(rw[1])}</button>
            </div>
          </div>
        ))}
      </>
    );
  } else if (screen === 'hist') {
    const old = INSPECTIONS.filter(i => i.insp === insp).slice(-8).reverse();
    view = (
      <>
        {session.map((s, i) => (
          <div className="acard" key={'s' + i}>
            <div className="row"><b>#{s.trip}</b>{s.viol ? <Badge k="crit">مخالفة</Badge> : <Badge k="good">سليم</Badge>}</div>
            <div className="mini">الآن · +{s.earned} نقطة</div>
          </div>
        ))}
        {old.map(i => (
          <div className="acard" key={i.id}>
            <div className="row"><b>#{i.trip}</b>{i.viol === null ? <Badge k="good">سليم</Badge> : i.confirmed ? <Badge k="crit">مخالفة مؤكدة</Badge> : <Badge k="neutral">أُلغيت بالاعتراض</Badge>}</div>
            <div className="mini">{iso(i.ts)} · {fmt1(i.dur)} د{i.viol !== null ? ' · ' + VIOL[i.viol] : ''}</div>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      <PageHead title="تطبيق الموبايل لنقاط العبور والتفتيش" desc="محاكي تفاعلي: سجّل الدخول، امسح رمز البوليصة، نفّذ قائمة الفحص، واكسب النقاط. كل عملية تُنتج أحداثاً تُغذّي لوحات BI ونظام المكافآت." />
      <div className="phonewrap">
        <div className="phone">
          <div className="screen">
            <div className="notch" />
            <div className="sbar"><span>9:41</span><span>4G</span></div>
            {hdr && (
              <div className="ahead">
                <div className="row">
                  <div><div className="t">{hdr.title}</div><div className="st">{hdr.sub}</div></div>
                  <Tier p={points} a="insp">{fmt(points)} نقطة</Tier>
                </div>
              </div>
            )}
            <div className="abody">{view}</div>
            {tabs && (
              <div className="atab">
                {TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : undefined} onClick={() => go(k)}><Ico k={k} />{l}</button>)}
              </div>
            )}
          </div>
        </div>
        <div className="grid">
          <Card title="سير العمل في التطبيق">
            <div className="flow" style={{ marginTop: 8 }}>
              {[['1. مسح QR', 'رمز مطبوع على البوليصة (Get Trip PDF)'], ['2. التحقق', 'Get Trip Details: المركبة، السائق، البوالص'], ['3. الفحص', 'قائمة تحقق + وزن الميزان + صورة'], ['4. النقاط', 'للمفتش وللناقل تلقائياً']]
                .map(([b, s], i) => [i > 0 && <div className="farrow" key={'a' + i}>←</div>, <div className="fbox" key={b}><b>{b}</b><span className="mini">{s}</span></div>])}
            </div>
          </Card>
          <Card title="الأحداث المُرسلة للمنصة (Kafka)، مباشر" sub="ما يحدث خلف الكواليس عند كل خطوة في التطبيق">
            <div style={{ maxHeight: 470, overflow: 'auto' }}>
              {events.length ? events.map(e => (
                <div key={e.id} style={{ marginBottom: 8 }}>
                  <div className="row"><code style={{ color: '#0e7c66', fontWeight: 600 }}>{e.topic}</code><span className="mini">{e.ts}</span></div>
                  <pre style={{ maxHeight: 150 }}>{JSON.stringify(e.payload, null, 2)}</pre>
                </div>
              )) : <div className="empty">نفّذ عملية فحص في التطبيق لتظهر الأحداث هنا</div>}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
