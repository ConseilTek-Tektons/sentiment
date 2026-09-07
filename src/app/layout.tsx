import type { Metadata } from "next";

import { product } from "@/config/product";
import "./globals.css";

export const metadata: Metadata = {
  title: `${product.name} · ${product.tagline}`,
  description: product.description,
  applicationName: product.name,
  authors: [{ name: "ConseilTek", url: "https://conseiltek.com" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: `${product.name} by ConseilTek`,
    description: product.tagline,
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
