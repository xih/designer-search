import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { ThemeProvider } from "next-themes";
// import { VoiceRecorderProvider } from "~/hooks/useVoiceRecorder"; // Commented out to disable microphone access
import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "~/components/ui/sonner";
import { PostHogProvider } from "~/components/PostHogProvider";

export const metadata: Metadata = {
  title: "ReadCV Search - Find Designers in Milliseconds",
  description:
    "Search and discover talented designers, product designers, brand designers, and researchers from top companies like Apple, Google, Meta, and more.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    title: "ReadCV Search - Find Designers",
    description:
      "Search and discover talented designers, product designers, brand designers, and researchers from top companies like Apple, Google, Meta, and more.",
    url: "https://readcvsearch.com",
    siteName: "ReadCV Search",
    images: [
      {
        url: "/opengraph/Opengraph@v1.png",
        width: 1200,
        height: 630,
        alt: "ReadCV Search - Find Designers",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReadCV Search - Find Designers",
    description:
      "Search and discover talented designers, product designers, brand designers, and researchers from top companies like Apple, Google, Meta, and more.",
    images: ["/opengraph/Opengraph@v1.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <PostHogProvider>
          {/* <VoiceRecorderProvider> Commented out to disable microphone access */}
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TRPCReactProvider>
              {children}
              <Toaster position="bottom-right" />
            </TRPCReactProvider>
          </ThemeProvider>
          {/* </VoiceRecorderProvider> */}
        </PostHogProvider>
      </body>
    </html>
  );
}
