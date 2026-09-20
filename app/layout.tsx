import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShiftReady — Ad hoc nursing shifts",
  description: "A marketplace connecting facilities with relief nurses for last-minute shifts.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const requestHeaders = await headers();
  const isLogistics = requestHeaders.get("x-ldx-app") === "logistics";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        {isLogistics ? (
          children
        ) : (
          <>
            <Nav />
            <main className="flex-1">{children}</main>
          </>
        )}
      </body>
    </html>
  );
}
