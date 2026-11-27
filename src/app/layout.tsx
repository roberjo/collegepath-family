import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "CollegePath Family", description: "A shared workspace for college planning, applications, scholarships, and deadlines." };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
