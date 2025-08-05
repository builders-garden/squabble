import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import Providers from "@/components/providers";
import "./globals.css";
import { Suspense } from "react";
import { preconnect } from "react-dom";
import { Toaster } from "sonner";

const rubik = Rubik({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Squabble",
  description: "Outspell your friends, in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  preconnect("https://auth.farcaster.xyz");

  return (
    <html lang="en">
      <body className={`${rubik.className} bg-[#1B7A6E] size-full antialiased`}>
        <Providers>{children}</Providers>
        <Suspense>
          <Toaster richColors />
        </Suspense>
      </body>
    </html>
  );
}
