import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evenward — Regulation Studio",
  description:
    "A self-directed studio for exploring regulation through movement, attention, patterns, and understanding.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
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
