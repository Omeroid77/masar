import './globals.css';
import Shell from '@/components/Shell';

export const metadata = {
  title: { default: 'مسار · المنصة الوطنية للنقل والشحن', template: '%s · مسار' },
  description: 'المنصة الوطنية للرحلات وبوالص الشحن، نسخة تجريبية ببيانات تجريبية',
};
export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@500;600;700&family=Noto+Sans+Arabic:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body><Shell>{children}</Shell></body>
    </html>
  );
}
