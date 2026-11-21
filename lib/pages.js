/* Navigation + page titles. nof = page ignores the global period/state filters. */
export const PAGES = [
  { id: 'overview', path: '/', t: 'لوحة القيادة', sec: 'تقارير ذكاء الأعمال', i: 'M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z' },
  { id: 'fuel', path: '/fuel/', t: 'استهلاك الوقود', i: 'M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3M7 7h4' },
  { id: 'food', path: '/food/', t: 'توزيع المواد الغذائية', i: 'M12 21c-4-2-7-6-7-11a7 7 0 0 1 14 0c0 5-3 9-7 11zM12 7v8M9 10l3-3 3 3' },
  { id: 'hum', path: '/hum/', t: 'المساعدات الإنسانية', i: 'M12 21s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z' },
  { id: 'roads', path: '/roads/', t: 'إهلاك الطرق', i: 'M5 21L9 3M19 21L15 3M12 5v2M12 11v2M12 17v2' },
  { id: 'traffic', path: '/traffic/', t: 'خطط توزيع الحركة', i: 'M9 3h6v18H9zM12 7h.01M12 12h.01M12 17h.01' },
  { id: 'borders', path: '/borders/', t: 'المعابر الحدودية', i: 'M4 21V4M4 4h11l-2 4 2 4H4M18 21v-6M14 21h8' },
  { id: 'app', path: '/app/', t: 'تطبيق المفتش (موبايل)', sec: 'التطبيقات الميدانية', nof: 1, i: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2' },
  { id: 'rewards', path: '/rewards/', t: 'النقاط والمكافآت', nof: 1, i: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9L7 22l5-3 5 3-1.2-8.1' },
  { id: 'api', path: '/integration/', t: 'التكامل وواجهات API', sec: 'المنصة', nof: 1, i: 'M8 9l-4 3 4 3M16 9l4 3-4 3M14 5l-4 14' },
];

const norm = p => (p.endsWith('/') ? p : p + '/');
export const pageFor = pathname => PAGES.find(p => norm(p.path) === norm(pathname || '/')) || PAGES[0];
