import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import ClientProviders from "@/providers/client-providers"; // Import the client providers wrapper
import { ThemeProvider } from "next-themes"; // Import ThemeProvider
const font = Urbanist({ subsets: ["latin"] });
export const metadata: Metadata = {
  title: "Store",
  description: "Store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      {/* Added flex flex-col min-h-screen */}
      <body className={`${font.className} flex flex-col min-h-screen`}>
        {/* Wrap client-side providers and main content */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="theme" // Ensures localStorage persistence and sync
        >
          <ClientProviders>
            <Navbar />
            {/* Added main tag with flex-grow */}
            <main className="flex-grow">{children}</main>
            <Analytics />
            <SpeedInsights />
            <Footer />
          </ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
