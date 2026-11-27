import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CollegePath Family",
  description:
    "A private family workspace for college planning, applications, scholarships, and deadlines.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#17324f",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
