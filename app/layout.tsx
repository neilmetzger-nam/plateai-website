import ChatRefinement from "./components/ChatRefinement";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlateAI — Restaurant-Quality Food Photos & Video",
  description:
    "AI-powered food photography and video generation for restaurants. Professional menu photos in minutes, not weeks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>{children}<ChatRefinement /></body>
    </html>
  );
}
