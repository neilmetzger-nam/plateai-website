import { ClerkProvider } from "@clerk/nextjs";
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
    <ClerkProvider appearance={{ variables: { colorPrimary: "#f97316" } }}>
      <html lang="en">
        <body className={`${geistSans.variable} antialiased`}>
          {children}
          <ChatRefinement />
          <script
            src="https://sandbox.web.squarecdn.com/v1/square.js"
            async
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
