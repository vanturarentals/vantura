import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const alteHaas = localFont({
  src: [
    {
      path: "../fonts/AlteHaasGroteskRegular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/AlteHaasGroteskRegular.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/AlteHaasGroteskBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/AlteHaasGroteskBold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/AlteHaasGroteskBold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-alte-haas",
  display: "swap",
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
    <html lang="en" className={`${alteHaas.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
