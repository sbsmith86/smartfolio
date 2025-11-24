import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shae Smith - Product & Engineering Leader",
  description: "Product leader with 15+ years building platforms at Epic Games, IHG, and leading startups. Expert in AI/ML, marketplace platforms, and scaled product development.",
  keywords: ["product management", "engineering leadership", "AI/ML", "marketplace platforms", "product leader", "tech leadership"],
  authors: [{ name: "Shae Smith" }],
  creator: "Shae Smith",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://shaebryantsmith.dev",
    title: "Shae Smith - Product & Engineering Leader",
    description: "Product leader with 15+ years building platforms at Epic Games, IHG, and leading startups. Expert in AI/ML, marketplace platforms, and scaled product development.",
    siteName: "Shae Smith Portfolio",
    images: [
      {
        url: "/shae-smith-image.jpeg",
        width: 400,
        height: 400,
        alt: "Shae Smith",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shae Smith - Product & Engineering Leader",
    description: "Product leader with 15+ years building platforms at Epic Games, IHG, and leading startups.",
    images: ["/shae-smith-image.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://shaebryantsmith.dev" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
