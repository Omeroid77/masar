import { PageHead, Card } from '@/components/ui';

const EXISTING = [
  ['POST', '/api/v1/carrier/trip', 'إنشاء رحلة مع البوالص', 'مصدر بيانات الرحلات والحمولة والمسافة'],
  ['PUT', '/api/v1/carrier/trip', 'تحديث المركبة أو السائق', ''],
  ['POST', '/api/v1/carrier/trip/waybill', 'إضافة بوليصة لرحلة', ''],
  ['PUT', '/api/v1/carrier/trip/waybill', 'تحديث بوليصة', ''],
  ['PUT', '/api/v1/carrier/trip/waybill/close', 'إغلاق بوليصة (actualDeliveryDate)', 'مؤشرات الالتزام بالموعد والنقاط'],
  ['PUT', '/api/v1/carrier/trip/waybill/cancel', 'إلغاء بوليصة (reasonId)', 'الفاقد: تلف/سرقة/رفض'],
  ['GET', '/api/v1/carrier/trip/{tripId}', 'تفاصيل الرحلة', 'شاشة التحقق في تطبيق المفتش'],
  ['GET', '/api/v1/carrier/trip/{tripId}/print', 'PDF البوليصة', 'يُضاف إليه رمز QR'],
  ['GET', '/api/v1/lookup/good-types', 'شجرة أنواع البضائع', 'تصنيف الغذاء/الوقود/الخطرة'],
];
const PROPOSED = [
  ['GET', '/api/v1/checkpoint/trips/{tripId}/verify', 'تحقق سريع من رمز QR في نقطة العبور'],
  ['POST', '/api/v1/checkpoint/inspections', 'تسجيل نتيجة الفحص (قائمة التحقق، الوزن، الصور)'],
  ['POST', '/api/v1/checkpoint/inspections/{id}/appeal', 'اعتراض الناقل على مخالفة'],
  ['GET', '/api/v1/rewards/parties/{partyId}/balance', 'رصيد النقاط والمستوى'],
  ['POST', '/api/v1/rewards/redemptions', 'طلب استبدال مكافأة'],
  ['GET', '/api/v1/bi/fuel|food|humanitarian|roads|traffic', 'واجهات تجميعية للوحات القيادة'],
  ['GET', '/api/v1/lookup/sd/states | cities | checkpoints', 'جداول مرجعية سودانية بديلة لجداول المناطق والمدن'],
  ['GET', '/api/v1/lookup/sd/border-crossings', 'المعابر الحدودية وحالة تشغيلها (تُحدّث من إدارة المعابر)'],
  ['POST', '/api/v1/border/clearances', 'تسجيل إجراءات العبور والربط مع البيان الجمركي'],
];
const SAMPLE = {
  inspectionId: 'INS-70421', tripId: 240913, checkpointId: 'CP03', inspectorId: 'I5009', timestamp: '2026-11-20T09:42:11+02:00',
  checks: { plate: true, driver: true, goods: true, seal: true }, measuredGrossWeightT: 58.4, legalGrossWeightT: 56, result: 'VIOLATION',
  findings: ['OVERLOAD'], photos: ['s3://inspections/70421/1.jpg'], geo: { lat: 18.17, lon: 36.30 },
};
const FLOW = [
  ['أنظمة الناقلين ومكاتب الشحن', 'Create Trip · Add/Close/Cancel Waybill'],
  ['بوابة API (app_id / app_key / client_id)', 'التحقق من الترخيص (409 عند عدم صلاحيته)'],
  ['ناقل الأحداث Kafka', 'trip.* · waybill.* · inspection.* · points.*'],
  ['محرك النقاط + مستودع البيانات', 'احتساب النقاط، ESAL، الوقود، التغطية'],
  ['لوحات BI · تطبيق المفتش', 'الإدارة العليا والميدان'],
];

const Ep = ({ m, p }) => <div className="ep"><code>{p}</code><span className={`m m-${m}`}>{m}</span></div>;

export default function Integration() {
  return (
    <>
      <PageHead title="التكامل وواجهات البرمجة" desc="المنصة تحافظ على عقود الخدمات الحالية (دليل تكامل الناقلين ومكاتب الشحن V7) وتضيف خدمات نقاط العبور والمكافآت وواجهات BI." />
      <Card title="تدفق البيانات" style={{ marginBottom: 14 }}>
        <div className="flow" style={{ marginTop: 10 }}>
          {FLOW.map(([b, s], i) => [
            i > 0 && <div className="farrow" key={'a' + i}>←</div>,
            <div className="fbox" key={b}><b>{b}</b><span className="mini">{s}</span></div>,
          ])}
        </div>
      </Card>
      <div className="grid g2" style={{ marginBottom: 14 }}>
        <Card title="الخدمات الحالية (من دليل التكامل)" sub="واستخدامها في المنصة">
          <div className="tw"><table>
            <thead><tr><th>الخدمة</th><th>الوصف</th><th>الاستخدام في BI/التطبيق</th></tr></thead>
            <tbody>{EXISTING.map(([m, p, d, x]) => <tr key={m + p}><td><Ep m={m} p={p} /></td><td>{d}</td><td className="mini">{x}</td></tr>)}</tbody>
          </table></div>
        </Card>
        <Card title="خدمات جديدة مقترحة" sub="لنقاط العبور والمكافآت والتقارير">
          <div className="tw"><table>
            <thead><tr><th>الخدمة</th><th>الوصف</th></tr></thead>
            <tbody>{PROPOSED.map(([m, p, d]) => <tr key={m + p}><td><Ep m={m} p={p} /></td><td>{d}</td></tr>)}</tbody>
          </table></div>
        </Card>
      </div>
      <div className="grid g2">
        <Card title="نموذج: POST /api/v1/checkpoint/inspections" sub="جسم الطلب">
          <pre>{JSON.stringify(SAMPLE, null, 2)}</pre>
        </Card>
        <Card title="التكييف للسياق السوداني" sub="تعديلات على عقود الدليل الأصلي">
          <table><tbody>
            <tr><td>رمز الدولة</td><td><code>countryCode: &quot;SD&quot;</code> كقيمة افتراضية، و<code>cityId</code> إلزامي عند SD بدلاً من SA</td></tr>
            <tr><td>الرحلات العابرة للحدود</td><td>المرسل أو المستلم بـ <code>EG / ET / SS / TD</code> مع حقل <code>borderCrossingId</code> إلزامي، مع إضافة رمز جنوب السودان SS غير الموجود في ملحق الدول بالدليل الأصلي</td></tr>
            <tr><td>المناطق والمدن</td><td>جداول مرجعية بالولايات الـ18 ومدنها ونقاط العبور</td></tr>
            <tr><td>رقم الجوال</td><td>التحقق بالصيغة <code>+2499XXXXXXXX</code> بدلاً من <code>+9665</code></td></tr>
            <tr><td>الهوية</td><td>الرقم الوطني السوداني بدل identityNumber/issueNumber</td></tr>
            <tr><td>طرق الدفع</td><td>إضافة المحافظ الإلكترونية وخدمات الدفع الحكومي المحلية بدل SADAD</td></tr>
            <tr><td>الترخيص</td><td>الربط مع جهة ترخيص النقل المحلية بدل منصة NAQL</td></tr>
            <tr><td>البيانات الحساسة</td><td>إخفاء أرقام الهوية والهواتف في التطبيق الميداني وسجل وصول لكل اطلاع</td></tr>
          </tbody></table>
        </Card>
      </div>
    </>
  );
}
