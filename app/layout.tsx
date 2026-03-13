import { ClerkProvider } from "@clerk/nextjs";
import ChatRefinement from "./components/ChatRefinement";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
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

const META_PIXEL_ID = "1227939869527135";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ variables: { colorPrimary: "#f97316" } }}>
      <html lang="en">
        <head>
          {/* Meta Pixel */}
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            <img
              height="1"
              width="1"
              style="display:none"
              src="https://www.facebook.com/tr?id=1227939869527135&ev=PageView&noscript=1"
              alt=""
            />
          </noscript>
        </head>
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
