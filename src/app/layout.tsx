import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

/** Original UI font — used for digits via the font stack + Panton unicode-range. */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Vantura Rentals — Premium van hire in London",
  description:
    "Premium van hire at affordable rates in London. Pick up and drop off 24/7.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
