import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { ViewTransition } from "react";
import { headers } from "next/headers";
import { Toaster } from "sonner";
import { shipeasy } from "@shipeasy/sdk/server";
import { i18n } from "@shipeasy/sdk/client";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

async function configureShipeasy() {
  const h = await headers();
  const seSearch = h.get("x-se-search") ?? undefined;
  return shipeasy({
    apiKey: process.env.SHIPEASY_SERVER_KEY ?? "",
    clientKey: process.env.NEXT_PUBLIC_SHIPEASY_CLIENT_KEY ?? "",
    urlOverrides: seSearch,
  });
}

export async function generateMetadata(): Promise<Metadata> {
  await configureShipeasy();
  return {
    title: {
      default: "Shouks — Empower your marketplace",
      template: "%s · Shouks",
    },
    description: i18n.t(
      "...app.layout.createAndJoinPrivateMarketplacesDescript",
    ),
    applicationName: "Shouks",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: i18n.t("common.shouks"),
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
      title: i18n.t("...app.layout.shouksEmpowerYourMarketplace"),
      description: i18n.t(
        "...app.layout.createAndJoinPrivateMarketplacesDescript2",
      ),
      siteName: "Shouks",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const seConfig = await configureShipeasy();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Instrument+Serif:ital,wght@0,400;1,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{ __html: seConfig.getBootstrapHtml() }}
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
              description: i18n.t("...app.layout.textmutedDescription"),
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
