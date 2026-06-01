import type { Metadata } from "next";
import { ClerkProvider, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import DemoModeToggle from "@/components/DemoModeToggle";
import Navbar from "@/components/Navbar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  applicationName: "PlantMates",
  title: "PlantMates - האוסף האישי שלך",
  description: "ניהול אוסף צמחים אישי, מכירה וקנייה בקהילה.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "PlantMates",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-stone-100 min-h-screen flex justify-center items-center p-4">
        <ClerkProvider>
          <ConvexClientProvider>
            <div className="w-full max-w-[400px] bg-white h-[800px] shadow-2xl rounded-[40px] flex flex-col relative overflow-hidden border-[8px] border-stone-900">
              <ClerkLoading>
                <div className="flex-1 flex items-center justify-center">טוען...</div>
              </ClerkLoading>
              <ClerkLoaded>
                <DemoModeToggle />
                <main className="flex-1 overflow-y-auto">{children}</main>
                <Navbar />
              </ClerkLoaded>
            </div>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
