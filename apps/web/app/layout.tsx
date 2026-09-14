import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WorldMap AI — See the world at its true scale",
  description:
    "WorldMap AI is an open-source interactive map for exploring real geographic scale, comparing map projections, measuring distortion, and asking geographic questions backed by deterministic calculations.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    title: "WorldMap AI — See the world at its true scale",
    description:
      "Explore projections. Measure distortion. Compare geography. Ask the map. Every number is calculated, never invented.",
    type: "website",
  },
  keywords: [
    "map projections",
    "Equal Earth",
    "Mercator",
    "geographic area",
    "geodesic",
    "cartography",
    "map distortion",
    "country comparison",
    "open source geospatial",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
