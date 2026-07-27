import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nodeenturk.org"),
  title: {
    default: "TurkNode — Volunteer Matching for Local Impact",
    template: "%s | TurkNode",
  },
  description:
    "TurkNode connects sustainability, education, and civic initiatives with skilled volunteers using AI-powered semantic matching. Built by ENTURK.",
  keywords: [
    "volunteering",
    "sustainability",
    "community impact",
    "volunteer matching",
    "ENTURK",
    "TurkNode",
  ],
  openGraph: {
    title: "TurkNode — Volunteer Matching for Local Impact",
    description:
      "Build local impact through volunteers, projects, and shared action. AI-powered matching connects skilled volunteers to urgent community projects.",
    url: "https://nodeenturk.org",
    siteName: "TurkNode",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "TurkNode — Volunteer Matching for Local Impact",
    description:
      "AI-powered matching connects skilled volunteers to urgent community projects.",
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
      <body>{children}</body>
    </html>
  );
}
