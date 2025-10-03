import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  metadataBase: new URL("https://finsight.studio"),
  title: {
    default: "FinSight - AI-Powered Financial Analysis",
    template: "%s | FinSight"
  },
  description: "Analyze company financials, calculate KPIs, and get real-time market insights with FinSight's AI-powered financial analysis chatbot. Access income statements, balance sheets, cash flows, and more.",
  keywords: ["financial analysis", "stock analysis", "company financials", "AI chatbot", "market data", "financial ratios", "earnings analysis", "investment research"],
  authors: [{ name: "FinSight" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://finsight.studio",
    title: "FinSight - AI-Powered Financial Analysis",
    description: "Analyze company financials, calculate KPIs, and get real-time market insights with AI-powered financial analysis.",
    siteName: "FinSight",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinSight - AI-Powered Financial Analysis",
    description: "Analyze company financials, calculate KPIs, and get real-time market insights with AI-powered financial analysis.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

const DARK_THEME_COLOR = "hsl(240deg 10% 3.92%)";
const THEME_COLOR_SCRIPT = `\
(function() {
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', '${DARK_THEME_COLOR}');
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geist.variable} ${geistMono.variable} dark`}
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required"
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <Toaster position="top-center" />
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
