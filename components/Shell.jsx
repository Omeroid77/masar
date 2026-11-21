'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PAGES, pageFor } from '@/lib/pages';

/* Global filters live here (the layout persists across route changes, so they survive navigation). */
const FilterCtx = createContext({ FP: 12, FS: 'ALL' });
const ToastCtx = createContext(() => {});
export const useFilters = () => useContext(FilterCtx);
export const useToast = () => useContext(ToastCtx);

/* Data generation uses local-time Date methods (same as the static build), so pages render
   only in the browser; the server-rendered HTML is the shell plus a loading line. */
const subscribe = () => () => {};
const useMounted = () => useSyncExternalStore(subscribe, () => true, () => false);

function Tooltip() {
  const el = useRef(null);
  useEffect(() => {
    const onMove = e => {
      const tip = el.current;
      const t = e.target.closest && e.target.closest('[data-tip]');
      if (!t) { tip.classList.remove('show'); return; }
      tip.innerHTML = t.getAttribute('data-tip'); // trusted: built from synthetic data in this app
      tip.classList.add('show');
      const w = tip.offsetWidth;
      let x = e.clientX - w - 14;
      if (x < 6) x = e.clientX + 14;
      tip.style.left = x + 'px';
      tip.style.top = e.clientY + 12 + 'px';
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, []);
  return <div className="tip" ref={el} />;
}

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

export default function Shell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const page = pageFor(pathname);
  const mounted = useMounted();
  const [FP, setFP] = useState(12);
  const [FS, setFS] = useState('ALL');
  const [navOpen, setNavOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [meta, setMeta] = useState(null);
  const toastT = useRef(0);

  const toast = useCallback(m => {
    setToastMsg(m);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToastMsg(null), 2600);
  }, []);

  // load the data module once in the browser for the state list and the header totals
  useEffect(() => {
    import('@/lib/data').then(d => setMeta({
      states: d.STATES, today: d.iso(d.TODAY), trips: d.fmt(d.TRIPS.length), wbs: d.fmt(d.WAYBILLS.length), insp: d.fmt(d.INSPECTIONS.length),
    }));
  }, []);

  // old static-build links (index.html#fuel) keep working
  useEffect(() => {
    const id = location.hash.slice(1);
    const p = PAGES.find(x => x.id === id);
    if (p && pathname === '/') router.replace(p.path);
  }, [pathname, router]);

  useEffect(() => { setNavOpen(false); window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    document.body.classList.toggle('navopen', navOpen);
    const onKey = e => { if (e.key === 'Escape') setNavOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  let sec = null;
  return (
    <FilterCtx.Provider value={{ FP, FS }}>
      <ToastCtx.Provider value={toast}>
        <div className="app">
          <div className="scrim" onClick={() => setNavOpen(false)} />
          <aside className="side">
            <div className="brand">
              <div className="wordmark">مَسار</div>
              <div className="brand-sub">المنصة الوطنية للرحلات وبوالص الشحن</div>
              <div className="brand-org">وزارة البنية التحتية والنقل</div>
            </div>
            <nav className="nav">
              {PAGES.map(p => {
                const head = p.sec && p.sec !== sec ? (sec = p.sec) : null;
                return (
                  <div key={p.id}>
                    {head && <div className="navsec">{head}</div>}
                    <Link href={p.path} className={p.id === page.id ? 'on' : undefined}><Icon d={p.i} /><span>{p.t}</span></Link>
                  </div>
                );
              })}
            </nav>
            <div className="sidefoot">الإصدار التجريبي 0.5<br />البيانات المعروضة تجريبية</div>
          </aside>
          <main className="main">
            <header className="top">
              <button className="menubtn" aria-label="القائمة" aria-expanded={navOpen} onClick={() => setNavOpen(o => !o)}><span /><span /><span /></button>
              <h1>
                {page.t}
                <small>{meta ? `بيانات حتى ${meta.today} · ${meta.trips} رحلة · ${meta.wbs} بوليصة · ${meta.insp} عملية فحص` : ' '}</small>
              </h1>
              <div className="filters" style={{ visibility: page.nof ? 'hidden' : 'visible' }}>
                <label htmlFor="fPeriod">الفترة</label>
                <select id="fPeriod" value={FP} onChange={e => setFP(+e.target.value)}>
                  <option value="12">آخر 12 شهراً</option><option value="6">آخر 6 أشهر</option><option value="3">آخر 3 أشهر</option>
                </select>
                <label htmlFor="fState">الولاية</label>
                <select id="fState" value={FS} onChange={e => setFS(e.target.value)}>
                  <option value="ALL">كل الولايات</option>
                  {meta?.states.map(s => <option key={s.id} value={s.id}>{s.ar}</option>)}
                </select>
              </div>
              <span className="demo-pill">بيانات تجريبية</span>
            </header>
            <section className="page on">
              {mounted ? children : <div className="loading">جارٍ تحميل البيانات…</div>}
            </section>
          </main>
        </div>
        <div className={'toast' + (toastMsg ? ' show' : '')}>{toastMsg}</div>
        <Tooltip />
      </ToastCtx.Provider>
    </FilterCtx.Provider>
  );
}
