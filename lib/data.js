/* Masar data engine: synthetic, API-shaped, deterministic (mulberry32 seed 20261120).
   Ported verbatim from src/p2.js (+ crossings, points ledger and PCI from p3/p4) so the
   random stream, and therefore every demo number, matches the static build.
   Note: generation uses local-time Date methods, so it must run in the browser (see ClientOnly). */
/* ================= DATA LAYER (synthetic, API-shaped) ================= */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R=mulberry32(20261120);
const rnd=(a,b)=>a+R()*(b-a), ri=(a,b)=>Math.floor(rnd(a,b+1)), pick=a=>a[Math.floor(R()*a.length)];
function wpick(items,wf){let t=0;for(const x of items)t+=wf(x);let r=R()*t;for(const x of items){r-=wf(x);if(r<=0)return x}return items[items.length-1]}
const fmt=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(n);
const fmt1=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:1,minimumFractionDigits:1}).format(n);
const pct=n=>fmt1(n*100)+'%';
const sum=(a,f=x=>x)=>a.reduce((s,x)=>s+f(x),0);
const groupBy=(a,f)=>{const m=new Map();for(const x of a){const k=f(x);if(!m.has(k))m.set(k,[]);m.get(k).push(x)}return m};
const DAY=86400000, TODAY=new Date('2026-11-20T12:00:00');
const iso=d=>d.toISOString().slice(0,10);

/* States of Sudan — capital coords, population (millions, approximate for demo) */
const STATES=[
 {id:'KRT',ar:'الخرطوم',cap:'الخرطوم',lat:15.50,lon:32.56,pop:8.0,ow:12},
 {id:'GEZ',ar:'الجزيرة',cap:'ود مدني',lat:14.40,lon:33.52,pop:5.5,ow:9},
 {id:'WNL',ar:'النيل الأبيض',cap:'كوستي',lat:13.16,lon:32.66,pop:2.5,ow:6},
 {id:'BNL',ar:'النيل الأزرق',cap:'الدمازين',lat:11.79,lon:34.36,pop:1.3,ow:1.5},
 {id:'SEN',ar:'سنار',cap:'سنجة',lat:13.15,lon:33.93,pop:1.9,ow:4},
 {id:'GED',ar:'القضارف',cap:'القضارف',lat:14.03,lon:35.38,pop:2.2,ow:7},
 {id:'KAS',ar:'كسلا',cap:'كسلا',lat:15.45,lon:36.40,pop:2.3,ow:4},
 {id:'RSE',ar:'البحر الأحمر',cap:'بورتسودان',lat:19.62,lon:37.22,pop:1.5,ow:14},
 {id:'RNL',ar:'نهر النيل',cap:'عطبرة',lat:17.70,lon:33.98,pop:1.5,ow:5},
 {id:'NOR',ar:'الشمالية',cap:'دنقلا',lat:19.17,lon:30.48,pop:0.95,ow:3},
 {id:'NKO',ar:'شمال كردفان',cap:'الأبيض',lat:13.18,lon:30.22,pop:2.2,ow:4},
 {id:'SKO',ar:'جنوب كردفان',cap:'كادقلي',lat:11.01,lon:29.72,pop:1.6,ow:1.5},
 {id:'WKO',ar:'غرب كردفان',cap:'الفولة',lat:11.73,lon:28.35,pop:1.7,ow:2},
 {id:'NDA',ar:'شمال دارفور',cap:'الفاشر',lat:13.63,lon:25.35,pop:2.4,ow:1},
 {id:'SDA',ar:'جنوب دارفور',cap:'نيالا',lat:12.05,lon:24.88,pop:3.8,ow:2.5},
 {id:'WDA',ar:'غرب دارفور',cap:'الجنينة',lat:13.45,lon:22.45,pop:1.6,ow:0.6},
 {id:'CDA',ar:'وسط دارفور',cap:'زالنجي',lat:12.91,lon:23.47,pop:1.4,ow:0.5},
 {id:'EDA',ar:'شرق دارفور',cap:'الضعين',lat:11.46,lon:26.13,pop:1.1,ow:1},
];
const ST=Object.fromEntries(STATES.map(s=>[s.id,s]));
/* Land border crossings — operating status from published reports (Nov 2026); volumes are synthetic */
const BORDERS=[
 {id:'ASH',ar:'معبر أشكيت – قسطل',cap:'أشكيت',country:'مصر',cc:'EG',state:'NOR',lat:21.80,lon:31.50,km:430,age:11,road:'دنقلا – وادي حلفا – أشكيت',st:'good',stTxt:'مفتوح',la:'start',w:4},
 {id:'ARG',ar:'معبر أرقين',cap:'أرقين',country:'مصر',cc:'EG',state:'NOR',lat:21.80,lon:30.80,km:390,age:9,road:'دنقلا – أرقين (غرب النيل)',st:'good',stTxt:'مفتوح',la:'end',w:1.8},
 {id:'GAL',ar:'معبر القلابات – المتمة',cap:'القلابات',country:'إثيوبيا',cc:'ET',state:'GED',lat:12.96,lon:36.06,km:160,age:16,road:'القضارف – دوكة – القلابات',st:'warn',stTxt:'مفتوح (افتراض، يُتحقق منه)',la:'start',w:2.5},
 {id:'JOD',ar:'معبر جودة',cap:'جودة',country:'جنوب السودان',cc:'SS',state:'WNL',lat:12.30,lon:32.79,km:120,age:19,road:'كوستي – الجبلين – جودة',st:'serious',stTxt:'يعمل مع إغلاقات متقطعة',la:'end',w:2.2},
 {id:'ADR',ar:'معبر أدري',cap:'أدري',country:'تشاد',cc:'TD',state:'WDA',lat:13.49,lon:22.27,km:30,age:14,road:'الجنينة – أدري',st:'crit',stTxt:'مغلق من الجانب التشادي منذ 22 فبراير 2026',la:'end',w:1.2,closed:[['2026-02-22','2099-01-01']]},
 {id:'TIN',ar:'معبر الطينة',cap:'الطينة',country:'تشاد',cc:'TD',state:'NDA',lat:14.97,lon:22.83,km:330,age:12,road:'الفاشر – كتم – الطينة',st:'warn',stTxt:'أُعيد فتحه للمساعدات في 25 سبتمبر 2026',la:'end',w:0.8,closed:[['2026-02-21','2026-09-25']]},
];
const BR=Object.fromEntries(BORDERS.map(b=>[b.id,b]));
const NODE={...ST,...BR};
const isOpen=(b,dt)=>!(b.closed||[]).some(([s,e])=>dt>=new Date(s)&&dt<new Date(e));
const COUNTRIES=['مصر','إثيوبيا','جنوب السودان','تشاد'];
const DARFUR=['NDA','SDA','WDA','CDA','EDA'], KORD=['NKO','SKO','WKO'];

/* Road network (national corridors) */
const EDGES=[
 {id:'E01',a:'KRT',b:'GEZ',km:186,name:'الخرطوم – ود مدني',age:20},
 {id:'E02',a:'GEZ',b:'GED',km:228,name:'ود مدني – القضارف',age:24},
 {id:'E03',a:'GED',b:'KAS',km:220,name:'القضارف – كسلا',age:22},
 {id:'E04',a:'KAS',b:'RSE',km:570,name:'كسلا – هيا – بورتسودان',age:26},
 {id:'E05',a:'KRT',b:'RNL',km:310,name:'الخرطوم – شندي – عطبرة (التحدي)',age:15},
 {id:'E06',a:'RNL',b:'RSE',km:470,name:'عطبرة – هيا – بورتسودان',age:18},
 {id:'E07',a:'KRT',b:'NOR',km:530,name:'الخرطوم – دنقلا (شريان الشمال)',age:12},
 {id:'E08',a:'KRT',b:'WNL',km:315,name:'الخرطوم – الدويم – كوستي',age:21},
 {id:'E09',a:'GEZ',b:'SEN',km:120,name:'ود مدني – سنار – سنجة',age:23},
 {id:'E10',a:'SEN',b:'BNL',km:240,name:'سنجة – الدمازين',age:19},
 {id:'E11',a:'SEN',b:'WNL',km:150,name:'سنار – ربك – كوستي',age:17},
 {id:'E12',a:'WNL',b:'NKO',km:300,name:'كوستي – أم روابة – الأبيض',age:25},
 {id:'E13',a:'NKO',b:'SKO',km:290,name:'الأبيض – الدلنج – كادقلي',age:14},
 {id:'E14',a:'NKO',b:'WKO',km:260,name:'الأبيض – الفولة',age:11},
 {id:'E15',a:'WKO',b:'EDA',km:300,name:'الفولة – الضعين',age:8},
 {id:'E16',a:'EDA',b:'SDA',km:180,name:'الضعين – نيالا',age:10},
 {id:'E17',a:'SDA',b:'CDA',km:210,name:'نيالا – زالنجي',age:9},
 {id:'E18',a:'CDA',b:'WDA',km:170,name:'زالنجي – الجنينة',age:7},
 {id:'E19',a:'SDA',b:'NDA',km:200,name:'نيالا – الفاشر',age:12},
 {id:'E20',a:'NKO',b:'NDA',km:640,name:'الأبيض – النهود – الفاشر (الإنقاذ الغربي)',age:6},
];
for(const b of BORDERS)EDGES.push({id:'E'+b.id,a:b.state,b:b.id,km:b.km,name:b.road,age:b.age,border:b.id});
const EG=Object.fromEntries(EDGES.map(e=>[e.id,e]));
/* checkpoints on corridors */
const CPS=[
 {id:'CP01',name:'نقطة عبور الكاملين',edge:'E01'},
 {id:'CP02',name:'نقطة عبور الفاو',edge:'E02'},
 {id:'CP03',name:'نقطة عبور هيا',edge:'E06'},
 {id:'CP04',name:'نقطة عبور شندي',edge:'E05'},
 {id:'CP05',name:'نقطة عبور الدويم',edge:'E08'},
 {id:'CP06',name:'نقطة عبور أم روابة',edge:'E12'},
 {id:'CP07',name:'نقطة عبور الدبة',edge:'E07'},
 {id:'CP08',name:'نقطة عبور سنجة',edge:'E10'},
 {id:'CP09',name:'نقطة عبور الضعين',edge:'E15'},
 {id:'CP10',name:'نقطة عبور كسلا الشرقية',edge:'E04'},
];
for(const b of BORDERS)CPS.push({id:'BC-'+b.id,name:b.ar,edge:'E'+b.id,border:b.id});
const CPBYEDGE=Object.fromEntries(CPS.map(c=>[c.edge,c]));

/* shortest paths (Dijkstra) */
const ADJ={};for(const k in NODE)ADJ[k]=[];
for(const e of EDGES){ADJ[e.a].push([e.b,e]);ADJ[e.b].push([e.a,e])}
function path(src,dst){const d={},p={},seen=new Set();for(const k in NODE)d[k]=Infinity;d[src]=0;
 while(true){let u=null;for(const k in d)if(!seen.has(k)&&(u===null||d[k]<d[u]))u=k;if(u===null||d[u]===Infinity)break;seen.add(u);if(u===dst)break;
  for(const[v,e]of ADJ[u]){if(d[u]+e.km<d[v]){d[v]=d[u]+e.km;p[v]=[u,e]}}}
 const edges=[];let c=dst;while(c!==src){const[u,e]=p[c];edges.unshift(e.id);c=u}return{km:d[dst],edges}}
const PATHC={};function getPath(a,b){const k=a+'>'+b;return PATHC[k]||(PATHC[k]=path(a,b))}

/* Good types — subset of GET /api/v1/lookup/good-types (response.json) */
const GT={
 14:{ar:'سلع استهلاكية سريعة الحركة الجافة',p:12},15:{ar:'سلع استهلاكية سريعة الحركة المبردة',p:12},16:{ar:'مواد الرعاية الصحية الجافة',p:12},
 122:{ar:'الألبان',p:12},138:{ar:'الزيوت (غذائية)',p:12},142:{ar:'المشروبات الغازية',p:12},171:{ar:'الخضروات والفواكه',p:12},
 137:{ar:'الأعلاف والحبوب',p:4},158:{ar:'المواد الزراعية والأسمدة',p:4},
 124:{ar:'المواشي',p:11},144:{ar:'الجمال والأحصنة',p:11},
 18:{ar:'بنزين 91',p:10},20:{ar:'ديزل',p:10},21:{ar:'كيروسين',p:10},24:{ar:'غاز نفطي',p:10},
 121:{ar:'أسمنت',p:34},46:{ar:'الصلب',p:34},55:{ar:'حديد التسليح',p:34},128:{ar:'الرمل',p:34},59:{ar:'الطوب',p:34},
 37:{ar:'الغازات',p:35},38:{ar:'السوائل اللهوبة',p:35},
 149:{ar:'الأدوية',p:null},156:{ar:'المستلزمات الطبية ومستلزمات المستشفيات',p:null},166:{ar:'مياه معبأة',p:null},
 140:{ar:'البيوت الجاهزة',p:null},159:{ar:'مولدات الكهرباء',p:null},135:{ar:'المواد البلاستيكية',p:5},188:{ar:'مكائن صناعية',p:5},
 165:{ar:'قطع غيار جديدة',p:129},147:{ar:'الملابس والأحذية',p:null},
};
const PARENT_AR={4:'زراعية',5:'صناعية',10:'منتجات بترولية',11:'حيوانات حية',12:'مواد غذائية',34:'مواد البناء والتشييد',35:'مواد خطرة',129:'قطع غيار'};
function group(gt){const g=GT[gt];if(g.p===12||gt===137)return'غذاء وحبوب';if(g.p===10)return'وقود ومنتجات بترولية';if(g.p===34)return'مواد بناء';if(g.p===11)return'ثروة حيوانية';
 if(gt===149||gt===156)return'أدوية ومستلزمات طبية';if(g.p===35)return'مواد خطرة';return'صناعية وأخرى'}
const FOOD=new Set([14,15,16,122,138,142,171,137]);
const UNITS={1:'قطعة',2:'طن',3:'باليت',4:'كرتون',5:'كيلوجرام',6:'حزمة',7:'حاوية'};
const STATUS={1:'نشطة',2:'ملغية',3:'مغلقة',4:'منتهية',5:'لم تسلم',6:'متعدد الحالات'};
const CANCEL={1:'إلغاء وثيقة',2:'رفض المستلم استلامها',3:'تلف البضائع',4:'بسبب السرقة'};
const PLATE={2:'نقل عام',3:'نقل خاص',7:'معدات ثقيلة',8:'تصدير',11:'مؤقت'};
const PAY={1:'كاش',2:'بطاقة صراف',6:'تحويل بنكي'};

const PROFILE={
 RSE:[[20,5],[18,3],[24,1],[14,3],[138,1.5],[46,1.5],[55,1],[149,1],[156,.6],[188,.6],[165,.8],[38,.4],[37,.3],[158,.8]],
 KRT:[[14,3],[142,2],[149,1.5],[135,1],[147,1],[165,1],[59,1],[15,1],[16,.6]],
 GEZ:[[137,4],[171,2],[14,1.5],[122,1]], GED:[[137,6],[171,1]], SEN:[[137,2],[171,3]],
 WNL:[[137,2],[14,3],[124,1]], KAS:[[171,4],[137,1]], RNL:[[121,5],[128,1],[171,1]], NOR:[[171,3],[137,2]],
 NKO:[[124,3],[144,2],[137,2]], SKO:[[124,2],[137,1]], WKO:[[124,2],[20,2]], SDA:[[124,2],[171,1]],
 NDA:[[124,1.5],[137,1]], WDA:[[124,1.5],[137,1]], CDA:[[124,1.5],[137,1]], EDA:[[124,1.5],[137,1]], BNL:[[137,1],[171,1]],
};
const XGOODS={'مصر':{import:[[14,3],[46,2],[121,1.5],[149,1.5],[135,1],[165,1.5],[147,1]],export:[[124,4],[144,2],[137,3]]},
 'إثيوبيا':{import:[[171,4],[14,1],[121,1]],export:[[14,2],[137,1],[20,1.5]]},
 'جنوب السودان':{import:[[124,1],[171,1]],export:[[14,4],[137,3],[20,2],[121,1],[166,1]]},
 'تشاد':{import:[[124,2],[144,1],[14,1]],export:[[14,3],[137,2],[20,1]]}};
const HUM_GOODS=[[14,4],[137,4],[149,2],[156,1.5],[166,1.5],[140,.8],[159,.4],[16,1]];

/* Vehicle classes */
const VCLASS={
 L:{ar:'خفيفة (محوران)',axles:2,cap:8,tare:5,base:18},
 M:{ar:'متوسطة (3 محاور)',axles:3,cap:16,tare:10,base:27},
 H:{ar:'قاطرة ومقطورة (5–6 محاور)',axles:6,cap:40,tare:16,base:37},
 T:{ar:'صهريج (5 محاور)',axles:5,cap:34,tare:15,base:35},
};
const FIRST=['أحمد','محمد','عثمان','الطيب','عبدالله','إبراهيم','يوسف','الصادق','حسن','عمر','مصطفى','خالد','آدم','إسماعيل','بشير','الفاتح','صلاح','عادل','حامد','منتصر','مجدي','ياسر','هاشم','النور','عوض'];
const LAST=['الأمين','عبدالرحيم','النعيم','حمد','الحسن','بابكر','موسى','علي','سليمان','عبدالقادر','الزين','إدريس','الطاهر','عثمان','محجوب','دفع الله','الخير','يعقوب'];
const person=()=>pick(FIRST)+' '+pick(FIRST)+' '+pick(LAST);
const CO_A=['النيل','الشرق','الصحراء','كردفان','الواحة','البحر الأحمر','البطانة','دارفور','الجزيرة','السودان الحديث','القافلة','الرواحل','المسار الأخضر','الأمانة','التضامن','الخليج','النخيل','الساحل'];
const CO_B=['للنقل البري','للشحن والخدمات اللوجستية','للنقل والتجارة','للنقل الثقيل','لنقل البضائع'];
const LET=['أ','ب','ج','د','ر','س','ص','ط','ع','ك','م','ن','هـ','و','ي'];

const CARRIERS=[];
for(let i=0;i<34;i++)CARRIERS.push({id:'C'+(1001+i),name:'شركة '+CO_A[i%CO_A.length]+' '+CO_B[i%CO_B.length]+(i>=CO_A.length?' ('+(i-CO_A.length+2)+')':''),type:'COMPANY',idn:'71000'+ri(10000,99999)});
for(let i=0;i<110;i++)CARRIERS.push({id:'O'+(2001+i),name:person(),type:'INDIVIDUAL',idn:'1'+ri(100000000,999999999)});
const FORWARDERS=[];
const FF_A=['الرائد','الأفق','الوسيط','المرسى','الضمان','الريادة','البوابة','النجم','السلام','الوطنية','الحصاد','السريع','الإتقان','الثقة'];
for(let i=0;i<14;i++)FORWARDERS.push({id:'F'+(3001+i),name:'مكتب '+FF_A[i]+' للتخليص والشحن'});

const VEH=[];
function mkVeh(owner,cls){const v={id:'V'+(VEH.length+1),owner:owner.id,cls,plateTypeId:wpick([[2,6],[3,2.5],[7,.5],[8,.5],[11,.5]],x=>x[1])[0],
 l:[pick(LET),pick(LET),pick(LET)],num:String(ri(1000,9999))};VEH.push(v);return v}
for(const c of CARRIERS){const n=c.type==='COMPANY'?ri(10,40):ri(1,3);for(let i=0;i<n;i++)mkVeh(c,wpick([['L',2],['M',3],['H',4],['T',1.6]],x=>x[1])[0])}
const VBYCLS=groupBy(VEH,v=>v.cls);
const plateStr=v=>v.l.join(' ')+' '+v.num;

/* Inspectors */
const INSPECTORS=[];
CPS.forEach((cp,i)=>{for(let k=0;k<4;k++)INSPECTORS.push({id:'I'+(5001+i*4+k),name:person(),cp:cp.id,rankName:pick(['مفتش أول','مفتش','مفتش','مفتش مساعد'])})});
const INSP=Object.fromEntries(INSPECTORS.map(x=>[x.id,x]));

/* ---- generate trips ---- */
const MONTHS=[];for(let i=11;i>=0;i--){const d=new Date(2026,10-i,1);MONTHS.push({y:d.getFullYear(),m:d.getMonth()})}
const MNAME=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const mlabel=(mo)=>MNAME[mo.m]+' '+String(mo.y).slice(2);
const SEASON=[1.15,1.2,1.1,1.0,0.95,0.9,0.72,0.68,0.8,0.95,1.05,0.72];
const HOURW=[.3,.2,.2,.2,.3,.8,1.6,2.2,2.4,2.1,1.7,1.4,1.2,1.2,1.3,1.6,1.9,2.0,1.6,1.1,.8,.6,.5,.4];
const ACCESS={KRT:1.6,NDA:.4,SDA:.5,WDA:.3,CDA:.3,EDA:.45,SKO:.55,WKO:.6,BNL:.65};
const TRIPS=[], WAYBILLS=[], INSPECTIONS=[];
let tripSeq=240000, wbSeq=880000;
const N=6200;
for(let n=0;n<N;n++){
 const mi=wpick(MONTHS.map((m,i)=>i),i=>SEASON[i]); const mo=MONTHS[mi];
 const lastDay=(mi===11)?20:new Date(mo.y,mo.m+1,0).getDate();
 let date; for(let g=0;g<6;g++){date=new Date(mo.y,mo.m,ri(1,lastDay),wpick(HOURW.map((w,i)=>i),i=>HOURW[i]),ri(0,59));const wd=date.getDay();if(wd===5&&R()>0.45)continue;if(wd===6&&R()>0.75)continue;break}
 if(date>TODAY)date=new Date(+TODAY-ri(1,30)*3600000);
 const hum=R()<0.08;
 let o,d,border=null,dir=null;
 if(hum){o=wpick([['RSE',5],['KRT',2],['GED',1],['KAS',1],['GEZ',1]],x=>x[1])[0];
   d=wpick(STATES.filter(s=>s.id!==o),s=>(DARFUR.includes(s.id)?3:KORD.includes(s.id)?2:s.id==='BNL'?2:s.id==='WNL'?1.5:.3)*s.pop).id;
   if(['WDA','CDA','SDA','NDA'].includes(d)&&R()<0.4){const ok=['ADR','TIN'].filter(b=>isOpen(BR[b],date));if(ok.length){border=pick(ok);dir='import';o=BR[border].state}}}
 else if(R()<0.13){const ob=BORDERS.filter(b=>isOpen(b,date));border=wpick(ob,b=>b.w).id;dir=R()<0.5?'import':'export';
   if(dir==='import'){o=BR[border].state;d=wpick(STATES,s=>Math.pow(s.pop,.9)*(ACCESS[s.id]||1)/(1+getPath(border,s.id).km/500)).id}
   else{d=BR[border].state;o=wpick(STATES,s=>s.ow/(1+(s.id===d?0:getPath(s.id,border).km)/500)).id}}
 else{o=wpick(STATES,s=>s.ow).id; d=wpick(STATES.filter(s=>s.id!==o),s=>Math.pow(s.pop,.9)*(ACCESS[s.id]||1)*(s.id==='RSE'&&o!=='RSE'?1.2:1)).id}
 const from=dir==='import'?border:o, to=dir==='export'?border:d;
 const rp=getPath(from,to);
 // rainy season slows access to Darfur/BNL/SKO
 const rainy=[6,7,8].includes(mo.m);
 if(rainy&&(DARFUR.includes(d)||d==='SKO'||d==='BNL')&&R()<0.35){n--;continue}
 const goodsList=hum?HUM_GOODS:border?XGOODS[BR[border].country][dir]:PROFILE[o];
 const nwb=wpick([[1,.55],[2,.3],[3,.15]],x=>x[1])[0];
 const mainGt=wpick(goodsList,x=>x[1])[0];
 const g=group(mainGt);
 let cls=g==='وقود ومنتجات بترولية'?'T':g==='ثروة حيوانية'?pick(['M','M','H']):(g==='مواد بناء'||mainGt===137)?wpick([['H',4],['M',1.5]],x=>x[1])[0]:wpick([['L',2],['M',3],['H',3]],x=>x[1])[0];
 const veh=pick(VBYCLS.get(cls)); const vc=VCLASS[cls];
 const owner=CARRIERS.find(c=>c.id===veh.owner);
 const over=R()<0.13; const loadF=over?rnd(1.08,1.45):rnd(0.45,1.0);
 const load=+(vc.cap*loadF).toFixed(1);
 const expDays=Math.ceil(rp.km/380)+1;
 let delay=R()<0.74?0:ri(1,3); if(hum&&(DARFUR.includes(d)||d==='SKO'))delay+=R()<0.5?ri(1,4):0; if(rainy)delay+=R()<0.3?ri(1,3):0;
 const ageDays=(TODAY-date)/DAY;
 let status, cancelReason=null, actual=null;
 if(ageDays<expDays+delay){status=1}
 else{const r=R(); if(r<0.035){status=2;cancelReason=wpick([[1,55],[2,20],[3,15],[4,10]],x=>x[1])[0]}
  else if(r<0.05)status=5; else if(r<0.075)status=6; else status=R()<0.8?3:4;
  if(status===3||status===4||status===6)actual=new Date(+date+(expDays+delay)*DAY)}
 const trip={id:++tripSeq,createdAt:date,carrier:owner.id,veh:veh.id,cls,driver:person(),driverId:'2'+ri(1000000000,9999999999),
  o,d,from,to,border,dir,km:rp.km,edges:rp.edges,load,cap:vc.cap,over:loadF>1.0,overF:loadF,hum,status,cancelReason,
  receivedDate:date,expected:new Date(+date+expDays*DAY),actual,delay,wbs:[],group:g,mainGt};
 // waybills
 let rem=load;
 for(let k=0;k<nwb;k++){
  const gt=k===0?mainGt:wpick(goodsList,x=>x[1])[0];
  const w=k===nwb-1?rem:+(rem*rnd(.3,.6)).toFixed(1); rem=+(rem-w).toFixed(1);
  const ff=R()<0.6?pick(FORWARDERS).id:null;
  const unit=GT[gt].p===11?1:[14,15,142,149,156,166,147,16].includes(gt)?4:2;
  const wb={id:++wbSeq,trip:trip.id,ff,gt,unit,weight:Math.max(0.3,w),qty:unit===2?Math.max(1,Math.round(w)):unit===1?ri(8,60):ri(120,900),
   sender:dir==='import'&&!hum?'مورّد من '+BR[border].country+' – '+pick(['شركة الوادي','مؤسسة الأفق','شركة النهضة','مجموعة الساحل']):hum?pick(['مفوضية العون الإنساني – مخازن ','منظمة إغاثة شريكة – مستودع ','برنامج دعم غذائي – مركز '])+ST[o].cap:person(),
   recipient:hum?'مركز توزيع '+ST[d].cap:dir==='export'?'مستورد في '+BR[border].country+' – '+pick(['شركة الشرق','مؤسسة النيل','دار التجارة']):person(),
   senderCountry:dir==='import'?BR[border].cc:'SD',recipientCountry:dir==='export'?BR[border].cc:'SD',fare:Math.round(rp.km*w*rnd(9,14)),pay:wpick([[1,5],[6,3],[2,1]],x=>x[1])[0],
   dangerousCode:GT[gt].p===35?String(pick([1203,1202,1075,1965])):null,status:status===6?(R()<.5?3:5):status};
  trip.wbs.push(wb);WAYBILLS.push(wb)}
 TRIPS.push(trip);
}
TRIPS.sort((a,b)=>a.createdAt-b.createdAt);
const TRIP=Object.fromEntries(TRIPS.map(t=>[t.id,t]));
const CARR=Object.fromEntries(CARRIERS.map(c=>[c.id,c]));
const VEHM=Object.fromEntries(VEH.map(v=>[v.id,v]));
const FFM=Object.fromEntries(FORWARDERS.map(f=>[f.id,f]));

/* ---- physics: fuel & road wear (ESAL, fourth-power law) ---- */
function fuelL(t){const vc=VCLASS[t.cls];return t.km*(vc.base+0.42*t.load)/100 + t.km*vc.base*0.62/100} // loaded leg + empty return
function axleLoads(cls,gross){const vc=VCLASS[cls];const steer=cls==='L'?4:6;const rest=(gross-steer)/(vc.axles-1);return [steer,...Array(vc.axles-1).fill(rest)]}
function esal(cls,gross){return sum(axleLoads(cls,gross),a=>Math.pow(a/8.2,4))}
for(const t of TRIPS){const vc=VCLASS[t.cls];t.fuel=fuelL(t);t.esal=esal(t.cls,vc.tare+t.load)+esal(t.cls,vc.tare);t.esalLegal=esal(t.cls,vc.tare+Math.min(t.load,vc.cap))+esal(t.cls,vc.tare);
 t.maxAxle=Math.max(...axleLoads(t.cls,vc.tare+t.load));}

/* ---- inspections at checkpoints ---- */
const VIOL=['حمولة زائدة عن الحد المسموح','عدم مطابقة البضاعة للبوليصة','غياب رمز المواد الخطرة','عدم مطابقة لوحة المركبة','عدم مطابقة البيان الجمركي'];
let inspSeq=70000;
for(const t of TRIPS){let cum=0;for(const eid of t.edges){const e=EG[eid];const cp=CPBYEDGE[eid];
  if(cp&&R()<0.66){const ts=new Date(+t.createdAt+(cum+e.km/2)/48*3600000);
   if(ts>TODAY)continue;
   const insp=pick(INSPECTORS.filter(x=>x.cp===cp.id));
   let viol=null;
   if(t.overF>1.1&&R()<0.85)viol=0; else if(R()<0.035)viol=1; else if(GT[t.mainGt].p===35&&R()<0.15)viol=2; else if(R()<0.012)viol=3; else if(cp.border&&R()<0.04)viol=4;
   const dur=cp.border?+rnd(25,180).toFixed(0):+rnd(2.5,9).toFixed(1);
   INSPECTIONS.push({id:++inspSeq,trip:t.id,cp:cp.id,insp:insp.id,ts,dur,viol,confirmed:viol===null?null:R()<0.9,photo:R()<0.7,carrier:t.carrier});}
  cum+=e.km}}

/* ---- crossings at checkpoints: every trip passing a checkpoint (from p3.js) ---- */
const CROSS=[];
for(const t of TRIPS){let cum=0;for(const eid of t.edges){const cp=CPBYEDGE[eid];const e=EG[eid];if(cp){const ts=new Date(+t.createdAt+(cum+e.km/2)/48*3600000);if(ts<=TODAY)CROSS.push({cp:cp.id,ts,heavy:t.cls==='H'||t.cls==='T',trip:t})}cum+=e.km}}

/* ---- points engine (from p3.js) ---- */
const RULES={
 insp:[['إتمام عملية فحص موثقة',10],['إنجاز الفحص خلال 5 دقائق أو أقل',5],['إرفاق صورة للمركبة/الحمولة',3],['مخالفة مؤكدة بعد انقضاء فترة الاعتراض',20],['مخالفة أُلغيت عند الاعتراض أو التدقيق',-15]],
 carrier:[['تسجيل رحلة إلكترونياً عبر المنصة',2],['إصدار بوليصة شحن',1],['إغلاق البوليصة في الموعد المتوقع',5],['اجتياز فحص نقطة عبور دون ملاحظات',3],['مخالفة مؤكدة (حمولة زائدة/عدم مطابقة)',-20]],
 ff:[['إصدار بوليصة مكتملة البيانات',1],['تسليم البوليصة في الموعد',3]],
};
const PTS={}; const LOG=[];
function addPts(id,p,why,ts){if(!PTS[id])PTS[id]={pts:0,n:0};PTS[id].pts+=p;PTS[id].n++;if(LOG.length<0)LOG.push({id,p,why,ts})}
for(const i of INSPECTIONS){addPts(i.insp,10);if(i.dur<=5)addPts(i.insp,5);if(i.photo)addPts(i.insp,3);
 if(i.viol!==null){if(i.confirmed){addPts(i.insp,20);addPts(i.carrier,-20)}else addPts(i.insp,-15)}else addPts(i.carrier,3)}
for(const t of TRIPS){if(t.status===2)continue;addPts(t.carrier,2);
 for(const w of t.wbs){addPts(t.carrier,1);if(w.ff)addPts(w.ff,1);
  if((t.status===3||t.status===4)&&t.delay===0){addPts(t.carrier,5);if(w.ff)addPts(w.ff,3)}}}
const TIERSET={party:[3500,1500,500,0],insp:[5500,3500,1500,0],own:[600,300,100,0],ff:[1400,1200,1100,0]};
const audOf=id=>id[0]==='I'?'insp':id[0]==='O'?'own':id[0]==='F'?'ff':'party';
const tiers=a=>[['بلاتيني','t-pl'],['ذهبي','t-go'],['فضي','t-si'],['برونزي','t-br']].map((x,i)=>({n:x[0],c:x[1],min:TIERSET[a][i]}));
const tierOf=(p,a='party')=>tiers(a).find(t=>p>=t.min)||tiers(a)[3];
const nextTier=(p,a='party')=>[...tiers(a)].reverse().find(t=>t.min>p);

/* ---- chart palette (fixed order, CVD-validated) and status colours ---- */
const C={s1:'#1f8257',s2:'#2f6fd1',s3:'#c47a12',s4:'#b8407a',good:'#1e8e4f',warn:'#d9a21b',serious:'#e07a45',crit:'#c93b3b'};
const SEQ=['#e8f3ec','#c5e3d0','#97cdae','#62b088','#33915f','#1d7349','#105535'];
const SERIES=[C.s1,C.s2,C.s3,C.s4];
const seqColor=(v,max)=>SEQ[Math.min(SEQ.length-1,Math.floor((v/(max||1))*(SEQ.length-0.001)))];

/* ---- PCI per segment (from p4.js; consumes R() right after inspections, keep this order) ---- */
const PCI={};(function(){const e={};for(const t of TRIPS)if(t.status!==2)for(const id of t.edges)e[id]=(e[id]||0)+t.esal;
 const pk=Object.fromEntries(EDGES.map(x=>[x.id,(e[x.id]||0)/x.km]));const mxv=Math.max(...Object.values(pk));
 for(const x of EDGES){PCI[x.id]=Math.max(18,Math.round(97-x.age*0.95-48*pk[x.id]/mxv-R()*5))}})();
const pciStat=p=>p<45?['crit','حرج، إعادة تأهيل']:p<60?['serious','سيئ، صيانة عاجلة']:p<75?['warn','متوسط، صيانة وقائية']:['good','جيد، صيانة دورية'];
const pciColor=p=>p<45?C.crit:p<60?C.serious:p<75?C.warn:C.good;
const ACTIVE=TRIPS.filter(t=>t.status===1);

/* ---- filters (period in months, state id or ALL) ---- */
const periodStart=FP=>{const mo=MONTHS[12-FP];return new Date(mo.y,mo.m,1)};
const inPeriod=(d,FP)=>d>=periodStart(FP);
const inState=(t,FS)=>FS==='ALL'||t.o===FS||t.d===FS;
const fTrips=(FP,FS)=>TRIPS.filter(t=>inPeriod(t.createdAt,FP)&&inState(t,FS));
const periodMonths=FP=>MONTHS.slice(12-FP);
const monthKey=d=>d.getFullYear()+'-'+d.getMonth();
function byMonth(arr,dateF,FP,valF=()=>1){const pm=periodMonths(FP);const m=new Map(pm.map(x=>[x.y+'-'+x.m,0]));for(const a of arr){const k=monthKey(dateF(a));if(m.has(k))m.set(k,m.get(k)+valF(a))}return{labels:pm.map(mlabel),data:[...m.values()]}}
/* route fuel formula, reused by the border-closure simulator */
const fuelForKm=(cls,load,km)=>km*(VCLASS[cls].base+0.42*load)/100+km*VCLASS[cls].base*0.62/100;

export {
 R,rnd,ri,pick,fmt,fmt1,pct,sum,groupBy,DAY,TODAY,iso,
 STATES,ST,BORDERS,BR,NODE,isOpen,COUNTRIES,DARFUR,KORD,EDGES,EG,CPS,CPBYEDGE,getPath,
 GT,PARENT_AR,FOOD,UNITS,STATUS,CANCEL,PLATE,PAY,VCLASS,
 CARRIERS,FORWARDERS,VEH,plateStr,INSPECTORS,INSP,MONTHS,MNAME,mlabel,
 TRIPS,WAYBILLS,INSPECTIONS,TRIP,CARR,VEHM,FFM,VIOL,CROSS,ACTIVE,inspSeq,
 RULES,PTS,TIERSET,audOf,tiers,tierOf,nextTier,
 C,SEQ,SERIES,seqColor,PCI,pciStat,pciColor,
 periodStart,inPeriod,inState,fTrips,periodMonths,byMonth,fuelForKm,
};
