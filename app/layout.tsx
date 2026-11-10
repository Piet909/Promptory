import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Promptory — Your AI prompt library",
  description: "Save, organize and reuse your best AI prompts.",
  applicationName: "Promptory",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it" suppressHydrationWarning><body>{children}</body></html>;
}
