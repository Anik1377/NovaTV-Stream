import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { NoscriptLinks } from "@/components/seo/NoscriptLinks";
import { HomeStructuredData } from "@/components/seo/HomeStructuredData";

const SITE_URL = "https://stvault.vercel.app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "StreamVault - Watch Movies & TV Shows Online Free",
    template: "%s | StreamVault",
  },
  description: "StreamVault is your free streaming hub for movies, TV shows, anime, live TV channels, manga, and games. Watch trending content from Netflix, Prime, Disney+, and more — all in one place.",
  keywords: [
    "stream movies online",
    "watch TV shows free",
    "anime streaming",
    "live TV channels",
    "free movies",
    "StreamVault",
    "watch series online",
    "manga reader",
    "browser games",
    "Asian dramas",
    "Desi cinema",
    "Hollywood movies",
    "Bollywood movies",
    "Korean drama",
    "showreels",
  ],
  authors: [{ name: "StreamVault" }],
  creator: "StreamVault",
  publisher: "StreamVault",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "StreamVault",
    title: "StreamVault - Watch Movies & TV Shows Online Free",
    description: "StreamVault is your free streaming hub for movies, TV shows, anime, live TV, manga, and games — all in one place.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "StreamVault",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "StreamVault - Watch Movies & TV Shows Online Free",
    description: "StreamVault is your free streaming hub for movies, TV shows, anime, live TV, manga, and games — all in one place.",
    images: ["/icon-512.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StreamVault",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-512.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://quge5.com/88/tag.min.js" data-zone="273910" async data-cfasync="false"></script>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-TD2CZN4R');",
          }}
        />
        {/* Google Analytics (GA4) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-QBS4R7BNGT"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-QBS4R7BNGT');",
          }}
        />
        {/* Google Search Console verification */}
        <meta name="google-site-verification" content="rdgkyfp5VPdQnJCl6hxceAqlIy5unb6UtC8HnEC_o0E" />
        <meta name="monetag" content="016b92e7b7b1413c51e03befb765714e" />
        <link rel="apple-touch-icon" href="/icon-512.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: "if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(function(){})}"
          }}
        />
        {/* JSON-LD Structured Data for Search Engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "StreamVault",
              "url": SITE_URL,
              "description": "Free streaming hub for movies, TV shows, anime, live TV, manga, and games",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${SITE_URL}/?search={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TD2CZN4R"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* Monetag banner ad — appends script to body to bypass Next.js head hoisting */}
        <script
          dangerouslySetInnerHTML={{
            __html: "(function(s){s.dataset.zone='11671790',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))"
          }}
        />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-red-600 focus:text-white focus:rounded-lg focus:text-sm focus:outline-none">Skip to content</a>
        <NoscriptLinks />
        <HomeStructuredData />
        <div id="main-content">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
