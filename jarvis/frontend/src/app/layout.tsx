import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "J.A.R.V.I.S — Stark Industries AI",
  description: "Just A Rather Very Intelligent System — Stark Industries",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ height: "100%", background: "#000" }}>
      <body style={{ height: "100%", margin: 0, overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
