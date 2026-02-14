import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Newsletter",
  description: "AI-powered newsletter generator",
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
