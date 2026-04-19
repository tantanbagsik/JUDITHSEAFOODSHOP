import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Judith Foods - Ecommerce Platform",
  description: "Create your online store in seconds. The fastest way to create and manage your ecommerce business. No coding required - just start selling.",
  keywords: ["ecommerce", "online store", "shop", "sell online", "multi-vendor", "marketplace", " Judith Foods"],
  authors: [{ name: "Judith Foods" }],
  openGraph: {
    title: "Judith Foods - Ecommerce Platform",
    description: "Create your online store in seconds. The fastest way to create and manage your ecommerce business.",
    url: "https://judith-seafoods.vercel.app",
    siteName: "Judith Foods",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Judith Foods - Ecommerce Platform",
    description: "Create your online store in seconds. No coding required - just start selling.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
