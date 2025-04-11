import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
      <body className={font.className}>
        {/* Wrap client-side providers and main content */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="theme" // Ensures localStorage persistence and sync
        >
          <ClientProviders>
            <Navbar />
            {children}
            <SpeedInsights />
            <Footer />
          </ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
