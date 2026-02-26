import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "子弹笔记",
  description: "简洁优雅的子弹笔记应用",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
