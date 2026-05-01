import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { ViewTransition } from "react";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "Shouks — Empower your marketplace",
    template: "%s · Shouks",
  },
  description:
    "Create and join private marketplaces for luxury collectibles. Buy, sell, and trade with trusted communities.",
  applicationName: "Shouks",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shouks",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    title: "Shouks — Empower your marketplace",
    description:
      "Create and join private marketplaces for luxury collectibles.",
    siteName: "Shouks",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Instrument+Serif:ital,wght@0,400;1,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div id="app-root">
          <ViewTransition>{children}</ViewTransition>
        </div>
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "!rounded-[10px] !border !border-line !shadow",
              title: "!text-ink !font-medium",
              description: "!text-muted",
            },
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
