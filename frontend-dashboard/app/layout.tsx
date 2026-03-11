import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TurkNode by ENTURK",
  description: "TurkNode is ENTURK's community impact platform for volunteers, project leads, and organizations.",
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
