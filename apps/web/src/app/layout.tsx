import type { Metadata } from "next";
import { Unbounded, Onest } from "next/font/google";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  weight: ["500", "700"],
  subsets: ["latin"],
});

const onest = Onest({
  variable: "--font-onest",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lingua — английский с точным уровнем, планом и куратором",
  description:
    "Бесплатный тест по 5 навыкам, персональный план, короткие уроки и куратор. Прогресс видно ученику и родителям. Уровни A1–C1.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${unbounded.variable} ${onest.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
