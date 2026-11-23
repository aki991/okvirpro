import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "latin-ext"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "OkvirPro – softver za PVC i ALU stolariju",
  description: "Ponude, krojne liste, radni nalozi, magacin i finansije za proizvođače stolarije.",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sr-Latn">
      <body className={`${manrope.variable} ${mono.variable} antialiased`}>{children}</body>
    </html>
  );
}
